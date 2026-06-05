import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiMail, FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { loginUser } from '../store/slices/authSlice'

export default function AdminLoginPage() {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((s) => s.auth)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Nếu đã đăng nhập và là admin, chuyển đến trang admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      window.location.href = '/admin.html'
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    try {
      const result = await dispatch(loginUser(formData)).unwrap()
      
      if (result.user.role !== 'admin') {
        toast.error('Bạn không có quyền truy cập trang Admin!')
        dispatch({ type: 'auth/logout' })
        return
      }

      toast.success('Đăng nhập thành công!')
      setTimeout(() => {
        window.location.href = '/admin.html'
      }, 500)
    } catch (error) {
      toast.error(error || 'Đăng nhập thất bại')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-amber-50 to-emerald-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-300 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative w-full bg-white dark:bg-dark-200 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Gradient */}
          <div className="bg-gradient-primary p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <span className="text-5xl mb-3 block">👑</span>
              <h2 className="text-3xl font-display font-bold text-white">Admin Portal</h2>
              <p className="text-white/80 text-sm mt-2">Hệ thống quản trị FoodServe</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="input-search pl-11"
                required
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu"
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
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1 }} 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" 
                  />
                  Đang xử lý...
                </span>
              ) : 'Đăng nhập'}
            </motion.button>

            {/* Demo Account Info */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">
                🔐 Tài khoản demo:
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-300">
                Email: <strong>admin@foodserve.vn</strong>
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-300">
                Password: <strong>123456</strong>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          © 2026 FoodServe. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
