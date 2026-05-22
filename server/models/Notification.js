import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['payment_request', 'payment_approved', 'payment_rejected', 'order_new', 'order_status', 'subscription_expiring', 'partner_approved', 'driver_approved']
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Dữ liệu bổ sung (orderId, restaurantId, etc.)
  read: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

// Index để query nhanh
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
