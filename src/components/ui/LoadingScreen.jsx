import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050510] transition-colors duration-500"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Aurora background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full -top-40 -left-40"
          style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full -bottom-20 -right-20"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.08) 0%, transparent 70%)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, rgba(255,146,43,0.06) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', damping: 15 }}
        className="flex flex-col items-center relative z-10"
      >
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-[28px]"
            style={{ 
              background: 'linear-gradient(135deg, #ff6b00, #d946ef, #ff922b)',
              filter: 'blur(20px)',
              opacity: 0.4,
            }}
            animate={{ 
              scale: [1, 1.15, 1], 
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Logo box */}
          <motion.div
            className="relative w-24 h-24 rounded-[28px] flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ff6b00, #ff922b)',
              boxShadow: '0 8px 32px rgba(255,107,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Inner shine effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
              }}
            />
            <span className="text-5xl relative z-10 drop-shadow-lg">🍽️</span>
          </motion.div>

          {/* Orbiting dot */}
          <motion.div
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #ff6b00, #ffb347)',
              boxShadow: '0 0 12px rgba(255,107,0,0.6)',
            }}
            animate={{
              rotate: 360,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transformOrigin: '-24px center',
            }}
          />
        </div>

        {/* Brand name */}
        <motion.h1
          className="text-4xl font-display font-black mb-2 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ff6b00, #ff922b, #ffb347)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          FoodServe
        </motion.h1>

        <motion.p
          className="text-white/40 text-sm font-medium tracking-wider uppercase"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Ăn ngon mỗi ngày
        </motion.p>

        {/* Loading indicator — morphing line */}
        <motion.div
          className="mt-10 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="w-48 h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #ff6b00, #d946ef, transparent)',
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
