import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiClock, FiDollarSign, FiPackage, FiBell, FiX } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function AvailableOrders({ shipperId, onOrderAccepted }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  useEffect(() => {
    fetchAvailableOrders();
    const interval = setInterval(fetchAvailableOrders, 30000); // giảm xuống 30s vì đã có socket

    // Socket.io - lắng nghe đơn hàng mới real-time
    const socket = io('http://localhost:5000');

    socket.on('new-order', (order) => {
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
      setTimeout(() => setNewOrderAlert(null), 10000);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/shipper/available');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Fetch available orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setAccepting(orderId);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/accept-shipper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipperId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Đã nhận đơn hàng thành công!');
        setOrders(orders.filter(o => o._id !== orderId));
        if (onOrderAccepted) onOrderAccepted(data.order);
      } else {
        toast.error(data.message || 'Không thể nhận đơn hàng');
      }
    } catch (error) {
      console.error('Accept order error:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ===== POPUP THÔNG BÁO ĐƠN MỚI ===== */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: 'spring', damping: 18 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-orange-500 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: [0, -20, 20, -20, 20, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                  <FiBell className="text-white text-xl" />
                </motion.div>
                <span className="text-white font-bold">🛒 Có đơn hàng mới!</span>
              </div>
              <button onClick={() => setNewOrderAlert(null)} className="text-white/80 hover:text-white">
                <FiX />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Mã đơn</span>
                <span className="font-mono font-bold text-sm">#{String(newOrderAlert._id || '').slice(-8).toUpperCase()}</span>
              </div>
              {newOrderAlert.deliveryAddress && (
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-orange-500 mt-0.5 flex-shrink-0" size={13} />
                  <span className="text-xs text-gray-600 line-clamp-2">{newOrderAlert.deliveryAddress}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-400">Thu nhập</span>
                <span className="font-bold text-green-600">🪙 +{Math.ceil((newOrderAlert.deliveryFee || 15000) * 0.9 / 1000)} Xu</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Tổng đơn</span>
                <span className="font-bold text-orange-500">{(newOrderAlert.finalAmount || 0).toLocaleString()}đ</span>
              </div>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => setNewOrderAlert(null)}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Xem & Nhận đơn →
              </button>
            </div>
            <motion.div
              initial={{ width: '100%' }} animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className="h-1 bg-orange-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng mới</h3>
          <p className="text-gray-500">Đơn hàng mới sẽ xuất hiện ở đây. Vui lòng chờ...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">📦 Đơn hàng có sẵn ({orders.length})</h2>
            <button onClick={fetchAvailableOrders} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-all">
              🔄 Làm mới
            </button>
          </div>
      {orders.map((order, index) => (
        <motion.div
          key={order._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 mb-1">
                Đơn hàng #{order._id.slice(-8)}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FiClock />
                <span>{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {order.finalAmount.toLocaleString()}đ
              </div>
              <div className="text-sm text-green-600 font-medium">
                🪙 +{Math.ceil(order.deliveryFee * 0.9 / 1000)} Xu
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiPackage /> Món ăn ({order.items.length})
            </h4>
            <div className="space-y-1">
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="text-sm text-gray-600">
                  • {item.quantity}x {item.name}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="text-sm text-gray-400">
                  ... và {order.items.length - 3} món khác
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <div className="flex items-start gap-2 text-sm">
              <FiMapPin className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-700 mb-1">Địa chỉ giao hàng:</div>
                <div className="text-gray-600">{order.deliveryAddress}</div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <div>📞 {order.contactPhone}</div>
            {order.note && (
              <div className="text-orange-600">💬 Có ghi chú</div>
            )}
          </div>

          {/* Action */}
          <button
            onClick={() => handleAcceptOrder(order._id)}
            disabled={accepting === order._id}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
              accepting === order._id
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:shadow-lg'
            }`}
          >
            {accepting === order._id ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Đang nhận...
              </span>
            ) : (
              '✅ Nhận đơn hàng này'
            )}
          </button>
        </motion.div>
      ))}
      </>
      )}
    </div>
  );
}
