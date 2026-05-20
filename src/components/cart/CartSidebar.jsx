import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMinus, FiPlus, FiTrash2, FiTag, FiCheck } from 'react-icons/fi'
import { closeCart, removeFromCart, updateQuantity, clearCart, applyVoucher, removeVoucher, selectCartTotal, selectCartCount } from '../../store/slices/cartSlice'
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
  const [showCheckout, setShowCheckout] = useState(false)

  const deliveryFee = total > 100000 ? 0 : 15000
  const finalTotal = Math.max(0, total + deliveryFee - discount)

  const handleCheckout = () => {
    dispatch(closeCart())
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
          />
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-dark-200 z-50 shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-display font-bold dark:text-white">
                🛒 Giỏ hàng <span className="text-primary-500">({count})</span>
              </h2>
              <button onClick={() => dispatch(closeCart())} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                <FiX className="text-xl dark:text-white" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-6xl mb-4">🛒</span>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Giỏ hàng trống</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Thêm món ăn yêu thích nhé!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50, height: 0 }}
                      className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-100"
                    >
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm dark:text-white line-clamp-1">{item.name}</h4>
                        <p className="text-primary-500 font-semibold text-sm mt-1">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-primary-500 transition-colors"
                          >
                            <FiMinus className="text-xs dark:text-white" />
                          </button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 1.4 }}
                            animate={{ scale: 1 }}
                            className="text-sm font-bold w-6 text-center dark:text-white"
                          >
                            {item.quantity}
                          </motion.span>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                            className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                          >
                            <FiPlus className="text-xs" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 self-start"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                {/* Voucher */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-dark-100 dark:text-white focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => { dispatch(applyVoucher(voucherCode)); setVoucherCode('') }}
                    className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
                
                {/* User Vouchers Selection */}
                {!voucher && user?.vouchers?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500 w-full mb-1">Kho Voucher của bạn:</span>
                    {user.vouchers.map(v => (
                      <button 
                        key={v} 
                        onClick={() => dispatch(applyVoucher(v))}
                        className="text-xs px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-600 font-semibold hover:bg-primary-500 hover:text-white transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
                
                {voucher && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2.5 rounded-lg mt-2">
                    <span className="text-green-600 text-sm flex items-center gap-1"><FiCheck /> {voucher.label}</span>
                    <button onClick={() => dispatch(removeVoucher())} className="text-red-400 text-xs font-bold hover:underline">Gỡ mã</button>
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Tạm tính</span><span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Phí giao hàng</span>
                    <span>{deliveryFee === 0 ? <span className="text-green-500">Miễn phí</span> : formatPrice(deliveryFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Giảm giá</span><span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>Tổng cộng</span><span className="text-primary-500">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleCheckout}
                  whileTap={{ scale: 0.97 }}
                  className="w-full btn-primary py-4 text-center text-lg"
                >
                  {`Thanh toán • ${formatPrice(finalTotal)}`}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
