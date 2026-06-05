import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiPhone, FiPackage, FiCheckCircle, FiNavigation, FiArrowRight } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// Helper: hiển thị trạng thái thanh toán
const PaymentBadge = ({ order }) => {
  if (order.paymentMethod === 'cash') return null;
  const isPaid = order.paymentStatus === 'paid';
  const methodLabel = { momo: '💜 MoMo', coins: '🪙 Xu', vnpay: '💳 VNPay', zalopay: '💙 ZaloPay' }[order.paymentMethod] || order.paymentMethod;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
      {isPaid ? `✅ Khách đã thanh toán qua ${methodLabel}` : `⏳ Chờ thanh toán ${methodLabel}`}
    </span>
  );
};

// Stepper địa chỉ: lấy hàng → giao hàng
const AddressStepper = ({ order }) => {
  const isPickedUp = order.status === 'delivering' || order.status === 'ready';
  const isDelivering = order.status === 'delivering';

  const restaurantAddress = order.restaurantId?.address || order.restaurantAddress || 'Địa chỉ nhà hàng';
  const restaurantName = order.restaurantId?.name || 'Nhà hàng';

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 mb-6">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
        <FiMapPin className="text-white" />
        <span className="text-white font-bold text-sm">Lộ trình giao hàng</span>
      </div>

      <div className="p-4 space-y-0">
        {/* Điểm lấy hàng */}
        <div className={`flex gap-3 items-start ${isDelivering ? 'opacity-50' : ''}`}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              isPickedUp ? 'bg-green-500 text-white' : 'bg-primary-500 text-white animate-pulse'
            }`}>
              {isPickedUp ? '✅' : '🏪'}
            </div>
            <div className="w-0.5 h-10 bg-gray-200 mt-1" />
          </div>
          <div className="pt-2 pb-4 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isPickedUp ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'
              }`}>
                {isPickedUp ? 'Đã lấy hàng' : 'Điểm lấy hàng'}
              </span>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{restaurantName}</p>
            <p className="text-gray-500 text-xs mt-0.5">{restaurantAddress}</p>
            {!isPickedUp && (
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantAddress)}`, '_blank')}
                className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
              >
                <FiNavigation size={11} /> Chỉ đường đến nhà hàng
              </button>
            )}
          </div>
        </div>

        {/* Điểm giao hàng */}
        <div className={`flex gap-3 items-start ${!isPickedUp ? 'opacity-40' : ''}`}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              order.status === 'completed' ? 'bg-green-500 text-white'
              : isDelivering ? 'bg-blue-500 text-white animate-pulse'
              : 'bg-gray-300 text-gray-500'
            }`}>
              {order.status === 'completed' ? '✅' : '🏠'}
            </div>
          </div>
          <div className="pt-2 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                order.status === 'completed' ? 'bg-green-100 text-green-700'
                : isDelivering ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
              }`}>
                {order.status === 'completed' ? 'Đã giao' : isDelivering ? 'Đang giao' : 'Điểm giao hàng'}
              </span>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{order.contactPhone || 'Khách hàng'}</p>
            <p className="text-gray-500 text-xs mt-0.5">{order.deliveryAddress}</p>
            {isDelivering && (
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`, '_blank')}
                className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
              >
                <FiNavigation size={11} /> Chỉ đường giao hàng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mũi tên chuyển phase */}
      {!isDelivering && isPickedUp && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border-t border-blue-100 px-4 py-2.5 flex items-center gap-2 text-blue-600 text-sm font-bold"
          >
            <FiArrowRight /> Bây giờ đến địa chỉ giao hàng!
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default function ActiveDelivery({ shipperId, onDeliveryCompleted, onOrderChange }) {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchActiveOrder();

    // Lắng nghe thông báo thanh toán online
    const socket = io('http://localhost:5000');
    socket.on('payment-confirmed', (data) => {
      toast.success(data.message || 'Khách đã thanh toán online!', {
        icon: '💳',
        duration: 5000,
        style: { fontWeight: 'bold' }
      });
      fetchActiveOrder(); // Refresh để hiện 0đ
    });
    return () => socket.disconnect();
  }, [shipperId]);

  useEffect(() => {
    if (activeOrder) {
      // Thông báo orderId cho parent component
      if (onOrderChange) {
        onOrderChange(activeOrder._id);
      }
      
      // Cập nhật vị trí mỗi 10 giây
      const interval = setInterval(updateLocation, 10000);
      return () => clearInterval(interval);
    } else {
      // Không có đơn nào
      if (onOrderChange) {
        onOrderChange(null);
      }
    }
  }, [activeOrder]);

  const fetchActiveOrder = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders?shipperId=${shipperId}`);
      const data = await response.json();
      
      // Lấy đơn đang giao (status = preparing hoặc delivering)
      const active = data.find(o => 
        o.status === 'preparing' || o.status === 'delivering' || o.status === 'ready'
      );
      
      setActiveOrder(active || null);
    } catch (error) {
      console.error('Fetch active order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    if (!activeOrder) return;

    try {
      // Lấy vị trí hiện tại
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          await fetch(`http://localhost:5000/api/orders/${activeOrder._id}/update-location`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude
            })
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    } catch (error) {
      console.error('Update location error:', error);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${activeOrder._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, shipperId })
      });

      if (response.ok) {
        const statusToasts = {
          ready: '📦 Đã lấy hàng! Khách hàng đã được thông báo',
          delivering: '🛵 Bắt đầu giao hàng! Khách hàng đã được thông báo',
          completed: '🎉 Hoàn thành giao hàng! Khách hàng đã được thông báo'
        };
        toast.success(statusToasts[newStatus] || '✅ Đã cập nhật trạng thái!');

        if (newStatus === 'completed') {
          setActiveOrder(null);
          if (onDeliveryCompleted) onDeliveryCompleted();
        } else {
          fetchActiveOrder();
        }
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật!');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Có lỗi xảy ra!');
    } finally {
      setUpdating(false);
    }
  };

  const openGoogleMaps = () => {
    if (activeOrder?.deliveryAddress) {
      const address = encodeURIComponent(activeOrder.deliveryAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="text-center py-20">
        <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">
          Chưa có đơn hàng đang giao
        </h3>
        <p className="text-gray-500">
          Nhận đơn hàng mới để bắt đầu giao hàng
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-6 shadow-xl border-2 border-primary-500"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Đơn hàng đang giao
          </h2>
          <div className="text-sm text-gray-500">
            #{activeOrder._id.slice(-8)}
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold ${
          activeOrder.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
          activeOrder.status === 'ready' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>
          {activeOrder.status === 'preparing' ? '🍳 Đang chuẩn bị' :
           activeOrder.status === 'ready' ? '📦 Sẵn sàng lấy' :
           '🚗 Đang giao'}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">Tổng tiền đơn:</div>
          <div className="text-2xl font-bold text-primary-600">
            {activeOrder.paymentStatus === 'paid' && activeOrder.paymentMethod !== 'cash'
              ? <span className="text-green-600">0đ <span className="text-sm font-normal text-gray-500">(đã thanh toán)</span></span>
              : `${activeOrder.finalAmount.toLocaleString()}đ`
            }
          </div>
        </div>
        {/* Badge thanh toán */}
        <div className="mb-2">
          <PaymentBadge order={activeOrder} />
          {activeOrder.paymentMethod === 'cash' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
              💵 Thu tiền mặt khi giao
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Bạn nhận được:</div>
          <div className="text-lg font-bold text-green-600">
            🪙 {Math.ceil(activeOrder.deliveryFee * 0.9 / 1000)} Xu
          </div>
        </div>
      </div>

      {/* Stepper địa chỉ lấy hàng → giao hàng */}
      <AddressStepper order={activeOrder} />

      {/* Items */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <FiPackage /> Món ăn ({activeOrder.items.length})
        </h3>
        <div className="space-y-2">
          {activeOrder.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium text-gray-800">
                {(item.price * item.quantity).toLocaleString()}đ
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Info — chỉ SĐT và ghi chú */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <FiPhone className="text-primary-500" />
          <div>
            <div className="font-semibold text-gray-700">Liên hệ khách:</div>
            <a href={`tel:${activeOrder.contactPhone}`} className="text-blue-600 hover:underline font-medium">
              {activeOrder.contactPhone}
            </a>
          </div>
        </div>

        {activeOrder.note && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="font-semibold text-yellow-800 mb-1">💬 Ghi chú từ khách:</div>
            <div className="text-yellow-700 text-sm">{activeOrder.note}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">

        {activeOrder.status === 'preparing' && (
          <button
            onClick={() => handleUpdateStatus('ready')}
            disabled={updating}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition-all"
          >
            {updating ? 'Đang cập nhật...' : '📦 Đã lấy hàng'}
          </button>
        )}

        {activeOrder.status === 'ready' && (
          <button
            onClick={() => handleUpdateStatus('delivering')}
            disabled={updating}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all"
          >
            {updating ? 'Đang cập nhật...' : '🚗 Bắt đầu giao hàng'}
          </button>
        )}

        {activeOrder.status === 'delivering' && (
          <button
            onClick={() => handleUpdateStatus('completed')}
            disabled={updating}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <FiCheckCircle /> {updating ? 'Đang xử lý...' : 'Hoàn thành giao hàng'}
          </button>
        )}
      </div>

      {/* Location Update Info */}
      <div className="mt-4 text-center text-xs text-gray-400">
        📍 Vị trí của bạn đang được cập nhật tự động mỗi 10 giây
      </div>
    </motion.div>
  );
}
