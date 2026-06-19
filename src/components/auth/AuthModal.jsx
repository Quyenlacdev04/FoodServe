import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMail, FiLock, FiUser, FiPhone, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi'
import { closeAuthModal } from '../../store/slices/uiSlice'
import { loginUser, registerUser, clearError, setAuth } from '../../store/slices/authSlice'
import API_BASE_URL from '../../config/api'
import toast from 'react-hot-toast'

// Bước quên mật khẩu
const FORGOT_STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  NEW_PASS: 'new_password',
  SUCCESS: 'success'
}

// Bước đăng ký với xác minh email
const REG_STEPS = {
  FORM: 'form',       // Nhập thông tin
  OTP: 'otp',         // Xác minh OTP
}

export default function AuthModal() {
  const dispatch = useDispatch()
  const { authModalOpen, authModalTab } = useSelector((s) => s.ui)
  const { loading, error } = useSelector((s) => s.auth)
  const [tab, setTab] = useState(authModalTab) // 'login' | 'register' | 'forgot'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  // Register OTP state
  const [regStep, setRegStep] = useState(REG_STEPS.FORM)
  const [regOtp, setRegOtp] = useState('')
  const [regOtpLoading, setRegOtpLoading] = useState(false)
  const [regOtpTimer, setRegOtpTimer] = useState(0)
  const [regDemoOtp, setRegDemoOtp] = useState('')

  // Forgot password state
  const [forgotStep, setForgotStep] = useState(FORGOT_STEPS.EMAIL)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpValue, setOtpValue] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [demoOtp, setDemoOtp] = useState('')

  // Bắt đầu timer đếm ngược OTP
  const startTimer = (setter, seconds = 300) => {
    setter(seconds)
    const interval = setInterval(() => {
      setter(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const formatTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ===== ĐĂNG KÝ: Bước 1 — Gửi OTP xác minh email =====
  const handleRegisterSendOtp = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Vui lòng điền đầy đủ thông tin')
    if (form.password.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự')
    setRegOtpLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Mã OTP đã gửi đến email!', { icon: '📧' })
        setRegStep(REG_STEPS.OTP)
        startTimer(setRegOtpTimer, 300)
        if (data.demo) setRegDemoOtp(data.demo)
      } else {
        toast.error(data.message || 'Lỗi gửi OTP')
      }
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setRegOtpLoading(false)
    }
  }

  // ===== ĐĂNG KÝ: Bước 2 — Xác minh OTP + Tạo tài khoản =====
  const handleRegisterVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    if (regOtp.length !== 6) return toast.error('OTP phải có 6 số')
    setRegOtpLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, otp: regOtp })
      })
      const data = await res.json()
      if (res.ok && data.token && data.user) {
        dispatch(setAuth({ token: data.token, user: data.user }))
        dispatch(closeAuthModal())
        toast.success('🎉 Đăng ký thành công! Chào mừng đến với FoodServe!', { duration: 4000 })
        resetRegFlow()
      } else {
        toast.error(data.message || 'OTP không chính xác')
      }
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setRegOtpLoading(false)
    }
  }

  const resetRegFlow = () => {
    setRegStep(REG_STEPS.FORM)
    setRegOtp('')
    setRegOtpTimer(0)
    setRegDemoOtp('')
    setForm({ name: '', email: '', phone: '', password: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearError())
    if (tab === 'login') {
      const resultAction = await dispatch(loginUser({ email: form.email, password: form.password }))
      if (resultAction.meta.requestStatus === 'fulfilled') {
        dispatch(closeAuthModal())
        toast.success('Đăng nhập thành công!', { icon: '👋' })
        setForm({ name: '', email: '', phone: '', password: '' })
      } else {
        toast.error(resultAction.payload || 'Có lỗi xảy ra', { icon: '❌' })
      }
    }
    // Register được handle bởi handleRegisterSendOtp
  }

  // Bước 1: Gửi OTP quên mật khẩu
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return toast.error('Vui lòng nhập email')
    setForgotLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('OTP đã được gửi!')
        setForgotStep(FORGOT_STEPS.OTP)
        startTimer(setOtpTimer, 300)
        if (data.demo) setDemoOtp(data.demo)
      } else {
        toast.error(data.message || 'Lỗi gửi OTP')
      }
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setForgotLoading(false)
    }
  }

  // Bước 2: Xác nhận OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otpValue.length !== 6) return toast.error('OTP phải có 6 số')
    setForgotLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: otpValue })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Xác nhận OTP thành công!')
        setResetToken(data.resetToken)
        setForgotStep(FORGOT_STEPS.NEW_PASS)
      } else {
        toast.error(data.message || 'OTP không chính xác')
      }
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setForgotLoading(false)
    }
  }

  // Bước 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự')
    if (newPassword !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp')
    setForgotLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, resetToken, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setForgotStep(FORGOT_STEPS.SUCCESS)
        setDemoOtp('')
      } else {
        toast.error(data.message || 'Lỗi đặt lại mật khẩu')
      }
    } catch {
      toast.error('Lỗi kết nối server')
    } finally {
      setForgotLoading(false)
    }
  }

  const resetForgotFlow = () => {
    setForgotStep(FORGOT_STEPS.EMAIL)
    setForgotEmail('')
    setOtpValue('')
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')
    setDemoOtp('')
    setOtpTimer(0)
  }

  const handleClose = () => {
    dispatch(closeAuthModal())
    resetForgotFlow()
    resetRegFlow()
    setTab('login')
  }

  // ===== RENDER FORGOT PASSWORD =====
  const renderForgot = () => {
    if (forgotStep === FORGOT_STEPS.SUCCESS) {
      return (
        <div className="p-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </motion.div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Đặt lại thành công!</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.
          </p>
          <button
            onClick={() => { resetForgotFlow(); setTab('login') }}
            className="w-full btn-primary py-3"
          >
            Đăng nhập ngay
          </button>
        </div>
      )
    }

    if (forgotStep === FORGOT_STEPS.NEW_PASS) {
      return (
        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setForgotStep(FORGOT_STEPS.OTP)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
              <FiArrowLeft className="dark:text-white" />
            </button>
            <div>
              <h3 className="font-bold dark:text-white">Mật khẩu mới</h3>
              <p className="text-xs text-gray-400">Đặt mật khẩu mới cho tài khoản</p>
            </div>
          </div>

          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input-search pl-11 pr-11"
              required minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-search pl-11"
              required
            />
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    newPassword.length >= i * 3
                      ? i <= 2 ? 'bg-red-400' : i === 3 ? 'bg-yellow-400' : 'bg-green-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {newPassword.length < 6 ? '⚠️ Quá ngắn' : newPassword.length < 9 ? '🟡 Trung bình' : '🟢 Mạnh'}
              </p>
            </div>
          )}

          <motion.button type="submit" disabled={forgotLoading} whileTap={{ scale: 0.97 }}
            className="w-full btn-primary py-3.5 disabled:opacity-50">
            {forgotLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Đang xử lý...
              </span>
            ) : '🔐 Đặt lại mật khẩu'}
          </motion.button>
        </form>
      )
    }

    if (forgotStep === FORGOT_STEPS.OTP) {
      return (
        <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => { setForgotStep(FORGOT_STEPS.EMAIL); setDemoOtp('') }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
              <FiArrowLeft className="dark:text-white" />
            </button>
            <div>
              <h3 className="font-bold dark:text-white">Nhập mã OTP</h3>
              <p className="text-xs text-gray-400">Gửi đến <strong>{forgotEmail}</strong></p>
            </div>
          </div>

          {/* Demo OTP banner */}
          {demoOtp && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                📧 Demo mode — Email chưa cấu hình
              </p>
              <p className="text-amber-900 dark:text-amber-300 font-mono font-bold text-lg tracking-widest mt-1">
                {demoOtp}
              </p>
              <button type="button" onClick={() => setOtpValue(demoOtp)}
                className="text-xs text-amber-600 underline mt-1">
                Điền tự động
              </button>
            </motion.div>
          )}

          {/* OTP Input */}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Nhập 6 số OTP"
              value={otpValue}
              onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input-search text-center text-2xl font-bold tracking-[0.5em] w-full"
              required
            />
          </div>

          {/* Timer */}
          <div className="text-center">
            {otpTimer > 0 ? (
              <p className="text-sm text-gray-400">
                ⏰ OTP hết hạn sau <span className="text-primary-500 font-bold">{formatTimer(otpTimer)}</span>
              </p>
            ) : (
              <button type="button" onClick={handleSendOtp}
                className="text-sm text-primary-500 hover:underline font-medium">
                Gửi lại OTP
              </button>
            )}
          </div>

          <motion.button type="submit" disabled={forgotLoading || otpValue.length !== 6} whileTap={{ scale: 0.97 }}
            className="w-full btn-primary py-3.5 disabled:opacity-50">
            {forgotLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Đang xác nhận...
              </span>
            ) : 'Xác nhận OTP'}
          </motion.button>
        </form>
      )
    }

    // Bước EMAIL
    return (
      <form onSubmit={handleSendOtp} className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button type="button" onClick={() => setTab('login')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
            <FiArrowLeft className="dark:text-white" />
          </button>
          <div>
            <h3 className="font-bold dark:text-white">Quên mật khẩu</h3>
            <p className="text-xs text-gray-400">Nhập email để nhận mã OTP</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 Mã OTP sẽ được gửi đến email của bạn và có hiệu lực trong <strong>5 phút</strong>
          </p>
        </div>

        <div className="relative">
          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            placeholder="Nhập email đăng ký"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            className="input-search pl-11"
            required
          />
        </div>

        <motion.button type="submit" disabled={forgotLoading} whileTap={{ scale: 0.97 }}
          className="w-full btn-primary py-3.5 disabled:opacity-50">
          {forgotLoading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Đang gửi OTP...
            </span>
          ) : '📨 Gửi mã OTP'}
        </motion.button>
      </form>
    )
  }

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          key="auth-modal"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, pointerEvents: 'auto' }}
          exit={{ opacity: 0, pointerEvents: 'none' }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-dark-200 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Nút X — đặt bên ngoài overflow-hidden, z cao */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <FiX size={18} />
            </button>

            {/* Header Gradient */}
            <div className="bg-gradient-primary p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="relative">
                <span className="text-4xl mb-2 block">🍽️</span>
                <h2 className="text-2xl font-display font-bold text-white">FoodServe</h2>
                <p className="text-white/80 text-sm mt-1">Ăn ngon mỗi ngày</p>
              </div>
            </div>

            {/* Tabs — chỉ hiện khi không ở forgot */}
            {tab !== 'forgot' && (
              <div className="flex border-b border-gray-100 dark:border-gray-800">
                {['login', 'register'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); dispatch(clearError()) }}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                      tab === t ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    {tab === t && (
                      <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Forgot password flow */}
            {tab === 'forgot' ? renderForgot() : (
              <form onSubmit={tab === 'register' ? handleRegisterSendOtp : handleSubmit} className="p-6 space-y-4">
                {/* Register OTP step */}
                {tab === 'register' && regStep === REG_STEPS.OTP ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <button type="button" onClick={() => { setRegStep(REG_STEPS.FORM); setRegDemoOtp('') }}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                        <FiArrowLeft className="dark:text-white" />
                      </button>
                      <div>
                        <h3 className="font-bold dark:text-white">Xác minh Email</h3>
                        <p className="text-xs text-gray-400">Nhập mã OTP gửi đến <strong>{form.email}</strong></p>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 text-center">
                      <p className="text-sm text-green-700 dark:text-green-400 font-medium">📧 Kiểm tra hộp thư của bạn</p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">Mã OTP đã được gửi đến <strong>{form.email}</strong></p>
                    </div>

                    {/* Demo OTP */}
                    {regDemoOtp && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-center">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">📧 Demo mode — Email chưa cấu hình</p>
                        <p className="text-amber-900 dark:text-amber-300 font-mono font-bold text-xl tracking-widest mt-1">{regDemoOtp}</p>
                        <button type="button" onClick={() => setRegOtp(regDemoOtp)}
                          className="text-xs text-amber-600 underline mt-1">Điền tự động</button>
                      </motion.div>
                    )}

                    {/* OTP Input */}
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Nhập 6 số OTP"
                      value={regOtp}
                      onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-search text-center text-2xl font-bold tracking-[0.5em] w-full"
                      required autoFocus
                    />

                    {/* Timer */}
                    <div className="text-center">
                      {regOtpTimer > 0 ? (
                        <p className="text-sm text-gray-400">
                          ⏰ OTP hết hạn sau <span className="text-primary-500 font-bold">{formatTimer(regOtpTimer)}</span>
                        </p>
                      ) : (
                        <button type="button" onClick={handleRegisterSendOtp}
                          className="text-sm text-primary-500 hover:underline font-medium">
                          Gửi lại OTP
                        </button>
                      )}
                    </div>

                    <motion.button type="button" onClick={handleRegisterVerifyOtp}
                      disabled={regOtpLoading || regOtp.length !== 6}
                      whileTap={{ scale: 0.97 }}
                      className="w-full btn-primary py-3.5 disabled:opacity-50">
                      {regOtpLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          Đang xác minh...
                        </span>
                      ) : '✅ Xác minh & Tạo tài khoản'}
                    </motion.button>
                  </>
                ) : (
                  <>
                    {tab === 'register' && (
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Họ và tên"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="input-search pl-11"
                          required
                        />
                      </div>
                    )}
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-search pl-11"
                        required
                      />
                    </div>
                    {tab === 'register' && (
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="Số điện thoại"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="input-search pl-11"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="input-search pl-11 pr-11"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>

                    {/* Thông báo xác minh email cho register */}
                    {tab === 'register' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">📧</span>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Sau khi nhấn đăng ký, chúng tôi sẽ gửi mã OTP đến email của bạn để xác minh.
                        </p>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={loading || regOtpLoading}
                      whileTap={{ scale: 0.97 }}
                      className="w-full btn-primary py-3.5 text-center disabled:opacity-50"
                    >
                      {(loading || regOtpLoading) ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          {tab === 'register' ? 'Đang gửi OTP...' : 'Đang xử lý...'}
                        </span>
                      ) : tab === 'login' ? 'Đăng nhập' : '📨 Gửi mã xác minh'}
                    </motion.button>

                    {tab === 'login' && (
                      <p className="text-center text-sm text-gray-400">
                        <button
                          type="button"
                          onClick={() => { setTab('forgot'); resetForgotFlow() }}
                          className="text-primary-500 hover:underline font-medium"
                        >
                          Quên mật khẩu?
                        </button>
                      </p>
                    )}
                  </>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
