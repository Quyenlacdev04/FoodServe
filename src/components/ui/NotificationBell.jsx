import { API_BASE_URL, SOCKET_URL } from '../../config/api.js'
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBell, FiCheck, FiX, FiTrash2, FiBellOff } from 'react-icons/fi'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import {
  isNotificationSupported,
  getPermissionStatus,
  requestNotificationPermission,
  showBrowserNotification,
  saveNotificationPreference,
  getUserNotificationPreference
} from '../../utils/webNotification'

export default function NotificationBell() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  // Web Notification state
  const [pushEnabled, setPushEnabled] = useState(() => getUserNotificationPreference())
  const [permissionStatus, setPermissionStatus] = useState(() => getPermissionStatus())

  const handleNotificationClick = async (notif) => {
    // Đánh dấu đã đọc trước
    if (!notif.read) {
      await markAsRead(notif._id)
    }
    
    // Đóng dropdown
    setShowDropdown(false)

    // Điều hướng dựa trên loại và dữ liệu
    const orderId = notif.data?.orderId
    const restaurantId = notif.data?.restaurantId

    if (orderId) {
      if (user?.role === 'admin') {
        navigate('/admin')
      } else if (user?.role === 'shipper' || user?.role === 'driver') {
        navigate('/shipper-dashboard')
      } else {
        navigate('/tracking', { state: { orderId } })
      }
    } else if (restaurantId) {
      if (user?.role === 'partner') {
        navigate('/restaurant-manage')
      } else {
        navigate(`/restaurant/${restaurantId}`)
      }
    }
  }

  // Tạo âm thanh thông báo
  const playNotificationSound = useCallback(() => {
    try {
      // Tạo âm thanh bằng Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Âm thanh "ding" - 2 nốt nhạc
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
      
      // Nốt thứ 2
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()
        
        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)
        
        oscillator2.frequency.value = 1000
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator2.start(audioContext.currentTime)
        oscillator2.stop(audioContext.currentTime + 0.1)
      }, 100)
    } catch (error) {
      console.log('Cannot play notification sound:', error)
    }
  }, [])

  // Toggle Web Push Notification
  const handleTogglePush = useCallback(async () => {
    if (!isNotificationSupported()) {
      toast.error('Trình duyệt của bạn không hỗ trợ thông báo đẩy')
      return
    }

    if (pushEnabled) {
      // Tắt thông báo đẩy
      setPushEnabled(false)
      saveNotificationPreference(false)
      toast.success('Đã tắt thông báo đẩy trên trình duyệt', { icon: '🔕' })
    } else {
      // Bật thông báo đẩy - cần xin quyền
      const status = await requestNotificationPermission()
      setPermissionStatus(status)

      if (status === 'granted') {
        setPushEnabled(true)
        saveNotificationPreference(true)
        toast.success('Đã bật thông báo đẩy! Bạn sẽ nhận thông báo ngay cả khi chuyển tab.', { icon: '🔔', duration: 4000 })
        
        // Gửi thông báo test
        showBrowserNotification({
          title: 'FoodServe',
          body: '✨ Thông báo đẩy đã được kích hoạt thành công!',
          type: 'order_status',
          tag: 'push-test'
        })
      } else if (status === 'denied') {
        toast.error('Bạn đã chặn quyền thông báo. Vui lòng vào Cài đặt trình duyệt để cho phép.', { duration: 6000 })
      }
    }
  }, [pushEnabled])

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Setup Socket.io
    const socket = io(SOCKET_URL)
    socket.emit('join-user', user._id || user.id)

    socket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Play notification sound
      playNotificationSound()
      
      // Show toast (hiển thị khi tab đang active)
      toast.success(notification.title, {
        icon: getNotificationIcon(notification.type),
        duration: 4000
      })

      // 🔔 Hiển thị Web Push Notification (hiển thị khi tab ở nền)
      showBrowserNotification({
        title: notification.title,
        body: notification.message,
        type: notification.type,
        tag: `notif-${notification._id || Date.now()}`,
        data: notification.data,
        onClick: () => {
          // Khi click vào push notification, điều hướng
          const orderId = notification.data?.orderId
          const restaurantId = notification.data?.restaurantId
          if (orderId) {
            if (user?.role === 'admin') navigate('/admin')
            else if (user?.role === 'shipper' || user?.role === 'driver') navigate('/shipper-dashboard')
            else navigate('/tracking', { state: { orderId } })
          } else if (restaurantId) {
            if (user?.role === 'partner') navigate('/restaurant-manage')
            else navigate(`/restaurant/${restaurantId}`)
          }
        }
      })
    })

    socket.on('payment-approved', () => {
      // Reload restaurant data if needed
      window.location.reload()
    })

    return () => socket.disconnect()
  }, [user, playNotificationSound, navigate])

  // Tự động xin quyền nhẹ nhàng khi component mount lần đầu
  useEffect(() => {
    if (!user) return
    if (!isNotificationSupported()) return
    
    const status = getPermissionStatus()
    setPermissionStatus(status)
    
    // Nếu chưa hỏi lần nào (default) và user đã đăng nhập -> hiện gợi ý
    if (status === 'default') {
      // Đợi 10s rồi hiện gợi ý
      const timer = setTimeout(() => {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-800">🔔 Bật thông báo đẩy?</p>
            <p className="text-xs text-gray-500">Nhận thông báo đơn hàng ngay cả khi bạn chuyển tab</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t.id)
                  const result = await requestNotificationPermission()
                  setPermissionStatus(result)
                  if (result === 'granted') {
                    setPushEnabled(true)
                    toast.success('Đã bật thông báo đẩy!', { icon: '🔔' })
                  }
                }}
                className="px-3 py-1.5 bg-primary-500 text-white text-xs font-bold rounded-lg hover:bg-primary-600 transition-colors"
              >
                Cho phép
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        ), {
          duration: 15000,
          position: 'bottom-right',
          style: {
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '16px',
            border: '1px solid rgba(255,107,0,0.15)',
          }
        })
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${user._id || user.id}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (err) {
      console.error('Fetch notifications error:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Mark read error:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${user._id || user.id}/read-all`, {
        method: 'PATCH'
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success('Đã đánh dấu tất cả là đã đọc')
      }
    } catch (err) {
      console.error('Mark all read error:', err)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
        toast.success('Đã xóa thông báo')
      }
    } catch (err) {
      console.error('Delete notification error:', err)
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      payment_request: '💳',
      payment_approved: '✅',
      payment_rejected: '❌',
      order_new: '🛒',
      order_status: '📦',
      subscription_expiring: '⏰',
      partner_approved: '🎉',
      driver_approved: '🚗'
    }
    return icons[type] || '🔔'
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  // Nhãn trạng thái quyền push
  const getPushStatusLabel = () => {
    if (!isNotificationSupported()) return { text: 'Không hỗ trợ', color: 'text-gray-400' }
    if (permissionStatus === 'denied') return { text: 'Đã chặn', color: 'text-red-500' }
    if (pushEnabled && permissionStatus === 'granted') return { text: 'Đang bật', color: 'text-green-500' }
    return { text: 'Đang tắt', color: 'text-gray-400' }
  }

  if (!user) return null

  const pushStatus = getPushStatusLabel()

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
        aria-label="Thông báo"
      >
        <FiBell className="text-xl text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-dark-200 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg dark:text-white">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-500 hover:underline font-semibold"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {/* Web Push Notification Toggle */}
                <div className="mt-3 flex items-center justify-between bg-gray-50 dark:bg-dark-100 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      pushEnabled && permissionStatus === 'granted'
                        ? 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {pushEnabled && permissionStatus === 'granted'
                        ? <FiBell className="text-white text-sm" />
                        : <FiBellOff className="text-gray-400 text-sm" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-bold dark:text-white leading-tight">Thông báo đẩy</p>
                      <p className={`text-[10px] font-semibold ${pushStatus.color}`}>{pushStatus.text}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePush}
                    disabled={permissionStatus === 'denied'}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                      pushEnabled && permissionStatus === 'granted'
                        ? 'bg-primary-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    } ${permissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={
                      permissionStatus === 'denied' 
                        ? 'Bạn đã chặn quyền thông báo trong trình duyệt. Vui lòng vào Cài đặt trình duyệt để thay đổi.' 
                        : pushEnabled ? 'Tắt thông báo đẩy' : 'Bật thông báo đẩy'
                    }
                  >
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                      animate={{
                        left: pushEnabled && permissionStatus === 'granted' ? '22px' : '2px'
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">Đang tải...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FiBell className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>Chưa có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-primary-50/30 dark:bg-primary-950/10' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-semibold text-sm dark:text-white">{notif.title}</h4>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{notif.message}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">{getTimeAgo(notif.createdAt)}</span>
                            <div className="flex gap-2">
                              {!notif.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif._id);
                                  }}
                                  className="text-xs text-primary-500 hover:underline p-1"
                                  title="Đánh dấu đã đọc"
                                >
                                  <FiCheck />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif._id);
                                }}
                                className="text-xs text-red-500 hover:underline p-1"
                                title="Xóa"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
