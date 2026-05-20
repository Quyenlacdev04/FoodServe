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
  subscriptionExpiry: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // Hết hạn phí duy trì (mặc định 30 ngày)
}, { timestamps: true });

export default mongoose.model('Restaurant', restaurantSchema);
