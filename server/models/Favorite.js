import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }
}, { timestamps: true });

// Index để tránh trùng lặp và tăng tốc query
favoriteSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Favorite', favoriteSchema);
