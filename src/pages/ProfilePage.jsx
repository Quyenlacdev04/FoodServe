import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { FiUser, FiPhone, FiMapPin, FiCamera, FiSave, FiAward, FiGift, FiTag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { updateProfile } from '../store/slices/authSlice'
import { getUserRank } from '../utils/rankUtils'
import { formatPrice } from '../data/mockData'

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || ''
      })
    }
  }, [user, isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh quá lớn (Tối đa 2MB)')
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setFormData({ ...formData, avatar: reader.result })
    }
    reader.onerror = () => {
      toast.error('Có lỗi xảy ra khi đọc file ảnh')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Tên không được để trống')
      return
    }
    try {
      await dispatch(updateProfile({ userId: user._id || user.id, ...formData })).unwrap()
      toast.success('Cập nhật hồ sơ thành công!')
    } catch (error) {
      toast.error(error || 'Lỗi khi cập nhật hồ sơ')
    }
  }

  if (!user) return null

  const rank = getUserRank(user.totalSpent)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-primary-500 hover:underline text-sm mb-6 inline-block">← Về trang chủ</Link>
        
        <div className="bg-white dark:bg-dark-200 rounded-3xl shadow-card overflow-hidden flex flex-col md:flex-row">
          
          {/* Cột trái: Avatar & Rank */}
          <div className="w-full md:w-1/3 bg-primary-50 dark:bg-primary-900/10 p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-primary-100 dark:border-gray-800">
            <div className="relative group w-32 h-32 mb-4">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover ring-4 ring-white shadow-lg group-hover:opacity-75 transition-opacity" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-5xl text-white shadow-lg ring-4 ring-white group-hover:opacity-75 transition-opacity">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Nút đổi ảnh nhanh trên avatar */}
              <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full bg-black/40">
                <FiCamera className="text-white text-3xl drop-shadow-md" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{user.email}</p>

            <div className="w-full bg-white dark:bg-dark-300 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm flex items-center gap-1"><FiAward /> Hạng</span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 ${rank.bg} ${rank.color}`}>
                  {rank.icon} {rank.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm flex items-center gap-1"><FiGift /> Lượt quay</span>
                <span className="font-bold text-primary-500">{user.spins || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">💰 Ví Xu</span>
                <span className="font-bold text-yellow-500">{user.coins || 0} Xu</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">🛒 Đã chi</span>
                <span className="font-bold text-green-600">{formatPrice(user.totalSpent || 0)}</span>
              </div>
            </div>
          </div>

          {/* Cột phải: Form cập nhật */}
          <div className="w-full md:w-2/3 p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Thông tin cá nhân</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-shadow"
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-shadow"
                    placeholder="VD: 0987654321"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Địa chỉ giao hàng mặc định
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                    placeholder="Nhập địa chỉ nhận hàng của bạn..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thay đổi ảnh đại diện (Tải lên từ máy tính)
                </label>
                <div className="relative">
                  <FiCamera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer transition-shadow focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Định dạng hỗ trợ: JPG, PNG, GIF (Tối đa 2MB).</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-primary-500/30"
                >
                  <FiSave /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Kho Voucher */}
        <div className="mt-8 bg-white dark:bg-dark-200 rounded-3xl shadow-card overflow-hidden p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiGift className="text-primary-500" /> Kho Voucher Của Bạn
          </h3>
          
          {(!user.vouchers || user.vouchers.length === 0) ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">🎫</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Bạn chưa có mã giảm giá nào.</p>
              <Link to="/games" className="inline-block mt-4 px-6 py-2 bg-primary-50 text-primary-600 font-bold rounded-full hover:bg-primary-100 transition-colors">
                Chơi mini-game để nhận mã ngay!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {user.vouchers.map((code, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 dark:bg-primary-900/10 p-4 flex items-center justify-between group hover:border-primary-400 transition-colors">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-dark-200 rounded-full border-r-2 border-dashed border-primary-200 group-hover:border-primary-400 transition-colors"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-dark-200 rounded-full border-l-2 border-dashed border-primary-200 group-hover:border-primary-400 transition-colors"></div>
                  
                  <div className="pl-4">
                    <p className="font-black text-lg text-primary-600 tracking-wider drop-shadow-sm">{code}</p>
                    <p className="text-xs font-semibold text-primary-500/70 uppercase tracking-widest mt-0.5">Sẵn sàng sử dụng</p>
                  </div>
                  <div className="pr-4">
                    <FiTag className="text-2xl text-primary-300 group-hover:text-primary-500 transition-colors rotate-90" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
