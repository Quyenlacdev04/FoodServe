import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMail, FiLock, FiUser, FiPhone } from 'react-icons/fi'
import { closeAuthModal } from '../../store/slices/uiSlice'
import { loginUser, registerUser, clearError } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

export default function AuthModal() {
  const dispatch = useDispatch()
  const { authModalOpen, authModalTab } = useSelector((s) => s.ui)
  const { loading, error } = useSelector((s) => s.auth)
  const [tab, setTab] = useState(authModalTab)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearError())
    
    let resultAction;
    
    if (tab === 'login') {
      resultAction = await dispatch(loginUser({ email: form.email, password: form.password }))
    } else {
      resultAction = await dispatch(registerUser(form))
    }
    
    if (resultAction.meta.requestStatus === 'fulfilled') {
      dispatch(closeAuthModal())
      toast.success(tab === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!', { icon: '👋' })
      setForm({ name: '', email: '', phone: '', password: '' })
    } else {
      toast.error(resultAction.payload || 'Có lỗi xảy ra', { icon: '❌' })
    }
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => dispatch(closeAuthModal())} />
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-dark-200 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Header Gradient */}
            <div className="bg-gradient-primary p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <button
                onClick={() => dispatch(closeAuthModal())}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <FiX />
              </button>
              <div className="relative">
                <span className="text-4xl mb-2 block">🍽️</span>
                <h2 className="text-2xl font-display font-bold text-white">FoodServe</h2>
                <p className="text-white/80 text-sm mt-1">Ăn ngon mỗi ngày</p>
              </div>
            </div>

            {/* Tabs */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  type="password"
                  placeholder="Mật khẩu"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-search pl-11"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full btn-primary py-3.5 text-center disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Đang xử lý...
                  </span>
                ) : tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </motion.button>

              {tab === 'login' && (
                <p className="text-center text-sm text-gray-400">
                  <button type="button" className="text-primary-500 hover:underline">Quên mật khẩu?</button>
                </p>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
