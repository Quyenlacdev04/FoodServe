import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { openAuthModal } from '../store/slices/uiSlice'
import { updateUser } from '../store/slices/authSlice'
import AuthModal from '../components/auth/AuthModal'
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiShoppingBag, 
  FiDollarSign, FiFileText, FiCheckCircle, FiChevronLeft, 
  FiChevronRight, FiCheck, FiAward, FiSmile, FiTrendingUp 
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const businessTypes = [
  'Quán ăn',
  'Nhà hàng',
  'Quán cà phê',
  'Fastfood',
  'Quán ăn vặt',
  'Tiệm bánh',
  'Quán trà sữa',
  'Buffet',
  'Khác'
]

const cuisineOptions = [
  'Món Việt',
  'Món Á',
  'Món Âu',
  'Món Nhật',
  'Món Hàn',
  'Món Thái',
  'Đồ uống',
  'Tráng miệng',
  'Ăn chay',
  'Hải sản'
]

const priceRanges = [
  '< 50.000đ',
  '50.000đ - 100.000đ',
  '100.000đ - 200.000đ',
  '200.000đ - 500.000đ',
  '> 500.000đ'
]

// Floating food card component styled exactly like the user's image
function FloatingFoodCard({ emoji, title, price, delay = 0, duration = 6, yRange = [-8, 8, -8], rotateRange = [-1, 2, -1], className = "" }) {
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
        <span className="text-[#FF7A00] font-sans font-semibold text-[14px] mt-0.5">
          {price}<span className="underline decoration-[1.5px] underline-offset-[2.5px] ml-0.5 font-bold">đ</span>
        </span>
      </div>
    </motion.div>
  )
}

const registrationStatusLabels = {
  pending: 'Đang chờ duyệt',
  reviewing: 'Đang xem xét',
  approved: 'Đã phê duyệt',
  rejected: 'Đã từ chối',
}

export default function PartnerRegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [registrationStatus, setRegistrationStatus] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    businessType: '',
    cuisineTypes: [],
    averagePrice: '',
    businessLicense: '',
    foodSafetyCert: '',
    description: '',
    specialDishes: ''
  })

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setCheckingStatus(false)
      setRegistrationStatus({ canRegister: false, reason: 'not_logged_in' })
      return
    }

    setFormData((prev) => ({
      ...prev,
      ownerName: prev.ownerName || user.name || '',
      ownerEmail: user.email || '',
      ownerPhone: prev.ownerPhone || user.phone || '',
    }))

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/partner/register/status?userId=${user._id}`
        )
        const data = await res.json()
        if (res.ok) {
          setRegistrationStatus(data)
          if (!data.canRegister && data.reason === 'already_merchant' && user.role !== 'merchant') {
            dispatch(updateUser({ role: 'merchant' }))
          }
        }
      } catch (error) {
        console.error('Status check error:', error)
      } finally {
        setCheckingStatus(false)
      }
    }

    fetchStatus()
  }, [isAuthenticated, user?._id, user?.email, user?.name, user?.phone, dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'ownerEmail') return
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCuisineToggle = (cuisine) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.ownerName.trim()) {
        toast.error('Vui lòng nhập họ và tên người đại diện!')
        return false
      }
      if (!formData.ownerEmail.trim()) {
        toast.error('Vui lòng nhập email người đại diện!')
        return false
      }
      if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
        toast.error('Email người đại diện không đúng định dạng!')
        return false
      }
      if (!formData.ownerPhone.trim()) {
        toast.error('Vui lòng nhập số điện thoại người đại diện!')
        return false
      }
      if (!/^\d{9,11}$/.test(formData.ownerPhone.replace(/\D/g, ''))) {
        toast.error('Số điện thoại không hợp lệ!')
        return false
      }
    } else if (step === 2) {
      if (!formData.restaurantName.trim()) {
        toast.error('Vui lòng nhập tên nhà hàng!')
        return false
      }
      if (!formData.restaurantAddress.trim()) {
        toast.error('Vui lòng nhập địa chỉ nhà hàng!')
        return false
      }
      if (!formData.restaurantPhone.trim()) {
        toast.error('Vui lòng nhập số điện thoại nhà hàng!')
        return false
      }
      if (!formData.businessType) {
        toast.error('Vui lòng chọn loại hình kinh doanh!')
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

    if (!isAuthenticated || !user?._id) {
      toast.error('Vui lòng đăng nhập để đăng ký đối tác!')
      dispatch(openAuthModal('login'))
      return
    }

    if (registrationStatus && !registrationStatus.canRegister) {
      return toast.error(registrationStatus.message || 'Tài khoản này đã đăng ký đối tác')
    }
    
    // Step 3 Validation
    if (formData.cuisineTypes.length === 0) {
      return toast.error('Vui lòng chọn ít nhất một loại món ăn!')
    }
    if (!formData.averagePrice) {
      return toast.error('Vui lòng chọn mức giá trung bình!')
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('http://localhost:5000/api/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user._id })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(true)
        setRegistrationStatus({ canRegister: false, reason: 'already_registered', request: data.request })
        toast.success('🎉 ' + data.message, { duration: 5000 })
      } else {
        if (res.status === 409 && data.request) {
          setRegistrationStatus({
            canRegister: false,
            reason: data.reason || 'already_registered',
            message: data.message,
            request: data.request,
          })
        }
        toast.error(data.message || 'Có lỗi xảy ra!')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Lỗi kết nối! Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Đang kiểm tra tài khoản...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-yellow-50 dark:from-[#0a0a14] dark:via-[#11111b] dark:to-[#1e1e2e] flex items-center justify-center px-4 py-20">
        <AuthModal />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-dark-100 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-white/10"
        >
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-display font-bold dark:text-white mb-3">Đăng nhập để đăng ký đối tác</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Mỗi tài khoản FoodServe chỉ được đăng ký đối tác nhà hàng <strong>một lần duy nhất</strong>. Vui lòng đăng nhập bằng tài khoản của bạn trước khi gửi hồ sơ.
          </p>
          <button
            type="button"
            onClick={() => dispatch(openAuthModal('login'))}
            className="w-full py-3 rounded-2xl bg-gradient-primary text-white font-bold shadow-glow hover:opacity-90 transition-opacity mb-3"
          >
            Đăng nhập ngay
          </button>
          <Link to="/" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
            ← Quay lại trang chủ
          </Link>
        </motion.div>
      </div>
    )
  }

  if (registrationStatus && !registrationStatus.canRegister && !success) {
    const req = registrationStatus.request
    const isMerchant = registrationStatus.reason === 'already_merchant'

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-yellow-50 dark:from-[#0a0a14] dark:via-[#11111b] dark:to-[#1e1e2e] flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full bg-white dark:bg-dark-100 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-white/10"
        >
          <div className="text-5xl mb-4 text-center">{isMerchant ? '✅' : '📋'}</div>
          <h2 className="text-2xl font-display font-bold dark:text-white mb-3 text-center">
            {isMerchant ? 'Bạn đã là đối tác' : 'Đã đăng ký đối tác'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 text-sm">
            {registrationStatus.message ||
              'Tài khoản này đã có hồ sơ đối tác. Mỗi tài khoản chỉ được đăng ký một lần.'}
          </p>
          {req && (
            <div className="bg-gray-50 dark:bg-dark-200/50 rounded-2xl p-4 mb-6 text-sm space-y-2">
              <p><span className="text-gray-500">Nhà hàng:</span> <strong className="dark:text-white">{req.restaurantName}</strong></p>
              <p>
                <span className="text-gray-500">Trạng thái:</span>{' '}
                <strong className="dark:text-white">{registrationStatusLabels[req.status] || req.status}</strong>
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {isMerchant && (
              <button
                type="button"
                onClick={() => navigate('/restaurant-manage')}
                className="w-full py-3 rounded-2xl bg-gradient-primary text-white font-bold shadow-glow hover:opacity-90 transition-opacity"
              >
                Vào trang quản lý nhà hàng
              </button>
            )}
            <Link
              to="/"
              className="w-full py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-center font-semibold text-gray-700 dark:text-gray-200 hover:border-primary-500 transition-colors"
            >
              Quay lại trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    )
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
            Đăng ký thành công!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm md:text-base leading-relaxed">
            Cảm ơn bạn đã đăng ký trở thành đối tác của <strong className="text-primary-500">FoodServe</strong>. 
            Chúng tôi sẽ xem xét hồ sơ và liên hệ tư vấn trong vòng <strong>24h làm việc</strong>.
          </p>
          
          <div className="bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100/50 dark:border-primary-900/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-primary-800 dark:text-primary-300 font-medium">
              📧 Thư xác nhận đăng ký đang gửi đến: <br />
              <strong className="text-gray-800 dark:text-white mt-1 block">{formData.ownerEmail}</strong>
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
      <AuthModal />
      
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
            🤝 Chương trình đối tác nhà hàng
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black text-gray-800 dark:text-white leading-[1.1] mb-4">
            Bùng nổ doanh số cùng <span className="text-gradient">FoodServe</span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            Hợp tác cùng FoodServe để số hóa thực đơn, tiếp cận hàng triệu thực khách mỗi ngày và tối ưu hóa hệ thống giao hàng tốc độ cao.
          </p>
          <p className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-medium">
            Đăng nhập với tài khoản <strong>{user?.email}</strong> — mỗi tài khoản chỉ đăng ký đối tác một lần.
          </p>
        </motion.div>

        {/* Bố cục Grid 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: Brand Showcase & Bộ thẻ lơ lửng bất đồng bộ */}
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
                  src="/restaurant_partner_hero.png" 
                  alt="FoodServe Restaurant Partner Hero" 
                  className="w-full h-full object-cover rounded-[24px]"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                {/* Top Left Badge */}
                <span className="absolute top-4 left-4 bg-gradient-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-white/20 uppercase tracking-wider flex items-center gap-1 z-20">
                  ⭐ Đối Tác Vàng
                </span>

                {/* Bottom Center Capsule */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white font-display font-semibold text-xs py-2.5 px-4 rounded-full flex items-center gap-2 border border-white/10 shadow-md whitespace-nowrap z-20">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Doanh thu tăng vọt <strong className="text-primary-400">2.5x</strong>
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
                    {step === 1 ? 'Thông tin người đại diện' : step === 2 ? 'Thông tin nhà hàng' : 'Chi tiết kinh doanh'}
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
                        <FiUser className="text-primary-500" /> Đại diện doanh nghiệp/quán ăn
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Họ và tên người đại diện <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                              type="text"
                              name="ownerName"
                              value={formData.ownerName}
                              onChange={handleChange}
                              className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors"
                              placeholder="Nguyễn Văn A"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Địa chỉ Email <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                              type="email"
                              name="ownerEmail"
                              value={formData.ownerEmail}
                              readOnly
                              className="input-search w-full pl-12 rounded-2xl bg-gray-100/80 dark:bg-dark-200/80 cursor-not-allowed opacity-90"
                              placeholder="ongchuquan@example.com"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Số điện thoại cá nhân <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                              type="tel"
                              name="ownerPhone"
                              value={formData.ownerPhone}
                              onChange={handleChange}
                              className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors"
                              placeholder="0987654321"
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
                        <FiShoppingBag className="text-primary-500" /> Thông tin cửa hàng / quán ăn
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Tên cửa hàng / thương hiệu <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                              type="text"
                              name="restaurantName"
                              value={formData.restaurantName}
                              onChange={handleChange}
                              className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors"
                              placeholder="Bánh Mì Kẹp Phố Cổ"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Địa chỉ hoạt động kinh doanh <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                            <input
                              type="text"
                              name="restaurantAddress"
                              value={formData.restaurantAddress}
                              onChange={handleChange}
                              className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors"
                              placeholder="12 Hàng Bông, Hoàn Kiếm, Hà Nội"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              SĐT liên hệ cửa hàng <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                              <input
                                type="tel"
                                name="restaurantPhone"
                                value={formData.restaurantPhone}
                                onChange={handleChange}
                                className="input-search w-full pl-12 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors"
                                placeholder="0243999888"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Loại hình kinh doanh <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="businessType"
                              value={formData.businessType}
                              onChange={handleChange}
                              className="input-search w-full pl-4 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors bg-white dark:bg-dark-200"
                              required
                            >
                              <option value="">-- Chọn loại hình --</option>
                              {businessTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
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
                        <FiDollarSign className="text-primary-500" /> Thực đơn & Giấy tờ kinh doanh
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Phong cách ẩm thực nổi bật (Chọn nhiều) <span className="text-red-500">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-dark-200 rounded-2xl border border-gray-200/50 dark:border-white/5">
                            {cuisineOptions.map(cuisine => {
                              const isSelected = formData.cuisineTypes.includes(cuisine)
                              return (
                                <button
                                  key={cuisine}
                                  type="button"
                                  onClick={() => handleCuisineToggle(cuisine)}
                                  className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                                    isSelected
                                      ? 'bg-gradient-primary text-white shadow-glow shadow-primary-500/20 scale-105'
                                      : 'bg-white dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5'
                                  }`}
                                >
                                  {cuisine}
                                  {isSelected && <FiCheck className="text-sm" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Khoảng giá trung bình <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="averagePrice"
                              value={formData.averagePrice}
                              onChange={handleChange}
                              className="input-search w-full pl-4 rounded-2xl hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-colors bg-white dark:bg-dark-200"
                              required
                            >
                              <option value="">-- Chọn khoảng giá --</option>
                              {priceRanges.map(range => (
                                <option key={range} value={range}>{range}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Các món đặc sản (bán chạy nhất)
                            </label>
                            <input
                              type="text"
                              name="specialDishes"
                              value={formData.specialDishes}
                              onChange={handleChange}
                              className="input-search w-full rounded-2xl hover:border-primary-500/40"
                              placeholder="Bún chả đặc biệt, Nem cua bể..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Số giấy phép kinh doanh (Không bắt buộc)
                            </label>
                            <input
                              type="text"
                              name="businessLicense"
                              value={formData.businessLicense}
                              onChange={handleChange}
                              className="input-search w-full rounded-2xl hover:border-primary-500/40"
                              placeholder="Mã số đăng ký doanh nghiệp"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Mã chứng nhận ATTP (Không bắt buộc)
                            </label>
                            <input
                              type="text"
                              name="foodSafetyCert"
                              value={formData.foodSafetyCert}
                              onChange={handleChange}
                              className="input-search w-full rounded-2xl hover:border-primary-500/40"
                              placeholder="Chứng nhận An toàn thực phẩm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Mô tả đôi nét về quán
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input-search w-full rounded-2xl min-h-[90px] resize-none py-3 hover:border-primary-500/40"
                            placeholder="Quán phục vụ món phở gia truyền từ năm 1989..."
                          />
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
                          Đang xử lý hồ sơ...
                        </>
                      ) : (
                        <>
                          🚀 Gửi hồ sơ đối tác <FiCheck className="text-lg" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 leading-normal">
                  Bằng cách hoàn tất gửi biểu mẫu đăng ký, bạn xác nhận đồng ý với <a href="#" className="text-primary-500 hover:underline">Điều khoản dịch vụ đối tác</a> và <a href="#" className="text-primary-500 hover:underline">Chính sách bảo mật dữ liệu</a> của FoodServe.
                </p>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  )
}
