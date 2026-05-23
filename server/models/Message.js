import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'merchant', 'shipper', 'admin'], required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  read: { type: Boolean, default: false },
  readAt: Date
}, { timestamps: true });

// Indexes
messageSchema.index({ orderId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
