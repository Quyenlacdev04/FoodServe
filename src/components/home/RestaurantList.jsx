import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiStar, FiClock, FiMapPin } from 'react-icons/fi'
import { setFilter } from '../../store/slices/restaurantSlice'
import { formatPrice } from '../../data/mockData'
import SearchAndFilter from './SearchAndFilter'
import FavoriteButton from '../ui/FavoriteButton'

const filters = [
  { id: 'all', label: '🔥 Tất cả' },
  { id: 'nearby', label: '📍 Gần bạn' },
  { id: 'popular', label: '⭐ Bán chạy' },
  { id: 'rating', label: '💯 Đánh giá cao' },
  { id: 'discount', label: '🏷️ Giảm giá mạnh' },
]

export default function RestaurantList() {
  const dispatch = useDispatch()
  const { filteredRestaurants, selectedFilter } = useSelector((s) => s.restaurants)
  const [restaurants, setRestaurants] = useState(filteredRestaurants)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRestaurants(filteredRestaurants)
  }, [filteredRestaurants])

  const handleSearch = async (searchQuery, filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filters.category) params.append('category', filters.category)
      if (filters.minRating) params.append('minRating', filters.minRating)
      if (filters.freeship) params.append('freeship', 'true')
      if (filters.sortBy) params.append('sortBy', filters.sortBy)

      const response = await fetch(`http://localhost:5000/api/restaurants?${params}`)
      const data = await response.json()
      setRestaurants(data.restaurants || data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = async (filters) => {
    await handleSearch('', filters)
  }

  return (
    <section id="restaurants" className="py-12 md:py-16 relative overflow-hidden">
      {/* Floating Food Icons - Left Side */}
      <div className="hidden xl:block absolute -left-20 top-1/4 pointer-events-none">
        <motion.div
          className="text-5xl opacity-30"
          animate={{ 
            y: [0, -20, 0],
            rotate: [-5, 5, -5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🍕
        </motion.div>
        <motion.div
          className="text-4xl opacity-30 mt-20"
          animate={{ 
            y: [0, 20, 0],
            rotate: [5, -5, 5]
          }}
          transition={{
            duration: 4,
            delay: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🍔
        </motion.div>
        <motion.div
          className="text-3xl opacity-30 mt-20"
          animate={{ 
            y: [0, -15, 0],
            rotate: [-3, 3, -3]
          }}
          transition={{
            duration: 3.5,
            delay: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🍜
        </motion.div>
      </div>

      {/* Floating Food Icons - Right Side */}
      <div className="hidden xl:block absolute -right-20 top-1/3 pointer-events-none">
        <motion.div
          className="text-4xl opacity-30"
          animate={{ 
            y: [0, 15, 0],
            rotate: [3, -3, 3]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🍱
        </motion.div>
        <motion.div
          className="text-5xl opacity-30 mt-20"
          animate={{ 
            y: [0, -25, 0],
            rotate: [-5, 5, -5]
          }}
          transition={{
            duration: 4,
            delay: 0.7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🍰
        </motion.div>
        <motion.div
          className="text-4xl opacity-30 mt-20"
          animate={{ 
            y: [0, 20, 0],
            rotate: [4, -4, 4]
          }}
          transition={{
            duration: 3.8,
            delay: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🍣
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold dark:text-white">
              Nhà hàng <span className="text-gradient">nổi bật</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Khám phá {restaurants.length} nhà hàng chất lượng</p>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} />

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => dispatch(setFilter(f.id))}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                selectedFilter === f.id
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'bg-white dark:bg-dark-100 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tìm kiếm...</p>
          </div>
        )}

        {/* Restaurant Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {restaurants.map((r, i) => (
              <motion.div
                key={r._id || r.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/restaurant/${r._id || r.id}`} className="block card-restaurant group">
                  {/* Image */}
                  <div className="relative overflow-hidden h-44">
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {r.discount > 0 && (
                        <span className="badge-discount">-{r.discount > 100 ? (r.discount/1000) + 'K' : r.discount + '%'}</span>
                      )}
                      {r.freeship && (
                        <span className="badge-freeship">Freeship</span>
                      )}
                    </div>
                    {/* Delivery time */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg glass text-white text-xs font-medium">
                      <FiClock className="text-xs" /> {r.deliveryTime} phút
                    </div>
                    {/* Favorite Button */}
                    <div className="absolute bottom-3 right-3" onClick={(e) => e.preventDefault()}>
                      <FavoriteButton restaurantId={r._id || r.id} size="sm" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-display font-bold text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors">
                      {r.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                        <FiStar className="fill-yellow-500" /> {r.rating}
                      </span>
                      <span className="text-gray-400">({r.reviews})</span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <FiMapPin className="text-xs" /> {r.distance}km
                      </span>
                    </div>
                    {r.promo && (
                      <div className="mt-3 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-medium">
                        🏷️ {r.promo}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && restaurants.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🔍</span>
            <p className="text-xl font-semibold dark:text-white">Không tìm thấy nhà hàng</p>
            <p className="text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>
    </section>
  )
}
