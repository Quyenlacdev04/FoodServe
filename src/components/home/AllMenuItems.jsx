import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiStar, FiClock, FiMapPin } from 'react-icons/fi'
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
      
      // Thử endpoint mới trước
      let response = await fetch(`http://localhost:5000/api/restaurants/menu/all?limit=${itemsPerPage}&page=${page}`)
      let data = await response.json()
      
      // Nếu endpoint mới không hoạt động, lấy từ tất cả nhà hàng
      if (!data.results || data.results.length === 0) {
        // Lấy tất cả nhà hàng
        response = await fetch(`http://localhost:5000/api/restaurants?limit=100`)
        const restaurantsData = await response.json()
        const restaurants = restaurantsData.restaurants || []
        
        // Lấy menu items từ mỗi nhà hàng
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
        
        // Phân trang thủ công
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
    <section className="py-8 md:py-12 bg-gray-50 dark:bg-dark-200">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold dark:text-white">
            Tất cả <span className="text-gradient">món ăn</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Khám phá {menuItems.length}+ món ăn ngon
          </p>
        </motion.div>

        {/* Loading */}
        {loading && menuItems.length === 0 && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải món ăn...</p>
          </div>
        )}

        {/* Menu Items Grid */}
        {menuItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {menuItems.map((item, i) => (
                <motion.div
                  key={`${item._id || item.id}-${i}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 12) * 0.02 }}
                >
                  <Link 
                    to={`/restaurant/${item.restaurant._id || item.restaurant.id}`} 
                    className="block card-restaurant group"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden h-44">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {item.restaurant.discount > 0 && (
                          <span className="badge-discount">
                            {item.restaurant.discount > 100 
                              ? `Giảm ${Math.floor(item.restaurant.discount/1000)}k` 
                              : `Giảm ${item.restaurant.discount}%`}
                          </span>
                        )}
                        {item.popular && (
                          <span className="badge-freeship">🔥 Hot</span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg glass text-white text-sm font-bold">
                        {item.price > 0 ? formatPrice(item.price) : 'Giá 0'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Restaurant name with icon */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                        <h3 className="font-display font-bold text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors text-sm">
                          {item.restaurant.name}
                        </h3>
                      </div>

                      {/* Menu item name */}
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 mb-2">
                        {item.name}
                      </p>

                      {/* Restaurant info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiStar className="fill-yellow-500 text-yellow-500" /> 
                          {item.restaurant.rating || '4.5'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="text-xs" /> 
                          {item.restaurant.deliveryTime || '30'} phút
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMapPin className="text-xs" /> 
                          {item.restaurant.distance || '2'}km
                        </span>
                      </div>

                      {/* Promo */}
                      {item.restaurant.promo && (
                        <div className="mt-3 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-medium line-clamp-1">
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
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      Xem thêm
                      <span className="text-xl">↻</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && menuItems.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🍽️</span>
            <p className="text-xl font-semibold dark:text-white">Chưa có món ăn nào</p>
            <p className="text-gray-400 mt-2">Vui lòng thử lại sau</p>
          </div>
        )}
      </div>
    </section>
  )
}
