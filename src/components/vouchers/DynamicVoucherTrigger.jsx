import { API_BASE_URL } from '../../config/api.js';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiGift, FiClock, FiCheck } from 'react-icons/fi';
import { applyVoucher, selectCartTotal } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

export default function DynamicVoucherTrigger() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { voucher, items } = useSelector((s) => s.cart);
  const cartTotal = useSelector(selectCartTotal);

  // Settings loaded from DB
  const [settings, setSettings] = useState({
    behavioralEnabled: true,
    behavioralAbandonedCartCode: 'SAVE15',
    behavioralAbandonedCartMin: 100000,
    behavioralFirstOrderCode: 'NEW30',
    behavioralHighValueCode: 'VIP100',
    behavioralHighValueThreshold: 250000
  });

  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          // Merge settings
          setSettings(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (err) {
        console.error('Fetch settings in trigger error:', err);
      }
    };
    fetchSettings();
  }, []);

  // 1. Countdown timer logic when modal is open
  useEffect(() => {
    if (isOpen) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsOpen(false); // Close when expired
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isOpen]);

  // 2. Behavioral Triggers logic (Exit Intent & Inactivity)
  useEffect(() => {
    if (!settings.behavioralEnabled) return;
    if (voucher) return; // If voucher already applied, do nothing
    if (items.length === 0) return; // If cart is empty, do nothing
    if (cartTotal < settings.behavioralAbandonedCartMin) return; // Cart total too low

    // Check if we already showed the abandoned cart modal this session
    const isShown = sessionStorage.getItem('foodserve_abandoned_cart_shown');
    if (isShown) return;

    // Trigger Abandoned Cart Modal
    const triggerModal = () => {
      sessionStorage.setItem('foodserve_abandoned_cart_shown', 'true');
      setIsOpen(true);
      setTimeLeft(300); // Reset timer to 5m
    };

    // A. Inactivity detection: 20 seconds of no movement/input
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        // Double check conditions before showing
        if (!voucher && items.length > 0 && cartTotal >= settings.behavioralAbandonedCartMin) {
          triggerModal();
        }
      }, 20000); // 20 seconds
    };

    // Listeners for inactivity
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);

    // B. Exit Intent detection (cursor leaves viewport at top)
    const handleMouseLeave = (e) => {
      if (e.clientY < 20) { // Cursor near or outside top boundary
        if (!voucher && items.length > 0 && cartTotal >= settings.behavioralAbandonedCartMin) {
          triggerModal();
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    // Initial run
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [settings, items, cartTotal, voucher]);

  // 3. Claim and Auto-apply Voucher action
  const handleClaimVoucher = async () => {
    setLoading(true);
    const code = settings.behavioralAbandonedCartCode;
    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          userId: user?._id || user?.id,
          orderTotal: cartTotal
        })
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        dispatch(applyVoucher({
          code,
          discountAmount: data.discount,
          voucherInfo: data.voucher
        }));
        setIsOpen(false);
        toast.success(`Đã áp dụng mã giảm giá ${code}!`, {
          icon: '🎉',
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: 'bold'
          }
        });
      } else {
        toast.error(data.message || 'Mã voucher không hợp lệ');
      }
    } catch (err) {
      console.error('Claim voucher trigger error:', err);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Helper formatting mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with strong blur */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative bg-white dark:bg-dark-200 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-cinema overflow-hidden text-center"
          >
            {/* Visual background lights */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FiX className="text-xl" />
            </button>

            {/* Icon & Glow */}
            <div className="w-20 h-20 bg-gradient-primary mx-auto rounded-3xl flex items-center justify-center shadow-glow mb-6 relative">
              <div className="absolute inset-0 bg-white/20 rounded-3xl animate-ping opacity-30" />
              <FiGift className="text-white text-4xl" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Đợi đã! Món Ngon Đang Chờ 🎁
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
              Đừng bỏ dở giỏ hàng của bạn! FoodServe tặng riêng bạn ưu đãi giảm giá đặc biệt để hoàn tất đơn hàng ngay lập tức.
            </p>

            {/* Voucher Card Showcase */}
            <div className="my-6 p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-950/10 border-2 border-dashed border-primary-200 dark:border-primary-800 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block">Mã Giảm Giá Độc Quyền</span>
                <span className="font-mono text-2xl font-black text-gray-900 dark:text-white tracking-widest">{settings.behavioralAbandonedCartCode}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block font-semibold">Ưu đãi</span>
                <span className="text-lg font-black text-primary-500">Giảm 15%</span>
              </div>
            </div>

            {/* Dynamic Real-time Countdown Timer */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <FiClock className={timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
              <span className={`text-xs font-bold uppercase tracking-wider ${
                timeLeft <= 60 ? 'text-red-500 animate-pulse font-black' : 'text-gray-400'
              }`}>
                Ưu đãi hết hạn sau: <b className="font-mono text-sm">{formatTime(timeLeft)}</b>
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleClaimVoucher}
                disabled={loading}
                className="w-full py-4 bg-gradient-primary hover:shadow-glow text-white font-black rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Đang áp dụng...' : 'Áp Dụng Mã & Đặt Ngay'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-gray-50 dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-100/80 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs transition-colors"
              >
                Bỏ qua ưu đãi
              </button>
            </div>

            {/* Small terms */}
            <p className="text-[10px] text-gray-400 mt-4 leading-normal">
              * Áp dụng cho giỏ hàng trị giá từ {Number(settings.behavioralAbandonedCartMin).toLocaleString('vi-VN')}đ. Không cộng dồn với mã giảm giá khác.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
