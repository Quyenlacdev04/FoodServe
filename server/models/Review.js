import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: String, required: true },
  
  // Đánh giá nhà hàng
  restaurantRating: { type: Number, min: 1, max: 5, required: true },
  restaurantComment: { type: String },
  
  // Đánh giá món ăn (array vì có nhiều món)
  itemReviews: [{
    itemName: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String
  }],
  
  // Đánh giá tài xế (nếu có)
  driverRating: { type: Number, min: 1, max: 5 },
  driverComment: { type: String },
  
  // Phân tích cảm xúc AI
  aiSentiment: { 
    type: String, 
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  aiSentimentScore: { type: Number, default: 0 },
  aiTags: [String],

  // Hình ảnh đính kèm
  images: [String],
  
  // Trạng thái
  status: { 
    type: String, 
    enum: ['active', 'hidden', 'reported'], 
    default: 'active' 
  },
  
  // Phản hồi từ nhà hàng
  restaurantReply: {
    text: String,
    repliedAt: Date
  },
  
  // Thống kê
  helpfulCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 }
}, { timestamps: true });

// Index để query nhanh
reviewSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ orderId: 1 });

export default mongoose.model('Review', reviewSchema);
