import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPackage, FiUsers, FiShoppingBag, FiSettings, FiCheckCircle, FiTruck, FiClock, FiHome, FiLogOut, FiSun, FiMoon, FiClipboard, FiDollarSign, FiBell, FiX } from 'react-icons/fi'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { formatPrice } from '../data/mockData'
import AdminRestaurants from '../components/admin/AdminRestaurants'
import AdminUsers from '../components/admin/AdminUsers'
import AdminSettings from '../components/admin/AdminSettings'
import AdminDrivers from '../components/admin/AdminDrivers'
import AdminVouchers from '../components/admin/AdminVouchers'
import NotificationBell from '../components/ui/NotificationBell'
import { logout } from '../store/slices/authSlice'
import { toggleDarkMode } from '../store/slices/uiSlice'

const statusMap = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-500/10 text-yellow-500' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500/10 text-blue-500' },
  preparing: { label: 'Đang chuẩn bị', color: 'bg-indigo-500/10 text-indigo-500' },
  delivering: { label: 'Đang giao', color: 'bg-purple-500/10 text-purple-500' },
  completed: { label: 'Hoàn thành', color: 'bg-green-500/10 text-green-500' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/10 text-red-500' },
}

export default function AdminPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { darkMode } = useSelector((s) => s.ui)
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [partnerRequests, setPartnerRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [driverRequests, setDriverRequests] = useState([])
  const [driverRequestsLoading, setDriverRequestsLoading] = useState(false)
  const [paymentRequests, setPaymentRequests] = useState([])
  const [paymentRequestsLoading, setPaymentRequestsLoading] = useState(false)
  const [subscriptionRevenue, setSubscriptionRevenue] = useState(0)
  const [newOrderAlert, setNewOrderAlert] = useState(null) // popup thông báo đơn mới
  const [unreadOrders, setUnreadOrders] = useState(0) // số đơn chưa xem
  const audioRef = useRef(null)

  // Kiểm tra quyền admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này!')
      window.location.href = '/admin-login.html'
    }
  }, [user, navigate])

  useEffect(() => {
    fetchOrders()
    fetchSubscriptionRevenue()
    
    // Listen for real-time changes
    const socket = io('http://localhost:5000')
    socket.on('order-status-updated', () => {
      fetchOrders()
    })
    socket.on('new-order', (order) => {
      // Phát âm thanh thông báo
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq4FINjRXjMPgspVbMzNPgLzduZxhMzNKdLTYtqFmMzNGaKzTsqZqMzNDXqXOraprMzNBVZ/JqKxuMzM/TZnEo65yMzM9RZO/n7B2MzM7PY26mrJ6MzM5NomzmrR+MzM3L4Wum7aAMzM1KIGqnLiCMzMzIX2nnbqEMzMxGnmknryGMzMvE3Whn76IMzMtDXGeoMCKMzMrB22boMKMMzMpAWmYocSOMzMnAGWVosaPMzMlAGGSo8iRMzMjAF2PpMqTMzMhAFmMpc2VMzMfAFWJps+XMzMdAFGGp9GZMzMbAE2DqNObMzMZAEmAqdWdMzMXAEV9qt+fMzMVAEF6q+GhMzMTAD13rOOjMzMRADl0reWlMzMPADVxruenMzMNADFusPmpMzMLAC1rsfurMzMJAClosvWtMzMHACVls/evMzMFACFis/mxMzMDACBgs/uzMzMBACBgs/uzMzM=')
        audio.volume = 0.5
        audio.play().catch(() => {})
      } catch (e) {}

      setNewOrderAlert(order)
      setUnreadOrders(prev => prev + 1)
      fetchOrders()
      setTimeout(() => setNewOrderAlert(null), 8000)
    })

    // Lắng nghe xác nhận thanh toán online
    socket.on('payment-confirmed', (data) => {
      toast.success(`💳 ${data.message || 'Khách hàng đã thanh toán online!'}`, {
        duration: 5000,
        style: { fontWeight: 'bold' }
      });
      fetchOrders(); // Refresh bảng đơn hàng
    });
    
    return () => socket.disconnect()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Tính tổng phí duy trì đã thu từ nhà hàng
  const fetchSubscriptionRevenue = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/restaurants')
      if (res.ok) {
        const data = await res.json()
        const restaurants = data.restaurants || data
        let total = 0
        restaurants.forEach(r => {
          if (r.paymentHistory) {
            r.paymentHistory.forEach(p => {
              if (p.status === 'completed') {
                // coins: 1 xu = 1000đ, bank_transfer: giá trị thực
                total += p.paymentMethod === 'coins'
                  ? (p.amount * 1000)
                  : (p.amount || 0)
              }
            })
          }
        })
        setSubscriptionRevenue(total)
      }
    } catch {}
  }

  const fetchPartnerRequests = async () => {
    try {
      setRequestsLoading(true)
      const res = await fetch('http://localhost:5000/api/partner/requests')
      if (res.ok) {
        const data = await res.json()
        setPartnerRequests(data)
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách đăng ký đối tác')
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'partner-requests') {
      fetchPartnerRequests()
    }
  }, [activeTab])

  const handlePartnerRequestStatus = async (requestId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/partner/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reviewedBy: user?._id || user?.id })
      })
      if (res.ok) {
        toast.success(newStatus === 'approved' ? 'Đã phê duyệt đối tác và tạo nhà hàng!' : 'Đã từ chối đơn đăng ký')
        fetchPartnerRequests()
      } else {
        toast.error('Lỗi khi cập nhật trạng thái đơn đăng ký')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const fetchDriverRequests = async () => {
    try {
      setDriverRequestsLoading(true)
      const res = await fetch('http://localhost:5000/api/partner/driver/requests')
      if (res.ok) {
        const data = await res.json()
        setDriverRequests(data)
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách đăng ký tài xế')
    } finally {
      setDriverRequestsLoading(false)
    }
  }

  const fetchPaymentRequests = async () => {
    try {
      setPaymentRequestsLoading(true)
      const res = await fetch('http://localhost:5000/api/restaurants/payment-requests/all')
      if (res.ok) {
        const data = await res.json()
        setPaymentRequests(data)
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách yêu cầu thanh toán')
    } finally {
      setPaymentRequestsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'driver-requests') {
      fetchDriverRequests()
    }
    if (activeTab === 'payment-requests') {
      fetchPaymentRequests()
    }
  }, [activeTab])

  const handleDriverRequestStatus = async (requestId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/partner/driver/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reviewedBy: user?._id || user?.id })
      })
      if (res.ok) {
        toast.success(newStatus === 'approved' ? 'Đã phê duyệt tài xế! Tài xế đã có quyền chạy đơn.' : 'Đã từ chối đơn đăng ký tài xế')
        fetchDriverRequests()
      } else {
        toast.error('Lỗi khi cập nhật trạng thái đăng ký tài xế')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const handlePaymentRequestStatus = async (requestId, action, reason = '') => {
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject'
      const res = await fetch(`http://localhost:5000/api/restaurants/payment-requests/${requestId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId: user?._id || user?.id,
          reason: reason
        })
      })
      if (res.ok) {
        toast.success(action === 'approve' ? 'Đã duyệt thanh toán và gia hạn nhà hàng!' : 'Đã từ chối yêu cầu thanh toán')
        fetchPaymentRequests()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Lỗi khi xử lý yêu cầu thanh toán')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Đã đăng xuất!')
    // Chuyển về trang đăng nhập admin
    window.location.href = '/admin-login.html'
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Đã cập nhật thành: ${statusMap[newStatus].label}`)
        fetchOrders()
      } else {
        toast.error('Lỗi khi cập nhật trạng thái')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all')
  const [orderDateFilter, setOrderDateFilter] = useState('all') // all, today, week, month
  const [orderPage, setOrderPage] = useState(1)
  const ORDER_PAGE_SIZE = 10

  // Filter đơn hàng
  const filteredOrders = orders.filter(order => {
    const matchSearch = !orderSearch ||
      order._id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.deliveryAddress || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.userId?.name || '').toLowerCase().includes(orderSearch.toLowerCase())

    const matchStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter

    const matchPayment = orderPaymentFilter === 'all' ||
      (orderPaymentFilter === 'paid' && order.paymentStatus === 'paid') ||
      (orderPaymentFilter === 'unpaid' && order.paymentStatus !== 'paid') ||
      (orderPaymentFilter === 'cash' && order.paymentMethod === 'cash') ||
      (orderPaymentFilter === 'momo' && order.paymentMethod === 'momo') ||
      (orderPaymentFilter === 'coins' && order.paymentMethod === 'coins')

    const now = new Date()
    let matchDate = true
    if (orderDateFilter === 'today') {
      matchDate = new Date(order.createdAt).toDateString() === now.toDateString()
    } else if (orderDateFilter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      matchDate = new Date(order.createdAt) >= weekAgo
    } else if (orderDateFilter === 'month') {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
      matchDate = new Date(order.createdAt) >= monthAgo
    }

    return matchSearch && matchStatus && matchPayment && matchDate
  })

  const totalOrderPages = Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE)
  const pagedOrders = filteredOrders.slice((orderPage - 1) * ORDER_PAGE_SIZE, orderPage * ORDER_PAGE_SIZE)
  const revenue = orders.filter(o => o.status === 'completed').reduce((acc, curr) => acc + (curr.finalAmount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300">

      {/* ===== POPUP THÔNG BÁO ĐƠN HÀNG MỚI ===== */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-20 right-4 z-[100] w-80 bg-white dark:bg-dark-200 rounded-2xl shadow-2xl border-l-4 border-primary-500 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <FiBell className="text-white text-xl" />
                </motion.div>
                <span className="text-white font-bold text-sm">🛒 Đơn hàng mới!</span>
              </div>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Mã đơn</span>
                <span className="font-mono font-bold text-sm text-gray-800 dark:text-white">
                  #{String(newOrderAlert._id || '').slice(-6).toUpperCase()}
                </span>
              </div>
              {newOrderAlert.deliveryAddress && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">Địa chỉ</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 text-right line-clamp-2">
                    📍 {newOrderAlert.deliveryAddress}
                  </span>
                </div>
              )}
              {newOrderAlert.items && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Số món</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {newOrderAlert.items.length} món
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400">Tổng tiền</span>
                <span className="font-bold text-primary-500 text-base">
                  {formatPrice(newOrderAlert.finalAmount || newOrderAlert.totalAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Thanh toán</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {newOrderAlert.paymentMethod === 'cash' ? '💵 Tiền mặt' : '💳 VNPay'}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  setActiveTab('orders')
                  setUnreadOrders(0)
                  setNewOrderAlert(null)
                }}
                className="w-full py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Xem đơn hàng →
              </button>
            </div>

            {/* Progress bar tự động đóng */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
              className="h-1 bg-primary-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-200 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white transform -rotate-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
              </div>
              <span className="text-xl font-display font-black text-gradient hidden sm:block">FoodServe</span>
            </Link>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-2xl">👑</span>
              <span className="font-bold text-gray-800 dark:text-white">Admin Dashboard</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationBell />
            
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <FiSun className="text-xl text-yellow-400" />
              ) : (
                <FiMoon className="text-xl text-gray-800" />
              )}
            </button>
            
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors text-gray-700 dark:text-gray-300"
            >
              <FiHome className="text-lg" />
              <span className="hidden sm:inline font-medium">Về trang chủ</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
            >
              <FiLogOut className="text-lg" />
              <span className="hidden sm:inline font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 pb-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <div className="bg-white dark:bg-dark-100 p-6 rounded-2xl shadow-card mb-4 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center text-3xl mb-3">
              👑
            </div>
            <h3 className="font-bold dark:text-white">{user?.name || 'Admin'}</h3>
            <p className="text-xs text-gray-400">{user?.email || 'admin@foodserve.vn'}</p>
          </div>

          <button onClick={() => { setActiveTab('orders'); setUnreadOrders(0) }} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'orders' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            <FiPackage /> Quản lý Đơn hàng
            {unreadOrders > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
              >
                {unreadOrders}
              </motion.span>
            )}
          </button>
          <button onClick={() => setActiveTab('restaurants')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'restaurants' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            <FiShoppingBag /> Quản lý Nhà hàng
          </button>
          <button onClick={() => setActiveTab('partner-requests')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'partner-requests' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            <FiClipboard /> Yêu cầu đối tác
          </button>
          <button onClick={() => setActiveTab('payment-requests')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'payment-requests' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            <FiDollarSign /> Yêu cầu thanh toán
          </button>
          <button onClick={() => setActiveTab('driver-requests')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'driver-requests' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            <FiTruck /> Yêu cầu tài xế
          </button>
          <button onClick={() => setActiveTab('drivers')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'drivers' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            🛵 Quản lý Tài xế
          </button>
          <button onClick={() => setActiveTab('vouchers')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'vouchers' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            🎫 Quản lý Voucher
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'users' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            <FiUsers /> Quản lý Users
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-primary-500 text-white shadow-glow' : 'hover:bg-white dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400'}`}>
            <FiSettings /> Cài đặt hệ thống
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-100 p-6 rounded-2xl shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl"><FiPackage /></div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Tổng Đơn Hàng</p>
                <h4 className="text-2xl font-bold dark:text-white">{orders.length}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{orders.filter(o => o.status === 'completed').length} hoàn thành</p>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-100 p-6 rounded-2xl shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-xl"><FiDollarSign /></div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Hoa hồng nền tảng</p>
                <h4 className="text-2xl font-bold dark:text-white">{formatPrice(Math.round(revenue * 0.1))}</h4>
                <p className="text-xs text-gray-400 mt-0.5">10% tổng đơn hoàn thành</p>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-100 p-6 rounded-2xl shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl">🏪</div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Phí duy trì đã thu</p>
                <h4 className="text-2xl font-bold dark:text-white">{formatPrice(subscriptionRevenue)}</h4>
                <p className="text-xs text-gray-400 mt-0.5">Từ nhà hàng đối tác</p>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-100 p-6 rounded-2xl shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-xl"><FiClock /></div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Đang Xử Lý</p>
                <h4 className="text-2xl font-bold dark:text-white">{orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{orders.filter(o => o.status === 'cancelled').length} đã hủy</p>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
              {/* Header + Search + Filter */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">Quản lý Đơn hàng</h3>
                    <p className="text-sm text-gray-400">
                      Hiển thị {filteredOrders.length}/{orders.length} đơn hàng
                    </p>
                  </div>
                  <button onClick={() => { fetchOrders(); setOrderPage(1) }}
                    className="text-sm text-primary-500 font-semibold hover:underline flex items-center gap-1">
                    🔄 Làm mới
                  </button>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-wrap gap-3">
                  {/* Search */}
                  <div className="flex-1 min-w-[200px] relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input
                      type="text"
                      placeholder="Tìm mã đơn, địa chỉ..."
                      value={orderSearch}
                      onChange={e => { setOrderSearch(e.target.value); setOrderPage(1) }}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                    />
                  </div>
                  {/* Lọc trạng thái */}
                  <select value={orderStatusFilter}
                    onChange={e => { setOrderStatusFilter(e.target.value); setOrderPage(1) }}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none">
                    <option value="all">📋 Tất cả TT</option>
                    <option value="pending">⏳ Chờ xác nhận</option>
                    <option value="confirmed">✅ Đã xác nhận</option>
                    <option value="preparing">👨‍🍳 Đang chuẩn bị</option>
                    <option value="delivering">🛵 Đang giao</option>
                    <option value="completed">🎉 Hoàn thành</option>
                    <option value="cancelled">❌ Đã hủy</option>
                  </select>
                  {/* Lọc thanh toán */}
                  <select value={orderPaymentFilter}
                    onChange={e => { setOrderPaymentFilter(e.target.value); setOrderPage(1) }}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none">
                    <option value="all">💳 Tất cả TT toán</option>
                    <option value="paid">✅ Đã thanh toán</option>
                    <option value="unpaid">⏳ Chưa thanh toán</option>
                    <option value="cash">💵 COD</option>
                    <option value="momo">🟣 MoMo</option>
                    <option value="coins">🪙 Xu</option>
                  </select>
                  {/* Lọc thời gian */}
                  <select value={orderDateFilter}
                    onChange={e => { setOrderDateFilter(e.target.value); setOrderPage(1) }}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none">
                    <option value="all">📅 Tất cả ngày</option>
                    <option value="today">📅 Hôm nay</option>
                    <option value="week">📅 7 ngày qua</option>
                    <option value="month">📅 30 ngày qua</option>
                  </select>
                  {/* Reset filter */}
                  {(orderSearch || orderStatusFilter !== 'all' || orderPaymentFilter !== 'all' || orderDateFilter !== 'all') && (
                    <button onClick={() => { setOrderSearch(''); setOrderStatusFilter('all'); setOrderPaymentFilter('all'); setOrderDateFilter('all'); setOrderPage(1) }}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors">
                      ✕ Xóa lọc
                    </button>
                  )}
                </div>

                {/* Quick stats khi filter */}
                {filteredOrders.length > 0 && (
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>✅ Hoàn thành: <b className="text-green-600">{filteredOrders.filter(o => o.status === 'completed').length}</b></span>
                    <span>⏳ Đang xử lý: <b className="text-yellow-600">{filteredOrders.filter(o => !['completed','cancelled'].includes(o.status)).length}</b></span>
                    <span>❌ Đã hủy: <b className="text-red-600">{filteredOrders.filter(o => o.status === 'cancelled').length}</b></span>
                    <span>💰 Doanh thu filter: <b className="text-primary-500">{formatPrice(filteredOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.finalAmount || 0), 0))}</b></span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-dark-200 text-gray-500 text-sm">
                      <th className="p-4 font-medium">Mã đơn</th>
                      <th className="p-4 font-medium">Ngày đặt</th>
                      <th className="p-4 font-medium">Địa chỉ</th>
                      <th className="p-4 font-medium">Tổng tiền</th>
                      <th className="p-4 font-medium">Trạng thái</th>
                      <th className="p-4 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="p-8 text-center text-gray-400">Đang tải...</td></tr>
                    ) : pagedOrders.length === 0 ? (
                      <tr><td colSpan="6" className="p-10 text-center">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-400">Không tìm thấy đơn hàng nào</p>
                        <p className="text-xs text-gray-300 mt-1">Thử thay đổi bộ lọc</p>
                      </td></tr>
                    ) : pagedOrders.map(order => (
                      <tr key={order._id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                        <td className="p-4 font-mono text-sm dark:text-gray-300">#{order._id.substring(0,7).toUpperCase()}</td>
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="p-4 text-xs text-gray-500 max-w-[160px]">
                          <span className="line-clamp-2">{order.deliveryAddress || '—'}</span>
                        </td>
                        <td className="p-4 font-semibold text-primary-500">
                          <div>{formatPrice(order.finalAmount || order.totalAmount)}</div>
                          {order.paymentMethod !== 'cash' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.paymentStatus === 'paid'
                                ? `✅ ${order.paymentMethod === 'momo' ? 'MoMo' : order.paymentMethod === 'coins' ? 'Xu' : order.paymentMethod}`
                                : '⏳ Chưa TT'}
                            </span>
                          )}
                          {order.paymentMethod === 'cash' && (
                            <span className="text-xs text-gray-400">💵 COD</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMap[order.status]?.color}`}>
                            {statusMap[order.status]?.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            className="bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-1.5 outline-none dark:text-white"
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          >
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="preparing">Đang chuẩn bị</option>
                            <option value="delivering">Đang giao</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Hủy đơn</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalOrderPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Trang {orderPage}/{totalOrderPages} — {filteredOrders.length} đơn hàng
                  </span>
                  <div className="flex gap-2">
                    <button disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors dark:text-white">
                      ← Trước
                    </button>
                    {Array.from({ length: Math.min(5, totalOrderPages) }, (_, i) => {
                      const page = orderPage <= 3 ? i + 1 : orderPage + i - 2
                      if (page < 1 || page > totalOrderPages) return null
                      return (
                        <button key={page} onClick={() => setOrderPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            page === orderPage ? 'bg-primary-500 text-white' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-200 dark:text-white'
                          }`}>
                          {page}
                        </button>
                      )
                    })}
                    <button disabled={orderPage >= totalOrderPages} onClick={() => setOrderPage(p => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors dark:text-white">
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'restaurants' && <AdminRestaurants />}
          
          {activeTab === 'drivers' && <AdminDrivers />}

          {activeTab === 'vouchers' && <AdminVouchers adminId={user?._id || user?.id} />}
          
          {activeTab === 'partner-requests' && (
            <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">Yêu cầu Đăng ký Đối tác</h3>
                  <p className="text-sm text-gray-400">Duyệt hồ sơ nhà hàng đăng ký kinh doanh</p>
                </div>
                <button onClick={fetchPartnerRequests} className="text-sm text-primary-500 font-semibold hover:underline">Làm mới</button>
              </div>
              
              <div className="p-6">
                {requestsLoading ? (
                  <div className="py-10 text-center text-gray-400">Đang tải yêu cầu...</div>
                ) : partnerRequests.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">Không có yêu cầu đăng ký nào.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {partnerRequests.map((req) => (
                      <div key={req._id} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50 dark:bg-dark-200 relative overflow-hidden transition-all hover:shadow-lg">
                        
                        {/* Header details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <span className="text-xs bg-primary-100 dark:bg-primary-950/40 text-primary-500 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                              {req.businessType || 'Nhà hàng'}
                            </span>
                            <h4 className="font-bold text-xl dark:text-white mt-1.5">{req.restaurantName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {req.restaurantAddress}</p>
                          </div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              req.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                              req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                            </span>
                          </div>
                        </div>

                        {/* Owner details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-gray-200 dark:border-gray-700/50 py-4 my-4">
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Người đại diện</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{req.ownerName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">📞 {req.ownerPhone} | 📧 {req.ownerEmail}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Chi tiết kinh doanh</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                              Món ăn: <span className="text-primary-500">{req.cuisineTypes?.join(', ')}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">Giá tb: {req.averagePrice} | ĐT quán: {req.restaurantPhone}</p>
                          </div>
                        </div>

                        {/* Description & Legal papers */}
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-semibold text-gray-700 dark:text-gray-400">Giới thiệu:</span> {req.description || 'Chưa cập nhật'}
                          </p>
                          {req.specialDishes && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-semibold text-gray-700 dark:text-gray-400">Món đặc trưng:</span> {req.specialDishes}
                            </p>
                          )}
                          <div className="flex gap-4 text-xs text-gray-400 mt-2">
                            <span>📜 GPKD: <strong className="text-gray-600 dark:text-gray-300">{req.businessLicense || 'Chưa cung cấp'}</strong></span>
                            <span>🛡️ ATTP: <strong className="text-gray-600 dark:text-gray-300">{req.foodSafetyCert || 'Chưa cung cấp'}</strong></span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => handlePartnerRequestStatus(req._id, 'rejected')}
                              className="px-4 py-2 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-semibold rounded-xl text-sm transition-colors"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => handlePartnerRequestStatus(req._id, 'approved')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-md transition-all hover:scale-[1.02]"
                            >
                              Phê duyệt & Tạo nhà hàng
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'driver-requests' && (
            <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">Yêu cầu Đăng ký Tài xế</h3>
                  <p className="text-sm text-gray-400">Xem xét và phê duyệt hồ sơ đối tác tài xế giao hàng</p>
                </div>
                <button onClick={fetchDriverRequests} className="text-sm text-primary-500 font-semibold hover:underline">Làm mới</button>
              </div>
              
              <div className="p-6">
                {driverRequestsLoading ? (
                  <div className="py-10 text-center text-gray-400">Đang tải hồ sơ tài xế...</div>
                ) : driverRequests.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">Không có hồ sơ tài xế nào.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {driverRequests.map((req) => (
                      <div key={req._id} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50 dark:bg-dark-200 relative overflow-hidden transition-all hover:shadow-lg">
                        
                        {/* Header details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-500 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                              🛵 {req.vehicleType || 'Tài xế'}
                            </span>
                            <h4 className="font-bold text-xl dark:text-white mt-1.5">{req.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 Khu vực chạy: <strong>{req.operationArea}</strong></p>
                          </div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              req.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                              req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                            </span>
                          </div>
                        </div>

                        {/* Owner details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-gray-200 dark:border-gray-700/50 py-4 my-4">
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Thông tin liên hệ & Định danh</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">SĐT: {req.phone}</p>
                            <p className="text-sm text-gray-500 mt-0.5">Email: {req.email}</p>
                            <p className="text-xs text-gray-400 mt-1">🆔 CCCD: <strong className="text-gray-700 dark:text-gray-300">{req.idCard}</strong></p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Thông tin bằng lái & Phương tiện</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Biển số: {req.licensePlate}</p>
                            <p className="text-sm text-gray-500 mt-0.5">Số GPLX: {req.driverLicense}</p>
                            {req.referrer && <p className="text-xs text-amber-600 mt-1 font-bold">👤 Người giới thiệu: {req.referrer}</p>}
                          </div>
                        </div>

                        {/* Experience */}
                        {req.experience && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-semibold text-gray-700 dark:text-gray-400">Kinh nghiệm & Giới thiệu:</span> {req.experience}
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => handleDriverRequestStatus(req._id, 'rejected')}
                              className="px-4 py-2 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-semibold rounded-xl text-sm transition-colors"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleDriverRequestStatus(req._id, 'approved')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-md transition-all hover:scale-[1.02]"
                            >
                              Phê duyệt & Cấp quyền tài xế
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payment-requests' && (
            <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">Yêu cầu Thanh toán Phí duy trì</h3>
                  <p className="text-sm text-gray-400">Duyệt các yêu cầu chuyển khoản từ nhà hàng</p>
                </div>
                <button onClick={fetchPaymentRequests} className="text-sm text-primary-500 font-semibold hover:underline">Làm mới</button>
              </div>
              
              <div className="p-6">
                {paymentRequestsLoading ? (
                  <div className="py-10 text-center text-gray-400">Đang tải yêu cầu thanh toán...</div>
                ) : paymentRequests.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">Không có yêu cầu thanh toán nào.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {paymentRequests.map((req) => (
                      <div key={req._id} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50 dark:bg-dark-200 relative overflow-hidden transition-all hover:shadow-lg">
                        
                        {/* Header details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-500 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                              💳 Phí duy trì
                            </span>
                            <h4 className="font-bold text-xl dark:text-white mt-1.5">{req.restaurantName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📅 {new Date(req.createdAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              req.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                              req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                            </span>
                          </div>
                        </div>

                        {/* Payment details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-gray-200 dark:border-gray-700/50 py-4 my-4">
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Thông tin thanh toán</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Số tiền: <span className="text-green-500">{(req.amount || 0).toLocaleString()}đ</span></p>
                            <p className="text-sm text-gray-500 mt-0.5">Phương thức: {req.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : req.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Trạng thái xử lý</p>
                            {req.status === 'approved' && (
                              <p className="text-sm text-green-600 mt-0.5">✅ Đã duyệt lúc: {new Date(req.approvedAt).toLocaleString()}</p>
                            )}
                            {req.status === 'rejected' && (
                              <div className="mt-0.5">
                                <p className="text-sm text-red-600">❌ Từ chối lúc: {new Date(req.rejectedAt).toLocaleString()}</p>
                                {req.rejectReason && <p className="text-xs text-red-500 mt-1">Lý do: {req.rejectReason}</p>}
                              </div>
                            )}
                            {req.status === 'pending' && (
                              <p className="text-sm text-yellow-600 mt-0.5">⏳ Đang chờ admin xử lý</p>
                            )}
                          </div>
                        </div>

                        {/* Note */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-semibold text-gray-700 dark:text-gray-400">Ghi chú:</span> {req.note}
                          </p>
                        </div>

                        {/* Action buttons */}
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => {
                                const reason = prompt('Lý do từ chối (tùy chọn):')
                                if (reason !== null) {
                                  handlePaymentRequestStatus(req._id, 'reject', reason)
                                }
                              }}
                              className="px-4 py-2 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-semibold rounded-xl text-sm transition-colors"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Xác nhận duyệt thanh toán ${(req.amount || 0).toLocaleString()}đ cho ${req.restaurantName}?`)) {
                                  handlePaymentRequestStatus(req._id, 'approve')
                                }
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-md transition-all hover:scale-[1.02]"
                            >
                              ✅ Duyệt thanh toán & Gia hạn
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'settings' && <AdminSettings />}

        </div>
      </div>
      </div>
    </div>
  )
}
