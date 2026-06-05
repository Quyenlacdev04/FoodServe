import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

const floatingFoods = ['🍕', '🍔', '🍜', '🍣', '🌮', '🍱', '🥗', '🍦']

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-300 flex items-center justify-center px-4 overflow-hidden relative">

      {/* Floating food emojis */}
      {floatingFoods.map((food, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl select-none pointer-events-none opacity-20 dark:opacity-10"
          style={{
            left: `${10 + (i * 12)}%`,
            top: `${15 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, i % 2 === 0 ? 15 : -15, 0],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3
          }}
        >
          {food}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-lg relative z-10"
      >
        {/* 404 số lớn */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 150, damping: 12 }}
          className="mb-4"
        >
          <span className="text-[120px] md:text-[160px] font-black leading-none bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent select-none">
            404
          </span>
        </motion.div>

        {/* Icon đĩa trống */}
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          className="text-7xl mb-6"
        >
          🍽️
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3"
        >
          Ối! Trang này không có thực đơn
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed"
        >
          Trang bạn đang tìm kiếm đã bị gỡ, đổi tên, hoặc chưa từng tồn tại.
          <br />
          Nhưng đừng lo — vẫn còn rất nhiều món ngon đang chờ bạn! 🤤
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
          >
            <FiHome /> Về trang chủ
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-dark-100 text-gray-700 dark:text-gray-200 font-bold rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors shadow-sm"
          >
            <FiArrowLeft /> Quay lại
          </motion.button>
        </motion.div>

        {/* Gợi ý */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 p-4 bg-white/60 dark:bg-dark-100/60 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Bạn có thể thử:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: '🍔 Đặt đồ ăn', path: '/' },
              { label: '📜 Lịch sử đơn', path: '/history' },
              { label: '❤️ Yêu thích', path: '/favorites' },
              { label: '🎁 Săn Xu', path: '/games' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors border border-primary-200 dark:border-primary-800"
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
