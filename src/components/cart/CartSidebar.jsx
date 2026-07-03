import { API_BASE_URL } from '../../config/api.js'
import { useState, useEffect } from 'react'
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
  const { healthyMode } = useSelector((s) => s.ui)
  const total = useSelector(selectCartTotal)
  const count = useSelector(selectCartCount)
  const navigate = useNavigate()
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [isMaintenance, setIsMaintenance] = useState(false)

  // Tính toán tổng dinh dưỡng của các sản phẩm trong giỏ hàng
  const cartNutrition = items.reduce((acc, item) => {
    const cal = item.calories || 0;
    const prot = item.protein || 0;
    const carb = item.carbs || 0;
    const f = item.fat || 0;
    
    acc.calories += cal * item.quantity;
    acc.protein += prot * item.quantity;
    acc.carbs += carb * item.quantity;
    acc.fat += f * item.quantity;
    if (item.isHealthy) acc.healthyCount += item.quantity;
    
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, healthyCount: 0 });

  const calorieTarget = user?.dailyCalorieTarget || 2000;
  const proteinTarget = user?.dailyProteinTarget || 130;
  const carbsTarget = user?.dailyCarbsTarget || 220;
  const fatTarget = user?.dailyFatTarget || 65;

  let healthTip = "Hãy bổ sung thêm rau xanh hoặc giảm tinh bột để bữa ăn cân bằng hơn.";
  let tipColor = "text-amber-600 dark:text-amber-400 bg-amber-500/5";
  if (cartNutrition.calories === 0) {
    healthTip = "Bật Chế độ Healthy để xem thông tin dinh dưỡng chi tiết.";
  } else if (cartNutrition.healthyCount > 0 && cartNutrition.calories < 800 && cartNutrition.fat < 20) {
    healthTip = "🌟 Lựa chọn tuyệt vời! Đơn hàng của bạn rất sạch, ít béo và giàu dinh dưỡng.";
    tipColor = "text-green-600 dark:text-green-400 bg-green-500/5";
  } else if (cartNutrition.calories > 1000) {
    healthTip = "⚠️ Lượng Calo đơn hàng khá cao (vượt 50% nhu cầu ngày). Hãy cân nhắc chia nhỏ phần ăn nhé!";
    tipColor = "text-red-500 dark:text-red-400 bg-red-500/5";
  } else if (cartNutrition.protein > 35) {
    healthTip = "💪 Bữa ăn giàu đạm cao cấp, rất phù hợp để phục hồi và phát triển cơ bắp!";
    tipColor = "text-primary-600 dark:text-primary-400 bg-primary-500/5";
  }

  useEffect(() => {
    if (!isOpen) return
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
  }, [isOpen])

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
      const res = await fetch(`${API_BASE_URL}/api/vouchers/validate`, {
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

              {/* BÁO CÁO DINH DƯỠNG GIỎ HÀNG (HEALTHY MODE) */}
              {healthyMode && items.length > 0 && cartNutrition.calories > 0 && (
                <div className="mt-6 p-4 rounded-3xl bg-green-500/5 dark:bg-green-500/10 border border-green-500/15 space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-green-700 dark:text-green-400 flex items-center gap-1">
                      🥗 Báo cáo Dinh dưỡng Giỏ hàng
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">Mục tiêu ngày</span>
                  </div>

                  {/* Calories Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-750 dark:text-gray-300">
                      <span>Năng lượng: <b className="text-green-600 font-sans">{cartNutrition.calories} / {calorieTarget} kcal</b></span>
                      <span>{Math.round((cartNutrition.calories / calorieTarget) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          cartNutrition.calories > calorieTarget ? 'bg-red-500' : 'bg-green-500'
                        }`} 
                        style={{ width: `${Math.min(100, (cartNutrition.calories / calorieTarget) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Macros grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* Protein */}
                    <div className="bg-white/60 dark:bg-dark-200/50 p-2 border border-green-500/5 rounded-xl">
                      <span className="text-[8px] text-gray-400 font-bold block uppercase leading-none">Đạm (Protein)</span>
                      <span className="text-xs font-black text-gray-800 dark:text-white font-sans block mt-1">{cartNutrition.protein}g / {proteinTarget}g</span>
                      <div className="w-full h-1 bg-gray-150 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (cartNutrition.protein / proteinTarget) * 100)}%` }} />
                      </div>
                    </div>
                    {/* Carbs */}
                    <div className="bg-white/60 dark:bg-dark-200/50 p-2 border border-green-500/5 rounded-xl">
                      <span className="text-[8px] text-gray-400 font-bold block uppercase leading-none">Carb (Tinh bột)</span>
                      <span className="text-xs font-black text-gray-800 dark:text-white font-sans block mt-1">{cartNutrition.carbs}g / {carbsTarget}g</span>
                      <div className="w-full h-1 bg-gray-150 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (cartNutrition.carbs / carbsTarget) * 100)}%` }} />
                      </div>
                    </div>
                    {/* Fat */}
                    <div className="bg-white/60 dark:bg-dark-200/50 p-2 border border-green-500/5 rounded-xl">
                      <span className="text-[8px] text-gray-400 font-bold block uppercase leading-none">Béo (Fat)</span>
                      <span className="text-xs font-black text-gray-800 dark:text-white font-sans block mt-1">{cartNutrition.fat}g / {fatTarget}g</span>
                      <div className="w-full h-1 bg-gray-150 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (cartNutrition.fat / fatTarget) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Health Advice Tip */}
                  <div className={`p-2.5 rounded-xl border border-green-500/10 text-[10px] font-bold leading-normal ${tipColor}`}>
                    {healthTip}
                  </div>
                </div>
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

                {/* DYNAMIC VOUCHER & BEHAVIORAL MARKETING SUGGESTIONS */}
                {!voucher && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-dark-100 dark:to-orange-950/10 border border-orange-200/40 p-4 rounded-2xl space-y-3 shadow-sm">
                    {/* A. VIP100 Upsell Target */}
                    {total < 250000 ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                          <span className="flex items-center gap-1">🚀 Cần mua thêm: <b className="text-primary-500 font-sans">{formatPrice(250000 - total)}</b></span>
                          <span className="text-[10px] text-gray-400">Ưu đãi VIP100</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-255/80 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-primary rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (total / 250000) * 100)}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                          Đặt thêm để áp dụng mã <b>VIP100</b> nhận ngay ưu đãi giảm <b>100.000đ</b> cho đơn hàng!
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] bg-green-500 text-white font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Đạt điều kiện</span>
                          <h5 className="font-bold text-sm text-gray-900 dark:text-white mt-1">Sẵn sàng nhận giảm 100k!</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Áp dụng ngay mã VIP100 cực khủng.</p>
                        </div>
                        <button
                          onClick={() => handleApplyVoucher('VIP100')}
                          className="flex-shrink-0 px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-black rounded-xl shadow-md transition-all duration-200"
                        >
                          Áp dụng
                        </button>
                      </div>
                    )}

                    {/* B. First Order Suggestion */}
                    {isAuthenticated && user && (user.totalSpent === 0 || !user.totalSpent) && total >= 100000 && (
                      <div className="pt-2.5 border-t border-gray-200/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] bg-primary-500 text-white font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Quà bạn mới</span>
                          <h5 className="font-bold text-xs text-gray-800 dark:text-white mt-1">Giảm ngay 30k cho bạn mới!</h5>
                        </div>
                        <button
                          onClick={() => handleApplyVoucher('NEW30')}
                          className="flex-shrink-0 px-3 py-1.5 bg-gradient-primary text-white text-[11px] font-black rounded-lg shadow-sm transition-all duration-200"
                        >
                          Dùng mã
                        </button>
                      </div>
                    )}
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
                {isMaintenance ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400 text-xs font-bold text-center">
                      ⚠️ Hệ thống đang bảo trì. Bạn tạm thời không thể đặt đơn hàng mới.
                    </div>
                    <button
                      disabled
                      className="w-full py-4 text-center text-base font-black rounded-2xl bg-gray-300 dark:bg-dark-300 text-gray-500 dark:text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Tạm đóng đặt hàng
                    </button>
                  </div>
                ) : (
                  <motion.button
                    onClick={handleCheckout}
                    whileTap={{ scale: 0.97 }}
                    className="w-full btn-primary py-4 text-center text-base font-black shadow-glow-lg flex items-center justify-center gap-2"
                  >
                    Thanh toán • {formatPrice(finalTotal)}
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
