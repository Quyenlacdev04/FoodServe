import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiPhone, FiPackage, FiCheckCircle, FiNavigation } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ActiveDelivery({ shipperId, onDeliveryCompleted, onOrderChange }) {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchActiveOrder();
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
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
      className="bg-white rounded-2xl p-6 shadow-xl border-2 border-orange-500"
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

      {/* Order Info */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">Tổng tiền:</div>
          <div className="text-2xl font-bold text-orange-600">
            {activeOrder.finalAmount.toLocaleString()}đ
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Bạn nhận được:</div>
          <div className="text-lg font-bold text-green-600">
            🪙 {Math.ceil(activeOrder.deliveryFee * 0.9 / 1000)} Xu
          </div>
        </div>
      </div>

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

      {/* Customer Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex items-start gap-3">
          <FiMapPin className="text-orange-500 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-gray-700 mb-1">Địa chỉ giao:</div>
            <div className="text-gray-600 text-sm">{activeOrder.deliveryAddress}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FiPhone className="text-orange-500" />
          <div>
            <div className="font-semibold text-gray-700">Liên hệ:</div>
            <a href={`tel:${activeOrder.contactPhone}`} className="text-blue-600 hover:underline">
              {activeOrder.contactPhone}
            </a>
          </div>
        </div>

        {activeOrder.note && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="font-semibold text-yellow-800 mb-1">💬 Ghi chú:</div>
            <div className="text-yellow-700 text-sm">{activeOrder.note}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={openGoogleMaps}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <FiNavigation /> Mở Google Maps
        </button>

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
