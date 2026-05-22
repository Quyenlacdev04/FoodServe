import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: String,
  cover: String,
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  deliveryTime: String,
  distance: Number,
  orders: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  freeship: { type: Boolean, default: false },
  promo: String,
  categories: [String],
  address: String,
  description: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subscriptionExpiry: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // Hết hạn phí duy trì (mặc định 30 ngày)
  isActive: { type: Boolean, default: true }, // Trạng thái hoạt động (false = bị khóa do hết hạn)
  paymentHistory: [{
    _id: String,
    amount: Number,
    paymentMethod: String, // 'coins' | 'bank_transfer'
    status: String, // 'completed'
    paidAt: Date,
    periodStart: Date,
    periodEnd: Date,
    transactionNote: String,
    approvedBy: String // Admin ID nếu là bank_transfer
  }],
  paymentRequests: [{
    _id: String,
    restaurantId: String,
    restaurantName: String,
    userId: String,
    amount: Number,
    paymentMethod: String,
    status: { type: String, default: 'pending' }, // pending | approved | rejected
    note: String,
    createdAt: Date,
    approvedBy: String,
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
    rejectReason: String
  }]
}, { timestamps: true });

export default mongoose.model('Restaurant', restaurantSchema);
