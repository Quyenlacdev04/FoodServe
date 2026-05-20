import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiTrash2, FiSearch, FiUser, FiX, FiAward, FiGift } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { formatPrice } from '../../data/mockData'

const roleBadgeMap = {
  user: { label: 'Khách hàng', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/30' },
  admin: { label: 'Admin 👑', color: 'bg-red-500/10 text-red-500 border border-red-500/30' },
  merchant: { label: 'Đối tác quán', color: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' },
  shipper: { label: 'Tài xế 🛵', color: 'bg-amber-500/10 text-amber-500 border border-amber-500/30' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    coins: 0,
    spins: 2,
    totalSpent: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/auth/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        toast.error('Lỗi khi tải danh sách người dùng')
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản người dùng này không? Hành động này không thể hoàn tác!')) return
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Xóa người dùng thành công!')
        setUsers(users.filter(u => u._id !== id))
      } else {
        toast.error('Không thể xóa người dùng')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const handleEditOpen = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      coins: user.coins || 0,
      spins: user.spins !== undefined ? user.spins : 2,
      totalSpent: user.totalSpent || 0
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Cập nhật thông tin thành công!')
        setIsModalOpen(false)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Lỗi khi cập nhật')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery)
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  return (
    <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden transition-colors duration-500">
      
      {/* Header & Controls */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg dark:text-white">Quản lý Người dùng</h3>
          <p className="text-sm text-gray-400">Xem danh sách, sửa quyền hạn, thưởng xu và quản lý thành viên</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên, email, sđt..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
            />
          </div>

          {/* Role Filter */}
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 text-sm rounded-xl outline-none font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="user">Khách hàng</option>
            <option value="admin">Admin</option>
            <option value="merchant">Đối tác quán</option>
            <option value="shipper">Tài xế</option>
          </select>

          <button onClick={fetchUsers} className="text-sm text-primary-500 font-semibold hover:underline">
            Làm mới
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-200 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              <th className="p-4 pl-6">Hội viên</th>
              <th className="p-4">Số điện thoại</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4">Thông số ví / Game</th>
              <th className="p-4">Ngày đăng ký</th>
              <th className="p-4 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <span className="text-gray-400 text-sm">Đang tải danh sách...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-gray-400">
                  Không tìm thấy người dùng phù hợp.
                </td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user._id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-200/50 transition-colors">
                
                {/* User column */}
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center font-bold text-lg">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td className="p-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {user.phone || 'Chưa cung cấp'}
                </td>

                {/* Role */}
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${roleBadgeMap[user.role]?.color || 'bg-gray-100 text-gray-500'}`}>
                    {roleBadgeMap[user.role]?.label || user.role}
                  </span>
                </td>

                {/* Coins, Spins, Total Spent */}
                <td className="p-4 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                    <FiAward className="text-sm" /> 💰 {user.coins || 0} Xu
                  </div>
                  <div className="flex items-center gap-1.5 text-[#ff6b00] font-semibold">
                    <FiGift className="text-sm" /> 🎡 {user.spins !== undefined ? user.spins : 2} Lượt quay
                  </div>
                  <div className="text-gray-400 font-medium">
                    Tổng chi: <strong className="text-primary-500 font-bold">{formatPrice(user.totalSpent || 0)}</strong>
                  </div>
                </td>

                {/* Created At */}
                <td className="p-4 text-xs text-gray-400 font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Không có'}
                </td>

                {/* Actions */}
                <td className="p-4 text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEditOpen(user)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                      title="Chỉnh sửa thông tin"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Xóa người dùng"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-dark-200 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors duration-500"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">Chỉnh sửa thông tin thành viên</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{formData.email}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm" 
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm" 
                  />
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Vai trò quyền hạn</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold cursor-pointer"
                  >
                    <option value="user">Khách hàng (User)</option>
                    <option value="shipper">Tài xế (Shipper)</option>
                    <option value="merchant">Đối tác quán (Merchant)</option>
                    <option value="admin">Admin cấp cao</option>
                  </select>
                </div>

                <hr className="border-gray-100 dark:border-gray-800" />
                <h4 className="font-bold text-sm text-primary-500">Quản lý Phần thưởng & Tiêu dùng</h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Coins */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Ví Xu (Coins)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.coins} 
                      onChange={e => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold" 
                    />
                  </div>

                  {/* Spins */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Lượt quay Vòng Quay</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.spins} 
                      onChange={e => setFormData({ ...formData, spins: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold" 
                    />
                  </div>
                </div>

                {/* Total Spent */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tổng chi tiêu trên App (VNĐ)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.totalSpent} 
                    onChange={e => setFormData({ ...formData, totalSpent: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold text-primary-500" 
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Lượng chi tiêu tích lũy giúp người dùng nâng cấp thứ hạng Đại Gia trên bảng xếp hạng.</p>
                </div>

                {/* Submit & Cancel */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02]"
                  >
                    Lưu cấu hình
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
