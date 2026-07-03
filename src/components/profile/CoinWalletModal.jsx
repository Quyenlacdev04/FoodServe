import { API_BASE_URL, SOCKET_URL } from '../../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiX, FiPlusCircle, FiDollarSign, FiClock, FiCheckCircle, 
  FiAlertCircle, FiArrowUpRight, FiArrowDownLeft, FiRefreshCw 
} from 'react-icons/fi'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { formatPrice } from '../../data/mockData'
import { updateUser } from '../../store/slices/authSlice'

const TOPUP_PACKAGES = [
  { amount: 20000, coins: 20, tag: 'Gói cơ bản' },
  { amount: 50000, coins: 50, tag: 'Gói khuyên dùng', popular: true },
  { amount: 100000, coins: 100, tag: 'Gói tiết kiệm' },
  { amount: 200000, coins: 200, tag: 'Gói vàng' },
  { amount: 500000, coins: 500, tag: 'Gói VIP' }
]

export default function CoinWalletModal({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  
  const [activeSubTab, setActiveSubTab] = useState('topup') // 'topup' | 'history'
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const [selectedPackage, setSelectedPackage] = useState(TOPUP_PACKAGES[1])
  const [paymentMethod, setPaymentMethod] = useState('payos') // 'payos' | 'momo'
  const [submitting, setSubmitting] = useState(false)

  // Demo QR code transfer states
  const [demoQRData, setDemoQRData] = useState(null)
  const [checkingDemoStatus, setCheckingDemoStatus] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?._id) return

    fetchHistory()

    // Realtime topup socket listener
    const socket = io(SOCKET_URL)
    socket.emit('join-user', user._id || user.id)

    socket.on('topup-success', (data) => {
      toast.success(data.message || `Nạp thành công +${data.coinsAdded} Xu!`, {
        icon: '🪙',
        duration: 5000
      })
      // Play a sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-200.wav')
        audio.play().catch(() => {})
      } catch {}

      dispatch(updateUser({ coins: data.coins }))
      fetchHistory()
      setDemoQRData(null)
      onClose()
    })

    return () => {
      socket.disconnect()
    }
  }, [isOpen, user?._id])

  const fetchHistory = async () => {
    if (!user?._id) return
    try {
      setLoadingHistory(true)
      const res = await fetch(`${API_BASE_URL}/api/payment/coins/history/${user._id || user.id}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCreateTopup = async () => {
    if (!user?._id) return
    try {
      setSubmitting(true)
      const res = await fetch(`${API_BASE_URL}/api/payment/coins/create-topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id || user.id,
          amount: selectedPackage.amount,
          paymentMethod
        })
      })

      const data = await res.json()
      if (res.ok) {
        if (data.isDemo) {
          // Hiển thị mã QR giả lập
          setDemoQRData(data)
          toast.success('Đã tạo thông tin chuyển khoản (Chế độ giả lập)')
        } else if (data.paymentUrl) {
          // Redirect to MoMo / PayOS gateway
          toast.loading('Đang chuyển hướng tới cổng thanh toán...')
          window.location.href = data.paymentUrl
        }
      } else {
        toast.error(data.message || 'Lỗi khi tạo yêu cầu nạp xu')
      }
    } catch (e) {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckDemoStatus = async () => {
    if (!demoQRData?.orderCode) return
    try {
      setCheckingDemoStatus(true)
      const res = await fetch(`${API_BASE_URL}/api/payment/coins/check-topup-status/${demoQRData.orderCode}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Thanh toán thành công!')
        dispatch(updateUser({ coins: data.coins }))
        fetchHistory()
        setDemoQRData(null)
        onClose()
      } else {
        toast.error(data.message || 'Chưa nhận được giao dịch. Vui lòng quét lại hoặc thử lại sau.')
      }
    } catch (e) {
      toast.error('Lỗi khi kiểm tra trạng thái')
    } finally {
      setCheckingDemoStatus(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative bg-white dark:bg-dark-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl z-10 border border-gray-100 dark:border-gray-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🪙</span>
            <div>
              <h2 className="font-display font-black text-xl leading-none">Ví Xu FoodServe</h2>
              <p className="text-white/80 text-xs mt-1">Dùng Xu để đặt món ăn nhanh chóng, nhận nhiều ưu đãi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Balance Card */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-100/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Số dư hiện tại</p>
            <p className="text-3xl font-black text-yellow-500 dark:text-yellow-400 mt-1 flex items-center gap-1.5">
              {user?.coins || 0} <span className="text-sm font-bold text-gray-400">Xu</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Giá trị quy đổi</p>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-1">
              ~ {((user?.coins || 0) * 1000).toLocaleString('vi-VN')} đ
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => { setActiveSubTab('topup'); setDemoQRData(null); }}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'topup'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🪙 Nạp xu vào ví
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'history'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📋 Lịch sử giao dịch
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[380px] overflow-y-auto">
          {activeSubTab === 'topup' && !demoQRData && (
            <div className="space-y-6">
              {/* Packages List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Chọn gói nạp Xu
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TOPUP_PACKAGES.map(pkg => (
                    <button
                      key={pkg.amount}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative rounded-2xl p-4.5 border-2 text-left transition-all hover:scale-[1.01] ${
                        selectedPackage.amount === pkg.amount
                          ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-500/10'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-gray-50/50 dark:bg-dark-100/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xl font-black text-yellow-500 dark:text-yellow-400">
                          +{pkg.coins} <span className="text-xs">Xu</span>
                        </span>
                        {pkg.popular && (
                          <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Hot
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2">
                        {pkg.amount.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{pkg.tag}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Chọn cổng thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setPaymentMethod('payos')}
                    className={`rounded-2xl p-4 border-2 flex items-center justify-between text-left transition-all ${
                      paymentMethod === 'payos'
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-100 dark:border-gray-800 text-gray-500'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">Chuyển khoản VietQR</div>
                      <div className="text-[10px] text-gray-400">Thanh toán bằng QR ngân hàng</div>
                    </div>
                    <span className="text-lg">🏦</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('momo')}
                    className={`rounded-2xl p-4 border-2 flex items-center justify-between text-left transition-all ${
                      paymentMethod === 'momo'
                        ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'border-gray-100 dark:border-gray-800 text-gray-500'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">Ví MoMo</div>
                      <div className="text-[10px] text-gray-400">Kết nối ví MoMo Sandbox</div>
                    </div>
                    <span className="text-lg">💜</span>
                  </button>
                </div>
              </div>

              {/* Topup Button */}
              <button
                onClick={handleCreateTopup}
                disabled={submitting}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold rounded-2xl text-base shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01]"
              >
                {submitting ? 'Đang tạo yêu cầu nạp...' : `Thanh toán ngay — ${selectedPackage.amount.toLocaleString('vi-VN')} đ`}
              </button>
            </div>
          )}

          {/* Demo Transfer Mode (For local mock or PayOS dev) */}
          {activeSubTab === 'topup' && demoQRData && (
            <div className="space-y-4 text-center">
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs rounded-2xl p-3 font-semibold mb-2">
                ⚠️ Cổng thanh toán thật chưa được cấu hình. Hệ thống đang chạy ở chế độ **GIẢ LẬP DEMO**.
              </div>
              
              <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                {/* Custom QR code generation via QuickChart QR API */}
                <img 
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(`24/7 Transfer`)}&size=150`} 
                  alt="VietQR Demo"
                  className="w-36 h-36 rounded-2xl bg-white p-2 shadow-card"
                />
                
                <div className="w-full mt-4 space-y-2 text-left text-xs bg-white dark:bg-dark-200 border border-gray-100 dark:border-gray-800 rounded-2xl p-3.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ngân hàng:</span>
                    <span className="font-bold dark:text-white">Techcombank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số tài khoản:</span>
                    <span className="font-bold dark:text-white">{demoQRData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tên thụ hưởng:</span>
                    <span className="font-bold dark:text-white uppercase">{demoQRData.accountName}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-100 dark:border-gray-800 pt-2 mt-2">
                    <span className="text-gray-400">Số tiền:</span>
                    <span className="font-black text-sm text-red-500">{demoQRData.amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nội dung chuyển khoản:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg font-mono">
                      {demoQRData.description}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDemoQRData(null)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 font-bold rounded-2xl text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCheckDemoStatus}
                  disabled={checkingDemoStatus}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-green-500/25 flex items-center justify-center gap-1.5"
                >
                  <FiCheckCircle size={15} /> {checkingDemoStatus ? 'Đang kiểm tra...' : 'Xác nhận đã chuyển'}
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'history' && (
            <div className="space-y-2">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FiClock className="text-4xl mx-auto mb-2 text-gray-300" />
                  Bạn chưa thực hiện giao dịch nào
                </div>
              ) : (
                history.map(tx => {
                  const isPlus = tx.type === 'topup' || tx.type === 'refund'
                  const txDate = new Date(tx.createdAt).toLocaleString('vi-VN', { 
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })
                  
                  return (
                    <div 
                      key={tx._id}
                      className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-dark-100 rounded-2xl border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                          isPlus 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {isPlus ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                        </div>
                        <div>
                          <div className="text-xs font-black dark:text-white">
                            {tx.type === 'topup' ? 'Nạp xu qua ví' : 
                             tx.type === 'spend' ? 'Thanh toán đơn hàng' :
                             tx.type === 'refund' ? 'Hoàn xu đơn hàng' : 'Nhận thưởng'}
                          </div>
                          <div className="text-[10px] text-gray-400">{txDate}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${isPlus ? 'text-green-500' : 'text-red-500'}`}>
                          {isPlus ? '+' : '-'}{tx.coins} Xu
                        </div>
                        <div className="text-[9px] text-gray-400 font-mono">
                          {tx.status === 'completed' ? (
                            <span className="text-green-500 font-semibold">Thành công</span>
                          ) : tx.status === 'pending' ? (
                            <span className="text-yellow-500 font-semibold">Đang xử lý</span>
                          ) : (
                            <span className="text-red-500 font-semibold">Thất bại</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
