import { API_BASE_URL } from '../config/api.js'
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { openAuthModal } from '../store/slices/uiSlice'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUsers, FiCopy, FiLock, FiUnlock, FiShoppingBag, FiCheckCircle, FiPlus, FiMinus, FiInfo, FiTrash2, FiMapPin, FiPhone, FiDollarSign } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { formatPrice } from '../data/mockData'

export default function GroupOrderPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  
  const [session, setSession] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutData, setCheckoutData] = useState({
    deliveryAddress: '',
    contactPhone: '',
    paymentMethod: 'cash',
    deliveryFee: 15000,
    discount: 0
  })
  
  const [activeTab, setActiveTab] = useState('by-member') // 'by-member' or 'summary'
  const [splitBillData, setSplitBillData] = useState(null)
  
  const socketRef = useRef(null)

  // 1. Fetch group order session and menu
  useEffect(() => {
    if (user?._id) {
      fetchSessionAndMenu()
    }
  }, [code, user?._id])

  const fetchSessionAndMenu = async () => {
    try {
      setLoading(true)
      // Join/Get session
      const res = await fetch(`${API_BASE_URL}/api/group-orders/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          userId: user._id,
          name: user.name
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        toast.error(errData.message || 'Lỗi tải phòng đặt chung')
        navigate('/')
        return
      }

      const sessionData = await res.json()
      setSession(sessionData)
      
      // Set default checkout info from host
      setCheckoutData(prev => ({
        ...prev,
        deliveryAddress: user.address || '',
        contactPhone: user.phone || ''
      }))

      // Get restaurant menu
      const menuRes = await fetch(`${API_BASE_URL}/api/restaurants/${sessionData.restaurantId}`)
      if (menuRes.ok) {
        const menuData = await menuRes.json()
        setMenuItems(menuData.menuItems || [])
      }

      // If already ordered, fetch split bill
      if (sessionData.status === 'ordered' && sessionData.orderId) {
        fetchSplitBill(sessionData.orderId)
      }
    } catch (e) {
      console.error('Error fetching group session:', e)
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  };

  // 2. Real-time Socket.io configuration
  useEffect(() => {
    if (!code) return

    socketRef.current = io(API_BASE_URL)
    const socket = socketRef.current

    socket.emit('join-group-order', code.toUpperCase())

    socket.on('group-order-updated', (updatedSession) => {
      setSession(updatedSession)
      if (updatedSession.status === 'ordered' && updatedSession.orderId) {
        fetchSplitBill(updatedSession.orderId)
      }
    })

    socket.on('group-order-ordered', ({ session: updatedSession, orderId }) => {
      setSession(updatedSession)
      fetchSplitBill(orderId)
      toast.success('Chủ phòng đã đặt hàng thành công! Đang chia hóa đơn...', { icon: '🎉', duration: 4000 })
    })

    return () => {
      socket.disconnect()
    }
  }, [code])

  const fetchSplitBill = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/group-orders/split-bill/${orderId}`)
      if (res.ok) {
        const bill = await res.json()
        setSplitBillData(bill)
      }
    } catch (e) {
      console.error('Error fetching split bill:', e)
    }
  }

  // Calculate delivery fee dynamically when address changes
  const calculateFee = async (address) => {
    if (!address || !session) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/calculate-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: session.restaurantId,
          deliveryAddress: address
        })
      })
      if (res.ok) {
        const feeData = await res.json()
        setCheckoutData(prev => ({
          ...prev,
          deliveryFee: feeData.deliveryFee || 15000
        }))
      }
    } catch (e) {
      // Ignore
    }
  }

  // Handlers
  const handleCopyLink = () => {
    const link = `${window.location.origin}/group-order/${code.toUpperCase()}`
    navigator.clipboard.writeText(link)
    toast.success('Đã sao chép link mời bạn bè! 🔗')
  }

  const handleUpdateItemQuantity = async (item, delta) => {
    if (!session || session.status !== 'active') return
    
    // Find current user's quantity of this item
    const existing = session.items.find(
      i => i.userId === user._id && i.menuItemId === item._id
    )
    const newQty = Math.max(0, (existing?.quantity || 0) + delta)

    try {
      const res = await fetch(`${API_BASE_URL}/api/group-orders/update-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          userId: user._id,
          userName: user.name,
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: newQty,
          image: item.image
        })
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || 'Lỗi cập nhật món ăn')
      }
    } catch (e) {
      toast.error('Lỗi kết nối')
    }
  }

  const handleToggleLock = async () => {
    if (!session) return
    const isLocked = session.status === 'locked'
    try {
      const res = await fetch(`${API_BASE_URL}/api/group-orders/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          hostId: user._id,
          lock: !isLocked
        })
      })
      if (res.ok) {
        toast.success(isLocked ? 'Đã mở khóa phòng!' : 'Đã khóa phòng đặt chung!')
      }
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái phòng')
    }
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!session) return
    if (!checkoutData.deliveryAddress) return toast.error('Vui lòng nhập địa chỉ giao hàng')
    if (!checkoutData.contactPhone) return toast.error('Vui lòng nhập số điện thoại liên hệ')

    const loadingToast = toast.loading('Đang xử lý đặt hàng...')
    try {
      const res = await fetch(`${API_BASE_URL}/api/group-orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          hostId: user._id,
          ...checkoutData
        })
      })

      toast.dismiss(loadingToast)
      if (res.ok) {
        toast.success('Chốt đơn và đặt hàng thành công! 🎉')
      } else {
        const err = await res.json()
        toast.error(err.message || 'Lỗi đặt hàng')
      }
    } catch (e) {
      toast.dismiss(loadingToast)
      toast.error('Lỗi kết nối server')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300 pt-24 px-4">
        <div className="bg-white dark:bg-dark-200 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-glow">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center text-white text-3xl shadow-lg mb-4">
            <FiUsers />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Đặt chung nhóm: {code?.toUpperCase()}</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Bạn cần đăng nhập tài khoản FoodServe để có thể tham gia vào phòng và đặt món chung cùng bạn bè của mình.
          </p>
          <div className="space-y-3 mt-6">
            <button
              onClick={() => dispatch(openAuthModal('login'))}
              className="w-full py-3 bg-gradient-primary hover:bg-primary-600 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Đăng nhập ngay
            </button>
            <Link 
              to="/" 
              className="w-full block py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-dark-100 dark:hover:bg-dark-100/80 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-colors"
            >
              Quay lại Trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-bold">Đang kết nối phòng đặt chung...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const isHost = session.hostId === user?._id
  const totalAmount = session.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Aggregate items count for Summary tab
  const summaryItems = []
  session.items.forEach(item => {
    const existing = summaryItems.find(i => i.menuItemId === item.menuItemId)
    if (existing) {
      existing.quantity += item.quantity
      existing.users.push({ name: item.userName, quantity: item.quantity })
    } else {
      summaryItems.push({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        users: [{ name: item.userName, quantity: item.quantity }]
      })
    }
  })

  // Group items by member for By-Member tab
  const memberGrouped = {}
  session.members.forEach(m => {
    memberGrouped[m.userId] = {
      name: m.name,
      avatar: m.avatar,
      items: [],
      total: 0
    }
  })
  session.items.forEach(item => {
    if (memberGrouped[item.userId]) {
      memberGrouped[item.userId].items.push(item)
      memberGrouped[item.userId].total += item.price * item.quantity
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ROOM DETAILS & MEMBER CART */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary-500/10 text-primary-500 px-4 py-1.5 rounded-bl-2xl text-xs font-black uppercase tracking-wider">
              {session.status === 'active' && '🟢 Đang đặt'}
              {session.status === 'locked' && '🔒 Đã khóa'}
              {session.status === 'ordered' && '🎉 Đã đặt'}
            </div>
            
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              🍔 Đặt Chung: {session.restaurantName}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Trưởng nhóm: {session.hostName}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {/* Sharing link */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-100 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-500 uppercase">Mã phòng:</span>
                <span className="text-sm font-black text-primary-500 font-mono tracking-wider">{session.code}</span>
                <button 
                  onClick={handleCopyLink}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-dark-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  title="Sao chép link mời"
                >
                  <FiCopy />
                </button>
              </div>

              {/* Members List avatars */}
              <div className="flex items-center gap-1">
                <FiUsers className="text-gray-400 text-sm mr-1" />
                <div className="flex -space-x-2 overflow-hidden">
                  {session.members.map((member) => (
                    <div 
                      key={member.userId} 
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-dark-200 bg-gradient-to-br from-primary-400 to-amber-500 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden"
                      title={member.name}
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-500 ml-1">{session.members.length} người</span>
              </div>
            </div>
          </div>

          {/* Group Cart / Session items */}
          {session.status !== 'ordered' ? (
            <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  🛒 Giỏ hàng nhóm ({session.items.reduce((s, i) => s + i.quantity, 0)} món)
                </h3>
                
                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-dark-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('by-member')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'by-member' 
                        ? 'bg-white dark:bg-dark-200 text-primary-500 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Xem theo người
                  </button>
                  <button 
                    onClick={() => setActiveTab('summary')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'summary' 
                        ? 'bg-white dark:bg-dark-200 text-primary-500 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Xem tổng hợp
                  </button>
                </div>
              </div>

              {/* By-Member Tab Content */}
              {activeTab === 'by-member' && (
                <div className="space-y-6">
                  {Object.keys(memberGrouped).map(userId => {
                    const group = memberGrouped[userId];
                    return (
                      <div key={userId} className="border-b border-gray-50 dark:border-gray-800/40 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center text-[9px] font-bold overflow-hidden">
                            {group.avatar ? (
                              <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
                            ) : (
                              group.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {group.name} {userId === user._id && <span className="text-[10px] text-gray-400 font-normal">(Bạn)</span>}
                          </span>
                          <span className="text-xs font-black text-primary-500 ml-auto">{formatPrice(group.total)}</span>
                        </div>

                        {group.items.length === 0 ? (
                          <p className="text-xs text-gray-400 italic pl-8">Chưa chọn món nào</p>
                        ) : (
                          <div className="space-y-3 pl-8">
                            {group.items.map(item => (
                              <div key={item.menuItemId} className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                  {item.name} <span className="font-bold text-gray-400">x{item.quantity}</span>
                                </span>
                                <span className="font-bold text-gray-700 dark:text-gray-400">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Summary Tab Content */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  {summaryItems.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-6">Chưa có ai đặt món</p>
                  ) : (
                    summaryItems.map(item => (
                      <div key={item.menuItemId} className="flex gap-3 items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/40 last:border-0">
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 truncate">
                            Đặt bởi: {item.users.map(u => `${u.name} (x${u.quantity})`).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800 dark:text-white">x{item.quantity}</p>
                          <p className="text-xs font-semibold text-primary-500">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Ordered / Completed Split Bill Page */
            <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800 space-y-6">
              <div className="text-center py-6 border-b border-gray-100 dark:border-gray-800">
                <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-3" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Đơn hàng nhóm đã được chốt thành công!</h3>
                <p className="text-xs text-gray-400 mt-1">Hóa đơn chia tiền tỷ lệ (Split Bill) tự động tính toán</p>
              </div>

              {splitBillData ? (
                <div className="space-y-6">
                  <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Hóa đơn chi tiết từng thành viên</h4>
                  <div className="space-y-4">
                    {splitBillData.memberBills.map(bill => (
                      <div key={bill.userId} className="bg-gray-50 dark:bg-dark-100 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center font-bold text-primary-500 overflow-hidden">
                            {bill.avatar ? (
                              <img src={bill.avatar} alt={bill.name} className="w-full h-full object-cover" />
                            ) : (
                              bill.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 dark:text-white">
                              {bill.name} {bill.userId === user._id && <span className="text-[10px] text-gray-400 font-normal">(Bạn)</span>}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Món: {formatPrice(bill.itemsTotal)} | Ship share: +{formatPrice(bill.shareDeliveryFee)} | Giảm share: -{formatPrice(bill.shareDiscount)}
                            </p>
                          </div>
                        </div>
                        
                        {/* VietQR Quick Scan for returning money to host */}
                        <div className="flex items-center gap-4 self-end md:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Cần trả Host</span>
                            <span className="text-base font-black text-amber-500">{formatPrice(bill.finalBill)}</span>
                          </div>
                          
                          {bill.userId !== session.hostId && bill.finalBill > 0 && (
                            <a 
                              href={`https://img.vietqr.io/image/vietinbank-11336688-print.png?amount=${bill.finalBill}&addInfo=PayGroup%20${session.code}%20${encodeURIComponent(bill.name)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                            >
                              Scan QR
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400">Đang tính toán hóa đơn chia tiền...</p>
              )}
            </div>
          )}

          {/* MenuItem Selector for Adding to Group Order */}
          {session.status === 'active' && (
            <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800 space-y-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                🍽️ Chọn thêm món của bạn vào nhóm
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map(item => {
                  const userItem = session.items.find(
                    i => i.userId === user._id && i.menuItemId === item._id
                  )
                  const qty = userItem?.quantity || 0

                  return (
                    <div key={item._id} className="bg-gray-50 dark:bg-dark-100/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-3">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate">{item.name}</h4>
                        <p className="text-primary-500 font-sans font-black text-xs mt-1">{formatPrice(item.price)}</p>
                      </div>
                      
                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button 
                              onClick={() => handleUpdateItemQuantity(item, -1)}
                              className="w-7 h-7 bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center hover:border-primary-500 shadow-sm active:scale-95"
                            >
                              <FiMinus className="text-[10px]" />
                            </button>
                            <span className="font-black text-xs w-4 text-center">{qty}</span>
                          </>
                        )}
                        <button 
                          onClick={() => handleUpdateItemQuantity(item, 1)}
                          className="w-7 h-7 bg-primary-500 text-white rounded-lg flex items-center justify-center hover:bg-primary-600 shadow-md active:scale-95"
                        >
                          <FiPlus className="text-[10px]" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: HOST PANEL (CHECKOUT & CONTROLS) */}
        <div className="space-y-6">
          {session.status !== 'ordered' ? (
            <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800 space-y-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                👑 Bảng điều khiển nhóm
              </h3>

              {isHost ? (
                <div className="space-y-5">
                  {/* Lock/Unlock room */}
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-dark-100 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="font-bold text-xs text-gray-400 uppercase">Trạng thái phòng</p>
                      <p className="font-bold text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                        {session.status === 'locked' ? '🔒 Đã khóa đặt món' : '🔓 Đang mở đặt món'}
                      </p>
                    </div>
                    <button 
                      onClick={handleToggleLock}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-colors ${
                        session.status === 'locked'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {session.status === 'locked' ? <FiUnlock /> : <FiLock />}
                      {session.status === 'locked' ? 'Mở khóa' : 'Khóa phòng'}
                    </button>
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <p className="font-bold text-xs text-gray-400 uppercase">Thông tin giao hàng nhóm</p>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Địa chỉ giao hàng</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-3.5 text-gray-400" />
                        <textarea
                          rows="2"
                          required
                          value={checkoutData.deliveryAddress}
                          onChange={e => {
                            setCheckoutData({ ...checkoutData, deliveryAddress: e.target.value })
                            calculateFee(e.target.value)
                          }}
                          placeholder="Địa chỉ giao hàng chính..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-100 text-xs focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Số điện thoại chốt</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={checkoutData.contactPhone}
                          onChange={e => setCheckoutData({ ...checkoutData, contactPhone: e.target.value })}
                          placeholder="Số điện thoại liên hệ"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-100 text-xs focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Phương thức thanh toán</label>
                      <select
                        value={checkoutData.paymentMethod}
                        onChange={e => setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-100 text-xs focus:ring-1 focus:ring-primary-500 font-bold"
                      >
                        <option value="cash">Tiền mặt (Trưởng nhóm trả)</option>
                        <option value="coins">Ví Xu (Trưởng nhóm trả)</option>
                      </select>
                    </div>

                    {/* Order summary billing list */}
                    <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tạm tính nhóm:</span>
                        <span className="font-bold">{formatPrice(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phí giao hàng:</span>
                        <span className="font-bold">+{formatPrice(checkoutData.deliveryFee)}</span>
                      </div>
                      <div className="w-full h-px bg-gray-200 dark:bg-gray-800 my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Tổng cộng:</span>
                        <span className="font-black text-primary-500">
                          {formatPrice(totalAmount + checkoutData.deliveryFee)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={session.items.length === 0}
                      className="w-full py-3 bg-gradient-primary hover:bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-primary-500/20"
                    >
                      <FiCheckCircle /> Chốt đơn & Đặt ngay
                    </button>
                  </form>
                </div>
              ) : (
                /* Member View Panel */
                <div className="space-y-4 text-center py-6">
                  <FiLock className="text-3xl text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-4">
                    Bạn đã tham gia thành công phòng đặt chung. Hãy thêm các món bạn muốn ăn từ thực đơn bên trái. Trưởng nhóm sẽ khóa phòng và tiến hành thanh toán đơn hàng.
                  </p>
                  <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-left text-xs space-y-2">
                    <p className="font-bold text-gray-400 uppercase text-[10px]">Tóm tắt của bạn</p>
                    <div className="flex justify-between">
                      <span>Món của bạn:</span>
                      <span className="font-bold">
                        {formatPrice(session.items.filter(i => i.userId === user._id).reduce((s, i) => s + (i.price * i.quantity), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Split Bill Summary for Host or Members */
            <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800 space-y-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                📊 Tổng hợp Hóa đơn Nhóm
              </h3>

              {splitBillData && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tổng tiền món đặt:</span>
                    <span className="font-bold">{formatPrice(splitBillData.totals.itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phí giao hàng:</span>
                    <span className="font-bold">+{formatPrice(splitBillData.totals.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chiết khấu/Giảm giá:</span>
                    <span className="font-bold text-red-500">-{formatPrice(splitBillData.totals.discount)}</span>
                  </div>
                  <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-700 dark:text-gray-300">Tổng thanh toán:</span>
                    <span className="font-black text-amber-500">{formatPrice(splitBillData.totals.finalAmount)}</span>
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-amber-600 dark:text-amber-400 mt-6">
                    <FiInfo className="text-lg flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed font-medium">
                      Phí giao hàng và mã giảm giá được chia tỷ lệ phần trăm tương đối chính xác dựa trên giá trị món của mỗi thành viên.
                    </p>
                  </div>

                  <Link 
                    to="/" 
                    className="w-full block text-center py-3 bg-gray-100 hover:bg-gray-200 dark:bg-dark-100 dark:hover:bg-dark-100/80 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors mt-6 shadow-sm"
                  >
                    Về trang chủ
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
