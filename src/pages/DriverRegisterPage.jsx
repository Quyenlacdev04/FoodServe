import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiTruck, 
  FiDollarSign, FiFileText, FiCheckCircle, FiChevronLeft, 
  FiChevronRight, FiCheck, FiAward, FiShield, FiCpu, FiCreditCard
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const vehicleTypes = [
  'Xe máy (Xăng)',
  'Xe máy điện',
  'Xe bán tải / Ô tô',
  'Khác'
]

const operationAreas = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Khác'
]

// Floating status card component matching the existing layout style
function FloatingDriverCard({ emoji, title, subtitle, delay = 0, duration = 6, yRange = [-8, 8, -8], rotateRange = [-1, 2, -1], className = "" }) {
  return (
    <motion.div
      initial={{ y: 0, rotate: 0 }}
      animate={{
        y: yRange,
        rotate: rotateRange,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      whileHover={{
        scale: 1.08,
        rotate: [-1, -3, 3, -1],
        y: 0,
        transition: { duration: 0.3 },
      }}
      className={`flex items-center gap-4 bg-gradient-to-br from-[#2D1B18]/95 to-[#1D0F0C]/95 border border-[#4A3229]/60 dark:border-[#4A3229]/80 rounded-[24px] p-3.5 px-6 shadow-[0_12px_32px_rgba(42,24,19,0.35)] hover:shadow-[0_20px_45px_rgba(255,107,0,0.4)] hover:border-primary-500/50 transition-all cursor-pointer select-none ${className}`}
    >
      <div className="text-3xl filter drop-shadow-sm transform hover:scale-110 transition-transform duration-300">
        {emoji}
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-white font-display font-bold text-[15px] tracking-wide">
          {title}
        </span>
        <span className="text-[#FF7A00] font-sans font-semibold text-[13px] mt-0.5">
          {subtitle}
        </span>
      </div>
    </motion.div>
  )
}

export default function DriverRegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idCard: '',
    vehicleType: '',
    licensePlate: '',
    driverLicense: '',
    operationArea: '',
    experience: '',
    referrer: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error('Vui lòng nhập họ và tên của bạn!')
        return false
      }
      if (!formData.email.trim()) {
        toast.error('Vui lòng nhập email liên hệ!')
        return false
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error('Email không đúng định dạng!')
        return false
      }
      if (!formData.phone.trim()) {
        toast.error('Vui lòng nhập số điện thoại!')
        return false
      }
      if (!/^\d{9,11}$/.test(formData.phone.replace(/\D/g, ''))) {
        toast.error('Số điện thoại không hợp lệ!')
        return false
      }
      if (!formData.idCard.trim()) {
        toast.error('Vui lòng nhập số căn cước công dân (CCCD)!')
        return false
      }
      if (!/^\d{9,12}$/.test(formData.idCard.replace(/\D/g, ''))) {
        toast.error('Số căn cước công dân không hợp lệ (9 hoặc 12 số)!')
        return false
      }
    } else if (step === 2) {
      if (!formData.vehicleType) {
        toast.error('Vui lòng chọn loại phương tiện!')
        return false
      }
      if (!formData.licensePlate.trim()) {
        toast.error('Vui lòng nhập biển số xe!')
        return false
      }
      if (!formData.driverLicense.trim()) {
        toast.error('Vui lòng nhập số giấy phép lái xe!')
        return false
      }
      if (!formData.operationArea) {
        toast.error('Vui lòng chọn khu vực hoạt động mong muốn!')
        return false
      }
    }
    return true
  }

  const handleNextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all steps just in case
    if (!validateStep()) return
    
    setLoading(true)
    
    try {
      const res = await fetch('http://localhost:5000/api/partner/driver/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(true)
        toast.success('🎉 Đăng ký tài xế thành công!', { duration: 5000 })
      } else {
        toast.error(data.message || 'Có lỗi xảy ra khi nộp hồ sơ!')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Lỗi kết nối mạng! Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-yellow-50 dark:from-[#0a0a14] dark:via-[#11111b] dark:to-[#1e1e2e] flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Glow BG blobs */}
        <div className="absolute w-[400px] h-[400px] bg-green-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000" />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white/80 dark:bg-dark-100/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20 dark:border-white/5 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
            className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow shadow-green-500/20"
          >
            <FiCheckCircle className="text-5xl text-green-500" />
          </motion.div>
          
          <h2 className="text-3xl font-display font-black text-gray-800 dark:text-white mb-3">
            Hồ sơ đã được gửi!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm md:text-base leading-relaxed">
            Hệ thống đang kiểm tra hồ sơ đăng ký tài xế của bạn. Chúng tôi sẽ kiểm tra thông tin đối chiếu và liên hệ hỗ trợ bạn kích hoạt tài khoản trong vòng <strong>24h làm việc</strong>.
          </p>
          
          <div className="bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100/50 dark:border-primary-900/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-primary-800 dark:text-primary-300 font-medium">
              📧 Email phản hồi sẽ gửi về: <br />
              <strong className="text-gray-800 dark:text-white mt-1 block">{formData.email}</strong>
            </p>
          </div>
          
          <Link
            to="/"
            className="btn-primary w-full py-3.5 text-center inline-block text-base font-bold tracking-wide"
          >
            Về trang chủ
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/40 via-orange-50/20 to-yellow-50/30 dark:from-[#0a0a14] dark:via-[#11111b] dark:to-[#0a0a14] py-12 px-4 relative overflow-hidden transition-colors duration-500">
      
      {/* Background soft glowing blur orbs */}
      <div className="absolute top-1/4 left-1/10 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/10 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[130px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/5 rounded-full blur-[150px] -z-10" />

      {/* Top Header Navigation */}
      <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white transform -rotate-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <span className="text-2xl font-display font-black text-gradient tracking-tight">
            FoodServe
          </span>
        </Link>

        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-dark-100/70 border border-gray-200/50 dark:border-white/10 hover:border-primary-500 dark:hover:border-primary-500 text-gray-700 dark:text-gray-200 hover:text-primary-500 transition-all font-medium text-sm shadow-sm hover:shadow"
        >
          <FiChevronLeft className="text-base" /> Quay lại trang chủ
        </Link>
      </header>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Intro */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center md:text-left mb-12 max-w-3xl"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-500 text-xs font-bold uppercase tracking-wider mb-4 border border-primary-200/30 dark:border-primary-900/30">
            🛵 Chương trình đối tác tài xế công nghệ
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black text-gray-800 dark:text-white leading-[1.1] mb-4">
            Đồng hành giao hàng cùng <span className="text-gradient">FoodServe</span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            Trở thành đối tác giao hàng của FoodServe. Thu nhập hấp dẫn, thời gian linh động, nhận 90% cước phí giao và nhiều phúc lợi hỗ trợ tài xế.
          </p>
        </motion.div>

        {/* Bố cục Grid 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: Brand Showcase */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Lơ lửng Showcase Area */}
            <div className="relative w-full h-[450px] md:h-[540px] lg:h-[580px] bg-gradient-to-b from-gray-100/50 to-gray-200/20 dark:from-dark-100/30 dark:to-dark-200/10 rounded-[32px] border border-gray-200/30 dark:border-white/5 overflow-hidden flex items-center justify-center p-6 shadow-inner">
              
              {/* Inner glowing core */}
              <div className="absolute w-64 h-64 rounded-full bg-primary-500/10 dark:bg-primary-500/5 blur-3xl animate-pulse" />
              
              {/* Floating Framed generated image */}
              <motion.div
                animate={{
                  y: [-12, 12, -12],
                  rotate: [-1.5, 1.5, -1.5]
                }}
                transition={{
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full h-full relative overflow-hidden rounded-[28px] border-4 border-white dark:border-dark-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white dark:bg-dark-100 z-10"
              >
                <img 
                  src="/driver_partner_hero.png" 
                  alt="FoodServe Driver Partner Hero" 
                  className="w-full h-full object-cover rounded-[24px]"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                {/* Top Left Badge */}
                <span className="absolute top-4 left-4 bg-gradient-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-white/20 uppercase tracking-wider flex items-center gap-1 z-20">
                  🛵 Chiến Binh Xanh
                </span>

                {/* Bottom Center Capsule */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white font-display font-semibold text-xs py-2.5 px-4 rounded-full flex items-center gap-2 border border-white/10 shadow-md whitespace-nowrap z-20">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Nhận ngay cước <strong className="text-primary-400">90% ví</strong>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CỘT PHẢI: Form Đăng ký Glassmorphic Multi-step */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-[32px] border border-gray-200/30 dark:border-white/5 p-6 md:p-8 shadow-cinema relative overflow-hidden"
            >
              {/* Form header step indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-primary-500 uppercase tracking-wider">
                    Bước {step} trên 3
                  </span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {step === 1 ? 'Thông tin cá nhân' : step === 2 ? 'Phương tiện & Giấy phép' : 'Hoàn tất hồ sơ'}
                  </span>
                </div>
                
                {/* Visual steps progress bar */}
                <div className="flex gap-2">
                  <div className={`h-2 rounded-full flex-1 transition-all duration-500 ${step >= 1 ? 'bg-gradient-primary' : 'bg-gray-200 dark:bg-dark-200'}`} />
                  <div className={`h-2 rounded-full flex-1 transition-all duration-500 ${step >= 2 ? 'bg-gradient-primary' : 'bg-gray-200 dark:bg-dark-200'}`} />
                  <div className={`h-2 rounded-full flex-1 transition-all duration-500 ${step >= 3 ? 'bg-gradient-primary' : 'bg-gray-200 dark:bg-dark-200'}`} />
                </div>
              </div>

              {/* Form Container */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
                        <FiUser className="text-primary-500" /> Thông tin cá nhân cơ bản
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Họ và tên tài xế <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors"
                              placeholder="Nguyễn Văn B"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Địa chỉ Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors text-sm"
                                placeholder="taixe@example.com"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Số điện thoại di động <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors text-sm"
                                placeholder="0901234567"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Số Căn cước công dân (CCCD) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                              type="text"
                              name="idCard"
                              value={formData.idCard}
                              onChange={handleChange}
                              className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors"
                              placeholder="Nhập 12 số căn cước của bạn"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
                        <FiTruck className="text-primary-500" /> Phương tiện & Giấy phép lái xe
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Loại phương tiện <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="vehicleType"
                              value={formData.vehicleType}
                              onChange={handleChange}
                              className="input-search w-full pl-4 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors bg-white dark:bg-dark-200 font-semibold cursor-pointer"
                              required
                            >
                              <option value="">-- Chọn loại phương tiện --</option>
                              {vehicleTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Biển số xe (VD: 29A-123.45) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="licensePlate"
                              value={formData.licensePlate}
                              onChange={handleChange}
                              className="input-search w-full rounded-2xl hover:border-primary-500/40"
                              placeholder="Nhập biển số đăng ký xe"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Số Giấy phép lái xe (GPLX) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="driverLicense"
                              value={formData.driverLicense}
                              onChange={handleChange}
                              className="input-search w-full rounded-2xl hover:border-primary-500/40"
                              placeholder="Số bằng lái A1/A2/B2..."
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Khu vực đăng ký chạy xe <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="operationArea"
                              value={formData.operationArea}
                              onChange={handleChange}
                              className="input-search w-full pl-4 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors bg-white dark:bg-dark-200 font-semibold cursor-pointer"
                              required
                            >
                              <option value="">-- Chọn thành phố --</option>
                              {operationAreas.map(area => (
                                <option key={area} value={area}>{area}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
                        <FiShield className="text-primary-500" /> Xác nhận & Hoàn tất hồ sơ
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Kinh nghiệm chạy xe của bạn (Nếu có)
                          </label>
                          <textarea
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            className="input-search w-full rounded-2xl min-h-[100px] resize-none py-3 hover:border-primary-500/40 text-sm"
                            placeholder="Mô tả sơ lược về kinh nghiệm giao hàng hoặc lái xe công nghệ của bạn..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Mã số / Số điện thoại người giới thiệu (Không bắt buộc)
                          </label>
                          <input
                            type="text"
                            name="referrer"
                            value={formData.referrer}
                            onChange={handleChange}
                            className="input-search w-full rounded-2xl hover:border-primary-500/40"
                            placeholder="Nhập mã giới thiệu nếu được giới thiệu"
                          />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-dark-200 rounded-2xl border border-gray-200/50 dark:border-white/5 space-y-2.5">
                          <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">📜 Cam kết tài xế FoodServe:</h4>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                            <li>Tuyệt đối tuân thủ luật giao thông đường bộ Việt Nam.</li>
                            <li>Bảo đảm đồ ăn luôn ở trạng thái tốt nhất đến tay khách hàng.</li>
                            <li>Có thái độ lịch sự, văn minh với khách hàng và chủ cửa hàng đối tác.</li>
                            <li>Đảm bảo các giấy tờ cung cấp là hoàn toàn chính xác.</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Buttons navigation block */}
                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-200 font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <FiChevronLeft className="text-lg" /> Quay lại
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 btn-primary py-3.5 rounded-2xl text-base font-bold tracking-wide flex items-center justify-center gap-1.5"
                    >
                      Tiếp theo <FiChevronRight className="text-lg" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-primary py-3.5 rounded-2xl text-base font-bold tracking-wide flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Đang nộp hồ sơ...
                        </>
                      ) : (
                        <>
                          🚀 Nộp hồ sơ chạy xe <FiCheck className="text-lg" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 leading-normal font-medium">
                  Bằng cách hoàn tất gửi biểu mẫu đăng ký, bạn xác nhận đồng ý với <a href="#" className="text-primary-500 hover:underline">Thỏa thuận hợp tác tài xế</a> và <a href="#" className="text-primary-500 hover:underline">Quy tắc ứng xử tài xế</a> của FoodServe.
                </p>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  )
}
