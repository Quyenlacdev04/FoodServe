import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiHome, FiPlus, FiEdit, FiTrash2, FiShoppingBag, 
  FiLayers, FiDollarSign, FiClock, FiCheckCircle, 
  FiXCircle, FiTrendingUp, FiSave, FiEye, FiSettings,
  FiCreditCard, FiImage, FiAlertTriangle, FiRefreshCw, FiMessageCircle
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { formatPrice } from '../data/mockData'
import { updateUser } from '../store/slices/authSlice'
import ImageUpload from '../components/ui/ImageUpload'
import RestaurantAnalytics from '../components/analytics/RestaurantAnalytics'
import ChatButton from '../components/chat/ChatButton'

const orderStatusMap = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  preparing: { label: 'Đang chuẩn bị', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
  delivering: { label: 'Đang giao', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  completed: { label: 'Hoàn thành', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
}

export default function RestaurantManagePage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  // Modals / forms state
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    description: '',
    category: 'Món chính',
    popular: false
  })

  // Store settings form
  const [storeForm, setStoreForm] = useState({
    name: '', address: '', description: '', image: '', cover: ''
  })
  const [savingStore, setSavingStore] = useState(false)

  // Subscription state
  const [systemSettings, setSystemSettings] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [qrStep, setQrStep] = useState(0) // 0: chọn, 1: QR, 2: thành công
  const [customQRCode, setCustomQRCode] = useState('') // QR code tùy chỉnh
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountName: '',
    accountNumber: ''
  }) // Thông tin ngân hàng

  // Validate Merchant Access
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập!')
      navigate('/')
      return
    }
    if (user && !user.isMerchant && user.role !== 'merchant' && user.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập! Vui lòng đăng xuất và đăng nhập lại để cập nhật quyền.')
      navigate('/')
      return
    }
  }, [user, isAuthenticated, navigate])

  // Fetch restaurant and menu items
  useEffect(() => {
    if (!user) return

    const fetchOwnerRestaurant = async () => {
      try {
        setLoading(true)
        // 1. Get owned restaurant info
        const res = await fetch(`http://localhost:5000/api/restaurants/owned/${user._id || user.id}`)
        if (!res.ok) {
          throw new Error('Bạn chưa được cấp quyền quản lý nhà hàng nào.')
        }
        const restData = await res.json()
        setRestaurant(restData)
        setStoreForm({
          name: restData.name || '',
          address: restData.address || '',
          description: restData.description || '',
          image: restData.image || '',
          cover: restData.cover || ''
        })

        // 2. Fetch full details (including menu items)
        const detailsRes = await fetch(`http://localhost:5000/api/restaurants/${restData._id}`)
        if (detailsRes.ok) {
          const fullData = await detailsRes.json()
          setMenuItems(fullData.menuItems || [])
        }

        // 3. Fetch restaurant orders
        const ordersRes = await fetch(`http://localhost:5000/api/orders/restaurant/${restData._id}`)
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(ordersData)
        }

        // 4. Fetch system settings (for subscription fee)
        const settingsRes = await fetch('http://localhost:5000/api/settings')
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setSystemSettings(settingsData)
        }
      } catch (err) {
        console.error(err)
        toast.error(err.message || 'Lỗi tải dữ liệu nhà hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchOwnerRestaurant()
  }, [user, refreshTrigger])

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1)

  // Create or Update Menu Item
  const handleItemSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      toast.error('Vui lòng nhập tên và giá món ăn')
      return
    }

    try {
      const url = editingItem 
        ? `http://localhost:5000/api/restaurants/menu/${editingItem._id}`
        : `http://localhost:5000/api/restaurants/${restaurant._id}/menu`
      
      const method = editingItem ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price)
        })
      })

      if (res.ok) {
        toast.success(editingItem ? 'Cập nhật món ăn thành công!' : 'Thêm món ăn mới thành công!')
        setShowItemModal(false)
        setEditingItem(null)
        setFormData({
          name: '',
          price: '',
          image: '',
          description: '',
          category: 'Món chính',
          popular: false
        })
        triggerRefresh()
      } else {
        toast.error('Lỗi khi lưu món ăn')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  // Delete Menu Item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa món này không?')) return
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/menu/${itemId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Đã xóa món ăn!')
        triggerRefresh()
      } else {
        toast.error('Lỗi khi xóa món')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success('Đã cập nhật trạng thái đơn hàng!')
        triggerRefresh()
      } else {
        toast.error('Lỗi cập nhật trạng thái')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const openAddModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      price: '',
      image: '',
      description: '',
      category: 'Món chính',
      popular: false
    })
    setShowItemModal(true)
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      price: item.price || '',
      image: item.image || '',
      description: item.description || '',
      category: item.category || 'Món chính',
      popular: !!item.popular
    })
    setShowItemModal(true)
  }

  // Save Store Settings
  const handleSaveStore = async (e) => {
    e.preventDefault()
    if (!storeForm.name) { toast.error('Tên cửa hàng không được trống!'); return }
    try {
      setSavingStore(true)
      const res = await fetch(`http://localhost:5000/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeForm)
      })
      if (res.ok) {
        const updated = await res.json()
        setRestaurant(updated)
        toast.success('Cập nhật thông tin cửa hàng thành công!', { icon: '🏪' })
        // Trigger refresh để reload toàn bộ dữ liệu
        triggerRefresh()
      } else {
        toast.error('Lỗi khi cập nhật thông tin cửa hàng')
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setSavingStore(false)
    }
  }

  // Renew Subscription
  const handleRenewSubscription = async (method) => {
    try {
      setPaymentProcessing(true)
      if (method === 'mockPayment') {
        setQrStep(1)
        // Không tự động chuyển sang bước 2, chờ user click "Đã chuyển khoản"
        return
      }
      if (method === 'qr_payment') {
        // Gửi yêu cầu thanh toán chờ admin duyệt
        const res = await fetch(`http://localhost:5000/api/restaurants/${restaurant._id}/request-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paymentMethod: 'bank_transfer',
            amount: monthlyFee,
            userId: user._id || user.id,
            restaurantId: restaurant._id,
            restaurantName: restaurant.name
          })
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Đã gửi yêu cầu thanh toán! Admin sẽ xác nhận trong vòng 24h.', { 
            icon: '⏳',
            duration: 5000 
          })
          setShowPaymentModal(false)
          setQrStep(0)
        } else {
          toast.error(data.message || 'Lỗi gửi yêu cầu thanh toán')
        }
        setPaymentProcessing(false)
        return
      }
      
      // Xử lý thanh toán bằng xu (tự động)
      const res = await fetch(`http://localhost:5000/api/restaurants/${restaurant._id}/renew-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method, userId: user._id || user.id })
      })
      const data = await res.json()
      if (res.ok) {
        setQrStep(2)
        toast.success(data.message, { icon: '🎉' })
        setRestaurant(prev => ({ ...prev, subscriptionExpiry: data.subscriptionExpiry }))
        // Update user coins in redux if paid with coins
        if (method === 'coins' && data.coinsRemaining !== undefined) {
          dispatch(updateUser({ coins: data.coinsRemaining }))
        }
        setTimeout(() => {
          setShowPaymentModal(false)
          setQrStep(0)
        }, 2000)
      } else {
        toast.error(data.message)
        setQrStep(0)
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ')
      setQrStep(0)
    } finally {
      setPaymentProcessing(false)
    }
  }

  // Overview metrics calculation
  const completedOrders = orders.filter(o => o.status === 'completed')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount), 0)
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing').length
  const isSubscriptionExpired = restaurant?.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) < new Date()
  const monthlyFee = systemSettings?.monthlyRestaurantFee || 500000
  const feeInCoins = Math.ceil(monthlyFee / 1000)
  
  // Tính số ngày còn lại
  const daysUntilExpiry = restaurant?.subscriptionExpiry 
    ? Math.ceil((new Date(restaurant.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : 0
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 7

  if (loading && !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Đang tải thông tin quản lý nhà hàng...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300 px-4">
        <div className="max-w-md text-center bg-white dark:bg-dark-200 p-8 rounded-3xl shadow-card">
          <span className="text-5xl block mb-4">🔒</span>
          <h3 className="text-xl font-bold dark:text-white mb-2">Quyền truy cập bị từ chối</h3>
          <p className="text-gray-400 mb-6">Bạn chưa có nhà hàng nào được liên kết hoặc đang chờ Admin phê duyệt đơn đăng ký của bạn.</p>
          <Link to="/" className="btn-primary inline-block w-full">Về trang chủ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Cảnh báo hết hạn - hiển thị ở đầu trang */}
        {(isSubscriptionExpired || isExpiringSoon) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border-2 ${
              isSubscriptionExpired
                ? 'bg-red-50 dark:bg-red-950/20 border-red-500'
                : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{isSubscriptionExpired ? '🔒' : '⏰'}</span>
              <div className="flex-1">
                <h3 className={`font-bold ${isSubscriptionExpired ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                  {isSubscriptionExpired 
                    ? (!restaurant.paymentHistory || restaurant.paymentHistory.length === 0 
                        ? '⚠️ Cửa hàng cần đóng phí duy trì để kích hoạt!' 
                        : '⚠️ Cửa hàng đã bị tạm khóa do hết hạn phí duy trì!')
                    : `⏰ Cảnh báo: Còn ${daysUntilExpiry} ngày nữa hết hạn!`
                  }
                </h3>
                <p className={`text-sm mt-1 ${isSubscriptionExpired ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>
                  {isSubscriptionExpired
                    ? (!restaurant.paymentHistory || restaurant.paymentHistory.length === 0
                        ? 'Cửa hàng của bạn mới được phê duyệt. Vui lòng đóng phí duy trì lần đầu để kích hoạt hoạt động và hiển thị trên ứng dụng.'
                        : 'Khách hàng không thể xem hoặc đặt hàng từ cửa hàng của bạn. Vui lòng gia hạn ngay để mở lại.')
                    : `Phí duy trì sẽ hết hạn vào ${new Date(restaurant.subscriptionExpiry).toLocaleDateString('vi-VN')}. Gia hạn ngay để tránh gián đoạn kinh doanh.`
                  }
                </p>
              </div>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-2 rounded-xl font-bold text-white ${
                  isSubscriptionExpired
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                } transition-colors`}
              >
                Gia hạn ngay
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Banner/Header nhà hàng */}
        <div className="relative h-48 sm:h-64 rounded-3xl overflow-hidden shadow-lg mb-8 group">
          <img 
            src={restaurant.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'} 
            alt={restaurant.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end w-full gap-4">
              <div>
                <span className="bg-primary-500 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  Chủ nhà hàng
                </span>
                <h1 className="text-2xl sm:text-4xl font-display font-black text-white mt-2 tracking-tight drop-shadow-md">
                  {restaurant.name}
                </h1>
                <p className="text-gray-200 text-sm mt-1 flex items-center gap-1.5 drop-shadow">
                  📍 {restaurant.address} | ⭐ {restaurant.rating.toFixed(1)} ({restaurant.reviews} đánh giá)
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-white text-sm font-semibold">Đang mở cửa kinh doanh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bố cục chính: Tabs & Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cột trái: Tab Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === 'overview' 
                  ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiTrendingUp className="text-lg" /> Tổng quan kết quả
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiTrendingUp className="text-lg" /> Báo cáo thống kê
            </button>
            <button 
              onClick={() => setActiveTab('menu')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === 'menu' 
                  ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiLayers className="text-lg" /> Quản lý Thực đơn
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiSettings className="text-lg" /> Cài đặt cửa hàng
            </button>
            <button 
              onClick={() => setActiveTab('subscription')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all relative ${
                activeTab === 'subscription' 
                  ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiCreditCard className="text-lg" /> Phí duy trì
              {isSubscriptionExpired && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  !
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('payment-history')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === 'payment-history' 
                  ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiClock className="text-lg" /> Lịch sử thanh toán
            </button>
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all relative ${
                activeTab === 'orders' 
                  ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiShoppingBag className="text-lg" /> Đơn hàng gửi tới
              {pendingOrdersCount > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
            
            <hr className="border-gray-200 dark:border-gray-800" />
            <Link to="/" className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold bg-white dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300 transition-colors">
              <FiHome className="text-lg" /> Quay lại trang chủ
            </Link>
          </div>

          {/* Cột phải: Content Area */}
          <div className="flex-1">
            
            {/* TỔNG QUAN TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Card Doanh thu */}
                  <div className="bg-white dark:bg-dark-200 p-6 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center text-2xl">
                      <FiDollarSign />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Doanh thu đạt</p>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{formatPrice(totalRevenue)}</p>
                    </div>
                  </div>

                  {/* Card Đơn thành công */}
                  <div className="bg-white dark:bg-dark-200 p-6 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl">
                      <FiCheckCircle />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Đơn hoàn tất</p>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{completedOrders.length} đơn hàng</p>
                    </div>
                  </div>

                  {/* Card Đơn chờ xử lý */}
                  <div className="bg-white dark:bg-dark-200 p-6 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-2xl">
                      <FiClock />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Đơn đang xử lý</p>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{pendingOrdersCount} đơn hàng</p>
                    </div>
                  </div>

                </div>

                {/* Danh sách đơn hàng mới nhận */}
                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-lg dark:text-white mb-4">Các đơn hàng mới nhận</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 text-sm font-semibold text-gray-400">
                          <th className="p-4 pl-0">Mã đơn</th>
                          <th className="p-4">Thời gian</th>
                          <th className="p-4">Số món</th>
                          <th className="p-4">Thành tiền</th>
                          <th className="p-4">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => (
                          <tr key={o._id} className="border-b border-gray-50 dark:border-gray-800/40 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-100/55 transition-colors">
                            <td className="p-4 pl-0 font-mono text-sm dark:text-gray-300">#{o._id.substring(0, 6).toUpperCase()}</td>
                            <td className="p-4 text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()}</td>
                            <td className="p-4 text-sm font-medium dark:text-gray-300">{o.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td>
                            <td className="p-4 font-bold text-primary-500">{formatPrice(o.finalAmount || o.totalAmount)}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${orderStatusMap[o.status]?.color}`}>
                                {orderStatusMap[o.status]?.label}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-400">Chưa có đơn hàng nào đổ về!</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BÁO CÁO THỐNG KÊ TAB */}
            {activeTab === 'analytics' && (
              <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                <div className="mb-6">
                  <h3 className="font-bold text-xl dark:text-white">📊 Báo cáo thống kê nâng cao</h3>
                  <p className="text-sm text-gray-400">Phân tích doanh thu, món bán chạy và giờ cao điểm</p>
                </div>
                <RestaurantAnalytics restaurantId={restaurant._id} />
              </div>
            )}

            {/* QUẢN LÝ THỰC ĐƠN TAB */}
            {activeTab === 'menu' && (
              <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-xl dark:text-white">Thực đơn nhà hàng</h3>
                    <p className="text-sm text-gray-400">Thêm, sửa, xóa các món ăn kinh doanh</p>
                  </div>
                  <button 
                    onClick={openAddModal}
                    className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02]"
                  >
                    <FiPlus /> Thêm món mới
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menuItems.map(item => (
                    <div key={item._id} className="flex gap-4 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50 dark:bg-dark-300/40 hover:shadow-md transition-shadow relative group">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} 
                        alt={item.name} 
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold dark:text-white group-hover:text-primary-500 transition-colors">{item.name}</h4>
                            <span className="text-xs bg-primary-100 dark:bg-primary-950/40 text-primary-500 font-bold px-2 py-0.5 rounded-md">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description || 'Chưa có mô tả chi tiết cho món ăn này.'}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-bold text-primary-500 text-lg">{formatPrice(item.price)}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openEditModal(item)}
                              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <FiEdit />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {menuItems.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-gray-400">
                      Thực đơn trống. Hãy thêm món ăn đầu tiên của bạn!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LỊCH SỬ THANH TOÁN TAB */}
            {activeTab === 'payment-history' && (
              <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                <div className="mb-6">
                  <h3 className="font-bold text-xl dark:text-white">Lịch sử thanh toán phí duy trì</h3>
                  <p className="text-sm text-gray-400">Xem tất cả các lần đóng phí duy trì cửa hàng</p>
                </div>

                {/* Thống kê tổng quan */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">Tổng số lần thanh toán</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{restaurant?.paymentHistory?.length || 0} lần</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider mb-1">Tổng chi phí</p>
                    <p className="text-2xl font-black text-green-700 dark:text-green-300">
                      {formatPrice(restaurant?.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-4 rounded-2xl border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider mb-1">Lần thanh toán gần nhất</p>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                      {restaurant?.paymentHistory?.length > 0 
                        ? new Date(restaurant.paymentHistory[restaurant.paymentHistory.length - 1].paidAt).toLocaleDateString('vi-VN')
                        : 'Chưa có'
                      }
                    </p>
                  </div>
                </div>

                {/* Bảng lịch sử */}
                <div className="overflow-x-auto">
                  {!restaurant?.paymentHistory || restaurant.paymentHistory.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <FiClock className="text-5xl mx-auto mb-3 opacity-50" />
                      <p className="font-semibold">Chưa có lịch sử thanh toán nào</p>
                      <p className="text-sm mt-1">Các giao dịch thanh toán phí duy trì sẽ hiển thị ở đây</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
                          <th className="p-4 pl-0">Ngày thanh toán</th>
                          <th className="p-4">Số tiền</th>
                          <th className="p-4">Phương thức</th>
                          <th className="p-4">Kỳ hạn</th>
                          <th className="p-4">Ghi chú</th>
                          <th className="p-4 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...restaurant.paymentHistory].reverse().map((payment, index) => (
                          <tr key={payment._id || index} className="border-b border-gray-100 dark:border-gray-800/40 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-100/30 transition-colors">
                            <td className="p-4 pl-0">
                              <div>
                                <p className="font-semibold dark:text-white">{new Date(payment.paidAt).toLocaleDateString('vi-VN')}</p>
                                <p className="text-xs text-gray-400">{new Date(payment.paidAt).toLocaleTimeString('vi-VN')}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-green-600 dark:text-green-400">
                                {payment.paymentMethod === 'coins' 
                                  ? `${payment.amount} Xu` 
                                  : formatPrice(payment.amount)
                                }
                              </p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                payment.paymentMethod === 'coins'
                                  ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                              }`}>
                                {payment.paymentMethod === 'coins' ? '🪙 Xu thưởng' : '💳 Chuyển khoản'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="text-xs">
                                <p className="text-gray-500 dark:text-gray-400">
                                  {new Date(payment.periodStart).toLocaleDateString('vi-VN')}
                                </p>
                                <p className="text-gray-400">→</p>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {new Date(payment.periodEnd).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                              {payment.transactionNote || '-'}
                            </td>
                            <td className="p-4 text-right">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400">
                                ✓ Hoàn tất
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* QUẢN LÝ ĐƠN HÀNG TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                <div className="mb-6">
                  <h3 className="font-bold text-xl dark:text-white">Đơn hàng gửi tới</h3>
                  <p className="text-sm text-gray-400">Xem và cập nhật trạng thái chuẩn bị đơn hàng</p>
                </div>

                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order._id} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50 dark:bg-dark-300/30">
                      
                      {/* Order Info Row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                        <div>
                          <p className="font-mono font-bold dark:text-white">Đơn hàng #{order._id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Đặt lúc: {new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${orderStatusMap[order.status]?.color}`}>
                            {orderStatusMap[order.status]?.label}
                          </span>
                          
                          {/* Trạng thái dropdown */}
                          <select 
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            className="bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 text-sm rounded-xl px-3 py-1.5 outline-none font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                          >
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Xác nhận đơn</option>
                            <option value="preparing">Đang làm món</option>
                            <option value="delivering">Đang giao hàng</option>
                            <option value="completed">Đã giao xong</option>
                            <option value="cancelled">Hủy đơn hàng</option>
                          </select>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="py-4 space-y-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="dark:text-gray-300 font-medium">
                              {item.name} <strong className="text-primary-500 font-bold ml-1">x{item.quantity}</strong>
                            </span>
                            <span className="font-semibold text-gray-600 dark:text-gray-400">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Customer Info & Summary */}
                      <div className="border-t border-gray-200 dark:border-gray-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p><strong>Khách hàng:</strong> {order.userName || 'Ẩn danh'}</p>
                          <p><strong>Địa chỉ giao:</strong> {order.shippingAddress || 'Chưa cung cấp'}</p>
                          <p><strong>Số điện thoại:</strong> {order.userPhone || 'Không có'}</p>
                          {order.note && <p className="text-yellow-500"><strong>Ghi chú khách:</strong> "{order.note}"</p>}
                        </div>
                        <div className="flex flex-col justify-end items-end gap-2">
                          <p className="text-xs text-gray-400">Tổng thu hộ:</p>
                          <p className="text-xl font-black text-primary-500">{formatPrice(order.finalAmount || order.totalAmount)}</p>
                          
                          {/* Nút Chat */}
                          <button
                            onClick={() => setSelectedOrderId(order._id)}
                            className="mt-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-lg text-white rounded-xl font-bold transition-all flex items-center gap-2"
                          >
                            <FiMessageCircle /> Chat với khách
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="py-12 text-center text-gray-400">
                      Chưa có đơn hàng nào được đặt tại nhà hàng của bạn.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CÀI ĐẶT CỬA HÀNG TAB */}
            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800"
              >
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><FiSettings className="text-primary-500" /> Cài đặt cửa hàng</h3>
                    <p className="text-sm text-gray-400">Chỉnh sửa thông tin, ảnh đại diện và ảnh bìa cửa hàng của bạn</p>
                  </div>
                  <button
                    onClick={triggerRefresh}
                    className="px-4 py-2 bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-600 dark:text-gray-300 rounded-xl font-medium flex items-center gap-2 transition-colors"
                    title="Làm mới dữ liệu"
                  >
                    <FiRefreshCw className="text-sm" /> Làm mới
                  </button>
                </div>

                {/* Preview ảnh */}
                <div className="relative h-40 rounded-2xl overflow-hidden mb-6 group">
                  <img 
                    src={storeForm.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'}
                    alt="Cover" className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-end gap-4">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                      <img 
                        src={storeForm.image || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200'}
                        alt="Logo" className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg drop-shadow">{storeForm.name || 'Tên cửa hàng'}</p>
                      <p className="text-white/70 text-xs drop-shadow">{storeForm.address || 'Địa chỉ cửa hàng'}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveStore} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tên cửa hàng <span className="text-red-500">*</span></label>
                      <input 
                        type="text" value={storeForm.name}
                        onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Nhập tên cửa hàng" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ</label>
                      <input 
                        type="text" value={storeForm.address}
                        onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mô tả cửa hàng</label>
                    <textarea 
                      value={storeForm.description}
                      onChange={e => setStoreForm({ ...storeForm, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                      placeholder="Giới thiệu về cửa hàng, phong cách ẩm thực..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                        <FiImage className="text-blue-500" /> Ảnh đại diện (Logo/Avatar)
                      </label>
                      <ImageUpload
                        value={storeForm.image}
                        onChange={(url) => setStoreForm({ ...storeForm, image: url })}
                        placeholder="Chọn ảnh đại diện từ máy tính"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                        <FiImage className="text-purple-500" /> Ảnh bìa (Cover)
                      </label>
                      <ImageUpload
                        value={storeForm.cover}
                        onChange={(url) => setStoreForm({ ...storeForm, cover: url })}
                        placeholder="Chọn ảnh bìa từ máy tính"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button 
                      type="submit" disabled={savingStore}
                      className="px-8 py-3 bg-gradient-primary hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <FiSave /> {savingStore ? 'Đang lưu...' : 'Lưu thay đổi cửa hàng'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* PHÍ DUY TRÌ TAB */}
            {activeTab === 'subscription' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Trạng thái hiện tại */}
                <div className={`rounded-3xl p-6 shadow-card border ${
                  isSubscriptionExpired 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                    : 'bg-white dark:bg-dark-200 border-gray-100 dark:border-gray-800'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        isSubscriptionExpired 
                          ? 'bg-red-500/10 text-red-500' 
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {isSubscriptionExpired ? <FiAlertTriangle /> : <FiCheckCircle />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg dark:text-white">
                          {isSubscriptionExpired ? '⚠️ Cửa hàng tạm khóa' : '✅ Cửa hàng đang hoạt động'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Hạn duy trì: <strong className={isSubscriptionExpired ? 'text-red-500' : 'text-emerald-500'}>
                            {restaurant?.subscriptionExpiry 
                              ? new Date(restaurant.subscriptionExpiry).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                              : 'Chưa có thông tin'}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setShowPaymentModal(true); setQrStep(0) }}
                      className="px-6 py-3 bg-gradient-primary text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:scale-[1.02] transition-all active:scale-95"
                    >
                      <FiCreditCard /> Đóng phí duy trì
                    </button>
                  </div>

                  {isSubscriptionExpired && (
                    <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        🚫 Cửa hàng của bạn đã <strong>quá hạn phí duy trì</strong>. Khách hàng sẽ không thể đặt món từ cửa hàng của bạn cho đến khi bạn gia hạn thành công.
                      </p>
                    </div>
                  )}
                </div>

                {/* Chi tiết phí */}
                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold dark:text-white mb-4 flex items-center gap-2"><FiDollarSign className="text-primary-500" /> Chi tiết phí duy trì</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-dark-300/50 rounded-2xl text-center">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Mức phí / tháng</p>
                      <p className="text-2xl font-black text-primary-500 mt-1">{formatPrice(monthlyFee)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-dark-300/50 rounded-2xl text-center">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Quy đổi bằng Xu</p>
                      <p className="text-2xl font-black text-amber-500 mt-1">{feeInCoins} Xu</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-dark-300/50 rounded-2xl text-center">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Xu hiện có</p>
                      <p className={`text-2xl font-black mt-1 ${(user?.coins || 0) >= feeInCoins ? 'text-emerald-500' : 'text-red-500'}`}>
                        {user?.coins || 0} Xu
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL THÊM / SỬA MÓN ĂN */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowItemModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-dark-200 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">
                  {editingItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn kinh doanh'}
                </h3>
                <button 
                  onClick={() => setShowItemModal(false)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tên món ăn <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" 
                    placeholder="VD: Phở bò tái lăn"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Giá bán (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" 
                      placeholder="VD: 45000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Danh mục
                    </label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="Món chính">Món chính</option>
                      <option value="Món khai vị">Món khai vị</option>
                      <option value="Đồ uống">Đồ uống</option>
                      <option value="Tráng miệng">Tráng miệng</option>
                      <option value="Món khác">Món khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Hình ảnh món ăn
                  </label>
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    placeholder="Chọn ảnh món ăn từ máy tính"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả món ăn
                  </label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none" 
                    placeholder="Mô tả nguyên liệu, hương vị..." 
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="popular-checkbox"
                    checked={formData.popular} 
                    onChange={e => setFormData({ ...formData, popular: e.target.checked })}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="popular-checkbox" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Món bán chạy (Đánh dấu nổi bật lên đầu)
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowItemModal(false)}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 dark:text-gray-300 font-semibold rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary-500/20"
                  >
                    <FiSave /> Lưu món ăn
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL THANH TOÁN PHÍ DUY TRÌ */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !paymentProcessing && setShowPaymentModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-dark-200 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">
                  Đóng phí duy trì cửa hàng
                </h3>
                <button 
                  disabled={paymentProcessing}
                  onClick={() => setShowPaymentModal(false)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold disabled:opacity-50"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-6">
                {qrStep === 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-dark-300/50 rounded-2xl">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-400 font-medium">Khoản phí cần đóng:</span>
                        <span className="font-bold dark:text-white">{formatPrice(monthlyFee)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-medium">Quy đổi bằng Xu:</span>
                        <span className="font-bold text-amber-500">{feeInCoins} Xu</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 text-center">Chọn một trong hai phương thức thanh toán bên dưới:</p>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Trừ Xu */}
                      <button
                        type="button"
                        disabled={paymentProcessing || (user?.coins || 0) < feeInCoins}
                        onClick={() => handleRenewSubscription('coins')}
                        className="w-full p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🪙</span>
                          <div>
                            <p className="font-bold text-amber-500 text-sm">Thanh toán bằng Xu thưởng</p>
                            <p className="text-xs text-gray-400 mt-0.5">Số dư của bạn: {user?.coins || 0} Xu</p>
                          </div>
                        </div>
                        <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform">➔</span>
                      </button>

                      {/* Quét mã QR */}
                      <button
                        type="button"
                        disabled={paymentProcessing}
                        onClick={() => handleRenewSubscription('mockPayment')}
                        className="w-full p-4 rounded-2xl border border-primary-500/20 bg-primary-500/5 hover:bg-primary-500/10 transition-colors flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <p className="font-bold text-primary-500 text-sm">Chuyển khoản / Quét mã QR</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {customQRCode ? 'Sử dụng QR code của bạn' : 'Thanh toán demo (chưa cấu hình QR)'}
                            </p>
                          </div>
                        </div>
                        <span className="text-primary-500 font-bold group-hover:translate-x-1 transition-transform">➔</span>
                      </button>
                    </div>
                  </div>
                )}

                {qrStep === 1 && (
                  <div className="text-center py-6 space-y-4">
                    <div className="relative w-64 h-64 mx-auto bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-center shadow-md">
                      {systemSettings?.adminPaymentQR ? (
                        <img 
                          src={systemSettings.adminPaymentQR} 
                          alt="QR Code thanh toán Admin" 
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        /* Fake QR code nếu admin chưa cấu hình */
                        <svg className="w-full h-full text-gray-800" viewBox="0 0 100 100">
                          <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" fill="currentColor"/>
                          <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" fill="currentColor"/>
                          <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" fill="currentColor"/>
                          <path d="M45,15 h10 v10 h-10 z M55,5 h5 v5 h-5 z M45,30 h5 v10 h-5 z M60,30 h5 v5 h-5 z M45,45 h15 v5 h-15 z M5,45 h5 v15 h-5 z M20,45 h10 v5 h-10 z M30,55 h10 v10 h-10 z M45,55 h20 v5 h-20 z M80,45 h15 v5 h-15 z M70,55 h10 v10 h-10 z M85,65 h10 v20 h-10 z M55,75 h25 v5 h-25 z M45,85 h35 v10 h-35 z" fill="currentColor"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold dark:text-white">
                        {systemSettings?.adminPaymentQR ? 'Quét mã QR để thanh toán phí duy trì' : 'Mã QR demo - Admin chưa cấu hình'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {systemSettings?.adminPaymentQR 
                          ? 'Chuyển khoản phí duy trì cho FoodServe' 
                          : 'Admin cần cấu hình QR code trong hệ thống'
                        }
                      </p>
                    </div>
                    
                    {systemSettings?.adminPaymentQR ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-left">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 text-center">
                            💳 Chuyển khoản phí duy trì cho FoodServe
                          </p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-blue-600 dark:text-blue-300">Ngân hàng:</span>
                              <strong className="text-blue-700 dark:text-blue-200">{systemSettings.adminBankName}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600 dark:text-blue-300">Chủ TK:</span>
                              <strong className="text-blue-700 dark:text-blue-200">{systemSettings.adminAccountName}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600 dark:text-blue-300">Số TK:</span>
                              <strong className="text-blue-700 dark:text-blue-200 font-mono">{systemSettings.adminAccountNumber}</strong>
                            </div>
                            <div className="flex justify-between border-t border-blue-200 dark:border-blue-700 pt-2">
                              <span className="text-blue-600 dark:text-blue-300">Phí duy trì:</span>
                              <strong className="text-blue-700 dark:text-blue-200 text-sm">{formatPrice(monthlyFee)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600 dark:text-blue-300">Nội dung:</span>
                              <strong className="text-blue-700 dark:text-blue-200">Phi {restaurant?.name}</strong>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRenewSubscription('qr_payment')}
                          disabled={paymentProcessing}
                          className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                        >
                          {paymentProcessing ? 'Đang gửi yêu cầu...' : '📤 Gửi yêu cầu thanh toán (Chờ Admin duyệt)'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-primary-500 text-xs font-semibold animate-pulse">
                        <FiRefreshCw className="animate-spin" /> Kết nối với cổng thanh toán demo...
                      </div>
                    )}
                  </div>
                )}

                {qrStep === 2 && (
                  <div className="text-center py-8 space-y-4">
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto"
                    >
                      ✓
                    </motion.div>
                    <div>
                      <h4 className="font-bold text-emerald-500 text-lg">Giao dịch thành công!</h4>
                      <p className="text-xs text-gray-400 mt-1">Cửa hàng của bạn đã được gia hạn thêm 30 ngày</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Button - hiển thị khi đang ở tab orders và có đơn được chọn */}
      {activeTab === 'orders' && selectedOrderId && (
        <ChatButton orderId={selectedOrderId} />
      )}
    </div>
  )
}
