import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  baseShippingFee: { type: Number, default: 15000 }, // Phí ship cơ bản (đơn vị: VNĐ)
  perKmShippingFee: { type: Number, default: 5000 }, // Phí ship mỗi km tiếp theo
  freeshipThreshold: { type: Number, default: 200000 }, // Đơn tối thiểu để freeship
  welcomeCoins: { type: Number, default: 100 }, // Xu tặng tài khoản mới
  maintenanceMode: { type: Boolean, default: false }, // Chế độ bảo trì
  supportPhone: { type: String, default: '19001000' }, // Hotline hỗ trợ
  supportEmail: { type: String, default: 'support@foodserve.vn' }, // Email hỗ trợ
  monthlyRestaurantFee: { type: Number, default: 500000 } // Phí duy trì nhà hàng hàng tháng (VNĐ)
}, { timestamps: true });

export default mongoose.model('SystemSetting', systemSettingSchema);
