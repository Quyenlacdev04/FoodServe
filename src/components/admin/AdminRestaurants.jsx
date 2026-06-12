import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiClock, FiX, FiArrowLeft, FiImage, FiUpload, FiSearch, FiToggleLeft, FiToggleRight, FiEye } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '', image: '', cover: '', categories: '', rating: 5.0,
    deliveryTime: '15-30', distance: 2.5, minOrder: 0, discount: ''
  })
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [menuForm, setMenuForm] = useState({ name: '', price: '', image: '', description: '', category: '', popular: false })
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)
  const menuFileInputRef = useRef(null)

  useEffect(() => { fetchRestaurants() }, [])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/restaurants')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data.restaurants || data)
      }
    } catch { toast.error('Lỗi khi tải danh sách nhà hàng') }
    finally { setLoading(false) }
  }

  const fetchMenuItems = async (restaurantId) => {
    try {
      setMenuLoading(true)
      const res = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`)
      if (res.ok) { const data = await res.json(); setMenuItems(data.menuItems || []) }
    } catch { toast.error('Lỗi khi tải menu') }
    finally { setMenuLoading(false) }
  }

  const uploadImage = async (file) => {
    const fd = new FormData(); fd.append('image', file); setUploadingImage(true)
    try {
      const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: fd })
      if (res.ok) { const data = await res.json(); return data.url || data.imageUrl || data.path }
      toast.error('Lỗi upload ảnh'); return null
    } catch { toast.error('Lỗi kết nối'); return null }
    finally { setUploadingImage(false) }
  }

  const handleMenuImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return }
    const url = await uploadImage(file)
    if (url) setMenuForm(p => ({ ...p, image: url }))
  }

  const handleRestaurantImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return }
    const url = await uploadImage(file)
    if (url) setFormData(p => ({ ...p, image: url, cover: url }))
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa nhà hàng "${name}"? Toàn bộ menu cũng sẽ bị xóa!`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Đã xóa nhà hàng'); setRestaurants(r => r.filter(x => x._id !== id)) }
      else toast.error('Không thể xóa nhà hàng')
    } catch { toast.error('Lỗi kết nối') }
  }

  const handleToggleActive = async (restaurant) => {
    const willClose = restaurant.isActive !== false
    if (!window.confirm(`${willClose ? '🔒 Đóng cửa' : '🔓 Mở cửa'} nhà hàng "${restaurant.name}"?`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !willClose })
      })
      if (res.ok) {
        toast.success(willClose ? '🔒 Đã đóng cửa nhà hàng' : '🔓 Đã mở cửa nhà hàng')
        fetchRestaurants()
      } else toast.error('Lỗi cập nhật')
    } catch { toast.error('Lỗi kết nối') }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData, categories: formData.categories.split(',').map(c => c.trim()).filter(Boolean) }
      const url = editingId ? `http://localhost:5000/api/restaurants/${editingId}` : 'http://localhost:5000/api/restaurants'
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { toast.success(editingId ? 'Đã cập nhật!' : 'Đã thêm nhà hàng!'); setIsModalOpen(false); fetchRestaurants() }
      else toast.error('Lỗi khi lưu')
    } catch { toast.error('Lỗi kết nối') }
  }

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm('Xóa món ăn này?')) return
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/menu/${itemId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Đã xóa món ăn'); setMenuItems(m => m.filter(x => x._id !== itemId)) }
      else toast.error('Lỗi khi xóa')
    } catch { toast.error('Lỗi kết nối') }
  }

  const handleSaveMenuItem = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...menuForm, price: Number(menuForm.price) }
      const res = editingMenuItem
        ? await fetch(`http://localhost:5000/api/restaurants/menu/${editingMenuItem._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch(`http://localhost:5000/api/restaurants/${selectedRestaurant._id}/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { toast.success(editingMenuItem ? 'Đã cập nhật!' : 'Đã thêm món!'); setIsMenuModalOpen(false); fetchMenuItems(selectedRestaurant._id) }
      else toast.error('Lỗi khi lưu')
    } catch { toast.error('Lỗi kết nối') }
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: '', image: '', cover: '', categories: '', rating: 5.0, deliveryTime: '15-30', distance: 2.5, minOrder: 0, discount: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (r) => {
    setEditingId(r._id)
    setFormData({
      name: r.name || '', image: r.image || '', cover: r.cover || r.image || '',
      categories: r.categories?.join(', ') || '',
      rating: r.rating || 5.0, deliveryTime: r.deliveryTime || '15-30',
      distance: r.distance || 2.5, minOrder: r.minOrder || 0, discount: r.discount || ''
    })
    setIsModalOpen(true)
  }

  const openAddMenuModal = () => {
    setEditingMenuItem(null)
    setMenuForm({ name: '', price: '', image: '', description: '', category: '', popular: false })
    setIsMenuModalOpen(true)
  }

  const openEditMenuModal = (item) => {
    setEditingMenuItem(item)
    setMenuForm({ name: item.name || '', price: item.price || '', image: item.image || '', description: item.description || '', category: item.category || '', popular: item.popular || false })
    setIsMenuModalOpen(true)
  }

  // Filter
  const filtered = restaurants.filter(r => {
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.address?.toLowerCase().includes(search.toLowerCase()) || r.categories?.some(c => c.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === 'all' ? true : filterStatus === 'active' ? r.isActive !== false : r.isActive === false
    return matchSearch && matchStatus
  })

  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.isActive !== false).length,
    locked: restaurants.filter(r => r.isActive === false).length
  }

  // ===== VIEW: MENU MÓN ĂN =====
  if (selectedRestaurant) {
    return (
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedRestaurant(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-200">
              <FiArrowLeft className="text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h3 className="font-bold text-lg dark:text-white">🍽️ {selectedRestaurant.name}</h3>
              <p className="text-sm text-gray-400">Quản lý món ăn & hình ảnh</p>
            </div>
          </div>
          <button onClick={openAddMenuModal} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
            <FiPlus /> Thêm món
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuLoading ? <div className="col-span-full py-10 text-center text-gray-400">Đang tải...</div>
          : menuItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              <FiImage className="mx-auto text-4xl mb-3 opacity-30" /><p>Chưa có món ăn nào</p>
            </div>
          ) : menuItems.map(item => (
            <motion.div key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow bg-white dark:bg-dark-200">
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-dark-300">
                <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'} alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300' }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => openEditMenuModal(item)} className="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg flex items-center gap-1">
                    <FiUpload size={12} /> Thay ảnh
                  </button>
                </div>
                {item.popular && <span className="absolute top-2 left-2 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">🔥 Phổ biến</span>}
              </div>
              <div className="p-3">
                <h4 className="font-bold text-sm dark:text-white line-clamp-1">{item.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary-500 font-bold text-sm">{Number(item.price).toLocaleString()}đ</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEditMenuModal(item)} className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100">
                      <FiEdit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteMenuItem(item._id)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100">
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal Menu Item */}
        <AnimatePresence>
          {isMenuModalOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuModalOpen(false)} />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <button onClick={() => setIsMenuModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24} /></button>
                <h2 className="text-xl font-bold dark:text-white mb-5">{editingMenuItem ? '✏️ Sửa món ăn' : '➕ Thêm món ăn mới'}</h2>
                <form onSubmit={handleSaveMenuItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh</label>
                    {menuForm.image ? (
                      <div className="relative rounded-xl overflow-hidden aspect-video mb-2">
                        <img src={menuForm.image} alt="preview" className="w-full h-full object-cover" onError={e => e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'} />
                        <button type="button" onClick={() => setMenuForm(p => ({ ...p, image: '' }))} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"><FiX size={14} /></button>
                      </div>
                    ) : (
                      <div onClick={() => menuFileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 transition-colors">
                        {uploadingImage ? <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /> : <><FiUpload className="mx-auto text-3xl text-gray-300 mb-2" /><p className="text-sm text-gray-400">Click để tải ảnh</p></>}
                      </div>
                    )}
                    <input ref={menuFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMenuImageUpload} />
                    <input type="url" placeholder="Hoặc nhập URL ảnh..." value={menuForm.image} onChange={e => setMenuForm(p => ({ ...p, image: e.target.value }))}
                      className="w-full mt-2 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên món *</label>
                      <input type="text" required value={menuForm.name} onChange={e => setMenuForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá (đ) *</label>
                      <input type="number" required min="0" value={menuForm.price} onChange={e => setMenuForm(p => ({ ...p, price: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục</label>
                      <input type="text" value={menuForm.category} onChange={e => setMenuForm(p => ({ ...p, category: e.target.value }))} placeholder="Món chính..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                      <textarea rows={2} value={menuForm.description} onChange={e => setMenuForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="popular" checked={menuForm.popular} onChange={e => setMenuForm(p => ({ ...p, popular: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
                      <label htmlFor="popular" className="text-sm text-gray-700 dark:text-gray-300">🔥 Đánh dấu là món phổ biến</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsMenuModalOpen(false)} className="px-5 py-2 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-100">Hủy</button>
                    <button type="submit" disabled={uploadingImage} className="btn-primary py-2 px-6 disabled:opacity-50">{uploadingImage ? 'Đang upload...' : 'Lưu món ăn'}</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ===== VIEW: DANH SÁCH NHÀ HÀNG =====
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng nhà hàng', value: stats.total, icon: '🏪', color: 'bg-blue-50 text-blue-600' },
          { label: 'Đang mở cửa', value: stats.active, icon: '✅', color: 'bg-green-50 text-green-600' },
          { label: 'Đã đóng cửa', value: stats.locked, icon: '🔒', color: 'bg-red-50 text-red-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-xs font-medium opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter + Thêm mới */}
      <div className="bg-white dark:bg-dark-100 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm tên, địa chỉ, danh mục..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-200 text-sm outline-none focus:ring-2 focus:ring-primary-400 dark:text-white" />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: '✅ Mở cửa' },
              { value: 'locked', label: '🔒 Đóng cửa' },
            ].map(f => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  filterStatus === f.value ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={openAddModal} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm whitespace-nowrap">
            <FiPlus /> Thêm mới
          </button>
        </div>
        <p className="text-xs text-gray-400">Hiển thị {filtered.length}/{restaurants.length} nhà hàng</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-10 text-center text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            <FiImage className="text-5xl mx-auto mb-3 opacity-30" /><p>Không tìm thấy nhà hàng nào</p>
          </div>
        ) : filtered.map(restaurant => (
          <div key={restaurant._id}
            className={`border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group relative bg-white dark:bg-dark-200 cursor-pointer ${
              restaurant.isActive === false ? 'border-red-200 dark:border-red-900/50 opacity-75' : 'border-gray-100 dark:border-gray-800'
            }`}
            onClick={() => setSelectedRestaurant(restaurant) || fetchMenuItems(restaurant._id)}
          >
            {restaurant.isActive === false && (
              <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">🔒 Đóng cửa</div>
            )}

            {/* Action buttons */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 z-10">
              <button onClick={e => { e.stopPropagation(); openEditModal(restaurant) }} title="Sửa"
                className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 shadow-lg">
                <FiEdit2 size={13} />
              </button>
              <button onClick={e => { e.stopPropagation(); handleToggleActive(restaurant) }}
                title={restaurant.isActive !== false ? 'Đóng cửa' : 'Mở cửa'}
                className={`w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg ${
                  restaurant.isActive !== false ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                }`}>
                {restaurant.isActive !== false ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
              </button>
              <button onClick={e => { e.stopPropagation(); handleDelete(restaurant._id, restaurant.name) }} title="Xóa"
                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg">
                <FiTrash2 size={13} />
              </button>
            </div>

            <div className="aspect-[4/3] overflow-hidden relative">
              {restaurant.discount && restaurant.discount !== '0' && (
                <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">-{restaurant.discount}</div>
              )}
              <img src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-sm bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2">
                  <FiEye size={14} /> Quản lý món ăn
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold text-base dark:text-white line-clamp-1">{restaurant.name}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  restaurant.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {restaurant.isActive !== false ? 'Mở' : 'Đóng'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{restaurant.categories?.join(' • ')}</p>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><FiStar className="text-yellow-400 fill-yellow-400" size={13} /> {restaurant.rating}</span>
                <span className="flex items-center gap-1"><FiClock size={12} /> {restaurant.deliveryTime}p</span>
                {restaurant.address && <span className="text-xs truncate max-w-[110px]">📍 {restaurant.address}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm/Sửa Nhà hàng */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24} /></button>
              <h2 className="text-2xl font-bold dark:text-white mb-6">{editingId ? 'Sửa nhà hàng' : 'Thêm nhà hàng mới'}</h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh nhà hàng</label>
                  {formData.image ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video mb-2">
                      <img src={formData.image} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(p => ({ ...p, image: '', cover: '' }))}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"><FiX size={14} /></button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-colors mb-2">
                      {uploadingImage ? <p className="text-sm text-gray-400">Đang upload...</p> : <><FiUpload className="mx-auto text-2xl text-gray-300 mb-1" /><p className="text-sm text-gray-400">Click để tải ảnh lên</p></>}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRestaurantImageUpload} />
                  <input type="url" placeholder="Hoặc nhập URL ảnh..." value={formData.image}
                    onChange={e => setFormData(p => ({ ...p, image: e.target.value, cover: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhà hàng *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian giao (phút)</label>
                    <input type="text" required value={formData.deliveryTime} onChange={e => setFormData({ ...formData, deliveryTime: e.target.value })}
                      placeholder="VD: 15-30"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục (cách nhau bằng dấu phẩy) *</label>
                    <input type="text" required value={formData.categories} onChange={e => setFormData({ ...formData, categories: e.target.value })}
                      placeholder="VD: Gà rán, Burger, Đồ ăn nhanh"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đánh giá (1-5)</label>
                    <input type="number" step="0.1" min="1" max="5" value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Khuyến mãi</label>
                    <input type="text" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })}
                      placeholder="VD: Giảm 30K, Freeship 2km"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    <p className="text-xs text-gray-400 mt-1">Text tự do: "30k", "20%", "Freeship"</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-100">Hủy</button>
                  <button type="submit" className="btn-primary py-2 px-6">Lưu nhà hàng</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
