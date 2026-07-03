import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  description: String,
  popular: { type: Boolean, default: false },
  category: String,
  
  // Dinh dưỡng & Ăn uống Lành mạnh
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  isHealthy: { type: Boolean, default: false },
  healthTags: { type: [String], default: [] }
}, { timestamps: true });

// Indexes để tăng hiệu suất truy vấn
menuItemSchema.index({ restaurantId: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ popular: -1 });

export default mongoose.model('MenuItem', menuItemSchema);
