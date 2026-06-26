import { API_BASE_URL, SOCKET_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck, FiPackage, FiTruck, FiHome, FiX } from 'react-icons/fi'
import { io } from 'socket.io-client'
import ChatButton from '../components/chat/ChatButton'
import SimpleMapView from '../components/tracking/SimpleMapView'
import CancelOrderModal from '../components/orders/CancelOrderModal'

const steps = [
  { icon: FiCheck, label: 'Đã xác nhận', statusId: 'confirmed' },
  { icon: FiPackage, label: 'Đang chuẩn bị', statusId: 'preparing' },
  { icon: FiTruck, label: 'Đang giao hàng', statusId: 'delivering' },
  { icon: FiHome, label: 'Đã giao', statusId: 'completed' },
]

export default function OrderTrackingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const [currentStep, setCurrentStep] = useState(0)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shipperLocation, setShipperLocation] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    let targetOrderId = location.state?.orderId

    const fetchOrder = async (idToFetch) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/${idToFetch}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data)
          const stepIndex = steps.findIndex(s => s.statusId === data.status)
          if (stepIndex !== -1) setCurrentStep(stepIndex)
          
          if (data.shipperLocation) {
            setShipperLocation({
              lat: data.shipperLocation.lat,
              lng: data.shipperLocation.lng
            })
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    const init = async () => {
      if (!targetOrderId) {
        if (!user) {
          setLoading(false)
          return
        }
        // Fetch latest order for this user
        try {
          const res = await fetch(`${API_BASE_URL}/api/orders?userId=${user._id || user.id}`)
          if (res.ok) {
            const orders = await res.json()
            if (orders.length > 0) {
              targetOrderId = orders[0]._id
              await fetchOrder(targetOrderId)
            } else {
              setLoading(false)
              return
            }
          }
        } catch (error) {
          setLoading(false)
          return
        }
      } else {
        await fetchOrder(targetOrderId)
      }

      if (targetOrderId) {
        // Connect to Socket.io only if we have an order
        const socket = io(SOCKET_URL)
        socket.emit('join-order', targetOrderId)

        socket.on('order-status-updated', (data) => {
          console.log('Real-time update:', data)
          const stepIndex = steps.findIndex(s => s.statusId === data.status)
          if (stepIndex !== -1) {
            setCurrentStep(stepIndex)
          }
          // Re-fetch entire order to sync steps timeline and other status fields
          fetchOrder(targetOrderId)
        })

        // Listen for shipper location updates
        socket.on('shipper-location-updated', (data) => {
          console.log('Shipper location update:', data)
          if (data.orderId === targetOrderId && data.location) {
            setShipperLocation({
              lat: data.location.lat,
              lng: data.location.lng
            })
          }
        })

        return () => socket.disconnect()
      }
    }

    init()
  }, [location.state, user])

  const handleCancelSuccess = () => {
    // Refresh order data
    if (order?._id) {
      fetch(`${API_BASE_URL}/api/orders/${order._id}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data);
          const stepIndex = steps.findIndex(s => s.statusId === data.status);
          if (stepIndex !== -1) setCurrentStep(stepIndex);
        })
        .catch(console.error);
    }
  };



  if (loading) {
    return <div className="min-h-screen pt-32 text-center dark:text-white">Đang tải thông tin đơn hàng...</div>
  }

  if (!order && !loading) {
    return (
      <div className="min-h-screen pt-32 text-center dark:text-white">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
        <Link to="/" className="btn-primary">Quay lại trang chủ</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-primary-500 hover:underline text-sm mb-6 inline-block">← Về trang chủ</Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-100 rounded-3xl p-6 md:p-8 shadow-cinema"
        >
          <div className="text-center mb-8">
            <motion.span
              className="text-5xl block mb-3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {order.status === 'cancelled' 
                ? '❌' 
                : order.status === 'pending'
                  ? '⏳'
                  : currentStep < 3 
                    ? '🛵' 
                    : '✅'
              }
            </motion.span>
            <h1 className="text-2xl font-display font-bold dark:text-white">
              {order.status === 'cancelled' 
                ? 'Đơn hàng đã bị hủy'
                : order.status === 'pending'
                  ? 'Chờ nhà hàng xác nhận...'
                  : currentStep < 3 
                    ? 'Đang theo dõi đơn hàng' 
                    : 'Giao hàng thành công!'
              }
            </h1>
            <p className="text-gray-400 text-sm mt-1">Đơn hàng #{order._id.substring(0, 8).toUpperCase()}</p>
            
            {/* Banner thông báo chờ xác nhận */}
            {order.status === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-600 dark:text-yellow-400 text-sm font-bold text-center">
                👨‍🍳 Nhà hàng đang kiểm tra món ăn và sẽ xác nhận đơn hàng của bạn ngay!
              </div>
            )}

            {/* Nút hủy đơn - chỉ hiển thị khi đơn hàng có thể hủy */}
            {['pending', 'confirmed', 'preparing'].includes(order.status) && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowCancelModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold transition-colors border-2 border-red-500/20 hover:border-red-500/40"
              >
                <FiX size={18} />
                <span>Hủy đơn hàng</span>
              </motion.button>
            )}
          </div>

          {/* Progress */}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            <div
              className="absolute left-6 top-0 w-0.5 bg-primary-500 transition-all duration-1000"
              style={{ height: `${(currentStep / 3) * 100}%` }}
            />

            <div className="space-y-8">
              {steps.map((step, i) => {
                const Icon = step.icon
                const isActive = i <= currentStep
                
                // Find if this step is recorded in the order steps history
                const stepRecord = order.steps?.find(s => s.status === step.statusId)
                const timeStr = stepRecord 
                  ? new Date(stepRecord.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                  : '--:--'

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-4 relative"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 ${
                      isActive ? 'bg-primary-500 text-white shadow-glow' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Icon className="text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isActive ? 'dark:text-white' : 'text-gray-400'}`}>{step.label}</p>
                      <p className="text-xs text-gray-400">{timeStr}</p>
                    </div>
                    {i === currentStep && i < 3 && (
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-3 h-3 bg-primary-500 rounded-full"
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Map View - hiển thị khi đang giao hàng */}
          {order && (order.status === 'delivering' || order.status === 'ready' || order.status === 'preparing') && (
            <div className="mt-8">
              <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2">
                <span>📍</span> Theo dõi vị trí giao hàng
              </h3>
              <SimpleMapView
                restaurantLocation={
                  order.restaurant?.location
                    ? { lat: order.restaurant.location.lat, lng: order.restaurant.location.lng }
                    : { lat: 10.762622, lng: 106.660172 }
                }
                customerLocation={
                  order.deliveryLocation
                    ? { lat: order.deliveryLocation.lat, lng: order.deliveryLocation.lng }
                    : { lat: 10.773996, lng: 106.700981 }
                }
                shipperLocation={shipperLocation}
                orderStatus={order.status}
              />
            </div>
          )}

          {/* Shipper info */}
          {order?.shipper ? (
            <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-dark-200 overflow-hidden border border-gray-100 dark:border-gray-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-orange-400 px-4 py-2.5 flex items-center gap-2">
                <span className="text-white text-sm font-bold">🛵 Tài xế đã nhận đơn</span>
                <span className="ml-auto w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl text-white overflow-hidden shadow-md">
                      {order.shipper.avatar
                        ? <img src={order.shipper.avatar} alt="" className="w-full h-full object-cover" />
                        : '🏍️'
                      }
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-dark-200 flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full" />
                    </span>
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base dark:text-white truncate">
                      {order.shipper.name || 'Tài xế giao hàng'}
                    </p>
                    {/* Rating + đơn đã giao */}
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-sm text-yellow-500 font-semibold">
                        ⭐ {order.shipper.shipperRating || '5.0'}
                      </span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {order.shipper.totalDeliveries || 0} đơn đã giao
                      </span>
                    </div>
                    {/* SĐT hiện rõ */}
                    {order.shipper.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                        📞 <span className="font-medium">{order.shipper.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Nút Gọi */}
                  {order.shipper.phone && (
                    <a
                      href={`tel:${order.shipper.phone}`}
                      className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl transition-colors shadow-md shadow-primary-500/25 active:scale-95"
                    >
                      <span className="text-xl">📞</span>
                      <span className="text-xs font-bold">Gọi</span>
                    </a>
                  )}
                </div>

                {/* Thông tin xe (nếu có) */}
                {(order.shipper.vehicleType || order.shipper.vehicleNumber) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {order.shipper.vehicleType && (
                      <span className="flex items-center gap-1.5">
                        🏍️ {order.shipper.vehicleType === 'motorbike' ? 'Xe máy'
                          : order.shipper.vehicleType === 'bike' ? 'Xe đạp'
                          : order.shipper.vehicleType === 'car' ? 'Ô tô'
                          : order.shipper.vehicleType}
                      </span>
                    )}
                    {order.shipper.vehicleNumber && (
                      <span className="flex items-center gap-1.5 font-mono font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-300 px-2 py-0.5 rounded-lg">
                        🔢 {order.shipper.vehicleNumber}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 p-4 rounded-2xl bg-gray-50 dark:bg-dark-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center text-xl animate-pulse">
                🔍
              </div>
              <div className="flex-1">
                <p className="font-semibold dark:text-white animate-pulse">Đang tìm tài xế giao hàng...</p>
                <p className="text-xs text-gray-400">Hệ thống đang điều phối tài xế gần nhất</p>
              </div>
            </div>
          )}

          {/* Hiển thị thông tin hủy đơn nếu đơn bị hủy */}
          {order.status === 'cancelled' && (
            <div className="mt-8 p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  ❌
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-700 dark:text-red-400 text-lg mb-2">
                    Đơn hàng đã bị hủy
                  </h3>
                  {order.cancellationReason && (
                    <p className="text-red-600 dark:text-red-300 text-sm mb-2">
                      <strong>Lý do:</strong> {order.cancellationReason}
                    </p>
                  )}
                  {order.cancelledAt && (
                    <p className="text-red-500 dark:text-red-400 text-xs">
                      Hủy lúc: {new Date(order.cancelledAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {order.paymentStatus === 'refunded' && (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-green-700 dark:text-green-400 text-sm font-semibold flex items-center gap-2">
                        <span>💰</span>
                        <span>
                          {order.paymentMethod === 'coins' 
                            ? 'Xu đã được hoàn lại vào tài khoản'
                            : 'Tiền sẽ được hoàn lại trong 3-5 ngày làm việc'
                          }
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        order={order}
        onSuccess={handleCancelSuccess}
      />

      {/* Chat Button - chỉ hiển thị khi có đơn hàng */}
      {order && <ChatButton orderId={order._id} />}
    </div>
  )
}
