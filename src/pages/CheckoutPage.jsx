import { API_BASE_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clearCart, selectCartTotal } from '../store/slices/cartSlice'
import { updateUser } from '../store/slices/authSlice'
import { formatPrice } from '../data/mockData'
import toast from 'react-hot-toast'
import { FiMapPin, FiCreditCard, FiDollarSign, FiChevronLeft, FiPhone, FiUser, FiTruck, FiEdit2 } from 'react-icons/fi'
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector'
import AddressPickerMap from '../components/map/AddressPickerMap'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, discount } = useSelector((s) => s.cart)
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  const total = useSelector(selectCartTotal)
  
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [deliveryFee, setDeliveryFee] = useState(15000)
  const [deliveryDistance, setDeliveryDistance] = useState(null)
  const [feeLoading, setFeeLoading] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [deliveryCoordinates, setDeliveryCoordinates] = useState(null)
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '', // Always initialize as empty string
    coordinates: null,
    note: ''
  })

  // Sync user data safely
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: String(user.name || ''),
        phone: String(user.phone || '')
      }));
    }
  }, [user]);

  // Check maintenance mode on mount
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`)
        if (res.ok) {
          const data = await res.json()
          setIsMaintenance(!!data.maintenanceMode)
        }
      } catch (err) {
        // Ignore
      }
    }
    checkMaintenance()
  }, [])

  // Redirect to home if cart is empty
  useEffect(() => {
    if (items.length === 0 && !loading) {
      toast.error('Giỏ hàng trống! Vui lòng chọn món trước khi thanh toán.', { id: 'empty-cart' })
      navigate('/')
    }
  }, [items, navigate, loading])

  const finalTotal = Math.max(0, total + deliveryFee - (discount || 0))

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Tính phí giao hàng theo km khi địa chỉ thay đổi
  useEffect(() => {
    const restaurantId = items[0]?.restaurantId
    if (!formData.address || formData.address.length < 10 || !restaurantId) return

    const timer = setTimeout(async () => {
      setFeeLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/restaurants/calculate-fee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, deliveryAddress: formData.address })
        })
        const data = await res.json()
        setDeliveryFee(data.deliveryFee || 15000)
        setDeliveryDistance(data.distance || null)
      } catch {
        setDeliveryFee(15000)
      } finally {
        setFeeLoading(false)
      }
    }, 1000) // Debounce 1 giây

    return () => clearTimeout(timer)
  }, [formData.address, items])

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (isMaintenance) {
      return toast.error('Hệ thống đang bảo trì, không thể đặt hàng lúc này!')
    }
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
          quantity: item.quantity,
          image: item.image
        })),
        totalAmount: total,
        discount: discount || 0,
        deliveryFee: deliveryFee,
        finalAmount: finalTotal,
        paymentMethod: paymentMethod,
        deliveryAddress: formData.address,
        deliveryLocation: formData.coordinates ? {
          lat: formData.coordinates.lat,
          lng: formData.coordinates.lng,
          address: formData.address
        } : null,
        contactPhone: formData.phone,
        note: formData.note
      }

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!res.ok) throw new Error('Lỗi khi tạo đơn hàng')
      
      const newOrder = await res.json()
      
      // Xử lý theo phương thức thanh toán
      if (paymentMethod === 'momo') {
        // Thanh toán MoMo
        const paymentRes = await fetch(`${API_BASE_URL}/api/payment/momo/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: newOrder._id,
            amount: finalTotal
          })
        })
        
        const paymentData = await paymentRes.json()
        
        if (paymentData.paymentUrl) {
          // Redirect đến MoMo
          window.location.href = paymentData.paymentUrl
          return
        } else {
          throw new Error(paymentData.message || 'Không thể tạo URL thanh toán MoMo')
        }
      } else if (paymentMethod === 'payos') {
        // Thanh toán qua PayOS (VietQR chuyển khoản)
        const paymentRes = await fetch(`${API_BASE_URL}/api/payment/payos/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: newOrder._id,
            amount: finalTotal
          })
        })
        
        const paymentData = await paymentRes.json()
        
        if (paymentData.success && paymentData.paymentUrl) {
          // Redirect đến trang checkout PayOS
          toast.loading('Đang chuyển hướng tới cổng thanh toán PayOS...', { duration: 2000 })
          window.location.href = paymentData.paymentUrl
          return
        } else {
          throw new Error(paymentData.message || 'Không thể tạo liên kết thanh toán PayOS')
        }
      } else if (paymentMethod === 'coins') {
        // Thanh toán bằng Xu
        const coinsRes = await fetch(`${API_BASE_URL}/api/payment/coins/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id,
            orderId: newOrder._id,
            amount: finalTotal
          })
        })
        
        const coinsData = await coinsRes.json()
        
        if (!coinsData.success) {
          throw new Error(coinsData.message || 'Thanh toán bằng Xu thất bại')
        }
        
        // Cập nhật số Xu trong Redux
        dispatch(updateUser({ coins: coinsData.coinsRemaining }))
      }
      
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
      toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại!')
      setLoading(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50 dark:bg-dark-300">

      {/* Map Picker Modal */}
      <AnimatePresence>
        {showMapPicker && (
          <AddressPickerMap
            value={formData.address}
            onChange={(addressText, coords) => {
              // Ensure addressText is always a string
              const safeAddress = typeof addressText === 'string' ? addressText : String(addressText || '');
              setFormData(p => ({ 
                ...p, 
                address: safeAddress,
                coordinates: coords ? { lat: coords[0], lng: coords[1] } : null
              }));
              setDeliveryCoordinates(coords); // Save coordinates [lat, lng]
            }}
            onClose={() => setShowMapPicker(false)}
          />
        )}
      </AnimatePresence>
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
                {/* Tên */}
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                    placeholder="Tên người nhận"
                    className="input-search pl-11 w-full bg-dark-200" required />
                </div>
                {/* SĐT */}
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    placeholder="Số điện thoại"
                    className="input-search pl-11 w-full bg-dark-200" required />
                </div>

                {/* ĐỊA CHỈ — nút mở map picker */}
                <div className="md:col-span-2 space-y-2">
                  {formData.address ? (
                    // Đã chọn địa chỉ → hiển thị + nút đổi
                    <div className="flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl p-3.5">
                      <FiMapPin className="text-primary-500 mt-0.5 shrink-0" size={16} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-0.5">Địa chỉ giao hàng</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                          {typeof formData.address === 'string' ? formData.address : String(formData.address || '')}
                        </p>
                        {deliveryDistance && !feeLoading && (
                          <p className="text-xs text-primary-500 font-medium mt-1">
                            📍 {deliveryDistance} km — Phí ship: <b>{formatPrice(deliveryFee)}</b>
                            <span className="text-gray-400 ml-1">(5.000đ/km)</span>
                          </p>
                        )}
                        {feeLoading && (
                          <p className="text-xs text-gray-400 animate-pulse mt-1">🔄 Đang tính phí...</p>
                        )}
                      </div>
                      <button onClick={() => setShowMapPicker(true)}
                        className="shrink-0 text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 bg-white dark:bg-dark-100 px-2.5 py-1.5 rounded-lg border border-primary-200 transition-colors">
                        <FiEdit2 size={12} /> Đổi
                      </button>
                    </div>
                  ) : (
                    // Chưa chọn → nút lớn mở map
                    <button onClick={() => setShowMapPicker(true)}
                      className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-400 hover:bg-primary-50/5 dark:hover:border-primary-500 transition-all group">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                        <FiMapPin className="text-primary-500" size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Chọn địa chỉ giao hàng</p>
                        <p className="text-xs text-gray-400 mt-0.5">Tìm kiếm hoặc ghim trên bản đồ</p>
                      </div>
                      <FiMapPin className="ml-auto text-gray-300 group-hover:text-primary-400 transition-colors" size={16} />
                    </button>
                  )}
                </div>

                {/* Ghi chú */}
                <div className="relative md:col-span-2">
                  <input type="text" name="note" value={formData.note} onChange={handleInputChange}
                    placeholder="💬 Ghi chú cho tài xế (cổng sau, tầng 3, gọi trước...)"
                    className="input-search px-4 w-full bg-dark-200" />
                </div>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <PaymentMethodSelector
                onSelect={setPaymentMethod}
                selectedMethod={paymentMethod}
                userCoins={user?.coins || 0}
                totalAmount={finalTotal}
              />
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
                  <span className="flex items-center gap-1">
                    <FiTruck />
                    Phí giao hàng
                    {deliveryDistance && (
                      <span className="text-xs text-primary-400">({deliveryDistance}km)</span>
                    )}
                  </span>
                  <span>
                    {feeLoading ? (
                      <span className="text-xs text-gray-400 animate-pulse">Đang tính...</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
                {(discount || 0) > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Giảm giá khuyến mãi</span>
                    <span>-{formatPrice(discount || 0)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 flex justify-between items-end">
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400 text-sm mb-1">Tổng thanh toán</span>
                    <span className="text-2xl font-bold text-primary-500">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {isMaintenance ? (
                <div className="mt-6 space-y-3">
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold text-center">
                    🔧 Hệ thống đang bảo trì. Vui lòng quay lại sau!
                  </div>
                  <button
                    disabled
                    className="w-full py-4 text-center text-lg font-bold rounded-2xl bg-gray-300 dark:bg-dark-300 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  >
                    Tạm đóng đặt hàng
                  </button>
                </div>
              ) : (
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
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
