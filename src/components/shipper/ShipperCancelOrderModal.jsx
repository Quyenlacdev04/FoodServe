import { API_BASE_URL } from '../../config/api.js'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CANCEL_REASONS = [
  {
    id: 'address_invalid',
    label: 'Địa chỉ không hợp lệ / Không tìm được địa chỉ',
    needsProof: true,
    icon: '📍'
  },
  {
    id: 'customer_not_answer',
    label: 'Khách hàng không nghe máy / Không liên lạc được',
    needsProof: false,
    icon: '📞'
  },
  {
    id: 'customer_cancel',
    label: 'Khách hàng yêu cầu hủy đơn',
    needsProof: false,
    icon: '🙅'
  },
  {
    id: 'restaurant_closed',
    label: 'Nhà hàng đóng cửa / Từ chối đơn',
    needsProof: true,
    icon: '🏪'
  },
  {
    id: 'food_not_ready',
    label: 'Món ăn không sẵn sàng / Hết món',
    needsProof: false,
    icon: '🍜'
  },
  {
    id: 'accident',
    label: 'Tai nạn / Sự cố không thể giao',
    needsProof: true,
    icon: '⚠️'
  },
  {
    id: 'weather',
    label: 'Thời tiết xấu / Không đảm bảo an toàn',
    needsProof: true,
    icon: '🌧️'
  },
  {
    id: 'other',
    label: 'Lý do khác',
    needsProof: true,
    icon: '❓'
  }
];

export default function ShipperCancelOrderModal({ isOpen, onClose, order, onSuccess }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedReasonData = CANCEL_REASONS.find(r => r.id === selectedReason);
  const needsProof = selectedReasonData?.needsProof || false;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!');
      return;
    }

    setProofImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    setProofPreview(null);
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Vui lòng chọn lý do hủy đơn');
      return;
    }

    if (needsProof && !proofImage) {
      toast.error('Lý do này cần có bằng chứng (ảnh chụp)');
      return;
    }

    if (selectedReason === 'other' && !additionalNote.trim()) {
      toast.error('Vui lòng nhập lý do cụ thể');
      return;
    }

    setLoading(true);

    try {
      // Upload image first if exists
      let proofImageUrl = null;
      if (proofImage) {
        const formData = new FormData();
        formData.append('image', proofImage);
        
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadRes.json();
        proofImageUrl = uploadData.url;
      }

      // Cancel order with reason and proof
      const response = await fetch(`${API_BASE_URL}/api/orders/${order._id}/shipper-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelReason: selectedReason,
          cancelReasonLabel: selectedReasonData.label,
          additionalNote: additionalNote.trim(),
          proofImage: proofImageUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel order');
      }

      const data = await response.json();
      
      toast.success('Đã hủy đơn hàng thành công', {
        icon: '✅',
        duration: 4000
      });

      // Reset form
      setSelectedReason('');
      setAdditionalNote('');
      setProofImage(null);
      setProofPreview(null);

      if (onSuccess) {
        onSuccess(data);
      }

      onClose();
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi hủy đơn');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-dark-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ⚠️ Hủy đơn hàng
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Đơn #{order._id.slice(-8)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <FiX className="text-xl text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Warning Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 flex gap-3">
              <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-yellow-800 dark:text-yellow-400 mb-1">
                  Lưu ý quan trọng:
                </p>
                <ul className="text-yellow-700 dark:text-yellow-500 space-y-1 list-disc list-inside">
                  <li>Hủy đơn không chính đáng có thể ảnh hưởng đến rating của bạn</li>
                  <li>Một số lý do yêu cầu bằng chứng (ảnh chụp)</li>
                  <li>Khách hàng sẽ được thông báo ngay sau khi hủy</li>
                </ul>
              </div>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Lý do hủy đơn <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CANCEL_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedReason(reason.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedReason === reason.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reason.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {reason.label}
                        </div>
                        {reason.needsProof && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                            <FiUpload size={10} /> Cần bằng chứng (ảnh)
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedReason === reason.id
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selectedReason === reason.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Note (for "other" or optional) */}
            {selectedReason && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú thêm {selectedReason === 'other' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  placeholder="Mô tả chi tiết tình huống..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-dark-200 dark:text-white focus:border-primary-500 focus:outline-none resize-none"
                />
              </div>
            )}

            {/* Proof Image Upload */}
            {needsProof && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Bằng chứng (Ảnh) <span className="text-red-500">*</span>
                </label>
                
                {!proofPreview ? (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-primary-500 transition-colors">
                      <FiUpload className="text-4xl text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Nhấn để chọn ảnh
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, JPEG • Tối đa 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <img
                      src={proofPreview}
                      alt="Proof"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-colors"
                    >
                      <FiX />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-xs font-semibold">
                        ✅ Đã chọn ảnh bằng chứng
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-200 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !selectedReason || (needsProof && !proofImage)}
              className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                'Xác nhận hủy đơn'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
