import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import useUserCapabilities from '../../hooks/useUserCapabilities'

export default function HeroSection() {
  const { caps } = useUserCapabilities()
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-gradient-mesh noise-overlay transition-colors duration-500">
      {/* Background Image with Premium Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=3840&h=2160&fit=crop&q=95"
          alt="Food background"
          className="w-full h-full object-cover opacity-95 dark:opacity-50 transition-all duration-500"
        />
        {/* Radial overlay to make center text perfectly readable while showing food details on the sides with maximum clarity */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.88)_15%,rgba(255,255,255,0.1)_80%,rgba(255,255,255,0)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(28,25,23,0.92)_15%,rgba(28,25,23,0.2)_80%,rgba(28,25,23,0)_100%)] transition-colors duration-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-dark-300 transition-colors duration-500" />
      </div>

      {/* Aurora Ambient Orbs — Indigo/Violet */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-orb aurora-orb-orange w-[600px] h-[600px] -top-40 -left-20" />
        <div className="aurora-orb aurora-orb-purple w-[500px] h-[500px] top-1/3 -right-20" />
        <div className="aurora-orb aurora-orb-gold w-[400px] h-[400px] -bottom-20 left-1/3" />
      </div>

      {/* Floating food cards with 3D Glassmorphism */}
      {/* 1. Burger Bò (Top Right) */}
      <motion.div
        className="absolute top-28 right-6 md:right-16 lg:right-28 glass-card rounded-3xl p-4 px-6 shadow-card-premium border-gradient hover:shadow-3d hidden md:flex items-center gap-4 transition-all duration-300 cursor-pointer select-none z-20 card-3d"
        animate={{ y: [-8, 8, -8], rotate: [-1.5, 2, -1.5] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
      >
        <span className="text-3xl filter drop-shadow-sm transform hover:rotate-12 transition-transform duration-300">🍔</span>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-gray-900 dark:text-white text-[15px] font-display font-bold tracking-wide">Burger Bò</p>
          <p className="text-primary-600 dark:text-primary-400 font-sans font-black text-[14px] mt-0.5">
            79.000<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">đ</span>
          </p>
        </div>
      </motion.div>

      {/* 2. Quán của tôi / Đăng ký mở quán (Bottom Right) */}
      {caps.showRestaurantManage ? (
        <Link to="/restaurant-manage" className="absolute bottom-28 right-6 md:right-16 lg:right-28 z-20 hidden md:block">
          <motion.div
            className="relative glass-card rounded-3xl p-4 px-6 shadow-card-premium border-gradient hover:shadow-3d flex items-center gap-4 transition-all duration-300 cursor-pointer select-none card-3d"
            animate={{ y: [-12, 12, -12], rotate: [-2.5, 2, -2.5] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
          >
            <span className="text-3xl filter drop-shadow-sm">🍳</span>
            <div className="flex flex-col items-start leading-tight">
              <p className="text-gray-900 dark:text-white text-[15px] font-display font-bold tracking-wide">Quán của tôi</p>
              <p className="text-primary-600 dark:text-primary-400 font-sans font-bold text-[13px] mt-0.5">Quản lý quán</p>
            </div>
          </motion.div>
        </Link>
      ) : caps.showPartnerRegister ? (
        <Link to="/partner-register" className="absolute bottom-28 right-6 md:right-16 lg:right-28 z-20 hidden md:block">
          <motion.div
            className="relative glass-card rounded-3xl p-4 px-6 shadow-card-premium border-gradient hover:shadow-3d flex items-center gap-4 transition-all duration-300 cursor-pointer select-none card-3d"
            animate={{ y: [-12, 12, -12], rotate: [-2.5, 2, -2.5] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
          >
            <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🍳</span>
            <div className="flex flex-col items-start leading-tight">
              <p className="text-gray-900 dark:text-white text-[15px] font-display font-bold tracking-wide">Đăng ký mở quán</p>
              <p className="text-primary-600 dark:text-primary-400 font-sans font-bold text-[13px] mt-0.5">Hợp tác ngay!</p>
            </div>
          </motion.div>
        </Link>
      ) : null}

      {/* 3. Trà Sữa (Top Left) */}
      <motion.div
        className="absolute top-40 left-6 md:left-16 lg:left-28 glass-card rounded-3xl p-4 px-6 shadow-card-premium border-gradient hover:shadow-3d hidden lg:flex items-center gap-4 transition-all duration-300 cursor-pointer select-none z-20 card-3d"
        animate={{ y: [-10, 10, -10], rotate: [-2, 1.5, -2] }}
        transition={{ duration: 6.0, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
        whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
      >
        <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🧋</span>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-gray-900 dark:text-white text-[15px] font-display font-bold tracking-wide">Trà Sữa</p>
          <p className="text-primary-600 dark:text-primary-400 font-sans font-black text-[14px] mt-0.5">
            35.000<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">đ</span>
          </p>
        </div>
      </motion.div>

      {/* 4. Sushi Thập Cẩm (Middle Left) */}
      <motion.div
        className="absolute top-72 left-6 md:left-16 lg:left-24 glass-card rounded-3xl p-4 px-6 shadow-card-premium border-gradient hover:shadow-3d hidden md:flex items-center gap-4 transition-all duration-300 cursor-pointer select-none z-20 card-3d"
        animate={{ y: [-14, 14, -14], rotate: [-3, 2.5, -3] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut", delay: 2.0 }}
        whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
      >
        <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🍣</span>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-gray-900 dark:text-white text-[15px] font-display font-bold tracking-wide">Sushi Thập Cẩm</p>
          <p className="text-primary-600 dark:text-primary-400 font-sans font-black text-[14px] mt-0.5">
            129.000<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">đ</span>
          </p>
        </div>
      </motion.div>

      {/* 5. Tài xế / Đăng ký tài xế (Bottom Left) */}
      {caps.showDriverPanel ? (
        <Link to="/driver" className="absolute bottom-16 left-6 md:left-16 lg:left-28 z-20 hidden md:block">
          <motion.div
            className="relative glass-card rounded-3xl p-4 px-6 shadow-card-premium border-gradient hover:shadow-3d flex items-center gap-4 transition-all duration-300 cursor-pointer select-none card-3d"
            animate={{ y: [-10, 10, -10], rotate: [-2, 2.5, -2] }}
            transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
            whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
          >
            <span className="text-3xl filter drop-shadow-sm">🛵</span>
            <div className="flex flex-col items-start leading-tight">
              <p className="text-gray-900 dark:text-white text-[15px] font-display font-bold tracking-wide">Tài xế</p>
              <p className="text-primary-600 dark:text-primary-400 font-sans font-bold text-[13px] mt-0.5">Nhận đơn giao</p>
            </div>
          </motion.div>
        </Link>
      ) : caps.showDriverRegister ? (
        <Link to="/driver-register" className="absolute bottom-16 left-6 md:left-16 lg:left-28 z-20 hidden md:block">
          <motion.div
            className="relative glass-card rounded-3xl p-4 px-6 shadow-card-premium border-gradient hover:shadow-3d flex items-center gap-4 transition-all duration-300 cursor-pointer select-none card-3d"
            animate={{ y: [-10, 10, -10], rotate: [-2, 2.5, -2] }}
            transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
            whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
          >
            <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🛵</span>
            <div className="flex flex-col items-start leading-tight">
              <p className="text-gray-900 dark:text-white text-[15px] font-display font-bold tracking-wide">Đăng ký tài xế</p>
              <p className="text-primary-600 dark:text-primary-400 font-sans font-bold text-[13px] mt-0.5">Thu nhập 90%!</p>
            </div>
          </motion.div>
        </Link>
      ) : null}

      {/* Hero content container */}
      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="antialiased w-full"
        >
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 font-bold text-sm mb-6 shadow-sm backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            Giao hàng nhanh trong 30 phút
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-black text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-6 transition-colors duration-500">
            Ăn ngon mỗi ngày
            <br />
            <span className="text-gradient-premium drop-shadow-sm">cùng FoodServe</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-10 leading-relaxed font-medium transition-colors duration-500">
            Khám phá hàng ngàn nhà hàng cao cấp, quán ăn ngon nhất. Đặt món dễ dàng, giao tận nơi siêu tốc.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <motion.a
              href="#restaurants"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-base px-8 py-4 flex items-center gap-2 shadow-3d w-full sm:w-auto justify-center"
            >
              🍽️ Đặt món ngay
            </motion.a>
            <motion.a
              href="#categories"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-2xl text-base font-bold text-primary-600 border-2 border-primary-500/20 hover:border-primary-500/50 dark:border-white/10 dark:hover:border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-md transition-all shadow-depth-sm w-full sm:w-auto justify-center"
            >
              📋 Xem menu
            </motion.a>
          </div>
        </motion.div>

        {/* Stats — 3D elevated cards */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 md:gap-6 mt-16 w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { num: '500+', label: 'Nhà hàng' },
            { num: '10K+', label: 'Món ăn' },
            { num: '50K+', label: 'Khách hàng' },
            { num: '4.8⭐', label: 'Đánh giá' },
          ].map((s) => (
            <div key={s.label} className="text-center px-4 py-4 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/5 shadow-depth hover:shadow-3d transition-all duration-500 flex-1 min-w-[140px] max-w-[180px] card-3d">
              <p className="text-2xl md:text-3xl font-display font-black text-primary-600 dark:text-white leading-none">{s.num}</p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-primary-300 dark:border-white/20 rounded-full flex items-start justify-center p-1.5">
          <motion.div
            className="w-1.5 h-3 bg-primary-500 dark:bg-white/60 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}
