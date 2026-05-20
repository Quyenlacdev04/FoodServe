import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { clearCart, selectCartTotal } from '../store/slices/cartSlice'
import { updateUser } from '../store/slices/authSlice'
import { formatPrice } from '../data/mockData'
import toast from 'react-hot-toast'
import { FiMapPin, FiCreditCard, FiDollarSign, FiChevronLeft, FiPhone, FiUser, FiTruck } from 'react-icons/fi'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, discount } = useSelector((s) => s.cart)
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  const total = useSelector(selectCartTotal)
  
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    note: ''
  })

  // Redirect to home if cart is empty
  useEffect(() => {
    if (items.length === 0 && !loading) {
      toast.error('Giỏ hàng trống! Vui lòng chọn món trước khi thanh toán.', { id: 'empty-cart' })
      navigate('/')
    }
  }, [items, navigate, loading])

  const deliveryFee = total > 100000 ? 0 : 15000
  const finalTotal = Math.max(0, total + deliveryFee - discount)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      return toast.error('Vui lòng đăng nhập để đặt hàng!')
    }
    if (!formData.address) {
      return toast.error('Vui lòng nhập địa chỉ giao hàng!')
    }
    
    setLoading(true)
    
    try {
      const orderData = {
        userId: user?._id || user?.id || 'demo_user',
        restaurantId: items[0]?.restaurantId || 'unknown',
        items: items.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        discount: discount,
        deliveryFee: deliveryFee,
        finalAmount: finalTotal,
        paymentMethod: paymentMethod,
        deliveryAddress: formData.address,
        contactPhone: formData.phone,
        note: formData.note
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!res.ok) throw new Error('Lỗi khi tạo đơn hàng')
      
      const newOrder = await res.json()
      
      setLoading(false)
      dispatch(clearCart())
      if (user) {
        // Cập nhật Redux state để Header tự động đổi hạng (DB đã được cập nhật bởi order API)
        dispatch(updateUser({ 
          spins: (user.spins || 0) + 1, 
          totalSpent: (user.totalSpent || 0) + finalTotal 
        }))
      }
      toast.success('🎉 Đặt hàng thành công! Bạn nhận được 1 lượt Quay May Mắn!', { duration: 4000 })
      navigate('/tracking', { state: { orderId: newOrder._id } })
    } catch (error) {
      console.error('Checkout Error:', error)
      toast.error('Có lỗi xảy ra, vui lòng thử lại!')
      setLoading(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50 dark:bg-dark-300">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white dark:bg-dark-200 rounded-xl shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors"
          >
            <FiChevronLeft className="text-xl dark:text-white" />
          </button>
          <h1 className="text-2xl md:text-3xl font-display font-bold dark:text-white">Thanh toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Delivery Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                <FiMapPin className="text-primary-500" /> Thông tin giao hàng
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" name="name"
                    value={formData.name} onChange={handleInputChange}
                    placeholder="Tên người nhận"
                    className="input-search pl-11 w-full bg-gray-50"
                    required
                  />
                </div>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel" name="phone"
                    value={formData.phone} onChange={handleInputChange}
                    placeholder="Số điện thoại"
                    className="input-search pl-11 w-full bg-gray-50"
                    required
                  />
                </div>
                <div className="relative md:col-span-2">
                  <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                  <textarea
                    name="address"
                    value={formData.address} onChange={handleInputChange}
                    placeholder="Địa chỉ giao hàng chi tiết (Số nhà, tên đường, phường/xã...)"
                    className="input-search pl-11 w-full min-h-[100px] resize-none bg-gray-50 py-3"
                    required
                  ></textarea>
                </div>
                <div className="relative md:col-span-2">
                  <input
                    type="text" name="note"
                    value={formData.note} onChange={handleInputChange}
                    placeholder="Ghi chú cho tài xế (Tùy chọn)"
                    className="input-search px-4 w-full bg-gray-50"
                  />
                </div>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-white">
                <FiCreditCard className="text-primary-500" /> Phương thức thanh toán
              </h2>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-100'}`}>
                  <input 
                    type="radio" name="payment" value="cash" 
                    checked={paymentMethod === 'cash'} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><FiDollarSign /></div>
                  <div>
                    <h3 className="font-semibold dark:text-white">Thanh toán tiền mặt</h3>
                    <p className="text-sm text-gray-500">Thanh toán khi nhận hàng (COD)</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-100'}`}>
                  <input 
                    type="radio" name="payment" value="momo" 
                    checked={paymentMethod === 'momo'} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="w-10 h-10 rounded-full bg-[#A50064] flex items-center justify-center text-white font-bold shrink-0">M</div>
                  <div>
                    <h3 className="font-semibold dark:text-white">Ví MoMo</h3>
                    <p className="text-sm text-gray-500">Thanh toán an toàn qua ví điện tử</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-100'}`}>
                  <input 
                    type="radio" name="payment" value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><FiCreditCard /></div>
                  <div>
                    <h3 className="font-semibold dark:text-white">Thẻ tín dụng/Ghi nợ</h3>
                    <p className="text-sm text-gray-500">Visa, Mastercard, JCB</p>
                  </div>
                </label>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 sticky top-24"
            >
              <h2 className="text-lg font-bold mb-4 dark:text-white">Tổng quan đơn hàng</h2>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold text-primary-500">{item.quantity}x</span>
                      <span className="dark:text-gray-200 line-clamp-2">{item.name}</span>
                    </div>
                    <span className="font-medium dark:text-white shrink-0 ml-2">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 mt-6 pt-4 space-y-3">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Tạm tính</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><FiTruck /> Phí giao hàng</span>
                  <span>{deliveryFee === 0 ? <span className="text-green-500">Miễn phí</span> : formatPrice(deliveryFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Giảm giá khuyến mãi</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 flex justify-between items-end">
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400 text-sm mb-1">Tổng thanh toán</span>
                    <span className="text-2xl font-bold text-primary-500">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full btn-primary py-4 mt-6 text-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Đặt hàng ngay'
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
