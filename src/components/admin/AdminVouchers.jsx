import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiSend, FiX, FiTag, FiToggleLeft, FiToggleRight, FiSearch, FiFilter, FiCopy, FiEye, FiDownload, FiUsers } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { formatPrice } from '../../data/mockData'

const EMPTY_FORM = {
  code: '', description: '', type: 'fixed', value: '',
  minOrder: 0, maxDiscount: 0, usageLimit: 0, expiresAt: '', isActive: true
}

export default function AdminVouchers({ adminId }) {
  const [vouchers, setVouchers] = useState([])
  const [filteredVouchers, setFilteredVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailVoucher, setDetailVoucher] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [broadcasting, setBroadcasting] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, totalUsed: 0, expired: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive, expired
  const [filterType, setFilterType] = useState('all') // all, fixed, percent

  useEffect(() => { fetchVouchers() }, [])
  
  useEffect(() => {
    // Filter & search
    let result = [...vouchers]
    
    // Search
    if (searchTerm) {
      result = result.filter(v => 
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by status
    if (filterStatus === 'active') result = result.filter(v => v.isActive && !isExpired(v))
    if (filterStatus === 'inactive') result = result.filter(v => !v.isActive)
    if (filterStatus === 'expired') result = result.filter(v => isExpired(v))
    
    // Filter by type
    if (filterType !== 'all') result = result.filter(v => v.type === filterType)
    
    setFilteredVouchers(result)
  }, [vouchers, searchTerm, filterStatus, filterType])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/vouchers')
      if (res.ok) {
        const data = await res.json()
        setVouchers(data)
        const now = new Date()
        setStats({
          total: data.length,
          active: data.filter(v => v.isActive && !(v.expiresAt && now > new Date(v.expiresAt))).length,
          totalUsed: data.reduce((s, v) => s + (v.usedCount || 0), 0),
          expired: data.filter(v => v.expiresAt && now > new Date(v.expiresAt)).length
        })
      }
    } catch { toast.error('Lỗi tải voucher') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEdit = (v) => {
    setEditingId(v._id)
    setForm({
      code: v.code, description: v.description || '',
      type: v.type, value: v.value,
      minOrder: v.minOrder || 0, maxDiscount: v.maxDiscount || 0,
      usageLimit: v.usageLimit || 0,
      expiresAt: v.expiresAt ? v.expiresAt.split('T')[0] : '',
      isActive: v.isActive !== false
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.code || !form.value) return toast.error('Vui lòng nhập mã và giá trị')
    setSaving(true)
    try {
      const body = { ...form, value: Number(form.value), minOrder: Number(form.minOrder), maxDiscount: Number(form.maxDiscount), usageLimit: Number(form.usageLimit), expiresAt: form.expiresAt || null, createdBy: adminId }
      const url = editingId ? `http://localhost:5000/api/vouchers/${editingId}` : 'http://localhost:5000/api/vouchers'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Cập nhật voucher!' : 'Tạo voucher thành công!')
        setIsModalOpen(false)
        fetchVouchers()
      } else { toast.error(data.message || 'Lỗi lưu voucher') }
    } catch { toast.error('Lỗi kết nối') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Xóa voucher "${code}"?`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/vouchers/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Đã xóa voucher'); fetchVouchers() }
    } catch { toast.error('Lỗi kết nối') }
  }

  const handleToggle = async (v) => {
    try {
      const res = await fetch(`http://localhost:5000/api/vouchers/${v._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !v.isActive })
      })
      if (res.ok) { fetchVouchers() }
    } catch { }
  }

  const handleBroadcast = async (v, role = 'user') => {
    const roleText = role === 'user' ? 'tất cả khách hàng' : role === 'shipper' ? 'tất cả tài xế' : 'tất cả đối tác'
    if (!window.confirm(`Phát voucher "${v.code}" cho ${roleText}?`)) return
    setBroadcasting(v._id)
    try {
      const res = await fetch(`http://localhost:5000/api/vouchers/${v._id}/broadcast`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message, { duration: 4000, icon: '🎉' })
      } else { toast.error(data.message) }
    } catch { toast.error('Lỗi kết nối') }
    finally { setBroadcasting(null) }
  }

  const handleDuplicate = (v) => {
    setEditingId(null)
    setForm({
      code: `${v.code}_COPY`,
      description: v.description || '',
      type: v.type,
      value: v.value,
      minOrder: v.minOrder || 0,
      maxDiscount: v.maxDiscount || 0,
      usageLimit: v.usageLimit || 0,
      expiresAt: '',
      isActive: false
    })
    setIsModalOpen(true)
    toast.success('Đã sao chép voucher! Sửa mã và lưu.')
  }

  const handleViewDetail = async (v) => {
    setDetailVoucher(v)
    setIsDetailOpen(true)
  }

  const handleExport = () => {
    const csv = [
      ['Mã', 'Loại', 'Giá trị', 'Đơn tối thiểu', 'Giới hạn', 'Đã dùng', 'Hết hạn', 'Trạng thái'].join(','),
      ...filteredVouchers.map(v => [
        v.code,
        v.type === 'percent' ? 'Phần trăm' : 'Tiền mặt',
        v.value,
        v.minOrder || 0,
        v.usageLimit || 'Không giới hạn',
        v.usedCount || 0,
        v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('vi-VN') : 'Không',
        v.isActive && !isExpired(v) ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vouchers_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Đã xuất file CSV!')
  }

  const isExpired = (v) => v.expiresAt && new Date() > new Date(v.expiresAt)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng voucher', value: stats.total, icon: '🎫', color: 'bg-blue-50 text-blue-600' },
          { label: 'Đang hoạt động', value: stats.active, icon: '✅', color: 'bg-green-50 text-green-600' },
          { label: 'Tổng lượt dùng', value: stats.totalUsed, icon: '📊', color: 'bg-purple-50 text-purple-600' },
          { label: 'Đã hết hạn', value: stats.expired, icon: '⚠️', color: 'bg-red-50 text-red-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-xs font-medium opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header & Actions */}
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg dark:text-white">Danh sách Voucher</h3>
            <p className="text-sm text-gray-400">Tạo và phát voucher cho người dùng</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors">
              <FiDownload size={16} /> Export
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 btn-primary px-4 py-2.5 text-sm">
              <FiPlus /> Tạo mới
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã voucher hoặc mô tả..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">✅ Active</option>
            <option value="inactive">❌ Inactive</option>
            <option value="expired">⚠️ Hết hạn</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none">
            <option value="all">Tất cả loại</option>
            <option value="fixed">💰 Tiền mặt</option>
            <option value="percent">📊 Phần trăm</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Đang tải...</div>
        ) : filteredVouchers.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FiTag className="text-5xl mx-auto mb-3 opacity-30" />
            <p>{searchTerm || filterStatus !== 'all' || filterType !== 'all' ? 'Không tìm thấy voucher nào' : 'Chưa có voucher nào. Tạo voucher đầu tiên!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-200 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Mã / Mô tả</th>
                  <th className="p-4 font-medium">Giảm giá</th>
                  <th className="p-4 font-medium">Điều kiện</th>
                  <th className="p-4 font-medium">Sử dụng</th>
                  <th className="p-4 font-medium">Hết hạn</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map(v => (
                  <tr key={v._id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                    {/* Mã */}
                    <td className="p-4">
                      <p className="font-black font-mono text-primary-600 dark:text-primary-400 text-base">{v.code}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{v.description || '—'}</p>
                    </td>
                    {/* Giảm */}
                    <td className="p-4">
                      <span className="font-bold text-green-600">
                        {v.type === 'percent' ? `-${v.value}%` : `-${formatPrice(v.value)}`}
                      </span>
                      {v.type === 'percent' && v.maxDiscount > 0 && (
                        <p className="text-xs text-gray-400">Tối đa {formatPrice(v.maxDiscount)}</p>
                      )}
                    </td>
                    {/* Điều kiện */}
                    <td className="p-4">
                      {v.minOrder > 0
                        ? <span className="text-sm text-gray-600 dark:text-gray-300">Đơn ≥ {formatPrice(v.minOrder)}</span>
                        : <span className="text-sm text-gray-400">Không giới hạn</span>}
                    </td>
                    {/* Sử dụng */}
                    <td className="p-4">
                      <span className="text-sm dark:text-gray-300">
                        {v.usedCount || 0}
                        {v.usageLimit > 0 ? ` / ${v.usageLimit}` : ' / ∞'}
                      </span>
                      {v.usageLimit > 0 && (
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div className="h-full bg-primary-400 rounded-full" style={{ width: `${Math.min(100, ((v.usedCount || 0) / v.usageLimit) * 100)}%` }} />
                        </div>
                      )}
                    </td>
                    {/* Hết hạn */}
                    <td className="p-4">
                      {v.expiresAt ? (
                        <span className={`text-sm ${isExpired(v) ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                          {isExpired(v) ? '⚠️ Hết hạn' : new Date(v.expiresAt).toLocaleDateString('vi-VN')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Không HH</span>
                      )}
                    </td>
                    {/* Trạng thái */}
                    <td className="p-4">
                      <button onClick={() => handleToggle(v)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${v.isActive && !isExpired(v) ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {v.isActive && !isExpired(v) ? <><FiToggleRight size={14} /> Active</> : <><FiToggleLeft size={14} /> Inactive</>}
                      </button>
                    </td>
                    {/* Thao tác */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Chi tiết */}
                        <button onClick={() => handleViewDetail(v)} title="Xem chi tiết"
                          className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <FiEye size={13} />
                        </button>
                        {/* Phát */}
                        <div className="relative group">
                          <button disabled={broadcasting === v._id || !v.isActive}
                            title="Phát voucher"
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-bold hover:bg-primary-100 transition-colors disabled:opacity-40">
                            {broadcasting === v._id ? (
                              <div className="w-3 h-3 border border-primary-500 border-t-transparent rounded-full animate-spin" />
                            ) : <FiSend size={12} />}
                            Phát
                          </button>
                          {/* Dropdown phát */}
                          <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white dark:bg-dark-200 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[150px]">
                            <button onClick={() => handleBroadcast(v, 'user')} disabled={!v.isActive}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-dark-100 dark:text-white disabled:opacity-40">
                              👥 Tất cả khách hàng
                            </button>
                            <button onClick={() => handleBroadcast(v, 'shipper')} disabled={!v.isActive}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-dark-100 dark:text-white disabled:opacity-40">
                              🛵 Tất cả tài xế
                            </button>
                            <button onClick={() => handleBroadcast(v, 'merchant')} disabled={!v.isActive}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-dark-100 dark:text-white disabled:opacity-40">
                              🏪 Tất cả đối tác
                            </button>
                          </div>
                        </div>
                        {/* Nhân bản */}
                        <button onClick={() => handleDuplicate(v)} title="Nhân bản"
                          className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center hover:bg-purple-100 transition-colors">
                          <FiCopy size={13} />
                        </button>
                        {/* Sửa */}
                        <button onClick={() => openEdit(v)} title="Sửa"
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                          <FiEdit2 size={13} />
                        </button>
                        {/* Xóa */}
                        <button onClick={() => handleDelete(v._id, v.code)} title="Xóa"
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                          <FiTrash2 size={13} />
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

      {/* Modal Tạo/Sửa Voucher */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={22} /></button>
              <h2 className="text-xl font-bold dark:text-white mb-5 flex items-center gap-2">
                <FiTag className="text-primary-500" />
                {editingId ? 'Sửa voucher' : 'Tạo voucher mới'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Mã */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã voucher *</label>
                  <input type="text" value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    disabled={!!editingId}
                    placeholder="VD: SUMMER30"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white font-mono uppercase tracking-widest focus:ring-2 focus:ring-primary-400 outline-none disabled:opacity-60 text-sm" />
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                  <input type="text" value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="VD: Voucher khuyến mãi hè"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                </div>

                {/* Loại giảm + Giá trị */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại giảm *</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm">
                      <option value="fixed">💰 Tiền mặt (đ)</option>
                      <option value="percent">📊 Phần trăm (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Giá trị * {form.type === 'percent' ? '(%)' : '(đ)'}
                    </label>
                    <input type="number" min="1" max={form.type === 'percent' ? 100 : undefined}
                      value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                  </div>
                </div>

                {/* Đơn tối thiểu + Giảm tối đa */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn tối thiểu (đ)</label>
                    <input type="number" min="0" value={form.minOrder}
                      onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                  </div>
                  {form.type === 'percent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giảm tối đa (đ)</label>
                      <input type="number" min="0" value={form.maxDiscount}
                        onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                        placeholder="0 = không giới hạn"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                    </div>
                  )}
                </div>

                {/* Giới hạn + Hết hạn */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới hạn dùng</label>
                    <input type="number" min="0" value={form.usageLimit}
                      onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))}
                      placeholder="0 = không giới hạn"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn</label>
                    <input type="date" value={form.expiresAt}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-100 rounded-xl">
                  <input type="checkbox" id="isActive" checked={form.isActive}
                    onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-primary-500" />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Kích hoạt ngay sau khi tạo
                  </label>
                </div>

                {/* Preview */}
                {form.code && form.value && (
                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl p-3">
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">📋 Preview:</p>
                    <p className="font-black font-mono text-primary-700 dark:text-primary-300">{form.code}</p>
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      Giảm {form.type === 'percent' ? `${form.value}%` : `${Number(form.value).toLocaleString('vi-VN')}đ`}
                      {form.minOrder > 0 && ` — Đơn tối thiểu ${Number(form.minOrder).toLocaleString('vi-VN')}đ`}
                      {form.expiresAt && ` — HH: ${new Date(form.expiresAt).toLocaleDateString('vi-VN')}`}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors">
                    Hủy
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-3 btn-primary disabled:opacity-50">
                    {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo voucher'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Chi tiết Voucher */}
      <AnimatePresence>
        {isDetailOpen && detailVoucher && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={22} /></button>
              
              <h2 className="text-xl font-bold dark:text-white mb-5 flex items-center gap-2">
                <FiEye className="text-primary-500" />
                Chi tiết Voucher
              </h2>

              {/* Thông tin chính */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
                  <p className="text-xs opacity-80 mb-1">MÃ VOUCHER</p>
                  <p className="text-3xl font-black font-mono tracking-wider">{detailVoucher.code}</p>
                  <p className="text-sm mt-2 opacity-90">{detailVoucher.description || 'Không có mô tả'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Loại giảm giá</p>
                    <p className="text-lg font-bold dark:text-white">
                      {detailVoucher.type === 'percent' ? `${detailVoucher.value}%` : formatPrice(detailVoucher.value)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Đơn tối thiểu</p>
                    <p className="text-lg font-bold dark:text-white">
                      {detailVoucher.minOrder > 0 ? formatPrice(detailVoucher.minOrder) : 'Không giới hạn'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Giới hạn sử dụng</p>
                    <p className="text-lg font-bold dark:text-white">
                      {detailVoucher.usageLimit > 0 ? `${detailVoucher.usedCount || 0} / ${detailVoucher.usageLimit}` : 'Không giới hạn'}
                    </p>
                    {detailVoucher.usageLimit > 0 && (
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div className="h-full bg-primary-500 rounded-full" 
                          style={{ width: `${Math.min(100, ((detailVoucher.usedCount || 0) / detailVoucher.usageLimit) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày hết hạn</p>
                    <p className="text-lg font-bold dark:text-white">
                      {detailVoucher.expiresAt ? new Date(detailVoucher.expiresAt).toLocaleDateString('vi-VN') : 'Không hết hạn'}
                    </p>
                    {detailVoucher.expiresAt && isExpired(detailVoucher) && (
                      <p className="text-xs text-red-500 mt-1">⚠️ Đã hết hạn</p>
                    )}
                  </div>
                </div>

                {detailVoucher.type === 'percent' && detailVoucher.maxDiscount > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Giảm tối đa</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatPrice(detailVoucher.maxDiscount)}</p>
                  </div>
                )}

                {/* Trạng thái */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trạng thái</p>
                    <p className={`text-sm font-bold ${detailVoucher.isActive && !isExpired(detailVoucher) ? 'text-green-600' : 'text-gray-500'}`}>
                      {detailVoucher.isActive && !isExpired(detailVoucher) ? '✅ Đang hoạt động' : '❌ Không hoạt động'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tạo lúc</p>
                    <p className="text-sm font-medium dark:text-gray-300">
                      {new Date(detailVoucher.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Thống kê sử dụng */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    📊 Thống kê sử dụng
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{detailVoucher.usedCount || 0}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Lượt sử dụng</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {detailVoucher.usedBy?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Người dùng</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-green-600 dark:text-green-400">
                        {detailVoucher.usageLimit > 0 
                          ? `${Math.round(((detailVoucher.usedCount || 0) / detailVoucher.usageLimit) * 100)}%`
                          : '∞'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Tỷ lệ dùng</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsDetailOpen(false)}
                className="w-full mt-6 py-3 btn-primary">
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
