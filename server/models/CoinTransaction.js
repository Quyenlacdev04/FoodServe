import mongoose from 'mongoose';

const coinTransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true }, // Số tiền VND
  coins: { type: Number, required: true },  // Số xu quy đổi tương ứng
  type: { 
    type: String, 
    enum: ['topup', 'spend', 'refund', 'reward', 'withdraw'], 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['momo', 'payos', 'zalopay', 'vnpay', 'bank', 'admin', 'system'] 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  referenceId: { type: String }, // Mã giao dịch của ví thanh toán (orderId/orderCode)
  description: { type: String }  // Ghi chú giao dịch
}, { timestamps: true });

coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ referenceId: 1 });

export default mongoose.model('CoinTransaction', coinTransactionSchema);
