import { API_BASE_URL } from '../../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiShoppingBag, FiStar, FiHeart, FiCpu, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { formatPrice } from '../../data/mockData'
import { addToCart } from '../../store/slices/cartSlice'

export default function AIRecommendations() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { healthyMode } = useSelector(state => state.ui)
  
  const [data, setData] = useState({ recommendedRestaurants: [], recommendedItems: [], context: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [user?._id])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const userId = user?._id || 'guest'
      const res = await fetch(`${API_BASE_URL}/api/restaurants/recommendations/user/${userId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error('Error fetching AI recommendations:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    dispatch(addToCart({
      id: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurantName || 'Nhà hàng',
      quantity: 1
    }))
    
    toast.success(`Đã thêm ${item.name} vào giỏ hàng!`, {
      icon: '🛒',
      duration: 2000
    })
  }

  if (loading) {
    return (
      <div className="py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-dark-100 animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 dark:bg-dark-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-dark-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const { recommendedRestaurants, recommendedItems, context } = data

  if (recommendedRestaurants.length === 0 && recommendedItems.length === 0) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative z-10">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center text-white text-lg shadow-lg shadow-primary-500/20">
            <FiCpu className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-gray-900 dark:text-white flex items-center gap-2">
              Gợi ý thông minh từ AI
              <span className="bg-primary-500/10 text-primary-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Cá nhân hóa
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {context.hasHistory 
                ? `Phân tích theo khẩu vị và ${context.timeLabel.toLowerCase()}`
                : `Thịnh hành nhất và ${context.timeLabel.toLowerCase()}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-gray-100 dark:bg-dark-100 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400">
          <FiClock /> Khung giờ: {context.timeLabel}
        </div>
      </div>

      {/* 1. RECOMMENDED RESTAURANTS */}
      {recommendedRestaurants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            🏪 Quán ngon đề xuất cho bạn
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedRestaurants.map((rest, index) => (
              <motion.div
                key={rest._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group relative bg-white dark:bg-dark-200 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-card hover:shadow-glow hover:border-primary-500/30 transition-all duration-300 flex flex-col h-full"
              >
                {/* Banner Image */}
                <Link to={`/restaurant/${rest._id}`} className="relative h-40 overflow-hidden block">
                  <img 
                    src={rest.cover || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'} 
                    alt={rest.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* AI Reason Badge */}
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-primary-500 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                    ✨ {rest.reasonTag}
                  </span>
                  
                  <span className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                    🛵 {rest.distance ? `${rest.distance} km` : 'Gần bạn'}
                  </span>
                </Link>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/restaurant/${rest._id}`} className="hover:text-primary-500 transition-colors">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">
                        {rest.name}
                      </h4>
                    </Link>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-1">📍 {rest.address}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/60 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        ⭐ {rest.rating?.toFixed(1) || '4.0'}
                      </span>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {rest.orders || 0} lượt mua
                      </span>
                    </div>
                    {rest.freeship && (
                      <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black px-2 py-0.5 rounded-lg">
                        Freeship
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 2. RECOMMENDED FOOD ITEMS */}
      {recommendedItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>{healthyMode ? '🥗 Món ngon Healthy dành riêng cho bạn' : '🍕 Món ngon gợi ý riêng cho bữa nay'}</span>
            {healthyMode && <span className="text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">Đã tối ưu dinh dưỡng</span>}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...recommendedItems]
              .sort((a, b) => (healthyMode ? (b.isHealthy ? 1 : 0) - (a.isHealthy ? 1 : 0) : 0))
              .map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative bg-white dark:bg-dark-200 rounded-3xl overflow-hidden border shadow-card hover:shadow-glow transition-all duration-300 flex flex-col justify-between ${
                  healthyMode && item.isHealthy 
                    ? 'border-green-500/35 hover:border-green-500/50 shadow-[0_2px_12px_-3px_rgba(34,197,94,0.15)]' 
                    : 'border-gray-100 dark:border-gray-800 hover:border-amber-500/30'
                }`}
              >
                {/* Food Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-dark-100">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* AI Badge */}
                  <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                    {item.badge}
                  </span>

                  {/* Healthy Badge */}
                  {healthyMode && item.isHealthy && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg shadow-md">
                      🥗 Healthy
                    </span>
                  )}

                  {/* Quick Add To Cart Button overlay */}
                  <button
                    onClick={(e) => handleAddToCart(item, e)}
                    className="absolute bottom-2 right-2 w-9 h-9 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg flex items-center justify-center transition-all scale-0 group-hover:scale-100 active:scale-90"
                    title="Thêm nhanh vào giỏ"
                  >
                    <FiShoppingBag size={16} />
                  </button>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-xs line-clamp-1">
                      {item.name}
                    </h5>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      🏪 {item.restaurantName}
                    </p>
                    {healthyMode && item.calories > 0 && (
                      <div className="mt-1.5 text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10 w-max">
                        🔥 {item.calories} kcal
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="font-extrabold text-primary-500 text-sm">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
