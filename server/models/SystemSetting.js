import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  baseShippingFee: { type: Number, default: 15000 }, // Phí ship cơ bản (đơn vị: VNĐ)
  perKmShippingFee: { type: Number, default: 5000 }, // Phí ship mỗi km tiếp theo
  freeshipThreshold: { type: Number, default: 200000 }, // Đơn tối thiểu để freeship
  welcomeCoins: { type: Number, default: 100 }, // Xu tặng tài khoản mới
  maintenanceMode: { type: Boolean, default: false }, // Chế độ bảo trì
  supportPhone: { type: String, default: '19001000' }, // Hotline hỗ trợ
  supportEmail: { type: String, default: 'support@foodserve.vn' }, // Email hỗ trợ
  monthlyRestaurantFee: { type: Number, default: 500000 }, // Phí duy trì nhà hàng hàng tháng (VNĐ)
  
  // Thông tin thanh toán của admin (nhận phí từ cửa hàng)
  adminPaymentQR: { type: String, default: '' }, // QR code admin
  adminBankName: { type: String, default: 'Techcombank' }, // Tên ngân hàng admin
  adminAccountName: { type: String, default: 'VU VAN QUYEN' }, // Tên chủ tài khoản admin
  adminAccountNumber: { type: String, default: '509868686868' }, // Số tài khoản admin

  // Cấu hình API PayOS của riêng admin
  payosClientId: { type: String, default: '' },
  payosApiKey: { type: String, default: '' },
  payosChecksumKey: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('SystemSetting', systemSettingSchema);
