import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiClock, FiDollarSign, FiPackage, FiBell, FiX, FiZap } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { formatPrice } from '../../data/mockData';

const POPUP_DURATION = 120; // giây (2 phút)

// Helper: badge thanh toán
const PaymentBadge = ({ order }) => {
  if (order.paymentMethod === 'cash') return null;
  const isPaid = order.paymentStatus === 'paid';
  const label = { momo: '💜 MoMo', coins: '🪙 Xu', vnpay: '💳 VNPay' }[order.paymentMethod] || order.paymentMethod;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
      {isPaid ? `✅ Đã TT ${label}` : `⏳ Chờ TT ${label}`}
    </span>
  );
};

// Popup đơn mới — hiện 2 phút rồi biến mất
function NewOrderPopup({ order, onAccept, onDismiss, accepting }) {
  const [timeLeft, setTimeLeft] = useState(POPUP_DURATION);

  useEffect(() => {
    if (timeLeft <= 0) { onDismiss(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const pct = (timeLeft / POPUP_DURATION) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
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
          <span className="text-white/80 text-xs font-mono">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
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

      {/* Nút nhận */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={onDismiss}
          className="flex-1 py-2 text-sm text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition-colors">
          Bỏ qua
        </button>
        <button onClick={() => onAccept(order._id)} disabled={accepting === order._id}
          className="flex-1 py-2 bg-gradient-to-r from-primary-500 to-orange-400 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1">
          <FiZap size={14} />
          {accepting === order._id ? 'Đang nhận...' : 'Nhận ngay!'}
        </button>
      </div>

      {/* Thanh đếm ngược */}
      <div className="h-1.5 bg-gray-100">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          className={`h-full transition-colors ${timeLeft > 60 ? 'bg-primary-500' : timeLeft > 30 ? 'bg-yellow-400' : 'bg-red-500'}`}
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
      setOrders(data);
    } catch (err) {
      console.error('Fetch available orders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableOrders();
    const interval = setInterval(fetchAvailableOrders, 30000);

    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('new-order', (order) => {
      // Chỉ hiện popup khi đang online
      if (!isOnline) return;

      // Phát âm thanh
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
      } catch (e) {}

      setNewOrderAlert(order);
      fetchAvailableOrders();
    });

    // Lắng nghe xác nhận thanh toán
    socket.on('payment-confirmed', (data) => {
      toast.success(data.message || 'Khách đã thanh toán online!', {
        icon: '💳', duration: 5000, style: { fontWeight: 'bold' }
      });
      fetchAvailableOrders();
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
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔴</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Bạn đang Offline</h3>
        <p className="text-gray-500 text-sm">Bật Online để bắt đầu nhận đơn hàng mới</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Popup đơn mới */}
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
        <div className="text-center py-20">
          <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
          <p className="text-gray-500 text-sm">Bạn đang Online 🟢 — Đơn mới sẽ hiện lên ngay lập tức!</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">
              📦 Đơn có thể nhận ({orders.length})
            </h2>
            <button onClick={fetchAvailableOrders} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-all">
              🔄 Làm mới
            </button>
          </div>

          {orders.map((order, index) => (
            <motion.div key={order._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">#{order._id.slice(-8).toUpperCase()}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <FiClock size={12} />
                    <span>{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary-600">{formatPrice(order.finalAmount)}</div>
                  <div className="text-sm text-green-600 font-medium">🪙 +{Math.ceil((order.deliveryFee || 15000) * 0.9 / 1000)} Xu</div>
                  <div className="mt-1"><PaymentBadge order={order} /></div>
                </div>
              </div>

              {/* Món ăn */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">🍽️ Món ăn ({order.items?.length || 0})</p>
                {order.items?.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-sm text-gray-600">• {item.quantity}x {item.name}</p>
                ))}
                {(order.items?.length || 0) > 3 && (
                  <p className="text-xs text-gray-400 mt-1">...và {order.items.length - 3} món khác</p>
                )}
              </div>

              {/* Địa chỉ */}
              <div className="flex items-start gap-2 mb-3 text-sm">
                <FiMapPin className="text-primary-500 mt-0.5 flex-shrink-0" size={14} />
                <span className="text-gray-600">{order.deliveryAddress}</span>
              </div>

              {/* SĐT + ghi chú */}
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <span>📞 {order.contactPhone}</span>
                {order.note && <span className="text-primary-500 font-medium">💬 Có ghi chú</span>}
              </div>

              {/* Nút nhận */}
              <button onClick={() => handleAcceptOrder(order._id)} disabled={accepting === order._id}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                  accepting === order._id ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary-500 to-orange-400 hover:shadow-lg hover:shadow-primary-500/25'
                }`}>
                {accepting === order._id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Đang nhận...
                  </span>
                ) : '✅ Nhận đơn hàng này'}
              </button>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}
