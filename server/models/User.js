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
  vouchers: { type: [String], default: [] },
  // Thông tin shipper
  shipperRating: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  vehicleType: { type: String }, // 'bike', 'motorbike', 'car'
  vehicleNumber: { type: String },
  isOnline: { type: Boolean, default: false },
  claimedRanks: { type: [String], default: [] }, // Danh sách cấp bậc đã nhận thưởng
  
  // Cài đặt Chế độ Ăn uống Lành mạnh & Tính Calo
  healthyModeEnabled: { type: Boolean, default: false },
  dailyCalorieTarget: { type: Number, default: 2000 },
  dailyProteinTarget: { type: Number, default: 130 },
  dailyCarbsTarget: { type: Number, default: 220 },
  dailyFatTarget: { type: Number, default: 65 }
}, { timestamps: true });

// Indexes để tăng hiệu suất truy vấn
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model('User', userSchema);
