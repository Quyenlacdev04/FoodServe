import { API_BASE_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiHome, FiUser, FiCheckCircle, FiClock, FiDollarSign, 
  FiMapPin, FiPhone, FiBox, FiRefreshCw, FiArrowLeft, 
  FiNavigation, FiTrendingUp, FiActivity, FiAlertTriangle,
  FiPlay, FiPause, FiCompass, FiTruck
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { formatPrice } from '../data/mockData'
import { updateUser } from '../store/slices/authSlice'

const orderStatusMap = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed: { label: 'Chờ tài xế nhận', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  preparing: { label: 'Đang chuẩn bị món', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
  delivering: { label: 'Đang giao hàng', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  completed: { label: 'Đã hoàn thành', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
}

// BẢN ĐỒ CHỈ ĐƯỜNG MÔ PHỎNG (GPS MAP SIMULATOR)
function MapSimulator({ order, onStatusUpdate, processingId }) {
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(0)

  // Reset progress khi đơn hàng thay đổi hoặc trạng thái thay đổi
  useEffect(() => {
    setProgress(0)
    setIsPlaying(false)
    setSpeed(0)
  }, [order?._id, order?.status])

  // Lặp mô phỏng di chuyển
  useEffect(() => {
    let interval = null
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false)
            setSpeed(0)
            toast.success(
              order.status === 'preparing'
                ? 'Đã đến Nhà hàng! Nhận đồ ăn & chuẩn bị giao khách.'
                : 'Đã đến điểm giao! Hãy bấm Giao hàng thành công.'
            )
            return 100
          }
          // Tốc độ ngẫu nhiên từ 35-48 km/h
          setSpeed(Math.floor(Math.random() * 13) + 35)
          return prev + 2
        })
      }, 250)
    } else {
      setSpeed(0)
    }
    return () => clearInterval(interval)
  }, [isPlaying, order?.status])

  if (!order) {
    return (
      <div className="h-[320px] bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-gray-500 border border-gray-800">
        <FiCompass className="text-4xl text-gray-700 animate-pulse mb-3" />
        <p className="text-xs font-bold text-gray-400">Chọn một đơn hàng để tải bản đồ dẫn đường</p>
      </div>
    )
  }

  // Tọa độ các điểm chính trên bản đồ kích thước 400x300
  const shipperStart = { x: 40, y: 40 }
  const restaurant = { x: 160, y: 110 }
  const customer = { x: 340, y: 230 }

  let currentPos = { ...shipperStart }
  let pathD = ""
  let pathCompletedD = ""

  if (order.status === 'preparing' || order.status === 'confirmed') {
    // Lộ trình 1: Shipper -> Nhà hàng
    // Đi ngang từ (40, 40) đến (160, 40) sau đó đi dọc xuống (160, 110)
    pathD = "M 40 40 L 160 40 L 160 110"
    if (progress < 50) {
      const ratio = progress / 50
      currentPos.x = 40 + (160 - 40) * ratio
      currentPos.y = 40
      pathCompletedD = `M 40 40 L ${currentPos.x} 40`
    } else {
      const ratio = (progress - 50) / 50
      currentPos.x = 160
      currentPos.y = 40 + (110 - 40) * ratio
      pathCompletedD = `M 40 40 L 160 40 L 160 ${currentPos.y}`
    }
  } else if (order.status === 'delivering') {
    // Lộ trình 2: Nhà hàng -> Khách hàng
    // Đi dọc từ (160, 110) xuống (160, 230) sau đó đi ngang đến (340, 230)
    pathD = "M 160 110 L 160 230 L 340 230"
    if (progress < 50) {
      const ratio = progress / 50
      currentPos.x = 160
      currentPos.y = 110 + (230 - 110) * ratio
      pathCompletedD = `M 160 110 L 160 ${currentPos.y}`
    } else {
      const ratio = (progress - 50) / 50
      currentPos.x = 160 + (340 - 160) * ratio
      currentPos.y = 230
      pathCompletedD = `M 160 110 L 160 230 L ${currentPos.x} 230`
    }
  } else {
    currentPos = { ...customer }
  }

  // Ước tính khoảng cách (KM) và thời gian (Phút)
  const baseDistance = order.status === 'preparing' ? 1.5 : 3.0 // km
  const remDistance = Math.max(0, baseDistance * (1 - progress / 100)).toFixed(1)
  const remTime = Math.ceil(remDistance * 2.5) // 2.5 phút/km

  // Chỉ dẫn đường (Turn-by-turn instruction)
  let directionText = "Chuẩn bị khởi hành..."
  if (order.status === 'preparing' || order.status === 'confirmed') {
    if (progress === 0) directionText = "Nhấp 'Bắt đầu di chuyển' hướng về Nhà hàng."
    else if (progress < 50) directionText = "Đi thẳng trên Đường Pasteur hướng về ngã tư lớn (400m nữa)"
    else if (progress < 100) directionText = "Rẽ phải vào Đại lộ Lê Lợi, Cửa hàng đối tác ở bên phải"
    else directionText = "Bạn đã đến Cửa hàng! Hãy nhận món và bắt đầu giao."
  } else if (order.status === 'delivering') {
    if (progress === 0) directionText = "Bắt đầu giao món. Nhấp 'Bắt đầu di chuyển' hướng đến nhà Khách."
    else if (progress < 50) directionText = "Đi thẳng trên Đại lộ Lê Lợi hướng về phía Vòng xoay (1.2 km)"
    else if (progress < 100) directionText = "Rẽ trái tại vòng xoay vào Đường Đồng Khởi, đi thẳng 600m"
    else directionText = "Đã đến nơi! Hãy giao hàng cho khách và nhận cước."
  }

  return (
    <div className="space-y-4">
      {/* HUD GPS Panel */}
      <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 text-white shadow-inner flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400">
            <FiCompass className="text-xl animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Chỉ dẫn GPS</p>
            <p className="text-xs font-bold text-gray-200">{directionText}</p>
          </div>
        </div>

        <div className="flex gap-4 shrink-0 text-right">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Khoảng cách</p>
            <p className="text-sm font-black text-amber-400">{remDistance} km</p>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Thời gian (ETA)</p>
            <p className="text-sm font-black text-emerald-400">{remTime} phút</p>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Tốc độ</p>
            <p className="text-sm font-black text-cyan-400">{speed} km/h</p>
          </div>
        </div>
      </div>

      {/* RENDER BẢN ĐỒ SVG */}
      <div className="relative aspect-[4/3] w-full bg-[#0a0f1d] rounded-3xl overflow-hidden border border-slate-800 shadow-lg">
        {/* Lưới tọa độ chìm */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />
        
        <svg viewBox="0 0 400 300" className="w-full h-full relative z-10 select-none">
          {/* Vẽ các tuyến đường phố giả lập dưới nền */}
          {/* Đường ngang 1 */}
          <line x1="10" y1="40" x2="390" y2="40" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
          <line x1="10" y1="40" x2="390" y2="40" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Đường ngang 2 */}
          <line x1="10" y1="230" x2="390" y2="230" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
          <line x1="10" y1="230" x2="390" y2="230" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 4" />

          {/* Đường dọc 1 */}
          <line x1="160" y1="10" x2="160" y2="290" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
          <line x1="160" y1="10" x2="160" y2="290" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 4" />

          {/* Nhãn tên đường */}
          <text x="75" y="44" fill="#64748b" fontSize="7" fontWeight="bold" className="opacity-80">ĐƯỜNG PASTEUR</text>
          <text x="240" y="234" fill="#64748b" fontSize="7" fontWeight="bold" className="opacity-80">ĐƯỜNG ĐỒNG KHỞI</text>
          <text x="165" y="170" fill="#64748b" fontSize="7" fontWeight="bold" transform="rotate(90,165,170)" className="opacity-80">ĐẠI LỘ LÊ LỢI</text>

          {/* Lộ trình màu neon nhấp nháy chưa đi qua */}
          {pathD && (
            <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" className="opacity-30" />
          )}

          {/* Lộ trình đã đi qua màu xanh neon */}
          {pathCompletedD && (
            <path d={pathCompletedD} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_#10b981]" />
          )}

          {/* ĐIỂM XUẤT PHÁT CỦA SHIPPER (Nếu đang chuẩn bị món) */}
          {(order.status === 'preparing' || order.status === 'confirmed') && (
            <g transform={`translate(${shipperStart.x}, ${shipperStart.y})`}>
              <circle r="12" fill="#eab308" className="animate-ping opacity-25" />
              <circle r="7" fill="#eab308" stroke="#1e1b4b" strokeWidth="1.5" />
              <text x="-4" y="3.5" fill="white" fontSize="9" fontWeight="bold">S</text>
            </g>
          )}

          {/* CỬA HÀNG (Restaurant) */}
          <g transform={`translate(${restaurant.x}, ${restaurant.y})`}>
            <circle r="16" fill="#ef4444" className="animate-pulse opacity-15" />
            <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="drop-shadow-[0_0_6px_#ef4444]" />
            <text x="-5.5" y="3.5" fontSize="10">🍳</text>
          </g>
          <text x={restaurant.x} y={restaurant.y - 15} fill="#f87171" fontSize="8" fontWeight="black" textAnchor="middle">CỬA HÀNG</text>

          {/* KHÁCH HÀNG (Customer) */}
          <g transform={`translate(${customer.x}, ${customer.y})`}>
            <circle r="16" fill="#3b82f6" className="animate-pulse opacity-15" />
            <circle r="10" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="drop-shadow-[0_0_6px_#3b82f6]" />
            <text x="-6" y="3">🏠</text>
          </g>
          <text x={customer.x} y={customer.y - 15} fill="#60a5fa" fontSize="8" fontWeight="black" textAnchor="middle">KHÁCH HÀNG</text>

          {/* XE MÔ TÔ CỦA SHIPPER DI CHUYỂN LIVE */}
          <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
            <circle r="15" fill="#10b981" className="animate-ping opacity-25" />
            <circle r="11" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" className="drop-shadow-[0_0_8px_#10b981]" />
            <text x="-7" y="4" fontSize="11">🛵</text>
          </g>
        </svg>

        {/* HUD overlay góc dưới bản đồ */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] text-gray-400 font-medium">
          Tọa độ: X:{Math.round(currentPos.x)} Y:{Math.round(currentPos.y)} | Progress: {progress}%
        </div>
      </div>

      {/* GPS Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={progress >= 100}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
            isPlaying 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-gradient-primary text-white shadow-primary-500/10'
          }`}
        >
          {isPlaying ? (
            <>
              <FiPause /> Tạm dừng GPS
            </>
          ) : (
            <>
              <FiPlay /> {progress > 0 ? 'Tiếp tục đi' : 'Bắt đầu mô phỏng'}
            </>
          )}
        </button>

        <button
          onClick={() => {
            setProgress(100)
            setIsPlaying(false)
            setSpeed(0)
            toast.success('Đã tới điểm đích mô phỏng!')
          }}
          disabled={progress >= 100}
          className="px-4 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center"
          title="Đi nhanh tới đích"
        >
          <FiCompass className="text-base" />
        </button>

        {/* Nút hành động nhanh trên bản đồ */}
        {progress === 100 && (
          <div className="w-1/2">
            {order.status === 'preparing' && (
              <button
                disabled={processingId === order._id}
                onClick={() => onStatusUpdate(order._id, 'delivering')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-1"
              >
                <FiBox /> Lấy món & Giao
              </button>
            )}
            {order.status === 'delivering' && (
              <button
                disabled={processingId === order._id}
                onClick={() => onStatusUpdate(order._id, 'completed')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1"
              >
                <FiCheckCircle /> Đã giao xong
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DriverPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  
  // ✅ QUAN TRỌNG: Tất cả hooks phải được gọi TRƯỚC bất kỳ return nào
  const [activeTab, setActiveTab] = useState('available')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState(null)
  const [accessState, setAccessState] = useState('checking') // checking | allowed | pending | blocked
  const [driverStatus, setDriverStatus] = useState(null)
  const [syncingRole, setSyncingRole] = useState(false)

  const syncProfileFromServer = async () => {
    const token = localStorage.getItem('foodserve_token')
    if (!token) return null
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const profileData = await res.json()
    dispatch(updateUser(profileData))
    return profileData
  }

  const handleRefreshDriverAccess = async () => {
    setSyncingRole(true)
    try {
      const profile = await syncProfileFromServer()
      if (profile?.role === 'shipper' || profile?.role === 'admin') {
        setAccessState('allowed')
        toast.success('Bạn đã có quyền tài xế — bắt đầu nhận đơn!')
        return
      }

      const res = await fetch(
        `${API_BASE_URL}/api/partner/driver/register/status?userId=${user._id}`
      )
      const data = await res.json()
      setDriverStatus(data)
      if (data.reason === 'pending') {
        toast('Hồ sơ vẫn đang chờ admin duyệt', { icon: '⏳' })
      } else {
        toast.error(data.message || 'Chưa được duyệt làm tài xế')
      }
    } finally {
      setSyncingRole(false)
    }
  }

  // Fetch orders and driver profile
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/orders`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        toast.error('Lỗi khi tải danh sách đơn hàng')
      }
    } catch (err) {
      console.error(err)
      toast.error('Không thể kết nối đến máy chủ')
    } finally {
      setLoading(false)
    }
  }

  const fetchDriverProfile = async () => {
    try {
      const token = localStorage.getItem('foodserve_token')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const profileData = await res.json()
        dispatch(updateUser(profileData))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Accept Order
  const handleAcceptOrder = async (orderId) => {
    if (!isOnline) {
      toast.error('Bạn cần chuyển sang trạng thái HOẠT ĐỘNG để nhận đơn!')
      return
    }
    try {
      setProcessingId(orderId)
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipperId: user._id || user.id })
      })
      
      if (res.ok) {
        toast.success('Nhận đơn giao thành công! Bắt đầu chuẩn bị.')
        setActiveTab('active')
        triggerRefresh()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Lỗi khi nhận đơn')
      }
    } catch (err) {
      toast.error('Lỗi kết nối mạng')
    } finally {
      setProcessingId(null)
    }
  }

  // Update Status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setProcessingId(orderId)
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          shipperId: user._id || user.id
        })
      })

      if (res.ok) {
        if (newStatus === 'completed') {
          toast.success('Giao hàng thành công! Thu nhập đã được cộng vào ví.')
          setActiveTab('history')
        } else {
          toast.success('Cập nhật trạng thái đơn hàng thành công!')
        }
        triggerRefresh()
      } else {
        toast.error('Lỗi cập nhật trạng thái')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    } finally {
      setProcessingId(null)
    }
  }

  // Generate Mock Order for Testing
  const handleCreateMockOrder = async () => {
    try {
      // 1. Get restaurants
      const restRes = await fetch(`${API_BASE_URL}/api/restaurants`)
      const restaurants = await restRes.json()
      const restaurant = restaurants.length > 0 ? restaurants[0] : null
      
      const mockOrder = {
        userId: 'demo_user',
        restaurantId: restaurant ? restaurant._id : '65ef1234567890abcdef1234',
        items: [
          { menuItemId: 'mock_item_1', name: 'Gà Rán Giòn Cay (Cái)', price: 35000, quantity: 2 },
          { menuItemId: 'mock_item_2', name: 'Nước Ngọt Coca Cola', price: 15000, quantity: 1 }
        ],
        totalAmount: 85000,
        discount: 10000,
        deliveryFee: 20000, // 20k ship
        finalAmount: 95000,
        deliveryAddress: 'Lầu 12, Tòa nhà Bitexco, Quận 1, TP. Hồ Chí Minh',
        contactPhone: '0909888999'
      }

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOrder)
      })

      if (res.ok) {
        toast.success('Đã tạo 1 đơn hàng giả lập mới trên hệ thống!')
        triggerRefresh()
      } else {
        toast.error('Không thể tạo đơn hàng giả lập')
      }
    } catch (err) {
      console.error(err)
      toast.error('Lỗi kết nối giả lập đơn')
    }
  }

  // ✅ useEffect phải đặt SAU tất cả function definitions
  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        toast.error('Vui lòng đăng nhập để tiếp tục!')
        navigate('/')
        return
      }

      if (user?.isShipper || user?.role === 'shipper' || user?.role === 'admin') {
        setAccessState('allowed')
        return
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/partner/driver/register/status?userId=${user._id}`
        )
        const data = await res.json()
        if (!res.ok) {
          setAccessState('blocked')
          return
        }

        setDriverStatus(data)

        if (data.reason === 'approved_sync_needed') {
          const profile = await syncProfileFromServer()
          if (profile?.isShipper || profile?.role === 'shipper' || profile?.role === 'admin') {
            setAccessState('allowed')
            toast.success('Đã kích hoạt quyền tài xế!')
            return
          }
        }

        if (data.reason === 'pending' || data.reason === 'reviewing') {
          setAccessState('pending')
          return
        }

        toast.error(data.message || 'Tài khoản chưa có quyền tài xế')
        navigate('/')
      } catch {
        toast.error('Không kiểm tra được quyền tài xế')
        navigate('/')
      }
    }

    if (user?._id) checkAccess()
  }, [user?._id, user?.role, user?.isShipper, isAuthenticated, navigate])

  useEffect(() => {
    if (user && (user.isShipper || user.role === 'shipper' || user.role === 'admin')) {
      fetchOrders()
      fetchDriverProfile()
    }
  }, [user, refreshTrigger])

  // Cập nhật đơn hàng được chọn xem trên bản đồ
  useEffect(() => {
    const currentUserId = user ? (user._id || user.id) : ''
    const activeOrders = orders.filter(o => o.shipperId === currentUserId && ['preparing', 'delivering'].includes(o.status))
    
    if (activeOrders.length > 0) {
      const exists = activeOrders.some(o => o._id === selectedActiveOrderId)
      if (!exists) {
        setSelectedActiveOrderId(activeOrders[0]._id)
      }
    } else {
      setSelectedActiveOrderId(null)
    }
  }, [orders, selectedActiveOrderId, user])

  // ✅ Tất cả early returns phải đặt SAU tất cả hooks và function definitions

  if (accessState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Đang kiểm tra quyền tài xế...</p>
        </div>
      </div>
    )
  }

  if (accessState === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-primary-50 dark:from-[#0a0a14] dark:to-[#1e1e2e] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white dark:bg-dark-100 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-white/10 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-display font-bold dark:text-white mb-3">Hồ sơ đang chờ duyệt</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {driverStatus?.message ||
              'Admin cần phê duyệt hồ sơ tài xế trước khi bạn vào trang nhận đơn.'}
          </p>
          <ol className="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6 bg-gray-50 dark:bg-dark-200/50 rounded-2xl p-4">
            <li><strong>1.</strong> Admin vào <Link to="/admin" className="text-primary-500 hover:underline">Trang quản trị</Link> → tab <strong>Yêu cầu tài xế</strong> → bấm <strong>Duyệt</strong>.</li>
            <li><strong>2.</strong> Bấm nút bên dưới để làm mới quyền (hoặc đăng xuất / đăng nhập lại).</li>
            <li><strong>3.</strong> Vào <strong>Trang tài xế</strong> tại <code className="text-primary-500">/driver</code> để nhận đơn.</li>
          </ol>
          <button
            type="button"
            onClick={handleRefreshDriverAccess}
            disabled={syncingRole}
            className="w-full py-3 rounded-2xl bg-gradient-primary text-white font-bold mb-3 disabled:opacity-60"
          >
            {syncingRole ? 'Đang kiểm tra...' : 'Làm mới quyền tài xế'}
          </button>
          <Link to="/" className="text-sm text-gray-500 hover:text-primary-500">← Về trang chủ</Link>
        </div>
      </div>
    )
  }

  if (accessState !== 'allowed') {
    return null
  }

  // Fetch orders and driver profile
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/orders`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        toast.error('Lỗi khi tải danh sách đơn hàng')
      }
    } catch (err) {
      console.error(err)
      toast.error('Không thể kết nối đến máy chủ')
    } finally {
      setLoading(false)
    }
  }

  const fetchDriverProfile = async () => {
    try {
      const token = localStorage.getItem('foodserve_token')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const profileData = await res.json()
        dispatch(updateUser(profileData))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (user && (user.isShipper || user.role === 'shipper' || user.role === 'admin')) {
      fetchOrders()
      fetchDriverProfile()
    }
  }, [user, refreshTrigger])

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Accept Order
  const handleAcceptOrder = async (orderId) => {
    if (!isOnline) {
      toast.error('Bạn cần chuyển sang trạng thái HOẠT ĐỘNG để nhận đơn!')
      return
    }
    try {
      setProcessingId(orderId)
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipperId: user._id || user.id })
      })
      
      if (res.ok) {
        toast.success('Nhận đơn giao thành công! Bắt đầu chuẩn bị.')
        setActiveTab('active')
        triggerRefresh()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Lỗi khi nhận đơn')
      }
    } catch (err) {
      toast.error('Lỗi kết nối mạng')
    } finally {
      setProcessingId(null)
    }
  }

  // Update Status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setProcessingId(orderId)
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          shipperId: user._id || user.id
        })
      })

      if (res.ok) {
        if (newStatus === 'completed') {
          toast.success('Giao hàng thành công! Thu nhập đã được cộng vào ví.')
          setActiveTab('history')
        } else {
          toast.success('Cập nhật trạng thái đơn hàng thành công!')
        }
        triggerRefresh()
      } else {
        toast.error('Lỗi cập nhật trạng thái')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    } finally {
      setProcessingId(null)
    }
  }

  // Generate Mock Order for Testing
  const handleCreateMockOrder = async () => {
    try {
      // 1. Get restaurants
      const restRes = await fetch(`${API_BASE_URL}/api/restaurants`)
      const restaurants = await restRes.json()
      const restaurant = restaurants.length > 0 ? restaurants[0] : null
      
      const mockOrder = {
        userId: 'demo_user',
        restaurantId: restaurant ? restaurant._id : '65ef1234567890abcdef1234',
        items: [
          { menuItemId: 'mock_item_1', name: 'Gà Rán Giòn Cay (Cái)', price: 35000, quantity: 2 },
          { menuItemId: 'mock_item_2', name: 'Nước Ngọt Coca Cola', price: 15000, quantity: 1 }
        ],
        totalAmount: 85000,
        discount: 10000,
        deliveryFee: 20000, // 20k ship
        finalAmount: 95000,
        deliveryAddress: 'Lầu 12, Tòa nhà Bitexco, Quận 1, TP. Hồ Chí Minh',
        contactPhone: '0909888999'
      }

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOrder)
      })

      if (res.ok) {
        toast.success('Đã tạo 1 đơn hàng giả lập mới trên hệ thống!')
        triggerRefresh()
      } else {
        toast.error('Không thể tạo đơn hàng giả lập')
      }
    } catch (err) {
      console.error(err)
      toast.error('Lỗi kết nối giả lập đơn')
    }
  }

  // Filter orders
  const currentUserId = user ? (user._id || user.id) : ''
  const availableOrders = orders.filter(o => !o.shipperId && ['confirmed', 'preparing'].includes(o.status))
  const activeOrders = orders.filter(o => o.shipperId === currentUserId && ['preparing', 'delivering'].includes(o.status))
  const historyOrders = orders.filter(o => o.shipperId === currentUserId && ['completed', 'cancelled'].includes(o.status))

  // Cập nhật đơn hàng được chọn xem trên bản đồ
  useEffect(() => {
    if (activeOrders.length > 0) {
      const exists = activeOrders.some(o => o._id === selectedActiveOrderId)
      if (!exists) {
        setSelectedActiveOrderId(activeOrders[0]._id)
      }
    } else {
      setSelectedActiveOrderId(null)
    }
  }, [activeOrders, selectedActiveOrderId])

  const selectedOrderObj = activeOrders.find(o => o._id === selectedActiveOrderId) || activeOrders[0]

  // Stats
  const completedOrders = historyOrders.filter(o => o.status === 'completed')
  const totalShipEarnings = completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0)
  const driverShare = totalShipEarnings * 0.9 // 90%
  const systemCut = totalShipEarnings * 0.1 // 10% commission

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <div className="w-full md:w-80 bg-white dark:bg-dark-200 border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-300 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white transition-colors">
              <FiArrowLeft />
            </Link>
            <div>
              <h2 className="font-display font-black text-xl text-gradient">FoodServe</h2>
              <p className="text-xs font-semibold text-primary-500 tracking-wider uppercase">Tài Xế Dashboard</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="p-4 bg-gray-50 dark:bg-dark-300/50 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold dark:text-white text-sm">{user?.name || 'Tài Xế'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {isOnline ? 'Đang hoạt động' : 'Đang ngoại tuyến'}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle status */}
            <div className="flex items-center justify-between p-2.5 bg-white dark:bg-dark-200 rounded-xl shadow-sm border border-gray-100/50 dark:border-gray-800/50">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Trạng thái nhận đơn</span>
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 focus:outline-none flex items-center ${isOnline ? 'bg-emerald-500 justify-end' : 'bg-gray-300 dark:bg-dark-300 justify-start'}`}
              >
                <motion.div layout className="w-5.5 h-5.5 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Wallet and Stats */}
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-primary-600 rounded-3xl text-white shadow-lg shadow-primary-500/10">
              <p className="text-xs font-semibold text-white/80 uppercase">Ví Thu Nhập</p>
              <h3 className="text-3xl font-black mt-1 flex items-baseline gap-1">
                {user?.coins || 0} <span className="text-sm font-bold text-white/90">Xu</span>
              </h3>
              <p className="text-[10px] text-white/70 mt-2">1 Xu thưởng = 1.000 VNĐ tiền mặt</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-gray-50 dark:bg-dark-300/30 rounded-2xl text-center border border-gray-100/30 dark:border-gray-800/30">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Đơn đã giao</p>
                <p className="text-lg font-black dark:text-white mt-0.5">{completedOrders.length}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-dark-300/30 rounded-2xl text-center border border-gray-100/30 dark:border-gray-800/30">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Doanh thu ship</p>
                <p className="text-sm font-black text-emerald-500 mt-1">{formatPrice(totalShipEarnings)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel for Testing */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <button 
            onClick={handleCreateMockOrder}
            className="w-full py-3 bg-gray-100 dark:bg-dark-300 hover:bg-primary-500 hover:text-white text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <FiBox /> Giả lập đơn hàng mới
          </button>
          <button 
            onClick={triggerRefresh}
            className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <FiRefreshCw /> Làm mới đơn
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navigation tabs */}
        <div className="bg-white dark:bg-dark-200 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'available', label: 'Đơn mới nhận', badge: availableOrders.length, color: 'bg-primary-500 text-white' },
              { id: 'active', label: 'Đơn đang giao', badge: activeOrders.length, color: 'bg-primary-500 text-white' },
              { id: 'history', label: 'Lịch sử giao', badge: historyOrders.length, color: 'bg-gray-500 text-white' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-primary text-white shadow-md' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300'
                }`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === tab.id ? 'bg-white text-primary-600' : 'bg-red-500 text-white'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 hidden sm:block">
            🔔 Luồng tự động: 90% cước ship về ví Shipper, chiết khấu 10%
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="flex-1 p-6 overflow-y-auto w-full mx-auto">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-2">
              <FiRefreshCw className="animate-spin text-3xl text-primary-500" />
              <p className="text-sm font-semibold">Đang truy vấn đơn hàng...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'available' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-4xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold dark:text-white text-base">🛒 Đơn hàng có sẵn trong khu vực ({availableOrders.length})</h3>
                    {!isOnline && (
                      <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                        <FiAlertTriangle /> Bật hoạt động để nhận đơn
                      </span>
                    )}
                  </div>
                  {availableOrders.length === 0 ? (
                    <div className="bg-white dark:bg-dark-200 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center">
                      <span className="text-4xl">🛵</span>
                      <p className="text-gray-400 text-sm font-semibold mt-3">Không có đơn hàng nào đang chờ nhận.</p>
                      <p className="text-xs text-gray-400/80 mt-1">Sử dụng nút "Giả lập đơn hàng mới" bên trái để tạo đơn test.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {availableOrders.map(order => {
                        const drShare = order.deliveryFee * 0.9;
                        const sysCut = order.deliveryFee * 0.1;
                        return (
                          <div key={order._id} className="bg-white dark:bg-dark-200 rounded-3xl p-5 shadow-card border border-gray-100 dark:border-gray-800 flex flex-col justify-between md:flex-row gap-4 hover:border-primary-500/30 transition-all">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-black text-xs text-gray-400 uppercase">Đơn #{order._id.substring(18)}</span>
                                <span className={`badge ${orderStatusMap[order.status]?.color} text-[10px] px-2 py-0.5 border rounded-lg font-bold`}>
                                  {orderStatusMap[order.status]?.label}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-400 flex items-center gap-1"><FiMapPin /> Nơi nhận hàng (Nhà hàng):</p>
                                <p className="text-sm font-bold dark:text-white mt-0.5">Nhà đối tác hệ thống</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-400 flex items-center gap-1"><FiNavigation /> Điểm giao hàng:</p>
                                <p className="text-sm font-bold dark:text-white mt-0.5">{order.deliveryAddress}</p>
                              </div>
                              <div className="flex gap-4 pt-1">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Cước Ship</p>
                                  <p className="font-black text-emerald-500 text-sm">{formatPrice(order.deliveryFee)}</p>
                                </div>
                                <div className="border-l border-gray-100 dark:border-gray-800 pl-4">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Thực nhận (90%)</p>
                                  <p className="font-black text-amber-500 text-sm">{drShare / 1000} Xu</p>
                                </div>
                                <div className="border-l border-gray-100 dark:border-gray-800 pl-4">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Khấu phí (10%)</p>
                                  <p className="font-black text-red-500 text-sm">{sysCut / 1000} Xu</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-end justify-end md:w-36">
                              <button
                                disabled={processingId === order._id || !isOnline}
                                onClick={() => handleAcceptOrder(order._id)}
                                className="w-full py-3 bg-gradient-primary disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                {processingId === order._id ? 'Đang nhận...' : 'Nhận Giao Đơn'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'active' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {activeOrders.length === 0 ? (
                    <div className="bg-white dark:bg-dark-200 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center max-w-4xl">
                      <span className="text-4xl">📦</span>
                      <p className="text-gray-400 text-sm font-semibold mt-3">Bạn chưa nhận giao đơn hàng nào.</p>
                      <p className="text-xs text-gray-400/80 mt-1">Hãy chuyển qua tab "Đơn mới nhận" để nhận đơn.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Active Orders list */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold dark:text-white text-sm">🛵 Đơn hàng đang nhận ({activeOrders.length})</h3>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Nhấp để xem bản đồ</span>
                        </div>
                        
                        {activeOrders.map(order => {
                          const isSelected = selectedActiveOrderId === order._id;
                          const drShare = order.deliveryFee * 0.9;
                          return (
                            <div 
                              key={order._id} 
                              onClick={() => setSelectedActiveOrderId(order._id)}
                              className={`bg-white dark:bg-dark-200 rounded-3xl p-5 shadow-card border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-primary-500 dark:border-primary-500 ring-2 ring-primary-500/10' 
                                  : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-center pb-2.5 border-b border-gray-50/50 dark:border-gray-800/50">
                                <div>
                                  <span className="font-black text-xs text-gray-400 uppercase">ĐƠN #{order._id.substring(18)}</span>
                                  <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</p>
                                </div>
                                <span className={`badge ${orderStatusMap[order.status]?.color} text-[10px] px-2 py-0.5 border rounded-lg font-bold`}>
                                  {orderStatusMap[order.status]?.label}
                                </span>
                              </div>

                              <div className="py-3 space-y-2 text-xs">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold">📍 GIAO ĐẾN:</p>
                                  <p className="dark:text-white font-bold truncate mt-0.5">{order.deliveryAddress}</p>
                                </div>
                                <div className="flex justify-between">
                                  <div>
                                    <p className="text-[10px] text-gray-400 font-bold">📞 SĐT KHÁCH:</p>
                                    <p className="dark:text-white font-bold mt-0.5">{order.contactPhone}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold">CƯỚC THỰC NHẬN:</p>
                                    <p className="text-amber-500 font-black mt-0.5">+{drShare / 1000} Xu</p>
                                  </div>
                                </div>
                              </div>

                              {/* Hành động nhanh nếu không xem bản đồ */}
                              <div className="flex gap-2 justify-end pt-2 border-t border-gray-50 dark:border-gray-800/40">
                                {order.status === 'preparing' && (
                                  <button
                                    disabled={processingId === order._id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(order._id, 'delivering')
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all"
                                  >
                                    Bắt đầu giao
                                  </button>
                                )}
                                {order.status === 'delivering' && (
                                  <button
                                    disabled={processingId === order._id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(order._id, 'completed')
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all"
                                  >
                                    Đã giao xong
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: GPS Navigation Map */}
                      <div className="lg:col-span-7 bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold dark:text-white text-sm flex items-center gap-1.5">
                            <FiNavigation className="text-primary-500 animate-bounce" /> Chỉ đường & Mô phỏng GPS Live
                          </h4>
                          {selectedOrderObj && (
                            <span className="text-[10px] text-gray-400 font-bold">ĐƠN ĐANG XEM: #{selectedOrderObj._id.substring(18)}</span>
                          )}
                        </div>
                        <MapSimulator 
                          order={selectedOrderObj} 
                          onStatusUpdate={handleUpdateStatus} 
                          processingId={processingId}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-4xl">
                  <div className="bg-white dark:bg-dark-200 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3">
                      <span className="text-xs text-gray-400 font-bold uppercase">Tổng cước phí giao</span>
                      <p className="text-xl font-black text-primary-500 mt-1">{formatPrice(totalShipEarnings)}</p>
                    </div>
                    <div className="text-center p-3 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-400 font-bold uppercase">Thực nhận ví (90%)</span>
                      <p className="text-xl font-black text-amber-500 mt-1">+{driverShare / 1000} Xu</p>
                    </div>
                    <div className="text-center p-3 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-400 font-bold uppercase">Hệ thống khấu (10%)</span>
                      <p className="text-xl font-black text-red-500 mt-1">-{systemCut / 1000} Xu</p>
                    </div>
                  </div>

                  <h3 className="font-bold dark:text-white text-base">📜 Lịch sử đơn hàng đã hoàn tất ({completedOrders.length})</h3>
                  {historyOrders.length === 0 ? (
                    <div className="bg-white dark:bg-dark-200 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center">
                      <p className="text-gray-400 text-sm font-semibold">Chưa có lịch sử giao hàng nào được ghi nhận.</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-dark-200 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-dark-300 text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                              <th className="p-4">ĐƠN HÀNG</th>
                              <th className="p-4">ĐỊA CHỈ GIAO</th>
                              <th className="p-4">CƯỚC GIAO</th>
                              <th className="p-4">THỰC NHẬN (90%)</th>
                              <th className="p-4">KHẤU (10%)</th>
                              <th className="p-4">TRẠNG THÁI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
                            {historyOrders.map(order => {
                              const isCompleted = order.status === 'completed';
                              const drShare = order.deliveryFee * 0.9;
                              const sysCut = order.deliveryFee * 0.1;
                              return (
                                <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-dark-300/30 transition-colors">
                                  <td className="p-4 font-bold">#{order._id.substring(18)}</td>
                                  <td className="p-4 truncate max-w-[200px]">{order.deliveryAddress}</td>
                                  <td className="p-4 font-semibold">{formatPrice(order.deliveryFee)}</td>
                                  <td className="p-4 font-bold text-emerald-500">
                                    {isCompleted ? `+${drShare / 1000} Xu` : '0 Xu'}
                                  </td>
                                  <td className="p-4 font-bold text-red-500">
                                    {isCompleted ? `-${sysCut / 1000} Xu` : '0 Xu'}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 border rounded-lg text-[10px] font-bold ${orderStatusMap[order.status]?.color}`}>
                                      {orderStatusMap[order.status]?.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
