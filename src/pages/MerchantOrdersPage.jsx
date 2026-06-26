import { API_BASE_URL, SOCKET_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiArrowLeft, FiShoppingBag, FiClock, FiCheckCircle, 
  FiXCircle, FiMessageCircle, FiRefreshCw, FiSearch
} from 'react-icons/fi'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { formatPrice } from '../data/mockData'
import ChatButton from '../components/chat/ChatButton'

const orderStatusMap = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  preparing: { label: 'Đang chuẩn bị', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
  delivering: { label: 'Đang giao', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  completed: { label: 'Hoàn thành', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
}

export default function MerchantOrdersPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  
  const [restaurant, setRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [socket, setSocket] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // Validate Merchant Access
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập!')
      navigate('/')
      return
    }
    if (user && !user.isMerchant && user.role !== 'merchant' && user.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập!')
      navigate('/')
      return
    }
  }, [user, isAuthenticated, navigate])

  // Fetch restaurant and orders
  useEffect(() => {
    if (!user) return

    const fetchOrders = async () => {
      try {
        if (!restaurant) {
          setLoading(true)
        }
        
        // 1. Get owned restaurant info
        const res = await fetch(`${API_BASE_URL}/api/restaurants/owned/${user._id || user.id}`)
        if (!res.ok) {
          throw new Error('Bạn chưa được cấp quyền quản lý nhà hàng nào.')
        }
        const restData = await res.json()
        setRestaurant(restData)

        // 2. Fetch restaurant orders
        const ordersRes = await fetch(`${API_BASE_URL}/api/orders/restaurant/${restData._id}`)
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(ordersData)
        }
      } catch (err) {
        console.error(err)
        toast.error(err.message || 'Lỗi tải dữ liệu đơn hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, refreshTrigger])

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1)

  // Socket.io real-time listener
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const s = io(SOCKET_URL)
    setSocket(s)
    
    s.emit('join-user', user._id || user.id)
    console.log('🔌 Merchant Orders Socket connected:', user._id || user.id)

    s.on('new-order-merchant', (newOrder) => {
      console.log('🛎️ Có đơn hàng mới:', newOrder)
      toast('🛎️ Cửa hàng của bạn có đơn hàng mới đang chờ xác nhận!', {
        icon: '🛒',
        duration: 6000
      })
      
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav')
        audio.play().catch(() => {})
      } catch (e) {
        console.error('Audio play error:', e)
      }
      
      triggerRefresh()
    })

    s.on('order-status-updated', (data) => {
      console.log('🔄 Trạng thái đơn hàng thay đổi:', data)
      triggerRefresh()
    })

    return () => {
      s.disconnect()
    }
  }, [user])

  // Join order rooms to track state changes in real-time
  useEffect(() => {
    if (!socket || orders.length === 0) return

    orders.forEach(order => {
      if (order.status !== 'completed' && order.status !== 'cancelled') {
        socket.emit('join-order', order._id)
      }
    })
  }, [socket, orders])

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          ...additionalData
        })
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

  // Print Bill
  const handlePrintBill = (order) => {
    const printWindow = window.open('', '_blank', 'width=600,height=800')
    if (!printWindow) {
      toast.error('Không thể mở cửa sổ in. Vui lòng tắt trình chặn popup của trình duyệt!')
      return
    }

    const shortId = order._id.substring(0, 8).toUpperCase()
    const orderDate = new Date(order.createdAt).toLocaleString('vi-VN')
    const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    
    const paymentMap = {
      cash: 'Tiền mặt (COD)',
      coins: 'Thanh toán bằng Xu',
      momo: 'Ví điện tử MoMo',
      payos: 'Chuyển khoản VietQR',
      vnpay: 'Cổng VNPAY',
      zalopay: 'Ví ZaloPay'
    }

    const paymentText = paymentMap[order.paymentMethod] || order.paymentMethod

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hóa đơn #${shortId}</title>
        <meta charset="utf-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 10px;
            width: 74mm;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .header { margin-bottom: 12px; }
          .restaurant-name {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .bill-title {
            font-size: 13px;
            font-weight: bold;
            margin: 8px 0;
            text-transform: uppercase;
          }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .info-table, .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          .info-table td { padding: 1.5px 0; vertical-align: top; }
          .items-table th { border-bottom: 1px dashed #000; padding: 3px 0; text-align: left; }
          .items-table td { padding: 3px 0; vertical-align: top; }
          .summary-table { width: 100%; margin-top: 4px; }
          .summary-table td { padding: 2.5px 0; }
          .footer { margin-top: 18px; text-align: center; font-size: 11px; }
          @media print { body { width: 74mm; } }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="restaurant-name">${restaurant?.name || 'Cửa hàng ăn uống'}</div>
          <div>Đ/C: ${restaurant?.address || 'Chưa cập nhật'}</div>
          <div class="divider"></div>
          <div class="bill-title">HÓA ĐƠN THANH TOÁN</div>
          <div>Mã đơn: #${shortId}</div>
          <div>Thời gian: ${orderDate}</div>
        </div>
        <div class="divider"></div>
        <table class="info-table">
          <tr>
            <td style="width: 35%;">Khách hàng:</td>
            <td class="bold">${order.userName || 'Ẩn danh'}</td>
          </tr>
          <tr>
            <td>Điện thoại:</td>
            <td class="bold">${order.userPhone || 'Không có'}</td>
          </tr>
          <tr>
            <td>Địa chỉ:</td>
            <td>${order.shippingAddress || 'Chưa cung cấp'}</td>
          </tr>
          ${order.note ? `
          <tr>
            <td>Ghi chú:</td>
            <td class="bold" style="font-style: italic;">"${order.note}"</td>
          </tr>
          ` : ''}
        </table>
        <div class="divider"></div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 55%;">Tên món</th>
              <th class="text-center" style="width: 15%;">SL</th>
              <th class="text-right" style="width: 30%;">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        <div class="divider"></div>
        <table class="summary-table">
          <tr>
            <td>Tiền món (${totalItems} món):</td>
            <td class="text-right">${formatPrice(order.totalAmount)}</td>
          </tr>
          <tr>
            <td>Phí giao hàng:</td>
            <td class="text-right">+${formatPrice(order.deliveryFee)}</td>
          </tr>
          ${order.discount > 0 ? `
          <tr>
            <td>Giảm giá:</td>
            <td class="text-right">-${formatPrice(order.discount)}</td>
          </tr>
          ` : ''}
          <tr class="bold" style="font-size: 13px;">
            <td>TỔNG CỘNG:</td>
            <td class="text-right">${formatPrice(order.finalAmount || order.totalAmount)}</td>
          </tr>
        </table>
        <div class="divider"></div>
        <table class="info-table">
          <tr>
            <td style="width: 45%;">Thanh toán:</td>
            <td class="bold text-right">${paymentText}</td>
          </tr>
          <tr>
            <td>Trạng thái:</td>
            <td class="bold text-right">${order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán (COD)'}</td>
          </tr>
        </table>
        <div class="divider"></div>
        <div class="footer">
          <div class="bold">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</div>
          <div>Chúc quý khách ngon miệng!</div>
          <div style="margin-top: 8px; font-size: 9px; opacity: 0.7;">Hệ thống quản lý FoodServe</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    // Apply status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }

    // Apply search filter
    if (!orderSearchQuery) return true
    const query = orderSearchQuery.toLowerCase().trim()
    const orderId = order._id.toLowerCase()
    const shortId = order._id.substring(0, 8).toLowerCase()
    const userName = (order.userName || '').toLowerCase()
    const userPhone = (order.userPhone || '').toLowerCase()
    const shippingAddress = (order.shippingAddress || '').toLowerCase()
    
    return orderId.includes(query) || 
           shortId.includes(query) || 
           userName.includes(query) || 
           userPhone.includes(query) ||
           shippingAddress.includes(query)
  })

  // Count active orders for different tabs
  const getCountByStatus = (status) => {
    if (status === 'all') return orders.length
    return orders.filter(o => o.status === status).length
  }

  if (loading && !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-8 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-dark-200 p-6 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/restaurant-manage')}
              className="p-3 bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-750 dark:text-white rounded-2xl transition-all active:scale-95 flex items-center justify-center"
              title="Quay lại bảng quản lý"
            >
              <FiArrowLeft className="text-xl" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 dark:bg-primary-950/40 text-primary-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Đơn hàng nhận
                </span>
                {restaurant && (
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Trực tuyến
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-display font-black text-gray-950 dark:text-white mt-1">
                {restaurant?.name || 'Đơn hàng của bạn'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto">
            <button
              onClick={triggerRefresh}
              className="px-4 py-3 bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-600 dark:text-gray-300 rounded-2xl font-bold flex items-center gap-2 transition-colors text-sm active:scale-95 shrink-0"
              title="Làm mới đơn hàng"
            >
              <FiRefreshCw className="animate-hover" /> Làm mới
            </button>
            
            <div className="relative flex-1 md:w-80 md:flex-none">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm mã đơn, tên khách..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all"
              />
              {orderSearchQuery && (
                <button
                  onClick={() => setOrderSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold text-lg"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Filters (Tabs) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Tất cả', icon: <FiShoppingBag /> },
            { id: 'pending', label: 'Chờ xác nhận', icon: <FiClock /> },
            { id: 'confirmed', label: 'Đã xác nhận', icon: <FiCheckCircle /> },
            { id: 'preparing', label: 'Đang làm món', icon: <FiClock /> },
            { id: 'delivering', label: 'Đang giao', icon: <FiClock /> },
            { id: 'completed', label: 'Hoàn thành', icon: <FiCheckCircle /> },
            { id: 'cancelled', label: 'Đã hủy', icon: <FiXCircle /> },
          ].map(tab => {
            const count = getCountByStatus(tab.id)
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shrink-0 transition-all text-sm active:scale-95 ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-glow shadow-primary-500/20' 
                    : 'bg-white dark:bg-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-100 border border-gray-100 dark:border-gray-800'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-100 dark:bg-dark-300 text-gray-500 dark:text-gray-450'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Orders Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map(order => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={order._id} 
                className="bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-card flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  {/* Order Card Header */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-150 dark:border-gray-800">
                    <div>
                      <p className="font-mono font-black text-slate-800 dark:text-white text-base">Đơn hàng #{order._id.substring(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Đặt lúc: {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${orderStatusMap[order.status]?.color}`}>
                        {orderStatusMap[order.status]?.label}
                      </span>
                      
                      {/* Trạng thái dropdown hoặc Nút bấm Nhận/Từ chối */}
                      {order.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                          >
                            ✅ Nhận đơn
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt("Nhập lý do từ chối đơn hàng:", "Nhà hàng hết món")
                              if (reason !== null) {
                                handleUpdateOrderStatus(order._id, 'cancelled', { 
                                  cancelledBy: 'restaurant', 
                                  reason: reason.trim() || 'Nhà hàng hết món' 
                                })
                              }
                            }}
                            className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 active:scale-95"
                          >
                            ❌ Từ chối
                          </button>
                        </div>
                      ) : (
                        <select 
                          value={order.status}
                          onChange={(e) => {
                            if (e.target.value === 'cancelled') {
                              const reason = window.prompt("Nhập lý do hủy đơn hàng:", "Nhà hàng gặp sự cố")
                              if (reason !== null) {
                                handleUpdateOrderStatus(order._id, 'cancelled', { 
                                  cancelledBy: 'restaurant', 
                                  reason: reason.trim() || 'Nhà hàng gặp sự cố' 
                                })
                              }
                            } else {
                              handleUpdateOrderStatus(order._id, e.target.value)
                            }
                          }}
                          className="bg-gray-50 dark:bg-dark-300 border border-gray-200 dark:border-gray-700 text-sm rounded-xl px-3 py-1.5 outline-none font-semibold text-gray-750 dark:text-gray-300 cursor-pointer"
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Xác nhận đơn</option>
                          <option value="preparing">Đang làm món</option>
                          <option value="delivering">Đang giao hàng</option>
                          <option value="completed">Đã giao xong</option>
                          <option value="cancelled">Hủy đơn hàng</option>
                        </select>
                      )}
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
                </div>

                {/* Customer Info & Summary */}
                <div className="border-t border-gray-150 dark:border-gray-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
                    <p><strong>Khách hàng:</strong> {order.userName || 'Ẩn danh'}</p>
                    <p><strong>Địa chỉ giao:</strong> {order.shippingAddress || 'Chưa cung cấp'}</p>
                    <p><strong>Số điện thoại:</strong> {order.userPhone || 'Không có'}</p>
                    {order.note && <p className="text-yellow-500"><strong>Ghi chú khách:</strong> "{order.note}"</p>}
                    {order.status === 'cancelled' && order.cancellationReason && (
                      <p className="text-red-500"><strong>Lý do hủy:</strong> "{order.cancellationReason}"</p>
                    )}
                  </div>
                  <div className="flex flex-col justify-end items-end gap-2">
                    <p className="text-xs text-gray-400">Tổng thu hộ:</p>
                    <p className="text-xl font-black text-primary-500">{formatPrice(order.finalAmount || order.totalAmount)}</p>
                    
                    {/* Actions Button Group */}
                    <div className="flex flex-wrap gap-2 mt-1 justify-end">
                      <button
                        onClick={() => setSelectedOrderId(order._id)}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-lg text-white rounded-xl font-bold transition-all flex items-center gap-2 text-xs"
                      >
                        <FiMessageCircle /> Chat với khách
                      </button>
                      
                      <button
                        onClick={() => handlePrintBill(order)}
                        className="px-4 py-2 bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300 rounded-xl font-bold border border-gray-200 dark:border-gray-750 transition-all flex items-center gap-2 text-xs active:scale-95"
                        title="In hóa đơn"
                      >
                        🖨️ In hóa đơn
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="bg-white dark:bg-dark-200 rounded-3xl p-12 text-center text-gray-400 border border-gray-100 dark:border-gray-800 shadow-card">
            <FiShoppingBag className="text-5xl mx-auto mb-4 opacity-50" />
            <p className="font-semibold text-base">Không tìm thấy đơn hàng nào</p>
            <p className="text-sm mt-1">
              {orderSearchQuery || statusFilter !== 'all'
                ? 'Không có đơn hàng nào khớp với các bộ lọc hoặc tìm kiếm hiện tại.'
                : 'Chưa có đơn hàng nào được gửi tới nhà hàng của bạn.'}
            </p>
          </div>
        )}
      </div>

      {/* Chat Button */}
      {selectedOrderId && (
        <ChatButton orderId={selectedOrderId} />
      )}
    </div>
  )
}
