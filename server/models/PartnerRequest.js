import mongoose from 'mongoose';

const partnerRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Thông tin người đại diện
  ownerName: { type: String, required: true },
  ownerEmail: { type: String, required: true, lowercase: true, trim: true },
  ownerPhone: { type: String, required: true },
  
  // Thông tin nhà hàng
  restaurantName: { type: String, required: true },
  restaurantAddress: { type: String, required: true },
  restaurantPhone: { type: String, required: true },
  
  // Thông tin kinh doanh
  businessType: { type: String, required: true }, // Quán ăn, Nhà hàng, Cà phê, Fastfood...
  cuisineTypes: [String], // Món Việt, Món Á, Món Âu, Đồ uống...
  averagePrice: { type: String, required: true }, // 50k-100k, 100k-200k, 200k-500k, >500k
  
  // Giấy tờ pháp lý
  businessLicense: { type: String }, // Số giấy phép kinh doanh
  foodSafetyCert: { type: String }, // Giấy chứng nhận ATTP
  
  // Mô tả
  description: { type: String },
  specialDishes: { type: String }, // Món đặc sản
  
  // Trạng thái
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

partnerRequestSchema.index({ userId: 1 }, { unique: true, sparse: true });
partnerRequestSchema.index({ ownerEmail: 1 }, { unique: true });

export default mongoose.model('PartnerRequest', partnerRequestSchema);
