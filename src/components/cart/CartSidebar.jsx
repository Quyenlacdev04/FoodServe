import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMinus, FiPlus, FiTrash2, FiTag, FiCheck } from 'react-icons/fi'
import { closeCart, removeFromCart, updateQuantity, applyVoucher, removeVoucher, selectCartTotal, selectCartCount } from '../../store/slices/cartSlice'
import { formatPrice } from '../../data/mockData'
import toast from 'react-hot-toast'

export default function CartSidebar() {
  const dispatch = useDispatch()
  const { items, isOpen, voucher, discount } = useSelector((s) => s.cart)
  const { user } = useSelector((s) => s.auth)
  const total = useSelector(selectCartTotal)
  const count = useSelector(selectCartCount)
  const navigate = useNavigate()
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)

  const deliveryFee = total > 100000 ? 0 : 15000
  const finalTotal = Math.max(0, total + deliveryFee - (discount || 0))

  // Validate voucher qua API
  const handleApplyVoucher = async (code) => {
    const c = (code || voucherCode).trim().toUpperCase()
    if (!c) {
      toast.error('Vui lòng nhập mã voucher', { icon: '⚠️' })
      return
    }
    
    setVoucherLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c, userId: user?._id || user?.id, orderTotal: total })
      })
      const data = await res.json()
      
      if (res.ok && data.valid) {
        dispatch(applyVoucher({ code: c, discountAmount: data.discount, voucherInfo: data.voucher }))
        setVoucherCode('')
        toast.success(data.message || `Áp dụng mã ${c} thành công!`, { 
          icon: '🎉',
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: 'bold'
          }
        })
      } else {
        // Hiển thị thông báo lỗi từ server với style nổi bật
        const errorIcon = data.shortage ? '💰' : '❌'
        toast.error(data.message || 'Mã voucher không hợp lệ', { 
          icon: errorIcon,
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: 'bold',
            maxWidth: '400px'
          }
        })
      }
    } catch (error) {
      console.error('Voucher validation error:', error)
      toast.error('Không thể kết nối đến server. Vui lòng thử lại!', { 
        icon: '⚠️',
        duration: 4000
      })
    } finally {
      setVoucherLoading(false)
    }
  }

  const handleCheckout = () => {
    dispatch(closeCart())
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay with blur */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
          />
          {/* Slide panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-dark-200 z-50 shadow-cinema flex flex-col border-l border-gray-100 dark:border-white/5"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-xl font-display font-black text-gray-900 dark:text-white flex items-center gap-2">
                🛒 Giỏ hàng <span className="text-gradient-premium">({count})</span>
              </h2>
              <button 
                onClick={() => dispatch(closeCart())} 
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <span className="text-6xl mb-4 filter drop-shadow-md">🛒</span>
                  <p className="text-gray-900 dark:text-white text-lg font-bold">Giỏ hàng trống</p>
                  <p className="text-gray-400 mt-1.5 font-medium max-w-xs">Chọn món ăn bạn yêu thích để thêm vào giỏ hàng ngay!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, scale: 0.9 }}
                      className="flex gap-4 p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-100 border border-gray-100/50 dark:border-white/5 shadow-sm"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm border border-gray-100 dark:border-white/5" 
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                          <p className="text-primary-500 font-sans font-black text-sm mt-1">{formatPrice(item.price)}</p>
                        </div>
                        
                        {/* Quantity controller */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-primary-500 transition-colors shadow-sm"
                          >
                            <FiMinus className="text-xs text-gray-600 dark:text-gray-300" />
                          </button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-sm font-black w-6 text-center text-gray-800 dark:text-white"
                          >
                            {item.quantity}
                          </motion.span>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                            className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-sm"
                          >
                            <FiPlus className="text-xs" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 self-start transition-all"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer Summary & Vouchers */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-white/5 p-5 space-y-4 bg-gray-50/30 dark:bg-dark-100/10">
                {/* Apply Voucher Code */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-dark-100 dark:text-white focus:border-primary-500 focus:outline-none transition-all shadow-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleApplyVoucher(voucherCode)}
                    disabled={voucherLoading}
                    className="px-5 py-3 bg-gradient-primary text-white text-sm font-bold rounded-2xl hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {voucherLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
                
                {/* Available user Vouchers Selection list */}
                {!voucher && user?.vouchers?.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Kho Voucher của bạn:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar">
                      {user.vouchers.map(v => (
                        <button 
                          key={v} 
                          onClick={() => handleApplyVoucher(v)}
                          disabled={voucherLoading}
                          className="text-xs px-3 py-1.5 rounded-xl border border-primary-200/50 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Applied Voucher state banner */}
                {voucher && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 border border-green-200/30 p-3 rounded-2xl">
                    <span className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-1.5">
                      <FiCheck className="text-lg" /> {voucher.label}
                    </span>
                    <button 
                      onClick={() => dispatch(removeVoucher())} 
                      className="text-red-500 hover:text-red-600 text-xs font-black hover:underline"
                    >
                      Gỡ mã
                    </button>
                  </div>
                )}

                {/* Summary calculation breakdown */}
                <div className="space-y-2.5 text-sm border-t border-gray-100 dark:border-white/5 pt-4">
                  <div className="flex justify-between font-medium text-gray-500 dark:text-gray-400">
                    <span>Tạm tính</span>
                    <span className="font-sans font-bold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-500 dark:text-gray-400">
                    <span>Phí giao hàng</span>
                    <span>{deliveryFee === 0 ? <span className="text-green-500 font-bold">Miễn phí</span> : <span className="font-sans font-bold">{formatPrice(deliveryFee)}</span>}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-medium text-green-500">
                      <span>Giảm giá</span>
                      <span className="font-sans font-bold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-white/5">
                    <span>Tổng cộng</span>
                    <span className="text-primary-500 font-sans text-lg">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <motion.button
                  onClick={handleCheckout}
                  whileTap={{ scale: 0.97 }}
                  className="w-full btn-primary py-4 text-center text-base font-black shadow-glow-lg flex items-center justify-center gap-2"
                >
                  Thanh toán • {formatPrice(finalTotal)}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
