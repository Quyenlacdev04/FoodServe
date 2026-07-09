import { API_BASE_URL } from '../config/api.js'
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBell, FiCheck, FiCheckCircle, FiTrash2, FiFilter,
  FiArrowLeft, FiChevronRight, FiInbox
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const typeConfig = {
  payment_request:      { icon: '💳', label: 'Thanh toán',    color: 'from-blue-500 to-blue-600' },
  payment_approved:     { icon: '✅', label: 'Duyệt thanh toán', color: 'from-green-500 to-green-600' },
  payment_rejected:     { icon: '❌', label: 'Từ chối',       color: 'from-red-500 to-red-600' },
  order_new:            { icon: '🛒', label: 'Đơn mới',       color: 'from-primary-500 to-orange-500' },
  order_status:         { icon: '📦', label: 'Đơn hàng',      color: 'from-purple-500 to-violet-500' },
  order_cancelled:      { icon: '🚫', label: 'Hủy đơn',       color: 'from-red-500 to-pink-500' },
  subscription_expiring:{ icon: '⏰', label: 'Hết hạn',       color: 'from-amber-500 to-yellow-500' },
  partner_approved:     { icon: '🎉', label: 'Đối tác',       color: 'from-emerald-500 to-teal-500' },
  driver_approved:      { icon: '🚗', label: 'Tài xế',        color: 'from-cyan-500 to-blue-500' },
}

const filterTabs = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'order', label: 'Đơn hàng' },
  { id: 'payment', label: 'Thanh toán' },
]

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return }
    fetchNotifications()
  }, [isAuthenticated])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${user._id || user.id}?limit=100`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Fetch notifications error:', err)
      toast.error('Lỗi khi tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = useCallback(async (notifId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notifId}/read`, { method: 'PATCH' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Mark read error:', err)
    }
  }, [])

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${user._id || user.id}/read-all`, { method: 'PATCH' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success('Đã đánh dấu tất cả đã đọc', { icon: '✅' })
      }
    } catch (err) {
      toast.error('Lỗi khi thực hiện')
    }
  }

  const deleteNotification = async (notifId) => {
    setDeletingId(notifId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notifId}`, { method: 'DELETE' })
      if (res.ok) {
        const notif = notifications.find(n => n._id === notifId)
        setNotifications(prev => prev.filter(n => n._id !== notifId))
        if (notif && !notif.read) setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success('Đã xóa thông báo')
      }
    } catch (err) {
      toast.error('Lỗi khi xóa')
    } finally {
      setDeletingId(null)
    }
  }

  const handleClick = async (notif) => {
    if (!notif.read) await markAsRead(notif._id)
    const orderId = notif.data?.orderId
    const restaurantId = notif.data?.restaurantId
    if (orderId) {
      if (user?.role === 'admin') navigate('/admin')
      else navigate(`/order/${orderId}`)
    } else if (restaurantId) {
      navigate(`/restaurant/${restaurantId}`)
    }
  }

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    return new Date(date).toLocaleDateString('vi-VN')
  }

  // Filter logic
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read
    if (activeFilter === 'order') return ['order_new', 'order_status', 'order_cancelled'].includes(n.type)
    if (activeFilter === 'payment') return ['payment_request', 'payment_approved', 'payment_rejected'].includes(n.type)
    return true
  })

  // Group by date
  const groupByDate = (notifs) => {
    const groups = {}
    notifs.forEach(n => {
      const date = new Date(n.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let key
      if (date.toDateString() === today.toDateString()) key = 'Hôm nay'
      else if (date.toDateString() === yesterday.toDateString()) key = 'Hôm qua'
      else key = date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

      if (!groups[key]) groups[key] = []
      groups[key].push(n)
    })
    return groups
  }

  const grouped = groupByDate(filteredNotifications)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white dark:hover:bg-dark-100 transition-colors">
              <FiArrowLeft className="text-xl text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold dark:text-white">Thông báo</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-primary-500 font-semibold">{unreadCount} chưa đọc</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-primary-500 hover:text-primary-600 bg-primary-50 dark:bg-primary-500/10 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FiCheckCircle /> Đọc tất cả
            </button>
          )}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide"
        >
          {filterTabs.map(tab => {
            const isActive = activeFilter === tab.id
            const count = tab.id === 'unread' ? unreadCount : null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-white dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-200 border border-gray-100 dark:border-gray-800'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-100 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-dark-200 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-dark-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 dark:bg-dark-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-dark-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-100 rounded-3xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-6xl mb-4 inline-block"
            >
              {activeFilter === 'unread' ? '✨' : '🔔'}
            </motion.div>
            <h2 className="text-xl font-bold dark:text-white mb-2">
              {activeFilter === 'unread' ? 'Đã đọc hết rồi!' : 'Chưa có thông báo'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {activeFilter === 'unread'
                ? 'Bạn đã đọc tất cả thông báo. Quay lại sau nhé!'
                : 'Thông báo về đơn hàng, khuyến mãi sẽ xuất hiện ở đây.'
              }
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95">
              Khám phá ngay <FiChevronRight />
            </Link>
          </motion.div>
        ) : (
          /* Notification List */
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, notifs]) => (
              <div key={date}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-3">{date}</p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {notifs.map((notif, i) => {
                      const config = typeConfig[notif.type] || { icon: '🔔', label: 'Thông báo', color: 'from-gray-500 to-gray-600' }
                      return (
                        <motion.div
                          key={notif._id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleClick(notif)}
                          className={`group relative bg-white dark:bg-dark-100 rounded-2xl border overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${
                            !notif.read
                              ? 'border-primary-200 dark:border-primary-500/20 shadow-sm'
                              : 'border-gray-100 dark:border-gray-800'
                          }`}
                        >
                          {/* Unread indicator bar */}
                          {!notif.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-orange-500 rounded-l-2xl" />
                          )}

                          <div className="p-4 flex gap-3.5">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-xl flex-shrink-0 shadow-lg shadow-gray-200/50 dark:shadow-none`}>
                              {config.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`text-sm leading-tight ${!notif.read ? 'font-bold dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>
                                  {notif.title}
                                </h4>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!notif.read && (
                                    <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse" />
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-2">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">{getTimeAgo(notif.createdAt)}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notif.read && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); markAsRead(notif._id) }}
                                      className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 text-green-500 transition-colors"
                                      title="Đánh dấu đã đọc"
                                    >
                                      <FiCheck className="text-sm" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id) }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                                    title="Xóa thông báo"
                                  >
                                    {deletingId === notif._id ? (
                                      <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                    ) : (
                                      <FiTrash2 className="text-sm" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
