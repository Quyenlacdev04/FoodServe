import { useState, useEffect } from 'react'
import { FiStar, FiThumbsUp, FiFlag, FiMessageCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ReviewList({ restaurantId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!restaurantId) return
    fetchReviews()
  }, [restaurantId, sortBy, page])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/api/reviews/restaurant/${restaurantId}?page=${page}&limit=10&sort=${sortBy}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Fetch reviews error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHelpful = async (reviewId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${reviewId}/helpful`, {
        method: 'POST'
      })
      if (res.ok) {
        toast.success('Cảm ơn phản hồi của bạn!')
        fetchReviews()
      }
    } catch (error) {
      console.error('Mark helpful error:', error)
    }
  }

  const handleReport = async (reviewId) => {
    if (!confirm('Bạn có chắc muốn báo cáo đánh giá này?')) return
    
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Spam hoặc nội dung không phù hợp' })
      })
      if (res.ok) {
        toast.success('Đã báo cáo đánh giá')
        fetchReviews()
      }
    } catch (error) {
      console.error('Report error:', error)
    }
  }

  const StarDisplay = ({ rating }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <FiStar
          key={star}
          className={`text-lg ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-xl dark:text-white">
          ⭐ Đánh giá từ khách hàng ({reviews.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-200 text-gray-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="newest">Mới nhất</option>
          <option value="highest">Đánh giá cao nhất</option>
          <option value="lowest">Đánh giá thấp nhất</option>
          <option value="helpful">Hữu ích nhất</option>
        </select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FiStar className="text-5xl mx-auto mb-3 opacity-50" />
          <p className="font-semibold">Chưa có đánh giá nào</p>
          <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá nhà hàng này!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-dark-200 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow"
            >
              {/* User Info & Rating */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                    {review.userId?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-bold dark:text-white">{review.userId?.name || 'Người dùng'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <StarDisplay rating={review.restaurantRating} />
              </div>

              {/* Comment */}
              {review.restaurantComment && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {review.restaurantComment}
                </p>
              )}

              {/* Driver Rating */}
              {review.driverRating && (
                <div className="bg-gray-50 dark:bg-dark-300/50 p-3 rounded-xl mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      🛵 Đánh giá tài xế:
                    </span>
                    <StarDisplay rating={review.driverRating} />
                  </div>
                  {review.driverComment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {review.driverComment}
                    </p>
                  )}
                </div>
              )}

              {/* Restaurant Reply */}
              {review.restaurantReply && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border-l-4 border-blue-500 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FiMessageCircle className="text-blue-500" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                      Phản hồi từ nhà hàng
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {review.restaurantReply.text}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleHelpful(review._id)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500 transition-colors"
                >
                  <FiThumbsUp />
                  <span>Hữu ích ({review.helpfulCount})</span>
                </button>
                <button
                  onClick={() => handleReport(review._id)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  <FiFlag />
                  <span>Báo cáo</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                page === pageNum
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
