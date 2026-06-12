import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiClock, FiPackage, FiBell, FiX, FiZap } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { formatPrice } from '../../data/mockData';

const ORDER_TIMEOUT = 120; // 2 phút (giây)

// Tính thời gian còn lại của đơn hàng kể từ lúc tạo
function getSecondsLeft(createdAt) {
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  return Math.max(0, ORDER_TIMEOUT - elapsed);
}

// Badge thanh toán
const PaymentBadge = ({ order }) => {
  if (order.paymentMethod === 'cash') return null;
  const isPaid = order.paymentStatus === 'paid';
  const label = { momo: '💜 MoMo', coins: '🪙 Xu', vnpay: '💳 VNPay' }[order.paymentMethod] || order.paymentMethod;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
      {isPaid ? `✅ ${label}` : `⏳ ${label}`}
    </span>
  );
};

// Thanh đếm ngược nhỏ hiển thị trong card đơn hàng
function OrderTimer({ createdAt, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(createdAt));

  useEffect(() => {
    if (secondsLeft <= 0) { onExpire(); return; }
    const t = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(t); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pct = (secondsLeft / ORDER_TIMEOUT) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 30;
  const isWarning = secondsLeft <= 60;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold ${isUrgent ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-gray-400'}`}>
          {isUrgent ? '⚠️ Sắp hết giờ!' : isWarning ? '⏰ Còn ít thời gian' : '⏳ Thời gian nhận đơn'}
        </span>
        <span className={`text-xs font-black font-mono ${isUrgent ? 'text-red-500' : isWarning ? 'text-yellow-600' : 'text-gray-600'}`}>
          {mins}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${isUrgent ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-primary-500'}`}
          initial={{ width: `${(getSecondsLeft(createdAt) / ORDER_TIMEOUT) * 100}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

// Popup đơn mới nổi lên — chỉ hiện khi vừa có đơn mới real-time
function NewOrderPopup({ order, onAccept, onDismiss, accepting }) {
  const [timeLeft, setTimeLeft] = useState(() => getSecondsLeft(order.createdAt || Date.now()));

  useEffect(() => {
    if (timeLeft <= 0) { onDismiss(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const pct = (timeLeft / ORDER_TIMEOUT) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 18 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-primary-500 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div animate={{ rotate: [0, -20, 20, -20, 20, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
            <FiBell className="text-white text-xl" />
          </motion.div>
          <span className="text-white font-bold text-sm">🛒 Đơn hàng mới!</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-black ${timeLeft <= 30 ? 'text-red-200' : 'text-white/80'}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
          <button onClick={onDismiss} className="text-white/70 hover:text-white"><FiX size={16} /></button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Mã đơn</span>
          <span className="font-mono font-bold text-sm">#{String(order._id || '').slice(-8).toUpperCase()}</span>
        </div>
        {order.deliveryAddress && (
          <div className="flex items-start gap-1.5">
            <FiMapPin className="text-primary-500 mt-0.5 flex-shrink-0" size={13} />
            <span className="text-xs text-gray-600 line-clamp-2">{order.deliveryAddress}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">Tổng đơn</span>
          <span className="font-bold text-primary-500">{formatPrice(order.finalAmount || 0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Bạn nhận</span>
          <span className="font-bold text-green-600">🪙 +{Math.ceil((order.deliveryFee || 15000) * 0.9 / 1000)} Xu</span>
        </div>
      </div>

      {/* Nút */}
      <div className="px-4 pb-3 flex gap-2">
        <button onClick={onDismiss}
          className="flex-1 py-2.5 text-sm text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium">
          Bỏ qua
        </button>
        <button onClick={() => onAccept(order._id)} disabled={accepting === order._id}
          className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-orange-400 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1">
          <FiZap size={14} />
          {accepting === order._id ? 'Đang nhận...' : 'Nhận ngay!'}
        </button>
      </div>

      {/* Thanh đếm ngược */}
      <div className="h-1.5 bg-gray-100">
        <motion.div
          initial={{ width: `${(getSecondsLeft(order.createdAt || Date.now()) / ORDER_TIMEOUT) * 100}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          className={`h-full ${timeLeft > 60 ? 'bg-primary-500' : timeLeft > 30 ? 'bg-yellow-400' : 'bg-red-500'}`}
        />
      </div>
    </motion.div>
  );
}

export default function AvailableOrders({ shipperId, onOrderAccepted, isOnline }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const socketRef = useRef(null);

  const fetchAvailableOrders = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders/shipper/available');
      const data = await res.json();
      // Lọc ngay đơn đã quá 2 phút
      const fresh = (Array.isArray(data) ? data : []).filter(o => getSecondsLeft(o.createdAt) > 0);
      setOrders(fresh);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Xóa đơn hết hạn khỏi list
  const handleOrderExpire = useCallback((orderId) => {
    setOrders(prev => prev.filter(o => o._id !== orderId));
  }, []);

  useEffect(() => {
    fetchAvailableOrders();
    const interval = setInterval(fetchAvailableOrders, 30000);

    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('new-order', (order) => {
      if (!isOnline) return;

      // Âm thanh thông báo
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [600, 800, 1000].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.1);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.1);
        });
      } catch {}

      // Thêm vào list + hiện popup
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        return [order, ...prev];
      });
      setNewOrderAlert(order);
    });

    socket.on('payment-confirmed', (data) => {
      toast.success(data.message || 'Khách đã thanh toán!', { icon: '💳', duration: 5000 });
      fetchAvailableOrders();
    });

    // Khi shipper khác nhận đơn → xóa khỏi list
    socket.on('order-status-updated', ({ orderId }) => {
      setOrders(prev => prev.filter(o => o._id !== orderId));
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [isOnline, fetchAvailableOrders]);

  const handleAcceptOrder = async (orderId) => {
    setAccepting(orderId);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/accept-shipper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipperId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Đã nhận đơn hàng!');
        setOrders(prev => prev.filter(o => o._id !== orderId));
        setNewOrderAlert(null);
        if (onOrderAccepted) onOrderAccepted(data.order);
      } else {
        toast.error(data.message || 'Không thể nhận đơn');
      }
    } catch {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setAccepting(null);
    }
  };

  if (!isOnline) {
    return (
      <div className="text-center py-20 space-y-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl"
        >🔴</motion.div>
        <h3 className="text-xl font-bold text-gray-700">Bạn đang Offline</h3>
        <p className="text-gray-500 text-sm">Bật Online để bắt đầu nhận đơn hàng</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        <p className="text-gray-500 text-sm">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Popup đơn mới real-time */}
      <AnimatePresence>
        {newOrderAlert && (
          <NewOrderPopup
            order={newOrderAlert}
            onAccept={handleAcceptOrder}
            onDismiss={() => setNewOrderAlert(null)}
            accepting={accepting}
          />
        )}
      </AnimatePresence>

      {orders.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <FiPackage className="text-6xl text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-600">Chưa có đơn hàng nào</h3>
          <p className="text-gray-400 text-sm">🟢 Đang chờ đơn mới — Sẽ hiện ngay lập tức!</p>
          <button onClick={fetchAvailableOrders}
            className="mt-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors">
            🔄 Làm mới
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">
              📦 Đơn có thể nhận <span className="text-primary-500">({orders.length})</span>
            </h2>
            <button onClick={fetchAvailableOrders}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold transition-colors">
              🔄 Làm mới
            </button>
          </div>

          <AnimatePresence>
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">#{order._id.slice(-8).toUpperCase()}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <FiClock size={11} />
                      <span>{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">{formatPrice(order.finalAmount)}</div>
                    <div className="text-xs text-green-600 font-bold">🪙 +{Math.ceil((order.deliveryFee || 15000) * 0.9 / 1000)} Xu</div>
                    <div className="mt-1"><PaymentBadge order={order} /></div>
                  </div>
                </div>

                {/* Món ăn */}
                {order.items?.length > 0 && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3">
                    <p className="text-xs font-semibold text-gray-400 mb-1">🍽️ {order.items.length} món</p>
                    {order.items.slice(0, 2).map((item, i) => (
                      <p key={i} className="text-xs text-gray-600 truncate">• {item.quantity}x {item.name}</p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-gray-400">+{order.items.length - 2} món khác</p>
                    )}
                  </div>
                )}

                {/* Địa chỉ */}
                <div className="flex items-start gap-2 mb-2">
                  <FiMapPin className="text-primary-400 mt-0.5 shrink-0" size={13} />
                  <span className="text-xs text-gray-600 line-clamp-2">{order.deliveryAddress}</span>
                </div>

                {/* SĐT + ghi chú */}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-1">
                  {order.contactPhone && <span>📞 {order.contactPhone}</span>}
                  {order.note && <span className="text-primary-400 font-medium">💬 Có ghi chú</span>}
                </div>

                {/* Timer 2 phút — quan trọng nhất */}
                <OrderTimer
                  createdAt={order.createdAt}
                  onExpire={() => handleOrderExpire(order._id)}
                />

                {/* Nút nhận */}
                <button
                  onClick={() => handleAcceptOrder(order._id)}
                  disabled={accepting === order._id}
                  className={`w-full mt-3 py-3 rounded-xl font-bold text-white text-sm transition-all ${
                    accepting === order._id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-orange-400 hover:shadow-md hover:shadow-primary-500/30'
                  }`}
                >
                  {accepting === order._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Đang nhận...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FiZap size={15} />
                      Nhận đơn hàng
                    </span>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
