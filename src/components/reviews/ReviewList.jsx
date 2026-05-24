import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FiStar, FiThumbsUp, FiFlag, FiMessageCircle, FiEdit3 } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ReviewList({ restaurantId }) {
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Form đánh giá
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hoverStar, setHoverStar] = useState(0)
  const [form, setForm] = useState({
    restaurantRating: 0,
    restaurantComment: ''
  })

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

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để đánh giá!'); return }
    if (form.restaurantRating === 0) { toast.error('Vui lòng chọn số sao!'); return }
    if (!form.restaurantComment.trim()) { toast.error('Vui lòng nhập nội dung đánh giá!'); return }

    setSubmitting(true)
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id || user.id,
          restaurantId,
          restaurantRating: form.restaurantRating,
          restaurantComment: form.restaurantComment
        })
      })
      if (res.ok) {
        toast.success('🎉 Đã gửi đánh giá thành công!')
        setForm({ restaurantRating: 0, restaurantComment: '' })
        setShowForm(false)
        fetchReviews()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Lỗi khi gửi đánh giá')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const StarPicker = ({ value, hover, onHover, onClick }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          onClick={() => onClick(star)}
          className="transition-transform hover:scale-125"
        >
          <FiStar className={`text-3xl transition-colors ${
            star <= (hover || value)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`} />
        </button>
      ))}
    </div>
  )

  const starLabels = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc']

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
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-md"
            >
              <FiEdit3 /> {showForm ? 'Hủy' : 'Viết đánh giá'}
            </button>
          )}
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
      </div>

      {/* Form đánh giá */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmitReview}
              className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-dark-200 dark:to-dark-200 rounded-2xl p-6 border border-orange-100 dark:border-gray-700"
            >
              <h4 className="font-bold text-lg dark:text-white mb-4">✍️ Viết đánh giá của bạn</h4>

              {/* Chọn sao */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Chất lượng nhà hàng</p>
                <div className="flex items-center gap-3">
                  <StarPicker
                    value={form.restaurantRating}
                    hover={hoverStar}
                    onHover={setHoverStar}
                    onClick={(star) => setForm(p => ({ ...p, restaurantRating: star }))}
                  />
                  {(hoverStar || form.restaurantRating) > 0 && (
                    <span className="text-sm font-bold text-orange-500">
                      {starLabels[hoverStar || form.restaurantRating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Nội dung */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Nội dung đánh giá</p>
                <textarea
                  rows={4}
                  value={form.restaurantComment}
                  onChange={e => setForm(p => ({ ...p, restaurantComment: e.target.value }))}
                  placeholder="Chia sẻ trải nghiệm của bạn về nhà hàng này... (chất lượng món ăn, dịch vụ, thời gian giao hàng...)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.restaurantComment.length}/500</p>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang gửi...
                    </span>
                  ) : '🚀 Gửi đánh giá'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nếu chưa đăng nhập */}
      {!isAuthenticated && (
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 text-center">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            🔐 Vui lòng <strong>đăng nhập</strong> để viết đánh giá nhà hàng này
          </p>
        </div>
      )}

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
