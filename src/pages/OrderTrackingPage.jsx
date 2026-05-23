import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck, FiPackage, FiTruck, FiHome } from 'react-icons/fi'
import { io } from 'socket.io-client'
import ChatButton from '../components/chat/ChatButton'
import MapView from '../components/tracking/MapView'
import SimpleMapView from '../components/tracking/SimpleMapView'
import { useGoogleMaps } from '../hooks/useGoogleMaps'

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
  const { isLoaded: mapsLoaded } = useGoogleMaps()

  useEffect(() => {
    let targetOrderId = location.state?.orderId

    const fetchOrder = async (idToFetch) => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${idToFetch}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data)
          const stepIndex = steps.findIndex(s => s.statusId === data.status)
          if (stepIndex !== -1) setCurrentStep(stepIndex)
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
          const res = await fetch(`http://localhost:5000/api/orders?userId=${user._id || user.id}`)
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
        const socket = io('http://localhost:5000')
        socket.emit('join-order', targetOrderId)

        socket.on('order-status-updated', (data) => {
          console.log('Real-time update:', data)
          const stepIndex = steps.findIndex(s => s.statusId === data.status)
          if (stepIndex !== -1) {
            setCurrentStep(stepIndex)
          }
          // Update order status
          setOrder(prev => prev ? { ...prev, status: data.status } : null)
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
              {currentStep < 3 ? '🛵' : '✅'}
            </motion.span>
            <h1 className="text-2xl font-display font-bold dark:text-white">
              {currentStep < 3 ? 'Đang theo dõi đơn hàng' : 'Giao hàng thành công!'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Đơn hàng #{order._id.substring(0, 8).toUpperCase()}</p>
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
              {mapsLoaded ? (
                <MapView
                  restaurantLocation={
                    order.restaurant?.location 
                      ? { lat: order.restaurant.location.lat, lng: order.restaurant.location.lng }
                      : { lat: 10.762622, lng: 106.660172 } // Default TP.HCM
                  }
                  customerLocation={
                    order.deliveryLocation
                      ? { lat: order.deliveryLocation.lat, lng: order.deliveryLocation.lng }
                      : { lat: 10.773996, lng: 106.700981 } // Default customer location
                  }
                  shipperLocation={shipperLocation}
                  orderStatus={order.status}
                />
              ) : (
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
              )}
            </div>
          )}

          {/* Shipper info */}
          <div className="mt-8 p-4 rounded-2xl bg-gray-50 dark:bg-dark-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-xl">
              🏍️
            </div>
            <div className="flex-1">
              <p className="font-semibold dark:text-white">Nguyễn Văn Shipper</p>
              <p className="text-sm text-gray-400">⭐ 4.9 • 1,200 đơn đã giao</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors">
              📞 Gọi
            </button>
          </div>
        </motion.div>
      </div>

      {/* Chat Button - chỉ hiển thị khi có đơn hàng */}
      {order && <ChatButton orderId={order._id} />}
    </div>
  )
}
