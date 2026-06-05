import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { categories } from '../../data/mockData'
import { setCategory } from '../../store/slices/restaurantSlice'

export default function CategorySection() {
  const dispatch = useDispatch()
  const { selectedCategory } = useSelector((s) => s.restaurants)

  return (
    <section id="categories" className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50/50 dark:from-dark-300 dark:to-dark-400 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-display font-black text-gray-900 dark:text-white">
            Bạn muốn ăn gì <span className="text-gradient-premium">hôm nay?</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Chọn danh mục món ăn yêu thích để khám phá</p>
        </motion.div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
          {/* "Tất cả" Category Card */}
          <motion.button
            onClick={() => dispatch(setCategory('all'))}
            className={`category-card border transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-primary-500/10 border-primary-500/40 shadow-glow text-primary-500 font-bold ring-1 ring-primary-500/20'
                : 'bg-white dark:bg-dark-100/60 border-gray-100 dark:border-white/5 shadow-card hover:bg-gray-50 dark:hover:bg-dark-100 hover:border-primary-500/20'
            }`}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-md border-gradient relative">
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop" alt="Tất cả" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs md:text-sm font-bold dark:text-white mt-1">Tất cả</span>
          </motion.button>

          {/* List of categories */}
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => dispatch(setCategory(cat.id))}
              className={`category-card border transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-primary-500/10 border-primary-500/40 shadow-glow text-primary-500 font-bold ring-1 ring-primary-500/20'
                  : 'bg-white dark:bg-dark-100/60 border-gray-100 dark:border-white/5 shadow-card hover:bg-gray-50 dark:hover:bg-dark-100 hover:border-primary-500/20'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-md border-gradient relative">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs md:text-sm font-bold dark:text-white mt-1">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
