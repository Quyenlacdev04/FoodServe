import { API_BASE_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle,
  FiArrowLeft, FiMapPin, FiPhone, FiStar, FiRefreshCw,
  FiMessageSquare, FiNavigation, FiCreditCard, FiShoppingBag,
  FiAlertCircle, FiCopy, FiChevronRight
} from 'react-icons/fi'
import { addToCart } from '../store/slices/cartSlice'
import { formatPrice } from '../data/mockData'
import toast from 'react-hot-toast'

const statusConfig = {
  pending:    { label: 'Chờ xác nhận',  icon: FiClock,       color: 'text-yellow-500', bg: 'bg-yellow-500', bgLight: 'bg-yellow-50 dark:bg-yellow-500/10',  step: 0 },
  confirmed:  { label: 'Đã xác nhận',   icon: FiCheckCircle, color: 'text-blue-500',   bg: 'bg-blue-500',   bgLight: 'bg-blue-50 dark:bg-blue-500/10',    step: 1 },
  preparing:  { label: 'Đang chuẩn bị', icon: FiPackage,     color: 'text-indigo-500', bg: 'bg-indigo-500', bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',  step: 2 },
  ready:      { label: 'Sẵn sàng',      icon: FiShoppingBag, color: 'text-cyan-500',   bg: 'bg-cyan-500',   bgLight: 'bg-cyan-50 dark:bg-cyan-500/10',     step: 3 },
  delivering: { label: 'Đang giao',     icon: FiTruck,       color: 'text-purple-500', bg: 'bg-purple-500', bgLight: 'bg-purple-50 dark:bg-purple-500/10',  step: 4 },
  completed:  { label: 'Hoàn thành',    icon: FiCheckCircle, color: 'text-green-500',  bg: 'bg-green-500',  bgLight: 'bg-green-50 dark:bg-green-500/10',   step: 5 },
  cancelled:  { label: 'Đã hủy',        icon: FiXCircle,     color: 'text-red-500',    bg: 'bg-red-500',    bgLight: 'bg-red-50 dark:bg-red-500/10',       step: -1 },
}

const paymentLabels = {
  cash: { label: 'Tiền mặt (COD)', icon: '💵' },
  vnpay: { label: 'VNPay', icon: '💳' },
  momo: { label: 'MoMo', icon: '📱' },
  zalopay: { label: 'ZaloPay', icon: '📲' },
  coins: { label: 'Xu FoodServe', icon: '🪙' },
}

const paymentStatusLabels = {
  pending: { label: 'Chờ thanh toán', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10' },
  paid: { label: 'Đã thanh toán', color: 'text-green-600 bg-green-50 dark:bg-green-500/10' },
  failed: { label: 'Thất bại', color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
  refunded: { label: 'Đã hoàn tiền', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
}

const timelineSteps = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed']

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasReview, setHasReview] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return }
    fetchOrder()
  }, [id, isAuthenticated])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        // Check review
        if (data.status === 'completed') {
          try {
            const reviewRes = await fetch(`${API_BASE_URL}/api/reviews/check/${id}`)
            if (reviewRes.ok) {
              const reviewData = await reviewRes.json()
              setHasReview(reviewData.hasReview)
            }
          } catch {}
        }
      } else {
        toast.error('Không tìm thấy đơn hàng')
        navigate('/history')
      }
    } catch (err) {
      console.error('Fetch order error:', err)
      toast.error('Lỗi khi tải đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = () => {
    if (!order?.items?.length) return
    order.items.forEach(item => {
      dispatch(addToCart({
        id: item.menuItemId,
        restaurantId: order.restaurantId?._id || order.restaurantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || ''
      }))
    })
    toast.success(`Đã thêm ${order.items.length} món vào giỏ hàng!`, { icon: '🛒' })
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng chọn lý do hủy đơn')
      return
    }
    setCancelling(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, userId: user._id || user.id })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Đã hủy đơn hàng thành công')
        setCancelModalOpen(false)
        fetchOrder()
      } else {
        toast.error(data.message || 'Không thể hủy đơn hàng')
      }
    } catch {
      toast.error('Lỗi khi hủy đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

  const copyOrderId = () => {
    navigator.clipboard.writeText(order._id)
    toast.success('Đã sao chép mã đơn hàng!', { icon: '📋' })
  }

  const cancelReasons = [
    'Tôi muốn thay đổi món ăn',
    'Đợi quá lâu',
    'Đặt nhầm nhà hàng',
    'Tôi không cần nữa',
    'Lý do khác'
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-dark-100 rounded-xl w-48" />
            <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-dark-200 rounded w-1/3" />
              <div className="h-20 bg-gray-200 dark:bg-dark-200 rounded-2xl" />
              <div className="h-20 bg-gray-200 dark:bg-dark-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) return null

  const currentStatus = statusConfig[order.status] || statusConfig.pending
  const isActive = ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)
  const canCancel = ['pending', 'confirmed', 'preparing'].includes(order.status)
  const restName = order.restaurant?.name || order.restaurantId?.name || 'Nhà hàng'
  const restAddress = order.restaurant?.address || order.restaurantId?.address || ''

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back + Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button onClick={() => navigate('/history')} className="p-2 rounded-xl hover:bg-white dark:hover:bg-dark-100 transition-colors">
            <FiArrowLeft className="text-xl text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold dark:text-white">Chi tiết đơn hàng</h1>
            <button onClick={copyOrderId} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-500 transition-colors mt-0.5 group">
              <span className="font-mono">#{order._id.substring(0, 8).toUpperCase()}</span>
              <FiCopy className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`rounded-3xl p-5 mb-6 border ${
            order.status === 'cancelled'
              ? 'bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5 border-red-200 dark:border-red-500/20'
              : order.status === 'completed'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/5 border-green-200 dark:border-green-500/20'
              : 'bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-500/10 dark:to-orange-500/5 border-primary-200 dark:border-primary-500/20'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl ${currentStatus.bg} shadow-lg`}>
              <currentStatus.icon />
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold ${currentStatus.color}`}>{currentStatus.label}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {order.status === 'cancelled' && order.cancellationReason
                  ? `Lý do: ${order.cancellationReason}`
                  : order.status === 'completed'
                  ? 'Đơn hàng đã được giao thành công!'
                  : isActive
                  ? 'Đơn hàng đang được xử lý...'
                  : ''
                }
              </p>
            </div>
          </div>

          {/* Timeline (only for non-cancelled) */}
          {order.status !== 'cancelled' && (
            <div className="mt-5 flex items-center gap-1">
              {timelineSteps.map((step, i) => {
                const stepNum = statusConfig[step].step
                const currentStepNum = statusConfig[order.status]?.step ?? 0
                const isDone = stepNum <= currentStepNum
                const isCurrent = step === order.status
                return (
                  <div key={step} className="flex-1 flex items-center gap-1">
                    <div className={`relative flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isDone
                        ? `${statusConfig[step].bg} text-white shadow-md`
                        : 'bg-gray-200 dark:bg-dark-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary-500/20 scale-110' : ''}`}>
                      {isDone ? <FiCheckCircle className="text-xs" /> : <span className="text-[8px] font-bold">{i + 1}</span>}
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                        stepNum < currentStepNum ? statusConfig[step].bg : 'bg-gray-200 dark:bg-dark-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-100 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6"
        >
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold dark:text-white flex items-center gap-2">
              <FiShoppingBag className="text-primary-500" /> Danh sách món ({order.items?.length || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {order.items?.map((item, i) => (
              <motion.div
                key={item.menuItemId || i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-dark-200 overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold dark:text-white text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">x{item.quantity}</p>
                </div>
                <p className="font-bold text-primary-500 text-sm flex-shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Restaurant + Shipper Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          {/* Restaurant */}
          <div className="bg-white dark:bg-dark-100 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-bold dark:text-white text-sm mb-3 flex items-center gap-2">
              🏪 Nhà hàng
            </h3>
            <p className="font-semibold dark:text-gray-200 text-sm">{restName}</p>
            {restAddress && (
              <p className="text-xs text-gray-400 mt-1 flex items-start gap-1.5">
                <FiMapPin className="flex-shrink-0 mt-0.5" /> {restAddress}
              </p>
            )}
            {order.restaurantId?._id && (
              <Link
                to={`/restaurant/${order.restaurantId._id}`}
                className="mt-3 text-xs text-primary-500 hover:underline font-semibold flex items-center gap-1"
              >
                Xem nhà hàng <FiChevronRight className="text-[10px]" />
              </Link>
            )}
          </div>

          {/* Shipper */}
          <div className="bg-white dark:bg-dark-100 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-bold dark:text-white text-sm mb-3 flex items-center gap-2">
              🛵 Tài xế
            </h3>
            {order.shipper ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {order.shipper.avatar ? (
                      <img src={order.shipper.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      order.shipper.name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold dark:text-gray-200 text-sm">{order.shipper.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {order.shipper.shipperRating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <FiStar className="text-yellow-400 fill-yellow-400" /> {order.shipper.shipperRating}
                        </span>
                      )}
                      {order.shipper.vehicleType && <span>• {order.shipper.vehicleType}</span>}
                      {order.shipper.vehicleNumber && <span>• {order.shipper.vehicleNumber}</span>}
                    </div>
                  </div>
                </div>
                {order.shipper.phone && (
                  <a href={`tel:${order.shipper.phone}`} className="text-xs text-primary-500 hover:underline flex items-center gap-1.5 font-semibold">
                    <FiPhone /> {order.shipper.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Chưa có tài xế nhận đơn</p>
            )}
          </div>
        </motion.div>

        {/* Delivery Address */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-dark-100 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-6"
        >
          <h3 className="font-bold dark:text-white text-sm mb-3 flex items-center gap-2">
            <FiMapPin className="text-primary-500" /> Thông tin giao hàng
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <FiNavigation className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Địa chỉ giao</p>
                <p className="dark:text-gray-200">{order.deliveryAddress || 'Không có thông tin'}</p>
              </div>
            </div>
            {order.contactPhone && (
              <div className="flex items-start gap-3">
                <FiPhone className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Số điện thoại</p>
                  <p className="dark:text-gray-200">{order.contactPhone}</p>
                </div>
              </div>
            )}
            {order.note && (
              <div className="flex items-start gap-3">
                <FiMessageSquare className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Ghi chú</p>
                  <p className="dark:text-gray-200">{order.note}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Payment Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-dark-100 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-6"
        >
          <h3 className="font-bold dark:text-white text-sm mb-4 flex items-center gap-2">
            <FiCreditCard className="text-primary-500" /> Chi tiết thanh toán
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tạm tính ({order.items?.length} món)</span>
              <span>{formatPrice(order.totalAmount || 0)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Giảm giá</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Phí giao hàng</span>
              <span>{order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : 'Miễn phí'}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between items-center">
              <span className="font-bold dark:text-white text-base">Tổng cộng</span>
              <span className="text-xl font-bold text-primary-500">{formatPrice(order.finalAmount || order.totalAmount || 0)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span>{paymentLabels[order.paymentMethod]?.icon || '💵'}</span>
                <span className="text-xs">{paymentLabels[order.paymentMethod]?.label || 'Tiền mặt'}</span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                paymentStatusLabels[order.paymentStatus]?.color || 'text-gray-500 bg-gray-50 dark:bg-dark-200'
              }`}>
                {paymentStatusLabels[order.paymentStatus]?.label || 'Chờ thanh toán'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Order Timeline Detail */}
        {order.steps?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white dark:bg-dark-100 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-6"
          >
            <h3 className="font-bold dark:text-white text-sm mb-4 flex items-center gap-2">
              <FiClock className="text-primary-500" /> Lịch sử trạng thái
            </h3>
            <div className="space-y-0">
              {order.steps.map((step, i) => {
                const config = statusConfig[step.status] || statusConfig.pending
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${config.bg} ring-4 ring-white dark:ring-dark-100`} />
                      {i < order.steps.length - 1 && <div className="w-0.5 h-8 bg-gray-200 dark:bg-dark-200" />}
                    </div>
                    <div className="pb-4">
                      <p className={`font-semibold text-sm ${config.color}`}>{config.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(step.time).toLocaleDateString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Date Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="text-center text-xs text-gray-400 mb-6"
        >
          Đặt lúc: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Track */}
          {isActive && (
            <button
              onClick={() => navigate('/tracking', { state: { orderId: order._id } })}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FiNavigation /> Theo dõi đơn hàng
            </button>
          )}

          {/* Review */}
          {order.status === 'completed' && !hasReview && (
            <button
              onClick={() => navigate(`/restaurant/${order.restaurantId?._id || order.restaurantId}`, { state: { openReview: true, orderId: order._id } })}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FiStar /> Đánh giá
            </button>
          )}

          {/* Reorder */}
          <button
            onClick={handleReorder}
            className="flex-1 py-3.5 rounded-2xl font-bold text-primary-500 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 border-2 border-primary-200 dark:border-primary-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FiRefreshCw /> Đặt lại
          </button>

          {/* Cancel */}
          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex-1 py-3.5 rounded-2xl font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-2 border-red-200 dark:border-red-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FiXCircle /> Hủy đơn
            </button>
          )}
        </motion.div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCancelModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-dark-200 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
                <FiAlertCircle className="text-2xl text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold dark:text-white">Hủy đơn hàng?</h3>
                <p className="text-xs text-gray-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Vui lòng chọn lý do hủy:</p>
            <div className="space-y-2 mb-5">
              {cancelReasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => setCancelReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all ${
                    cancelReason === reason
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-500/30 font-semibold'
                      : 'bg-gray-50 dark:bg-dark-100 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-dark-100/80 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling || !cancelReason}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiXCircle /> Xác nhận hủy
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
