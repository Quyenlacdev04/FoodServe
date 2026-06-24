import { API_BASE_URL } from '../../config/api.js'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CANCEL_REASONS = [
  { id: 'changed_mind', label: '🤔 Tôi đổi ý rồi', description: 'Không muốn đặt món này nữa' },
  { id: 'wrong_order', label: '❌ Đặt nhầm món', description: 'Chọn sai món ăn hoặc địa chỉ' },
  { id: 'too_expensive', label: '💰 Giá quá cao', description: 'Tổng tiền đơn hàng quá đắt' },
  { id: 'too_long', label: '⏰ Đợi quá lâu', description: 'Thời gian giao hàng quá lâu' },
  { id: 'found_better', label: '🔄 Tìm được quán khác', description: 'Tìm thấy lựa chọn tốt hơn' },
  { id: 'duplicate', label: '📋 Đặt trùng đơn', description: 'Đã đặt đơn hàng này rồi' },
  { id: 'payment_issue', label: '💳 Vấn đề thanh toán', description: 'Không thể thanh toán được' },
  { id: 'other', label: '📝 Lý do khác', description: 'Lý do khác (ghi chú bên dưới)' }
];

export default function CancelOrderModal({ 
  isOpen, 
  onClose, 
  order,
  onSuccess 
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error('Vui lòng chọn lý do hủy đơn');
      return;
    }

    if (selectedReason === 'other' && !otherReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    setCancelling(true);

    try {
      const reason = selectedReason === 'other' 
        ? otherReason.trim()
        : CANCEL_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

      const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          userId: order.userId
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Đã hủy đơn hàng thành công', {
          icon: '✅',
          duration: 5000
        });
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.message || 'Không thể hủy đơn hàng', {
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('Lỗi khi hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order && ['pending', 'confirmed', 'preparing'].includes(order.status);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-100 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-xl">❌</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold dark:text-white">Hủy đơn hàng</h3>
                    <p className="text-xs text-gray-500">#{order?._id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-dark-200 flex items-center justify-center transition-colors"
                >
                  <FiX className="text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* Warning nếu không thể hủy */}
                {!canCancel && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                    <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                        Không thể hủy đơn hàng
                      </p>
                      <p className="text-red-600 dark:text-red-300 text-xs mt-1">
                        {order?.status === 'pending' && 'Đơn hàng đang chờ xác nhận. Vui lòng đợi nhà hàng xác nhận trước khi hủy.'}
                        {order?.status === 'delivering' && 'Đơn hàng đang được giao. Vui lòng liên hệ tài xế hoặc hỗ trợ.'}
                        {order?.status === 'ready' && 'Món ăn đã sẵn sàng. Vui lòng liên hệ hỗ trợ để hủy.'}
                        {order?.status === 'completed' && 'Đơn hàng đã hoàn thành. Không thể hủy.'}
                        {order?.status === 'cancelled' && 'Đơn hàng đã được hủy trước đó.'}
                      </p>
                    </div>
                  </div>
                )}

                {canCancel && (
                  <>
                    {/* Info */}
                    <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>
                          Bạn có chắc chắn muốn hủy đơn hàng này không? 
                          {order?.paymentStatus === 'paid' && (
                            <strong className="block mt-1">
                              💰 Tiền sẽ được hoàn lại {order?.paymentMethod === 'coins' ? 'ngay vào tài khoản Xu' : 'trong 3-5 ngày làm việc'}.
                            </strong>
                          )}
                        </span>
                      </p>
                    </div>

                    {/* Reason selection */}
                    <div className="space-y-3 mb-6">
                      <label className="block font-semibold text-sm dark:text-white mb-3">
                        Vui lòng chọn lý do hủy đơn:
                      </label>
                      {CANCEL_REASONS.map((reason) => (
                        <motion.button
                          key={reason.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedReason(reason.id)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                            selectedReason === reason.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              selectedReason === reason.id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {selectedReason === reason.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-white rounded-full"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm dark:text-white">
                                {reason.label}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {reason.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Other reason textarea */}
                    {selectedReason === 'other' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <label className="block font-semibold text-sm dark:text-white mb-2">
                          Lý do cụ thể:
                        </label>
                        <textarea
                          value={otherReason}
                          onChange={(e) => setOtherReason(e.target.value)}
                          placeholder="Vui lòng nhập lý do hủy đơn..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-dark-200 dark:text-white focus:border-primary-500 outline-none transition-colors resize-none"
                          rows={3}
                          maxLength={200}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {otherReason.length}/200 ký tự
                        </p>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                  {canCancel && (
                    <button
                      onClick={handleCancel}
                      disabled={!selectedReason || cancelling}
                      className="flex-1 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold transition-colors disabled:cursor-not-allowed"
                    >
                      {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                    </button>
                  )}
                </div>

                {/* Cancellation policy */}
                {canCancel && (
                  <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-dark-200">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      <strong className="text-gray-700 dark:text-gray-300">📋 Chính sách hủy đơn:</strong><br />
                      • Chỉ có thể hủy khi đơn hàng chưa được giao<br />
                      • Tiền thanh toán online sẽ được hoàn lại đầy đủ<br />
                      • Xu sẽ được hoàn ngay lập tức<br />
                      • Lượt quay thưởng sẽ bị trừ lại
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
