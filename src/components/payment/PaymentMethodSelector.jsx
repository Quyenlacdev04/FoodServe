import { motion } from 'framer-motion';
import { FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';

export default function PaymentMethodSelector({ onSelect, selectedMethod, userCoins = 0, totalAmount = 0 }) {
  const coinsRequired = Math.ceil(totalAmount / 1000); // 1 Xu = 1.000đ
  const hasEnoughCoins = userCoins >= coinsRequired;

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Tiền mặt (COD)',
      icon: FiDollarSign,
      description: 'Thanh toán khi nhận hàng',
      color: 'green',
      available: true,
      badge: null
    },
    {
      id: 'momo',
      name: 'MoMo',
      icon: FiCreditCard,
      description: 'Ví điện tử MoMo',
      color: 'pink',
      available: true,
      badge: '🔒 An toàn'
    },
    {
      id: 'coins',
      name: 'Xu (Coins)',
      icon: FaCoins,
      description: hasEnoughCoins 
        ? `Cần ${coinsRequired} Xu (Bạn có ${userCoins} Xu)` 
        : `Không đủ Xu. Cần ${coinsRequired} Xu (Bạn có ${userCoins} Xu)`,
      color: 'yellow',
      available: hasEnoughCoins,
      badge: hasEnoughCoins ? '✨ Đủ Xu' : null
    }
  ];

  const colorMap = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-500',
      selectedBg: 'bg-green-50 dark:bg-green-900/20'
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-900/30',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-500',
      selectedBg: 'bg-pink-50 dark:bg-pink-900/20'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500',
      selectedBg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-500',
      selectedBg: 'bg-yellow-50 dark:bg-yellow-900/20'
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        💳 Phương thức thanh toán
      </h3>

      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;
        const isDisabled = !method.available;
        const colors = colorMap[method.color];

        return (
          <motion.button
            key={method.id}
            onClick={() => method.available && onSelect(method.id)}
            disabled={isDisabled}
            whileHover={method.available ? { scale: 1.02 } : {}}
            whileTap={method.available ? { scale: 0.98 } : {}}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
              isSelected
                ? `${colors.border} ${colors.selectedBg}`
                : isDisabled
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-300 opacity-50 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-dark-100'
            }`}
          >
            {/* Badge */}
            {method.badge && !isDisabled && (
              <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                method.color === 'blue' 
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                  : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
              }`}>
                {method.badge}
              </span>
            )}

            <div className="flex items-start gap-4">
              {/* Radio */}
              <div className="mt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
              </div>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                <Icon className={`text-2xl ${colors.text}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 dark:text-white mb-0.5">{method.name}</h4>
                <p className={`text-sm ${isDisabled ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {method.description}
                </p>
              </div>
            </div>
          </motion.button>
        );
      })}

      {/* MoMo Note */}
      {selectedMethod === 'momo' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-800"
        >
          <p className="text-sm text-pink-700 dark:text-pink-300 mb-2">
            💜 <strong>Thanh toán qua MoMo:</strong>
          </p>
          <ul className="text-xs text-pink-600 dark:text-pink-400 space-y-1 ml-5 list-disc">
            <li>Bạn sẽ được chuyển đến trang thanh toán MoMo</li>
            <li>Hỗ trợ ví MoMo, ATM, Visa, MasterCard, QR Code</li>
            <li>Giao dịch được bảo mật</li>
          </ul>
        </motion.div>
      )}

      {/* Coins Note */}
      {selectedMethod === 'coins' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800"
        >
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            🪙 <strong>Thanh toán bằng Xu:</strong> Xu sẽ được trừ ngay khi đặt hàng.
            Bạn có thể kiếm thêm Xu qua Mini Games!
          </p>
        </motion.div>
      )}
    </div>
  );
}
