import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['fixed', 'percent'], default: 'fixed' }, // fixed = tiền mặt, percent = %
  value: { type: Number, required: true }, // tiền hoặc %
  minOrder: { type: Number, default: 0 }, // đơn tối thiểu
  maxDiscount: { type: Number, default: 0 }, // giới hạn giảm tối đa (dùng cho percent)
  usageLimit: { type: Number, default: 0 }, // 0 = không giới hạn
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null }, // null = không hết hạn
  isActive: { type: Boolean, default: true },
  targetUsers: { type: String, enum: ['all', 'specific'], default: 'all' }, // all = tất cả, specific = chọn user
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // nếu specific
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users đã dùng
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

voucherSchema.index({ code: 1 }, { unique: true });
voucherSchema.index({ isActive: 1 });

export default mongoose.model('Voucher', voucherSchema);
