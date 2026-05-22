import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiTruck, FiAward, FiInfo, FiActivity, FiPhone, FiMail, FiDollarSign, FiCreditCard } from 'react-icons/fi'
import toast from 'react-hot-toast'
import ImageUpload from '../ui/ImageUpload'

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    baseShippingFee: 15000,
    perKmShippingFee: 5000,
    freeshipThreshold: 200000,
    welcomeCoins: 100,
    maintenanceMode: false,
    supportPhone: '19001000',
    supportEmail: 'support@foodserve.vn',
    monthlyRestaurantFee: 500000,
    adminPaymentQR: '',
    adminBankName: 'Techcombank',
    adminAccountName: 'VU VAN QUYEN',
    adminAccountNumber: '509868686868'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        toast.error('Lỗi khi tải cài đặt hệ thống')
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        toast.success('Lưu cài đặt hệ thống thành công!', { icon: '⚙️' })
      } else {
        toast.error('Lỗi khi lưu cài đặt')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-100 rounded-2xl p-20 shadow-card text-center transition-colors duration-500">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span className="text-gray-400 font-medium">Đang tải cấu hình hệ thống...</span>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden transition-colors duration-500"
    >
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg dark:text-white">Cài đặt hệ thống</h3>
          <p className="text-sm text-gray-400">Điều chỉnh mức phí vận chuyển, tặng thưởng, hỗ trợ và trạng thái hoạt động</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-8">
        
        {/* Chế độ Bảo trì */}
        <div className="p-5 border border-red-500/20 dark:border-red-500/10 rounded-2xl bg-red-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <FiActivity /> Chế độ bảo trì hệ thống (Maintenance Mode)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Khi bật chế độ bảo trì, toàn bộ người dùng bên ngoài sẽ không thể tạo đơn hàng mới. Giao diện trang chủ sẽ hiển thị thông báo bảo trì định kỳ.
            </p>
          </div>
          
          <button 
            type="button"
            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
              settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <motion.div 
              layout 
              className="bg-white w-6 h-6 rounded-full shadow-md"
              animate={{ x: settings.maintenanceMode ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* 3 cột Cài đặt */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          
          {/* Cài đặt Vận chuyển */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <FiTruck className="text-primary-500" /> Cài đặt Vận chuyển
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Phí ship cơ bản (VNĐ)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    value={settings.baseShippingFee} 
                    onChange={e => setSettings({ ...settings, baseShippingFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">VNĐ</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Áp dụng cho 2 km đầu tiên của đơn hàng.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Phí ship mỗi km tiếp theo (VNĐ)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    value={settings.perKmShippingFee} 
                    onChange={e => setSettings({ ...settings, perKmShippingFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">/ km</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Áp dụng cho các khoảng cách phát sinh ngoài 2 km đầu.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Đơn tối thiểu để Freeship (VNĐ)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    value={settings.freeshipThreshold} 
                    onChange={e => setSettings({ ...settings, freeshipThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">VNĐ</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Đơn hàng đạt giá trị này sẽ được miễn phí vận chuyển 100%.</p>
              </div>
            </div>
          </div>

          {/* Cài đặt Ví & Liên hệ hỗ trợ */}
          <div className="space-y-6">
            
            {/* Cài đặt Phần thưởng */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <FiAward className="text-amber-500" /> Cấu hình Ví & Thưởng
              </h4>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Mức xu thưởng chào mừng (Coins)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    value={settings.welcomeCoins} 
                    onChange={e => setSettings({ ...settings, welcomeCoins: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Xu</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Người dùng mới đăng ký tài khoản sẽ tự động được cộng số xu này.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                  <FiDollarSign className="text-emerald-500" /> Phí duy trì nhà hàng hàng tháng (VNĐ)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    step="10000"
                    value={settings.monthlyRestaurantFee} 
                    onChange={e => setSettings({ ...settings, monthlyRestaurantFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">VNĐ</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Mức phí các nhà hàng đối tác phải đóng hàng tháng để duy trì cửa hàng hoạt động. Quy đổi: 1 Xu = 1.000 VNĐ.</p>
              </div>
            </div>

            {/* Thông tin hỗ trợ */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <FiInfo className="text-blue-500" /> Thông tin liên hệ hỗ trợ
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1"><FiPhone /> Hotline hỗ trợ</label>
                  <input 
                    type="text" 
                    value={settings.supportPhone} 
                    onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1"><FiMail /> Email hỗ trợ</label>
                  <input 
                    type="email" 
                    value={settings.supportEmail} 
                    onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium" 
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Cấu hình thanh toán Admin */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
          <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
            <FiCreditCard className="text-green-500" /> Cấu hình thanh toán Admin (Nhận phí từ cửa hàng)
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Thông tin ngân hàng */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tên ngân hàng</label>
                  <input
                    type="text"
                    value={settings.adminBankName}
                    onChange={(e) => setSettings({...settings, adminBankName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                    placeholder="VD: Techcombank"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Chủ tài khoản</label>
                  <input
                    type="text"
                    value={settings.adminAccountName}
                    onChange={(e) => setSettings({...settings, adminAccountName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                    placeholder="VD: VU VAN QUYEN"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Số tài khoản</label>
                  <input
                    type="text"
                    value={settings.adminAccountNumber}
                    onChange={(e) => setSettings({...settings, adminAccountNumber: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium font-mono"
                    placeholder="VD: 509868686868"
                  />
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Mã QR thanh toán Admin</label>
              <ImageUpload
                value={settings.adminPaymentQR}
                onChange={(url) => setSettings({...settings, adminPaymentQR: url})}
                placeholder="Upload QR Techcombank của bạn"
              />
              <p className="text-[10px] text-gray-400 mt-2">
                💡 Khi cửa hàng đóng phí duy trì, họ sẽ chuyển khoản vào QR này
              </p>
            </div>
          </div>
        </div>

        {/* Nút lưu cài đặt */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-3 bg-gradient-primary hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <FiSave /> {saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình hệ thống'}
          </button>
        </div>

      </form>
      
    </motion.div>
  )
}
