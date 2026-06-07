import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiStar, FiClock, FiMapPin, FiRefreshCw } from 'react-icons/fi'
import { formatPrice } from '../../data/mockData'

export default function AllMenuItems() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const itemsPerPage = 12

  useEffect(() => {
    loadMenuItems()
  }, [page])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      let response = await fetch(`http://localhost:5000/api/restaurants/menu/all?limit=${itemsPerPage}&page=${page}`)
      let data = await response.json()
      
      if (!data.results || data.results.length === 0) {
        response = await fetch(`http://localhost:5000/api/restaurants?limit=100`)
        const restaurantsData = await response.json()
        const restaurants = restaurantsData.restaurants || []
        
        const allMenuItems = []
        for (const restaurant of restaurants) {
          try {
            const menuResponse = await fetch(`http://localhost:5000/api/restaurants/${restaurant._id}`)
            const menuData = await menuResponse.json()
            if (menuData.menuItems && menuData.menuItems.length > 0) {
              menuData.menuItems.forEach(item => {
                allMenuItems.push({
                  ...item,
                  restaurant: restaurant
                })
              })
            }
          } catch (err) {
            console.error(`Error loading menu for restaurant ${restaurant._id}:`, err)
          }
        }
        
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedItems = allMenuItems.slice(startIndex, endIndex)
        
        setMenuItems(prev => page === 1 ? paginatedItems : [...prev, ...paginatedItems])
        setHasMore(endIndex < allMenuItems.length)
      } else {
        setMenuItems(prev => page === 1 ? data.results : [...prev, ...data.results])
        setHasMore(data.page < data.totalPages)
      }
    } catch (error) {
      console.error('Error loading menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  return (
    <section className="py-12 bg-surface-light/60 dark:bg-dark-400 relative">
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-black text-gray-900 dark:text-white">
            Tất cả <span className="text-gradient-premium">món ăn ngon</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Khám phá các món ăn đa dạng từ hệ thống nhà hàng của chúng tôi
          </p>
        </motion.div>

        {/* Loading for first page */}
        {loading && menuItems.length === 0 && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">Đang tải món ăn...</p>
          </div>
        )}

        {/* Menu Items Grid */}
        {menuItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map((item, i) => (
                <motion.div
                  key={`${item._id || item.id}-${i}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % itemsPerPage) * 0.03 }}
                >
                  <Link 
                    to={`/restaurant/${item.restaurant._id || item.restaurant.id}`} 
                    className="block card-restaurant group"
                  >
                    {/* Image Section */}
                    <div className="relative overflow-hidden h-48 rounded-t-3xl">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      
                      {/* Badges top left */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {item.restaurant.discount > 0 && (
                          <span className="badge-discount text-xs font-black shadow-lg">
                            {item.restaurant.discount > 100 
                              ? `Giảm ${Math.floor(item.restaurant.discount/1000)}k` 
                              : `Giảm ${item.restaurant.discount}%`}
                          </span>
                        )}
                        {item.popular && (
                          <span className="badge-hot text-xs font-black shadow-lg">🔥 Hot</span>
                        )}
                      </div>

                      {/* Price Badge */}
                      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-2xl glass text-white text-sm font-black shadow-inner-glow">
                        {item.price > 0 ? formatPrice(item.price) : 'Giá 0'}
                      </div>
                    </div>

                    {/* Details content */}
                    <div className="p-5">
                      {/* Restaurant label info */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px]">🏢</span>
                        </div>
                        <span className="font-bold text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors text-xs truncate">
                          {item.restaurant.name}
                        </span>
                      </div>

                      {/* Item Name */}
                      <h3 className="text-base font-black text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors mb-2">
                        {item.name}
                      </h3>

                      {/* Restaurant Stats */}
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-white/5 pt-3">
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <FiStar className="fill-yellow-500 text-yellow-500" /> {item.restaurant.rating || '4.5'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <FiClock /> {item.restaurant.deliveryTime || '30'} phút
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <FiMapPin /> {item.restaurant.distance || '2'} km
                        </span>
                      </div>

                      {/* Promo Tag if present */}
                      {item.restaurant.promo && (
                        <div className="mt-3.5 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-500/5 dark:to-primary-600/5 text-primary-600 dark:text-primary-400 text-xs font-bold border border-primary-500/20 truncate">
                          🏷️ {item.restaurant.promo}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-primary text-white font-bold hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="animate-spin text-lg" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      Xem thêm món ăn
                      <FiRefreshCw className="text-lg" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && menuItems.length === 0 && (
          <div className="text-center py-20 glass-card rounded-3xl p-8 max-w-lg mx-auto border border-gray-100 dark:border-white/5 shadow-card">
            <span className="text-6xl block mb-4">🍽️</span>
            <p className="text-xl font-bold dark:text-white">Chưa có món ăn nào</p>
            <p className="text-gray-400 mt-2 font-medium">Hệ thống đang cập nhật thực đơn, vui lòng quay lại sau.</p>
          </div>
        )}
      </div>
    </section>
  )
}
