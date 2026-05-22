import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, enum: ['user', 'admin', 'shipper', 'merchant'], default: 'user' },
  isMerchant: { type: Boolean, default: false },
  isShipper: { type: Boolean, default: false },
  avatar: { type: String },
  coins: { type: Number, default: 0 },
  spins: { type: Number, default: 2 },
  totalSpent: { type: Number, default: 0 },
  vouchers: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
