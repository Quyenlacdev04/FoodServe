import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiHome, FiFileText } from 'react-icons/fi';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handlePaymentReturn();
  }, []);

  const handlePaymentReturn = async () => {
    try {
      // Lấy tất cả params từ VNPay
      const params = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Gọi API xử lý callback
      const response = await fetch(
        `http://localhost:5000/api/payment/vnpay/return?${searchParams.toString()}`
      );
      const data = await response.json();
      
      setResult(data);
    } catch (error) {
      console.error('Payment return error:', error);
      setResult({
        success: false,
        message: 'Có lỗi xảy ra khi xử lý thanh toán'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý thanh toán...</p>
        </div>
      </div>
    );
  }

  const isSuccess = result?.success;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            {isSuccess ? (
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FiCheckCircle className="text-6xl text-green-500" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <FiXCircle className="text-6xl text-red-500" />
              </div>
            )}
          </motion.div>

          {/* Title */}
          <h1 className={`text-3xl font-bold mb-3 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {isSuccess ? '🎉 Thanh toán thành công!' : '❌ Thanh toán thất bại'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {result?.message || 'Không có thông tin'}
          </p>

          {/* Details */}
          {isSuccess && result?.orderId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-bold text-gray-800">#{result.orderId.slice(-8)}</span>
              </div>
              {result?.amount && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-orange-600">
                    {result.amount.toLocaleString()}đ
                  </span>
                </div>
              )}
              {result?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-mono text-sm text-gray-800">{result.transactionId}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isSuccess ? (
              <>
                <button
                  onClick={() => navigate('/tracking')}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <FiFileText /> Theo dõi đơn hàng
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <FiHome /> Về trang chủ
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <FiHome /> Về trang chủ
                </button>
              </>
            )}
          </div>

          {/* Support */}
          <p className="text-sm text-gray-400 mt-6">
            Cần hỗ trợ? Liên hệ: <a href="tel:1900555577" className="text-orange-500 hover:underline">1900 555 577</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
