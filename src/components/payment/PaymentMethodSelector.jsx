import { useState } from 'react';
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
      available: true
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      icon: FiCreditCard,
      description: 'Thanh toán qua VNPay (ATM, Visa, MasterCard)',
      color: 'blue',
      available: true
    },
    {
      id: 'coins',
      name: 'Xu (Coins)',
      icon: FaCoins,
      description: hasEnoughCoins 
        ? `Cần ${coinsRequired} Xu (Bạn có ${userCoins} Xu)` 
        : `Không đủ Xu. Cần ${coinsRequired} Xu (Bạn có ${userCoins} Xu)`,
      color: 'yellow',
      available: hasEnoughCoins
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        💳 Phương thức thanh toán
      </h3>

      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;
        const isDisabled = !method.available;

        return (
          <motion.button
            key={method.id}
            onClick={() => method.available && onSelect(method.id)}
            disabled={isDisabled}
            whileHover={method.available ? { scale: 1.02 } : {}}
            whileTap={method.available ? { scale: 0.98 } : {}}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              isSelected
                ? 'border-orange-500 bg-orange-50'
                : isDisabled
                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Radio */}
              <div className="mt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  method.color === 'green'
                    ? 'bg-green-100 text-green-600'
                    : method.color === 'blue'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}
              >
                <Icon className="text-2xl" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 mb-1">{method.name}</h4>
                <p className={`text-sm ${isDisabled ? 'text-red-500' : 'text-gray-500'}`}>
                  {method.description}
                </p>
              </div>
            </div>
          </motion.button>
        );
      })}

      {/* Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-xl">
        <p className="text-sm text-blue-700">
          💡 <strong>Lưu ý:</strong> Thanh toán VNPay sẽ chuyển đến trang thanh toán an toàn của VNPay
        </p>
      </div>
    </div>
  );
}
