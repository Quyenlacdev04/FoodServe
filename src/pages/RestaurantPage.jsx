import { API_BASE_URL } from '../config/api.js'
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiStar, FiClock, FiMapPin, FiPlus, FiMinus, FiShoppingCart, FiAlertTriangle } from 'react-icons/fi'
import { fetchRestaurantDetails } from '../store/slices/restaurantSlice'
import { addToCart, openCart, selectCartCount } from '../store/slices/cartSlice'
import { formatPrice } from '../data/mockData'
import ReviewList from '../components/reviews/ReviewList'
import toast from 'react-hot-toast'

export default function RestaurantPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { selectedRestaurant, menuItems, status } = useSelector((s) => s.restaurants)
  const { user } = useSelector((s) => s.auth)
  const cartCount = useSelector(selectCartCount)
  const [activeCategory, setActiveCategory] = useState('all')
  const [quantities, setQuantities] = useState({})
  const [groupLoading, setGroupLoading] = useState(false)

  const handleStartGroupOrder = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bắt đầu đặt nhóm!')
      return
    }
    try {
      setGroupLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/group-orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: user._id,
          hostName: user.name,
          restaurantId: selectedRestaurant._id || selectedRestaurant.id,
          restaurantName: selectedRestaurant.name
        })
      })

      if (res.ok) {
        const session = await res.json()
        toast.success('Đã tạo phòng đặt chung thành công! 🎉')
        navigate(`/group-order/${session.code}`)
      } else {
        const err = await res.json()
        toast.error(err.message || 'Lỗi tạo phòng đặt nhóm')
      }
    } catch (e) {
      toast.error('Không thể kết nối máy chủ')
    } finally {
      setGroupLoading(false)
    }
  }

  useEffect(() => {
    dispatch(fetchRestaurantDetails(id))
    window.scrollTo(0, 0)
  }, [id, dispatch])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-dark-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-bold">Đang tải dữ liệu nhà hàng...</p>
        </div>
      </div>
    )
  }

  if (!selectedRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-dark-300">
        <div className="text-center glass-card p-8 rounded-3xl max-w-sm border border-gray-100 dark:border-white/5 shadow-card">
          <span className="text-6xl block mb-4">🔍</span>
          <p className="text-xl font-bold dark:text-white mb-2">Không tìm thấy nhà hàng</p>
          <Link to="/" className="text-primary-500 font-bold hover:underline inline-flex items-center gap-1">
            <FiArrowLeft /> Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  const items = menuItems[id] || []
  const cats = ['all', ...new Set(items.map((i) => i.category || 'Khác'))]

  const filtered = activeCategory === 'all' ? items : items.filter((i) => i.category === activeCategory)

  const isExpired = selectedRestaurant.subscriptionExpiry && new Date(selectedRestaurant.subscriptionExpiry) < new Date()

  const updateQty = (itemId, delta) => {
    if (isExpired) return
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }))
  }

  const handleAdd = (item) => {
    if (isExpired) return
    dispatch(addToCart(item))
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }))
  }

  return (
    <div className="min-h-screen bg-surface-light/60 dark:bg-dark-300 pb-20 transition-colors duration-500">
      {/* Cover Header Image */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={selectedRestaurant.cover || selectedRestaurant.image}
          alt={selectedRestaurant.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = selectedRestaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-24 left-4 md:left-8 w-11 h-11 rounded-2xl glass flex items-center justify-center text-white hover:bg-white/20 transition-all z-10 shadow-lg border border-white/10"
        >
          <FiArrowLeft className="text-lg" />
        </Link>
        
        {/* Title Details Overlay */}
        <div className="absolute bottom-8 left-4 md:left-8 right-4 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-display font-black text-white text-shadow-lg leading-tight">
            {selectedRestaurant.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs md:text-sm font-bold text-white/90">
            <span className="flex items-center gap-1 text-yellow-400">
              <FiStar className="fill-yellow-400 text-yellow-400" /> {selectedRestaurant.rating}
              <span className="text-white/60">({selectedRestaurant.reviews} đánh giá)</span>
            </span>
            <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
            <span className="flex items-center gap-1 text-white/90">
              <FiClock /> {selectedRestaurant.deliveryTime} phút
            </span>
            <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
            <span className="flex items-center gap-1 text-white/90">
              <FiMapPin /> {selectedRestaurant.distance} km
            </span>
            {isExpired && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ml-2 shadow-lg">
                Tạm khóa do hết hạn
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {selectedRestaurant.promo && (
              <div className="inline-flex px-3.5 py-2 rounded-xl bg-red-500 text-white text-xs font-black shadow-lg">
                🏷️ {selectedRestaurant.promo}
              </div>
            )}
            {!isExpired && (
              <button
                type="button"
                onClick={handleStartGroupOrder}
                disabled={groupLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-amber-500 text-white text-xs font-black shadow-lg hover:shadow-glow transition-all active:scale-95 disabled:opacity-60 cursor-pointer border border-white/10"
              >
                👥 {groupLoading ? 'Đang tạo...' : 'Đặt nhóm (Split Bill)'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Merchant Expired Banner */}
        {isExpired && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 mb-6 flex items-start gap-4 shadow-sm backdrop-blur-sm">
            <FiAlertTriangle className="text-red-500 text-2xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-600 dark:text-red-400 text-sm">Cửa hàng tạm ngưng hoạt động</p>
              <p className="text-xs text-red-500 dark:text-red-400/80 mt-1 leading-relaxed font-medium">
                Cửa hàng này hiện đang tạm ngưng nhận đơn hàng mới do quá hạn phí duy trì. Quý khách vui lòng chọn các nhà hàng khác.
              </p>
            </div>
          </div>
        )}

        {/* Description card */}
        <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 mb-8 shadow-card border border-gray-100 dark:border-white/5">
          <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{selectedRestaurant.description}</p>
          <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-4" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            📍 {selectedRestaurant.address}
          </p>
        </div>

        {/* Category filtering tab pills */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-4 mb-8">
          {cats.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl text-xs font-black transition-all duration-300 shadow-sm ${
                activeCategory === cat
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'bg-white dark:bg-dark-100 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-dark-200'
              }`}
            >
              {cat === 'all' ? '🍽️ Tất cả món' : cat}
            </button>
          ))}
        </div>

        {/* Menu item cards listing grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-dark-100 rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover border border-gray-100 dark:border-white/5 transition-all duration-300 flex"
              >
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-28 h-28 md:w-32 md:h-32 object-cover flex-shrink-0" 
                  loading="lazy" 
                />
                
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-base text-gray-800 dark:text-white line-clamp-1">{item.name}</h4>
                      {item.popular && (
                        <span className="badge-hot text-[9px] px-2 py-0.5 rounded-lg shadow-sm">HOT</span>
                      )}
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5 line-clamp-2 font-medium">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-primary-500 font-sans font-black text-base">{formatPrice(item.price)}</span>
                    
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 px-3 py-1.5 bg-gray-50 dark:bg-dark-200 border border-gray-100 dark:border-white/5 rounded-xl select-none">
                          Tạm khóa
                        </span>
                      ) : (
                        <>
                          {(quantities[item.id] || 0) > 0 && (
                            <>
                              <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                onClick={() => updateQty(item.id, -1)}
                                className="w-8 h-8 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center bg-white dark:bg-dark-200 hover:border-primary-500 transition-colors shadow-sm"
                              >
                                <FiMinus className="text-xs text-gray-600 dark:text-white" />
                              </motion.button>
                              <motion.span
                                key={quantities[item.id]}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="text-sm font-black w-6 text-center text-gray-800 dark:text-white"
                              >
                                {quantities[item.id]}
                              </motion.span>
                            </>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => {
                              if ((quantities[item.id] || 0) === 0) updateQty(item.id, 1)
                              else handleAdd({ ...item, quantity: quantities[item.id] })
                            }}
                            className="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 hover:shadow-glow transition-all shadow-md"
                          >
                            {(quantities[item.id] || 0) === 0 ? <FiPlus className="text-base" /> : <FiShoppingCart className="text-base" />}
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Reviews panel card */}
        <div className="mt-12 bg-white dark:bg-dark-100 rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 dark:border-white/5">
          <ReviewList restaurantId={id} />
        </div>
      </div>

      {/* Floating cart drawer button for mobile view */}
      {cartCount > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => dispatch(openCart())}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 btn-primary py-3.5 px-6 rounded-2xl shadow-glow-lg flex items-center gap-2 z-40 text-base font-black border border-white/10"
        >
          <FiShoppingCart className="text-lg" /> Giỏ hàng ({cartCount})
        </motion.button>
      )}
    </div>
  )
}
