import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiStar, FiTruck, FiX, FiPhone, FiMail, FiEye } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { formatPrice } from '../../data/mockData'

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all | online | offline | active | inactive
  const [selectedDriver, setSelectedDriver] = useState(null) // modal chi tiết
  const [editDriver, setEditDriver] = useState(null) // modal sửa
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [driverOrders, setDriverOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => { fetchDrivers() }, [])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/auth/users')
      if (res.ok) {
        const data = await res.json()
        // Lọc chỉ lấy shipper/driver
        const shipperList = data.filter(u => u.isShipper || u.role === 'shipper')
        setDrivers(shipperList)
      }
    } catch { toast.error('Lỗi tải danh sách tài xế') }
    finally { setLoading(false) }
  }

  const fetchDriverOrders = async (driverId) => {
    setOrdersLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/orders?shipperId=${driverId}`)
      if (res.ok) {
        const data = await res.json()
        setDriverOrders(data)
      }
    } catch { }
    finally { setOrdersLoading(false) }
  }

  const handleViewDetail = (driver) => {
    setSelectedDriver(driver)
    fetchDriverOrders(driver._id)
  }

  const handleOpenEdit = (driver) => {
    setEditDriver(driver)
    setEditForm({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      vehicleType: driver.vehicleType || 'motorbike',
      vehicleNumber: driver.vehicleNumber || '',
      coins: driver.coins || 0,
      shipperRating: driver.shipperRating || 0,
      isShipper: driver.isShipper !== false,
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${editDriver._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          vehicleType: editForm.vehicleType,
          vehicleNumber: editForm.vehicleNumber,
          coins: Number(editForm.coins),
          shipperRating: Number(editForm.shipperRating),
        })
      })
      if (res.ok) {
        toast.success('Cập nhật tài xế thành công!')
        setEditDriver(null)
        fetchDrivers()
      } else {
        toast.error('Lỗi cập nhật')
      }
    } catch { toast.error('Lỗi kết nối') }
    finally { setEditLoading(false) }
  }

  const handleToggleStatus = async (driver) => {
    // Toggle isShipper (vô hiệu hóa/kích hoạt tài xế)
    try {
      const newRole = driver.isShipper ? 'user' : 'shipper'
      const res = await fetch(`http://localhost:5000/api/auth/users/${driver._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, isShipper: !driver.isShipper })
      })
      if (res.ok) {
        toast.success(driver.isShipper ? '🔴 Đã vô hiệu hóa tài xế' : '🟢 Đã kích hoạt tài xế')
        fetchDrivers()
      }
    } catch { toast.error('Lỗi kết nối') }
  }

  const handleDelete = async (driver) => {
    if (!window.confirm(`Xóa tài xế ${driver.name}? Hành động này không thể hoàn tác!`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${driver._id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Đã xóa tài xế')
        fetchDrivers()
        if (selectedDriver?._id === driver._id) setSelectedDriver(null)
      }
    } catch { toast.error('Lỗi kết nối') }
  }

  const handleAdjustCoins = async (driver, amount) => {
    try {
      const newCoins = Math.max(0, (driver.coins || 0) + amount)
      const res = await fetch(`http://localhost:5000/api/auth/users/${driver._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: newCoins })
      })
      if (res.ok) {
        toast.success(`${amount > 0 ? '+' : ''}${amount} Xu`)
        fetchDrivers()
        if (selectedDriver?._id === driver._id) {
          setSelectedDriver(prev => ({ ...prev, coins: newCoins }))
        }
      }
    } catch { toast.error('Lỗi kết nối') }
  }

  // Lọc
  const filtered = drivers.filter(d => {
    const matchSearch = !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search) ||
      d.email?.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicleNumber?.toLowerCase().includes(search.toLowerCase())

    const matchStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'online' ? d.isOnline :
      filterStatus === 'offline' ? !d.isOnline :
      filterStatus === 'active' ? d.isShipper !== false :
      filterStatus === 'inactive' ? d.isShipper === false : true

    return matchSearch && matchStatus
  })

  const stats = {
    total: drivers.length,
    online: drivers.filter(d => d.isOnline).length,
    active: drivers.filter(d => d.isShipper !== false).length,
    topRating: drivers.reduce((best, d) => d.shipperRating > (best?.shipperRating || 0) ? d : best, null)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng tài xế', value: stats.total, icon: '🛵', color: 'bg-blue-50 text-blue-600' },
          { label: 'Đang online', value: stats.online, icon: '🟢', color: 'bg-green-50 text-green-600' },
          { label: 'Đang hoạt động', value: stats.active, icon: '✅', color: 'bg-primary-50 text-primary-600' },
          { label: 'Rating cao nhất', value: stats.topRating ? `⭐ ${stats.topRating.shipperRating}` : '—', icon: '🏆', color: 'bg-yellow-50 text-yellow-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-xs font-medium opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-dark-100 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm tên, SĐT, biển số..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-sm outline-none focus:ring-2 focus:ring-primary-400 dark:text-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'online', label: '🟢 Online' },
            { value: 'active', label: '✅ Active' },
            { value: 'inactive', label: '🔴 Vô hiệu' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filterStatus === f.value ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-lg dark:text-white">Danh sách tài xế ({filtered.length})</h3>
          <button onClick={fetchDrivers} className="text-sm text-primary-500 hover:underline font-semibold">🔄 Làm mới</button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FiTruck className="text-5xl mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy tài xế nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-200 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Tài xế</th>
                  <th className="p-4 font-medium">Liên hệ</th>
                  <th className="p-4 font-medium">Phương tiện</th>
                  <th className="p-4 font-medium">Hiệu suất</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(driver => (
                  <tr key={driver._id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                    {/* Avatar + Tên */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-white font-bold overflow-hidden">
                            {driver.avatar ? <img src={driver.avatar} alt="" className="w-full h-full object-cover" /> : driver.name?.charAt(0)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${driver.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm dark:text-white">{driver.name}</p>
                          <p className="text-xs text-gray-400">🪙 {driver.coins || 0} Xu</p>
                        </div>
                      </div>
                    </td>

                    {/* Liên hệ */}
                    <td className="p-4">
                      <p className="text-sm dark:text-gray-300 flex items-center gap-1"><FiPhone size={12} /> {driver.phone || '—'}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><FiMail size={11} /> {driver.email}</p>
                    </td>

                    {/* Phương tiện */}
                    <td className="p-4">
                      <p className="text-sm dark:text-gray-300">
                        {driver.vehicleType === 'motorbike' ? '🏍️ Xe máy'
                          : driver.vehicleType === 'bike' ? '🚲 Xe đạp'
                          : driver.vehicleType === 'car' ? '🚗 Ô tô' : '—'}
                      </p>
                      {driver.vehicleNumber && (
                        <p className="text-xs font-mono bg-gray-100 dark:bg-dark-300 px-2 py-0.5 rounded mt-0.5 inline-block dark:text-gray-300">
                          {driver.vehicleNumber}
                        </p>
                      )}
                    </td>

                    {/* Hiệu suất */}
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                        <FiStar size={13} /> {driver.shipperRating || '0'}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{driver.totalDeliveries || 0} đơn</p>
                    </td>

                    {/* Trạng thái */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold block w-fit ${driver.isShipper !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {driver.isShipper !== false ? '✅ Active' : '🔴 Vô hiệu'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium block w-fit ${driver.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {driver.isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleViewDetail(driver)} title="Xem chi tiết"
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                          <FiEye size={14} />
                        </button>
                        <button onClick={() => handleOpenEdit(driver)} title="Sửa"
                          className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center hover:bg-primary-100 transition-colors">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => handleToggleStatus(driver)}
                          title={driver.isShipper !== false ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            driver.isShipper !== false
                              ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-100'
                              : 'bg-green-50 dark:bg-green-900/20 text-green-500 hover:bg-green-100'
                          }`}>
                          {driver.isShipper !== false ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                        </button>
                        <button onClick={() => handleDelete(driver)} title="Xóa"
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chi tiết tài xế */}
      <AnimatePresence>
        {selectedDriver && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDriver(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-dark-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-orange-400 p-6 rounded-t-3xl">
                <button onClick={() => setSelectedDriver(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                  <FiX size={22} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl overflow-hidden">
                    {selectedDriver.avatar ? <img src={selectedDriver.avatar} alt="" className="w-full h-full object-cover" /> : '🛵'}
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-bold">{selectedDriver.name}</h3>
                    <p className="text-white/80 text-sm">{selectedDriver.email}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {selectedDriver.isOnline ? '🟢 Online' : '⚫ Offline'}
                      </span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {selectedDriver.isShipper !== false ? '✅ Active' : '🔴 Vô hiệu'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Thống kê nhanh */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-3 text-center">
                    <div className="text-xl font-black text-yellow-600">⭐ {selectedDriver.shipperRating || 0}</div>
                    <div className="text-xs text-yellow-500 mt-0.5">Đánh giá</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 text-center">
                    <div className="text-xl font-black text-blue-600">{selectedDriver.totalDeliveries || 0}</div>
                    <div className="text-xs text-blue-500 mt-0.5">Đơn đã giao</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 text-center">
                    <div className="text-xl font-black text-green-600">🪙 {selectedDriver.coins || 0}</div>
                    <div className="text-xs text-green-500 mt-0.5">Xu hiện có</div>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">📞 SĐT:</span> <strong className="dark:text-white ml-1">{selectedDriver.phone || '—'}</strong></div>
                  <div><span className="text-gray-400">🚘 Xe:</span> <strong className="dark:text-white ml-1">
                    {selectedDriver.vehicleType === 'motorbike' ? 'Xe máy' : selectedDriver.vehicleType === 'car' ? 'Ô tô' : selectedDriver.vehicleType || '—'}
                  </strong></div>
                  <div><span className="text-gray-400">🔢 Biển số:</span> <strong className="dark:text-white font-mono ml-1">{selectedDriver.vehicleNumber || '—'}</strong></div>
                  <div><span className="text-gray-400">📅 Tham gia:</span> <strong className="dark:text-white ml-1">{new Date(selectedDriver.createdAt).toLocaleDateString('vi-VN')}</strong></div>
                </div>

                {/* Điều chỉnh Xu */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4">
                  <p className="font-bold text-sm text-yellow-700 dark:text-yellow-400 mb-3">🪙 Điều chỉnh Xu</p>
                  <div className="flex gap-2 flex-wrap">
                    {[-100, -50, -10, +10, +50, +100, +500].map(amt => (
                      <button key={amt} onClick={() => handleAdjustCoins(selectedDriver, amt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          amt > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}>
                        {amt > 0 ? '+' : ''}{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lịch sử đơn */}
                <div>
                  <h4 className="font-bold dark:text-white mb-3">📦 Đơn hàng gần đây</h4>
                  {ordersLoading ? (
                    <p className="text-gray-400 text-sm text-center py-4">Đang tải...</p>
                  ) : driverOrders.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Chưa có đơn hàng nào</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {driverOrders.slice(0, 10).map(order => (
                        <div key={order._id} className="flex items-center justify-between bg-gray-50 dark:bg-dark-100 rounded-xl px-4 py-2.5 text-sm">
                          <div>
                            <span className="font-mono text-xs text-gray-500">#{order._id.slice(-6).toUpperCase()}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>{order.status === 'completed' ? 'Hoàn thành' : order.status}</span>
                          </div>
                          <span className="font-bold text-primary-500">{formatPrice(order.finalAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nút thao tác nhanh */}
                <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => { handleOpenEdit(selectedDriver); setSelectedDriver(null) }}
                    className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition-colors">
                    ✏️ Sửa thông tin
                  </button>
                  <button onClick={() => handleToggleStatus(selectedDriver)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                      selectedDriver.isShipper !== false
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}>
                    {selectedDriver.isShipper !== false ? '🔴 Vô hiệu hóa' : '🟢 Kích hoạt'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Sửa tài xế */}
      <AnimatePresence>
        {editDriver && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditDriver(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <button onClick={() => setEditDriver(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={22} /></button>
              <h3 className="text-xl font-bold dark:text-white mb-5">✏️ Sửa thông tin tài xế</h3>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {[
                  { key: 'name', label: 'Họ tên', type: 'text' },
                  { key: 'phone', label: 'Số điện thoại', type: 'tel' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'vehicleNumber', label: 'Biển số xe', type: 'text' },
                  { key: 'coins', label: 'Xu (Coins)', type: 'number' },
                  { key: 'shipperRating', label: 'Rating (0-5)', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                    <input type={f.type} value={editForm[f.key] || ''} step={f.key === 'shipperRating' ? '0.1' : undefined}
                      min={f.key === 'coins' || f.key === 'shipperRating' ? 0 : undefined}
                      max={f.key === 'shipperRating' ? 5 : undefined}
                      onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                  </div>
                ))}

                {/* Loại xe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phương tiện</label>
                  <select value={editForm.vehicleType || 'motorbike'}
                    onChange={e => setEditForm(p => ({ ...p, vehicleType: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                    <option value="motorbike">🏍️ Xe máy</option>
                    <option value="bike">🚲 Xe đạp</option>
                    <option value="car">🚗 Ô tô</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditDriver(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors text-sm">
                    Hủy
                  </button>
                  <button type="submit" disabled={editLoading}
                    className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
                    {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
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
