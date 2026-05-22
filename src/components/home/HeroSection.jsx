import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import useUserCapabilities from '../../hooks/useUserCapabilities'

export default function HeroSection() {
  const { caps } = useUserCapabilities()
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop&q=80"
          alt="Food background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white/95 dark:from-black/70 dark:via-black/40 dark:to-black/80 transition-colors duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent dark:from-orange-900/30 transition-colors duration-500" />
      </div>

      {/* Smoke effects */}
      <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-smoke pointer-events-none" />
      <div className="absolute top-1/4 right-1/3 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl animate-smoke pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/3 left-1/2 w-20 h-20 bg-white/5 rounded-full blur-2xl animate-smoke pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Floating food cards */}
      {/* 1. Burger Bò (Top Right) */}
      <motion.div
        className="absolute top-32 right-10 md:right-28 lg:right-32 bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 rounded-[24px] p-3 px-5 shadow-[0_12px_28px_rgba(42,24,19,0.35)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.4)] hover:border-primary-500/50 hidden md:flex items-center gap-4 transition-all duration-300 cursor-pointer select-none z-10"
        animate={{ y: [-8, 8, -8], rotate: [-1.5, 2, -1.5] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
      >
        <span className="text-3xl filter drop-shadow-sm transform hover:rotate-12 transition-transform duration-300">🍔</span>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-white text-[15px] font-display font-bold tracking-wide">Burger Bò</p>
          <p className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">
            79.000<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">đ</span>
          </p>
        </div>
      </motion.div>

      {/* 2. Quán / đăng ký mở quán */}
      {caps.showRestaurantManage ? (
        <Link to="/restaurant-manage" className="absolute bottom-28 right-8 md:right-24 lg:right-28 z-10 hidden md:block">
        <motion.div
          className="bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 rounded-[24px] p-3.5 px-6 shadow-[0_14px_32px_rgba(42,24,19,0.4)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.45)] hover:border-primary-500/50 flex items-center gap-4 transition-all duration-300 cursor-pointer select-none"
          animate={{ y: [-12, 12, -12], rotate: [-2.5, 2, -2.5] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
        >
          <span className="text-3xl filter drop-shadow-sm">🍳</span>
          <div className="flex flex-col items-start leading-tight">
            <p className="text-white text-[15px] font-display font-bold tracking-wide">Quán của tôi</p>
            <p className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">Quản lý quán</p>
          </div>
        </motion.div>
        </Link>
      ) : caps.showPartnerRegister ? (
      <Link to="/partner-register" className="absolute bottom-28 right-8 md:right-24 lg:right-28 z-10 hidden md:block">
        <motion.div
          className="bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 rounded-[24px] p-3.5 px-6 shadow-[0_14px_32px_rgba(42,24,19,0.4)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.45)] hover:border-primary-500/50 flex items-center gap-4 transition-all duration-300 cursor-pointer select-none"
          animate={{ y: [-12, 12, -12], rotate: [-2.5, 2, -2.5] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
        >
          <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🍳</span>
          <div className="flex flex-col items-start leading-tight">
            <p className="text-white text-[15px] font-display font-bold tracking-wide">Đăng ký mở quán</p>
            <p className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">
              Hợp tác ngay<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">!</span>
            </p>
          </div>
        </motion.div>
      </Link>
      ) : null}

      {/* 3. Trà Sữa (Top Left) */}
      <motion.div
        className="absolute top-48 left-10 md:left-24 lg:left-32 bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 rounded-[24px] p-3 px-5 shadow-[0_12px_28px_rgba(42,24,19,0.35)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.4)] hover:border-primary-500/50 hidden lg:flex items-center gap-4 transition-all duration-300 cursor-pointer select-none z-10"
        animate={{ y: [-10, 10, -10], rotate: [-2, 1.5, -2] }}
        transition={{ duration: 6.0, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
        whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
      >
        <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🧋</span>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-white text-[15px] font-display font-bold tracking-wide">Trà Sữa</p>
          <p className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">
            35.000<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">đ</span>
          </p>
        </div>
      </motion.div>

      {/* 4. Sushi Thập Cẩm (Bottom Left) */}
      <motion.div
        className="absolute bottom-36 left-8 md:left-20 lg:left-24 bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 rounded-[24px] p-3 px-5 shadow-[0_12px_30px_rgba(42,24,19,0.35)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.4)] hover:border-primary-500/50 hidden md:flex items-center gap-4 transition-all duration-300 cursor-pointer select-none z-10"
        animate={{ y: [-14, 14, -14], rotate: [-3, 2.5, -3] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut", delay: 2.0 }}
        whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
      >
        <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🍣</span>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-white text-[15px] font-display font-bold tracking-wide">Sushi Thập Cẩm</p>
          <p className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">
            129.000<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">đ</span>
          </p>
        </div>
      </motion.div>

      {/* 5. Tài xế / đăng ký tài xế */}
      {caps.showDriverPanel ? (
        <Link to="/driver" className="absolute bottom-12 left-8 md:left-20 lg:left-24 z-10 hidden md:block">
        <motion.div
          className="bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 rounded-[24px] p-3.5 px-6 shadow-[0_14px_32px_rgba(42,24,19,0.4)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.45)] hover:border-primary-500/50 flex items-center gap-4 transition-all duration-300 cursor-pointer select-none"
          animate={{ y: [-10, 10, -10], rotate: [-2, 2.5, -2] }}
          transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
        >
          <span className="text-3xl filter drop-shadow-sm">🛵</span>
          <div className="flex flex-col items-start leading-tight">
            <p className="text-white text-[15px] font-display font-bold tracking-wide">Tài xế</p>
            <p className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">Nhận đơn giao</p>
          </div>
        </motion.div>
        </Link>
      ) : caps.showDriverRegister ? (
      <Link to="/driver-register" className="absolute bottom-12 left-8 md:left-20 lg:left-24 z-10 hidden md:block">
        <motion.div
          className="bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 rounded-[24px] p-3.5 px-6 shadow-[0_14px_32px_rgba(42,24,19,0.4)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.45)] hover:border-primary-500/50 flex items-center gap-4 transition-all duration-300 cursor-pointer select-none"
          animate={{ y: [-10, 10, -10], rotate: [-2, 2.5, -2] }}
          transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          whileHover={{ scale: 1.08, rotate: [-1, -3, 3, -1], y: 0 }}
        >
          <span className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">🛵</span>
          <div className="flex flex-col items-start leading-tight">
            <p className="text-white text-[15px] font-display font-bold tracking-wide">Đăng ký tài xế</p>
            <p className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">
              Thu nhập 90%<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">!</span>
            </p>
          </div>
        </motion.div>
      </Link>
      ) : null}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="antialiased"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 font-semibold text-sm mb-6 shadow-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Giao hàng nhanh trong 30 phút
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-black dark:text-white leading-tight tracking-tight mb-6 drop-shadow-sm dark:drop-shadow-2xl transition-colors duration-500">
            Ăn ngon mỗi ngày
            <br />
            <span className="text-primary-600 dark:text-gradient drop-shadow-sm transition-colors duration-500">cùng FoodServe</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-800 dark:text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed font-semibold drop-shadow-sm dark:drop-shadow-md tracking-wide transition-colors duration-500">
            Khám phá hàng ngàn nhà hàng, quán ăn ngon nhất. Đặt món dễ dàng, giao tận nơi siêu tốc.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="#restaurants"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg px-8 py-4 flex items-center gap-2 shadow-glow-lg"
            >
              🍽️ Đặt món ngay
            </motion.a>
            <motion.a
              href="#categories"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl text-lg font-semibold text-primary-600 border-2 border-primary-200 hover:bg-primary-50 transition-all shadow-sm"
            >
              📋 Xem menu
            </motion.a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 md:gap-12 mt-16"
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
            <div key={s.label} className="text-center p-4 rounded-2xl bg-white/50 dark:bg-transparent backdrop-blur-sm dark:glass border border-gray-100 dark:border-white/20 shadow-sm hover:shadow-md dark:hover:shadow-glow transition-all duration-500">
              <p className="text-2xl md:text-3xl font-display font-black text-primary-600 dark:text-white transition-colors duration-500">{s.num}</p>
              <p className="text-sm font-semibold text-gray-500 dark:text-white/80 transition-colors duration-500">{s.label}</p>
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
        <div className="w-6 h-10 border-2 border-primary-300 dark:border-white/30 rounded-full flex items-start justify-center p-1.5">
          <motion.div
            className="w-1.5 h-3 bg-primary-400 dark:bg-white/60 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}
