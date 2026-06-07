import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiStar, FiClock, FiMapPin, FiPercent } from 'react-icons/fi'
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
      const response = await fetch(`http://localhost:5000/api/restaurants?limit=100`)
      const restaurantsData = await response.json()
      const restaurants = restaurantsData.restaurants || []
      const discountRestaurants = restaurants.filter(r => r.discount > 0)
      
      const discountMenuItems = []
      for (const restaurant of discountRestaurants) {
        try {
          const menuResponse = await fetch(`http://localhost:5000/api/restaurants/${restaurant._id}`)
          const menuData = await menuResponse.json()
          if (menuData.menuItems && menuData.menuItems.length > 0) {
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
      
      setMenuItems(discountMenuItems.slice(0, 8))
    } catch (error) {
      console.error('Error loading discount menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Đang tải món ăn ưu đãi...</p>
          </div>
        </div>
      </section>
    )
  }

  if (menuItems.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gradient-to-b from-surface-light/60 to-white dark:from-dark-400 dark:to-dark-300 relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
            Món ăn <span className="text-gradient-premium">ưu đãi</span> <FiPercent className="text-primary-500" />
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Tiết kiệm ngay với các món ăn đang giảm giá cực khủng
          </p>
        </motion.div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <div className="relative overflow-hidden h-48 rounded-t-3xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  
                  {/* Discount Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="badge-discount py-1.5 px-3 rounded-2xl text-xs font-black tracking-wide flex items-center gap-1 shadow-lg bg-gradient-to-r from-red-600 to-amber-500">
                      <FiPercent className="text-sm animate-bounce" />
                      {item.restaurant.discount > 100 
                        ? `GIẢM ${Math.floor(item.restaurant.discount/1000)}K` 
                        : `GIẢM ${item.restaurant.discount}%`}
                    </span>
                  </div>

                  {/* Price Glass Badge */}
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-2xl glass text-white text-sm font-black shadow-inner-glow">
                    {item.price > 0 ? formatPrice(item.price) : 'Giá 0'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Restaurant detail */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-5 h-5 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px]">🍳</span>
                    </div>
                    <span className="font-bold text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors text-xs truncate">
                      {item.restaurant.name}
                    </span>
                  </div>

                  {/* Item Name */}
                  <h3 className="text-base font-black text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors mb-2">
                    {item.name}
                  </h3>

                  {/* Info Row */}
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-white/5 pt-3">
                    <span className="flex items-center gap-1 text-yellow-500">
                      <FiStar className="fill-yellow-500" /> 
                      {item.restaurant.rating || '4.5'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FiClock /> 
                      {item.restaurant.deliveryTime || '30'} phút
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FiMapPin /> 
                      {item.restaurant.distance || '2'} km
                    </span>
                  </div>

                  {/* Promo Banner if present */}
                  {item.restaurant.promo && (
                    <div className="mt-3.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 dark:from-red-500/5 dark:to-amber-500/5 text-red-500 dark:text-amber-400 text-xs font-bold border border-red-500/20 truncate">
                      🎁 {item.restaurant.promo}
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
