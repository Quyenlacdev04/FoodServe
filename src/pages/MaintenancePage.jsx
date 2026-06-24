import { API_BASE_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSliders, FiPhone, FiMail, FiAlertTriangle, FiLock } from 'react-icons/fi'

export default function MaintenancePage() {
  const [settings, setSettings] = useState({
    supportPhone: '19001000',
    supportEmail: 'support@foodserve.vn'
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`)
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (err) {
        // Fallback to default settings
      }
    }
    fetchSettings()
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 dark:from-dark-300 dark:via-dark-200 dark:to-dark-300 flex items-center justify-center p-4 font-sans text-gray-800 dark:text-gray-200 transition-colors duration-500">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Animated Icons Area */}
        <div className="relative flex justify-center items-center h-40">
          {/* Pulsing Glow Background */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute w-32 h-32 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 rounded-full filter blur-xl"
          />

          {/* Rotating Main Gear */}
          <motion.span 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            className="text-8xl filter drop-shadow-md select-none absolute"
          >
            ⚙️
          </motion.span>


        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-500/20">
              System Maintenance
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-display font-black tracking-tight text-gray-950 dark:text-white"
          >
            Hệ Thống Đang Bảo Trì & Nâng Cấp
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto font-medium"
          >
            FoodServe đang thực hiện bảo trì định kỳ nhằm nâng cấp hiệu năng hệ thống và mang lại trải nghiệm dịch vụ tốt hơn. Rất tiếc vì sự gián đoạn này.
          </motion.p>
        </div>

        {/* Dynamic Support/Contact Information */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-dark-200 p-6 rounded-3xl shadow-card border border-gray-100 dark:border-white/5 max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 transition-colors duration-500"
        >
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-dark-100 border border-gray-100/50 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-lg">
              <FiPhone />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Hotline</p>
              <a href={`tel:${settings.supportPhone}`} className="text-sm font-black text-gray-800 dark:text-gray-200 hover:text-amber-500 transition-colors truncate block">
                {settings.supportPhone}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-dark-100 border border-gray-100/50 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 text-lg">
              <FiMail />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Email hỗ trợ</p>
              <a href={`mailto:${settings.supportEmail}`} className="text-sm font-black text-gray-800 dark:text-gray-200 hover:text-orange-500 transition-colors truncate block">
                {settings.supportEmail}
              </a>
            </div>
          </div>
        </motion.div>

        {/* Footer Area with Subtle Portal Entry */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="pt-4 flex flex-col items-center gap-2"
        >
          <p className="text-xs text-gray-400 font-medium">
            © 2026 FoodServe. All rights reserved.
          </p>
          
          {/* Subtle Admin Entrance */}
          <a 
            href="/admin" 
            className="mt-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 bg-gray-100 dark:bg-dark-250 px-2.5 py-1 rounded-md border border-gray-200/40 dark:border-white/5 transition-all"
          >
            <FiLock className="text-[8px]" /> Admin Portal
          </a>
        </motion.div>

      </div>
    </div>
  )
}
