import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiStar, FiClock, FiMapPin, FiAward, FiNavigation } from 'react-icons/fi'
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
    <section id="restaurants" className="py-12 md:py-16 relative overflow-hidden bg-white dark:bg-dark-300 transition-colors duration-500">
      {/* Decorative Orbs */}
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Food Emojis */}
      <div className="hidden xl:block absolute -left-16 top-1/4 pointer-events-none z-0">
        <motion.div className="text-5xl opacity-20" animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>🍕</motion.div>
        <motion.div className="text-4xl opacity-20 mt-24" animate={{ y: [0, 20, 0], rotate: [5, -5, 5] }} transition={{ duration: 5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}>🍔</motion.div>
      </div>

      <div className="hidden xl:block absolute -right-16 top-1/3 pointer-events-none z-0">
        <motion.div className="text-4xl opacity-20" animate={{ y: [0, 15, 0], rotate: [3, -3, 3] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>🍱</motion.div>
        <motion.div className="text-5xl opacity-20 mt-24" animate={{ y: [0, -20, 0], rotate: [-4, 4, -4] }} transition={{ duration: 5.5, delay: 0.7, repeat: Infinity, ease: "easeInOut" }}>🍣</motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-black text-gray-900 dark:text-white">
            Nhà hàng <span className="text-gradient-premium">nổi bật</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Khám phá {restaurants.length} nhà hàng chất lượng hàng đầu</p>
        </motion.div>

        {/* Search Panel Component */}
        <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} />

        {/* Categories filters */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-4 mb-8">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => dispatch(setFilter(f.id))}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                selectedFilter === f.id
                  ? 'bg-gradient-primary border-transparent text-white shadow-glow'
                  : 'bg-white dark:bg-dark-100/60 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-200 border-gray-100 dark:border-white/5 shadow-card'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">Đang tải danh sách nhà hàng...</p>
          </div>
        )}

        {/* Restaurants Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((r, i) => (
              <motion.div
                key={r._id || r.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/restaurant/${r._id || r.id}`} className="block card-restaurant group">
                  {/* Banner Image */}
                  <div className="relative overflow-hidden h-48 rounded-t-3xl">
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    
                    {/* Badges top left */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {r.discount > 0 && (
                        <span className="badge-discount text-xs font-black shadow-lg">
                          -{r.discount > 100 ? (r.discount/1000) + 'K' : r.discount + '%'}
                        </span>
                      )}
                      {r.freeship && (
                        <span className="badge-freeship text-xs font-black shadow-lg">Freeship</span>
                      )}
                    </div>

                    {/* Delivery Time bottom left */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-2xl glass text-white text-xs font-bold shadow-inner-glow">
                      <FiClock className="text-xs" /> {r.deliveryTime} phút
                    </div>

                    {/* Favorite Button top right */}
                    <div className="absolute top-4 right-4" onClick={(e) => e.preventDefault()}>
                      <FavoriteButton restaurantId={r._id || r.id} size="sm" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <h3 className="font-display font-black text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors text-base">
                      {r.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-2.5 text-sm font-bold text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-0.5 text-yellow-500">
                        <FiStar className="fill-yellow-500 text-yellow-500" /> {r.rating}
                      </span>
                      <span>•</span>
                      <span>({r.reviews} đánh giá)</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <FiMapPin /> {r.distance}km
                      </span>
                    </div>

                    {/* Promo tag */}
                    {r.promo ? (
                      <div className="mt-4 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-500/5 dark:to-primary-600/5 text-primary-600 dark:text-primary-400 text-xs font-black border border-primary-500/20 truncate">
                        🏷️ {r.promo}
                      </div>
                    ) : (
                      <div className="mt-4 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-dark-200 text-gray-400 text-xs font-bold border border-gray-100 dark:border-white/5 truncate">
                        ✨ Không có ưu đãi đặc biệt
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && restaurants.length === 0 && (
          <div className="text-center py-20 glass-card rounded-3xl p-8 max-w-lg mx-auto border border-gray-100 dark:border-white/5 shadow-card">
            <span className="text-6xl block mb-4">🔍</span>
            <p className="text-xl font-bold dark:text-white">Không tìm thấy nhà hàng</p>
            <p className="text-gray-400 mt-2 font-medium">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>
    </section>
  )
}
