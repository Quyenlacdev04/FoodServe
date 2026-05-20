import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { categories } from '../../data/mockData'
import { setCategory } from '../../store/slices/restaurantSlice'

export default function CategorySection() {
  const dispatch = useDispatch()
  const { selectedCategory } = useSelector((s) => s.restaurants)

  return (
    <section id="categories" className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold dark:text-white">
            Bạn muốn ăn gì <span className="text-gradient">hôm nay?</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Chọn danh mục yêu thích</p>
        </motion.div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
          <motion.button
            onClick={() => dispatch(setCategory('all'))}
            className={`category-card ${selectedCategory === 'all' ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500 shadow-glow' : 'bg-white dark:bg-dark-100'}`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop" alt="Tất cả" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs md:text-sm font-medium dark:text-white mt-1">Tất cả</span>
          </motion.button>
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => dispatch(setCategory(cat.id))}
              className={`category-card ${selectedCategory === cat.id ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500 shadow-glow' : 'bg-white dark:bg-dark-100'}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden shadow-sm">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs md:text-sm font-medium dark:text-white mt-1">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
