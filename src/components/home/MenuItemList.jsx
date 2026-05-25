import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiStar, FiClock, FiMapPin } from 'react-icons/fi'
import { formatPrice } from '../../data/mockData'

export default function MenuItemList() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDiscountMenuItems()
  }, [])

  const loadDiscountMenuItems = async () => {
    try {
      setLoading(true)
      
      // Lấy tất cả nhà hàng có ưu đãi
      const response = await fetch(`http://localhost:5000/api/restaurants?limit=100`)
      const restaurantsData = await response.json()
      const restaurants = restaurantsData.restaurants || []
      
      // Lọc nhà hàng có discount > 0
      const discountRestaurants = restaurants.filter(r => r.discount > 0)
      
      // Lấy menu items từ các nhà hàng có ưu đãi
      const discountMenuItems = []
      for (const restaurant of discountRestaurants) {
        try {
          const menuResponse = await fetch(`http://localhost:5000/api/restaurants/${restaurant._id}`)
          const menuData = await menuResponse.json()
          if (menuData.menuItems && menuData.menuItems.length > 0) {
            // Lấy tối đa 2 món từ mỗi nhà hàng
            const items = menuData.menuItems.slice(0, 2)
            items.forEach(item => {
              discountMenuItems.push({
                ...item,
                restaurant: restaurant
              })
            })
          }
        } catch (err) {
          console.error(`Error loading menu for restaurant ${restaurant._id}:`, err)
        }
      }
      
      // Giới hạn hiển thị 8 món
      setMenuItems(discountMenuItems.slice(0, 8))
    } catch (error) {
      console.error('Error loading discount menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải món ăn ưu đãi...</p>
          </div>
        </div>
      </section>
    )
  }

  if (menuItems.length === 0) {
    return null // Không hiển thị gì nếu không có món ưu đãi
  }

  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-orange-50 to-white dark:from-dark-200 dark:to-dark-100">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold dark:text-white">
            Món ăn <span className="text-gradient">ưu đãi</span> 🎁
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Tiết kiệm ngay với {menuItems.length} món ăn đang giảm giá
          </p>
        </motion.div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {menuItems.map((item, i) => (
            <motion.div
              key={`${item._id || item.id}-${i}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
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
                  
                  {/* Discount Badge - Nổi bật */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-bold shadow-lg animate-pulse">
                      {item.restaurant.discount > 100 
                        ? `🎁 Giảm ${Math.floor(item.restaurant.discount/1000)}k` 
                        : `🎁 Giảm ${item.restaurant.discount}%`}
                    </span>
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
      </div>
    </section>
  )
}
