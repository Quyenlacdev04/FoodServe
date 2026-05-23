import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function ReviewModal({ order, onClose, onSubmit }) {
  const [restaurantRating, setRestaurantRating] = useState(5)
  const [restaurantComment, setRestaurantComment] = useState('')
  const [driverRating, setDriverRating] = useState(5)
  const [driverComment, setDriverComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (restaurantRating < 1) {
      toast.error('Vui lòng đánh giá nhà hàng')
      return
    }

    try {
      setSubmitting(true)
      
      const reviewData = {
        orderId: order._id,
        userId: order.userId,
        restaurantId: order.restaurantId,
        restaurantRating,
        restaurantComment,
        driverRating,
        driverComment,
        itemReviews: order.items?.map(item => ({
          itemName: item.name,
          rating: restaurantRating, // Simplified: use same rating for all items
          comment: ''
        }))
      }

      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })

      if (res.ok) {
        toast.success('Cảm ơn bạn đã đánh giá! 🌟')
        onSubmit?.()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Lỗi khi gửi đánh giá')
      }
    } catch (error) {
      console.error('Submit review error:', error)
      toast.error('Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ rating, setRating, label }) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <FiStar
              className={`text-3xl ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-lg font-bold text-gray-700 dark:text-gray-300">
          {rating}/5
        </span>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-dark-200 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-dark-200 z-10">
            <div>
              <h3 className="font-bold text-xl dark:text-white">⭐ Đánh giá đơn hàng</h3>
              <p className="text-sm text-gray-400 mt-1">Chia sẻ trải nghiệm của bạn</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold"
            >
              <FiX />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Restaurant Rating */}
            <div className="bg-gray-50 dark:bg-dark-300/50 p-4 rounded-2xl">
              <h4 className="font-bold text-gray-800 dark:text-white mb-3">
                🏪 Đánh giá nhà hàng
              </h4>
              <StarRating
                rating={restaurantRating}
                setRating={setRestaurantRating}
                label="Chất lượng món ăn & dịch vụ"
              />
              <textarea
                value={restaurantComment}
                onChange={(e) => setRestaurantComment(e.target.value)}
                placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-200 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                rows="3"
              />
            </div>

            {/* Driver Rating */}
            <div className="bg-gray-50 dark:bg-dark-300/50 p-4 rounded-2xl">
              <h4 className="font-bold text-gray-800 dark:text-white mb-3">
                🛵 Đánh giá tài xế
              </h4>
              <StarRating
                rating={driverRating}
                setRating={setDriverRating}
                label="Thái độ & tốc độ giao hàng"
              />
              <textarea
                value={driverComment}
                onChange={(e) => setDriverComment(e.target.value)}
                placeholder="Nhận xét về tài xế (tùy chọn)..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-200 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                rows="2"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-primary text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
