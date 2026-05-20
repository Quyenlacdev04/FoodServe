import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle, FiChevronRight } from 'react-icons/fi'
import { formatPrice } from '../data/mockData'

const statusConfig = {
  pending: { label: 'Chờ xác nhận', icon: FiClock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
  confirmed: { label: 'Đã xác nhận', icon: FiCheckCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  preparing: { label: 'Đang chuẩn bị', icon: FiPackage, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  delivering: { label: 'Đang giao', icon: FiTruck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  completed: { label: 'Hoàn thành', icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
  cancelled: { label: 'Đã hủy', icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
}

export default function OrderHistoryPage() {
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders?userId=${user._id || user.id}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch (err) {
        console.error('Lỗi tải lịch sử:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [isAuthenticated, navigate, user])

  if (loading) {
    return <div className="min-h-screen pt-32 text-center text-gray-500 dark:text-gray-400">Đang tải lịch sử đơn hàng...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-primary-500 hover:underline text-sm mb-6 inline-block">← Về trang chủ</Link>
        <h1 className="text-3xl font-display font-bold dark:text-white mb-8">Lịch sử đơn hàng</h1>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-dark-100 rounded-3xl p-12 text-center shadow-sm">
            <span className="text-6xl block mb-4">🍽️</span>
            <h2 className="text-2xl font-bold dark:text-white mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-gray-500 mb-6">Bạn chưa đặt món ăn nào. Hãy khám phá các món ngon ngay nhé!</p>
            <Link to="/" className="btn-primary inline-flex">Khám phá ngay</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const StatusIcon = statusConfig[order.status]?.icon || FiClock
              const isTracking = ['pending', 'confirmed', 'preparing', 'delivering'].includes(order.status)

              return (
                <motion.div 
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-dark-100 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-400 font-mono mb-1">MÃ ĐƠN: #{order._id.substring(0,8).toUpperCase()}</p>
                      <p className="font-semibold dark:text-white">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.color}`}>
                      <StatusIcon />
                      <span className="font-semibold text-sm">{statusConfig[order.status]?.label}</span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="w-full flex-1 space-y-3">
                      {order.items.map(item => (
                        <div key={item.menuItemId} className="flex justify-between items-center text-sm">
                          <div className="flex gap-3">
                            <span className="font-bold text-gray-500 dark:text-gray-400">{item.quantity}x</span>
                            <span className="dark:text-gray-200 line-clamp-1">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300 ml-4 shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex flex-col items-end md:border-l border-gray-100 dark:border-gray-800 md:pl-6">
                      <p className="text-sm text-gray-500 mb-1">Tổng cộng</p>
                      <p className="text-2xl font-bold text-primary-500 mb-4">{formatPrice(order.finalAmount || order.totalAmount)}</p>
                      
                      <button 
                        onClick={() => navigate('/tracking', { state: { orderId: order._id } })}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                          isTracking ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-glow' : 'bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {isTracking ? 'Theo dõi đơn' : 'Xem chi tiết'} <FiChevronRight />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
