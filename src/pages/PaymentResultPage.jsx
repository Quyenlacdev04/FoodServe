import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiHome, FiFileText, FiClock, FiShield } from 'react-icons/fi';
import { clearCart } from '../store/slices/cartSlice';
import { formatPrice } from '../data/mockData';

// Simple confetti effect without external dependency
function createConfetti() {
  const colors = ['#d4952a', '#ecc472', '#10b981', '#3b82f6', '#34d399', '#8b5cf6'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const x = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 2 + 2;
    
    particle.style.cssText = `
      position:absolute; top:-20px; left:${x}%;
      width:${size}px; height:${size}px;
      background:${color}; border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation: confetti-fall ${duration}s ease-in ${delay}s forwards;
      transform: rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(particle);
  }
  
  // Add keyframe animation if not exists
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Cleanup after animation
  setTimeout(() => {
    container.remove();
  }, 4000);
}

// Mô tả lỗi MoMo theo resultCode
const MOMO_ERRORS = {
  '1001': 'Giao dịch thất bại do tài khoản không đủ số dư',
  '1002': 'Giao dịch bị từ chối do nhà phát hành tài khoản',
  '1003': 'Giao dịch bị từ chối do tài khoản đã đạt hạn mức giao dịch',
  '1004': 'Giao dịch thất bại do số tiền vượt quá hạn mức thanh toán',
  '1005': 'URL thanh toán đã hết hạn hoặc đã được thanh toán',
  '1006': 'Giao dịch thất bại do người dùng từ chối xác nhận',
  '1007': 'Giao dịch bị từ chối do tài khoản MoMo không tồn tại',
  '1017': 'Giao dịch bị hủy bởi người dùng',
  '1026': 'Giao dịch bị hạn chế theo chính sách của MoMo',
  '1080': 'Giao dịch thất bại trong quá trình hoàn tiền',
  '1081': 'Giao dịch hoàn tiền bị từ chối',
  '9000': 'Giao dịch đã được xác nhận thành công',
  '8000': 'Giao dịch đang được xử lý',
  '7000': 'Giao dịch đang được khởi tạo',
  '99': 'Lỗi hệ thống, vui lòng thử lại sau'
};

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showDetails, setShowDetails] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Hỗ trợ cả 2 trường hợp:
  // 1. Backend đã xử lý: ?success=true&orderId=...&amount=...
  // 2. MoMo redirect thẳng về frontend: ?partnerCode=MOMO&resultCode=0&orderId=...
  const hasMomoRaw = searchParams.get('partnerCode') === 'MOMO';
  const momoResultCode = searchParams.get('resultCode');

  const isSuccess = hasMomoRaw
    ? String(momoResultCode) === '0'
    : searchParams.get('success') === 'true';

  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') ? Number(searchParams.get('amount')) : 0;
  const transactionId = searchParams.get('transId') || searchParams.get('transactionId') || '';
  const responseCode = hasMomoRaw
    ? momoResultCode || ''
    : searchParams.get('responseCode') || searchParams.get('code') || '';

  useEffect(() => {
    // Nếu MoMo redirect thẳng về (không qua backend), gọi backend cập nhật order
    if (hasMomoRaw && momoResultCode === '0' && orderId) {
      setResolving(true);
      fetch(`/api/payment/momo/confirm-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, transId: transactionId, amount })
      }).finally(() => setResolving(false));
    }

    if (isSuccess) {
      dispatch(clearCart());
      createConfetti();
    }
  }, [isSuccess, dispatch]);

  const getErrorMessage = () => {
    if (responseCode && MOMO_ERRORS[responseCode]) {
      return MOMO_ERRORS[responseCode];
    }
    return 'Thanh toán không thành công. Vui lòng thử lại.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-amber-50 to-emerald-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-300 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-dark-200 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className={`h-2 ${isSuccess 
            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
            : 'bg-gradient-to-r from-red-400 to-rose-500'
          }`} />

          <div className="p-8 text-center">
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-6"
            >
              {isSuccess ? (
                <div className="relative">
                  <motion.div
                    animate={{ 
                      boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 20px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto"
                  >
                    <FiCheckCircle className="text-6xl text-green-500" />
                  </motion.div>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center mx-auto">
                  <FiXCircle className="text-6xl text-red-500" />
                </div>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {isSuccess ? '🎉 Thanh toán thành công!' : '❌ Thanh toán thất bại'}
            </motion.h1>

            {/* Sub message */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 dark:text-gray-400 mb-6"
            >
              {isSuccess 
                ? 'Đơn hàng của bạn đã được thanh toán thành công qua MoMo 💜'
                : getErrorMessage()
              }
            </motion.p>

            {/* Order Details */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {isSuccess && orderId && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-100 dark:to-dark-300 rounded-2xl p-5 mb-6 text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
                      <FiFileText className="text-primary-500" /> Mã đơn hàng
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                      #{orderId.slice(-8).toUpperCase()}
                    </span>
                  </div>

                  {amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">💰 Số tiền</span>
                      <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                        {formatPrice(amount)}
                      </span>
                    </div>
                  )}

                  {transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
                        <FiShield className="text-blue-500" /> Mã giao dịch
                      </span>
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-200 px-2 py-1 rounded">
                        {transactionId}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
                      <FiClock className="text-green-500" /> Thời gian
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date().toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* MoMo badge */}
                  <div className="flex items-center justify-center pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>💜</span>
                      <span>Thanh toán an toàn qua <strong className="text-pink-600 dark:text-pink-400">MoMo</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error details for failed payments */}
              {!isSuccess && responseCode && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 mb-6 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Mã lỗi</span>
                    <span className="font-mono text-red-600 dark:text-red-400 font-bold">{responseCode}</span>
                  </div>
                  {orderId && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Mã đơn hàng</span>
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        #{orderId.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              {isSuccess ? (
                <>
                  <button
                    onClick={() => navigate('/tracking', { state: { orderId } })}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <FiFileText /> Theo dõi đơn hàng
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3.5 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-300 transition-all flex items-center justify-center gap-2"
                  >
                    <FiHome /> Về trang chủ
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all active:scale-[0.98]"
                  >
                    🔄 Thử thanh toán lại
                  </button>
                  <button
                    onClick={() => navigate('/history')}
                    className="w-full py-3.5 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-300 transition-all flex items-center justify-center gap-2"
                  >
                    <FiFileText /> Xem lịch sử đơn hàng
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiHome /> Về trang chủ
                  </button>
                </>
              )}
            </motion.div>

            {/* Support */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-sm text-gray-400 dark:text-gray-500 mt-6"
            >
              Cần hỗ trợ? Liên hệ: <a href="tel:1900555577" className="text-primary-500 hover:underline font-medium">1900 555 577</a>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
