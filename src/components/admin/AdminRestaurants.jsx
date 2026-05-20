import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiClock, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    categories: '',
    rating: 5.0,
    deliveryTime: '15-30',
    distance: 2.5,
    minOrder: 0,
    discount: ''
  })

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/restaurants')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data)
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách nhà hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhà hàng này? Mọi món ăn thuộc nhà hàng cũng sẽ bị xóa!')) return
    try {
      const res = await fetch(`http://localhost:5000/api/restaurants/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Đã xóa nhà hàng')
        setRestaurants(restaurants.filter(r => r._id !== id))
      } else {
        toast.error('Không thể xóa nhà hàng')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        categories: formData.categories.split(',').map(c => c.trim()).filter(Boolean)
      }

      if (editingId) {
        // Update
        const res = await fetch(`http://localhost:5000/api/restaurants/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          toast.success('Đã cập nhật nhà hàng!')
          setIsModalOpen(false)
          fetchRestaurants()
        } else {
          toast.error('Lỗi khi cập nhật nhà hàng')
        }
      } else {
        // Create
        const res = await fetch('http://localhost:5000/api/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          toast.success('Đã thêm nhà hàng mới!')
          setIsModalOpen(false)
          fetchRestaurants()
        } else {
          toast.error('Lỗi khi tạo nhà hàng')
        }
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({
      name: '', image: '', categories: '', rating: 5.0, deliveryTime: '15-30', distance: 2.5, minOrder: 0, discount: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (restaurant) => {
    setEditingId(restaurant._id)
    setFormData({
      name: restaurant.name || '',
      image: restaurant.image || '',
      categories: restaurant.categories?.join(', ') || '',
      rating: restaurant.rating || 5.0,
      deliveryTime: restaurant.deliveryTime || '15-30',
      distance: restaurant.distance || 2.5,
      minOrder: restaurant.minOrder || 0,
      discount: restaurant.discount || ''
    })
    setIsModalOpen(true)
  }

  return (
    <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg dark:text-white">Danh sách Nhà hàng</h3>
          <p className="text-sm text-gray-400">Quản lý đối tác và thông tin hiển thị</p>
        </div>
        <button onClick={openAddModal} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
          <FiPlus /> Thêm nhà hàng mới
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-gray-400">Đang tải dữ liệu...</div>
        ) : restaurants.map(restaurant => (
          <div key={restaurant._id} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:shadow-lg transition-shadow group relative bg-white dark:bg-dark-200">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
              <button onClick={() => openEditModal(restaurant)} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 shadow-lg" title="Sửa">
                <FiEdit2 size={14} />
              </button>
              <button onClick={() => handleDelete(restaurant._id)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg" title="Xóa">
                <FiTrash2 size={14} />
              </button>
            </div>
            
            <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 relative">
              {restaurant.discount && restaurant.discount !== '0' && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
                  {String(restaurant.discount).includes('%') || String(restaurant.discount).toUpperCase().includes('K') 
                    ? `-${restaurant.discount}` 
                    : `-${restaurant.discount}K`}
                </div>
              )}
              <img src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            
            <h4 className="font-bold text-lg dark:text-white mb-1 line-clamp-1">{restaurant.name}</h4>
            <p className="text-xs text-gray-400 mb-3">{restaurant.categories?.join(' • ')}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><FiStar className="text-yellow-400 fill-yellow-400" /> {restaurant.rating}</span>
              <span className="flex items-center gap-1"><FiClock /> {restaurant.deliveryTime} phút</span>
            </div>
          </div>
        ))}
        {!loading && restaurants.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">Không có nhà hàng nào.</div>
        )}
      </div>

      {/* Modal Thêm/Sửa Nhà hàng */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <FiX size={24} />
              </button>
              
              <h2 className="text-2xl font-bold dark:text-white mb-6">
                {editingId ? 'Sửa nhà hàng' : 'Thêm nhà hàng mới'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhà hàng</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Hình ảnh</label>
                    <input type="url" required value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục (cách nhau bằng dấu phẩy)</label>
                    <input type="text" required value={formData.categories} onChange={e => setFormData({...formData, categories: e.target.value})} placeholder="VD: Gà rán, Burger, Đồ ăn nhanh" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đánh giá (1-5)</label>
                    <input type="number" step="0.1" min="1" max="5" required value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian giao (phút)</label>
                    <input type="text" required value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} placeholder="VD: 15-30" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Khuyến mãi (VD: 30K hoặc 20%)</label>
                    <input type="text" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">Hủy</button>
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
