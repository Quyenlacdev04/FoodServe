import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiStar, FiClock, FiMapPin, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi'
import { fetchRestaurantDetails } from '../store/slices/restaurantSlice'
import { addToCart, openCart, selectCartCount } from '../store/slices/cartSlice'
import { formatPrice } from '../data/mockData'

export default function RestaurantPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { selectedRestaurant, menuItems, status } = useSelector((s) => s.restaurants)
  const cartCount = useSelector(selectCartCount)
  const [activeCategory, setActiveCategory] = useState('all')
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    dispatch(fetchRestaurantDetails(id))
    window.scrollTo(0, 0)
  }, [id, dispatch])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center dark:text-white">Đang tải dữ liệu...</div>
  }

  if (!selectedRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🔍</span>
          <p className="text-xl font-semibold dark:text-white">Không tìm thấy nhà hàng</p>
          <Link to="/" className="text-primary-500 mt-4 inline-block hover:underline">← Về trang chủ</Link>
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300">
      {/* Cover */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={selectedRestaurant.cover} alt={selectedRestaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <Link
          to="/"
          className="absolute top-20 left-4 md:left-8 w-10 h-10 rounded-xl glass flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <FiArrowLeft />
        </Link>
        <div className="absolute bottom-6 left-4 md:left-8 right-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white text-shadow-lg">
            {selectedRestaurant.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-yellow-400 font-semibold">
              <FiStar className="fill-yellow-400" /> {selectedRestaurant.rating}
              <span className="text-white/60">({selectedRestaurant.reviews})</span>
            </span>
            <span className="flex items-center gap-1 text-white/70">
              <FiClock /> {selectedRestaurant.deliveryTime} phút
            </span>
            <span className="flex items-center gap-1 text-white/70">
              <FiMapPin /> {selectedRestaurant.distance}km
            </span>
            {isExpired && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                Tạm khóa do hết hạn
              </span>
            )}
          </div>
          {selectedRestaurant.promo && (
            <div className="inline-flex mt-3 px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-medium">
              🏷️ {selectedRestaurant.promo}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Banner quá hạn phí duy trì */}
        {isExpired && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-600 dark:text-red-400 text-sm">Cửa hàng tạm ngưng hoạt động</p>
              <p className="text-xs text-red-500 dark:text-red-400/80 mt-0.5">
                Cửa hàng này hiện đang tạm ngưng nhận đơn hàng mới do quá hạn phí duy trì. Quý khách vui lòng quay lại sau!
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl p-5 mb-6 shadow-card">
          <p className="text-gray-600 dark:text-gray-300">{selectedRestaurant.description}</p>
          <p className="text-sm text-gray-400 mt-2">📍 {selectedRestaurant.address}</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
          {cats.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'bg-white dark:bg-dark-100 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {cat === 'all' ? '🍽️ Tất cả' : cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-dark-100 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex"
              >
                <img src={item.image} alt={item.name} className="w-28 h-28 md:w-32 md:h-32 object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold dark:text-white line-clamp-1">{item.name}</h4>
                      {item.popular && <span className="badge bg-primary-500/10 text-primary-500 text-[10px]">HOT</span>}
                    </div>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-500 font-bold">{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <span className="text-xs font-bold text-gray-400 px-3 py-1.5 bg-gray-100 dark:bg-dark-200 rounded-lg">
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
                                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                              >
                                <FiMinus className="text-xs dark:text-white" />
                              </motion.button>
                              <motion.span
                                key={quantities[item.id]}
                                initial={{ scale: 1.5 }}
                                animate={{ scale: 1 }}
                                className="text-sm font-bold w-5 text-center dark:text-white"
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
                            className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                          >
                            {(quantities[item.id] || 0) === 0 ? <FiPlus className="text-sm" /> : <FiShoppingCart className="text-sm" />}
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
      </div>

      {/* Floating cart button on mobile */}
      {cartCount > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => dispatch(openCart())}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 btn-primary py-3 px-6 rounded-2xl shadow-glow-lg flex items-center gap-2 z-40"
        >
          <FiShoppingCart /> Giỏ hàng ({cartCount})
        </motion.button>
      )}
    </div>
  )
}
