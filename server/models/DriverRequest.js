import mongoose from 'mongoose';

const driverRequestSchema = new mongoose.Schema({
  // Thông tin cá nhân
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  idCard: { type: String, required: true }, // Số CCCD
  
  // Thông tin phương tiện và bằng lái
  vehicleType: { type: String, required: true }, // Xe máy, Xe máy điện...
  licensePlate: { type: String, required: true }, // Biển số xe
  driverLicense: { type: String, required: true }, // Số GPLX
  operationArea: { type: String, required: true }, // Hà Nội, TP. Hồ Chí Minh...
  
  // Trạng thái yêu cầu
  status: { 
    type: String, 
    enum: ['pending', 'reviewing', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // Ghi chú từ admin
  adminNote: { type: String },
  
  // Thời gian
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('DriverRequest', driverRequestSchema);
