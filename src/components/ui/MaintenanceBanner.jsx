import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MaintenanceBanner() {
  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setIsMaintenance(!!data.maintenanceMode)
        }
      } catch (err) {
        // Ignore fetch errors
      }
    }

    checkMaintenance()
    // Kiểm tra lại mỗi 30 giây
    const interval = setInterval(checkMaintenance, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {isMaintenance && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <motion.span 
              className="text-2xl"
              animate={{ rotate: [0, 20, -20, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🔧
            </motion.span>
            <div className="text-center">
              <p className="font-bold text-sm md:text-base tracking-wide">
                Hệ thống đang bảo trì
              </p>
              <p className="text-[11px] md:text-xs text-white/80 font-medium">
                Bạn không thể đặt đơn hàng mới trong thời gian này. Vui lòng quay lại sau!
              </p>
            </div>
            <motion.span 
              className="text-2xl"
              animate={{ rotate: [0, -20, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              ⚠️
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
