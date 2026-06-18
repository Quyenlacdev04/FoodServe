import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: String },
  restaurantId: { type: String },
  shipperId: { type: String },
  items: [{
    menuItemId: { type: String },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  discount: Number,
  deliveryFee: Number,
  finalAmount: Number,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  deliveryAddress: String,
  contactPhone: String,
  note: String,
  deliveryLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  restaurant: {
    location: {
      lat: Number,
      lng: Number
    },
    address: String,
    name: String
  },
  shipperLocation: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  shipperRating: { type: Number, min: 1, max: 5 },
  shipperComment: String,
  steps: [{
    status: String,
    time: Date
  }],
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  // Thông tin thanh toán
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'vnpay', 'momo', 'zalopay', 'coins'], 
    default: 'cash' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  transactionId: String,
  paidAt: Date,
  // Thông tin hủy đơn
  cancellationReason: String,
  cancelledBy: { type: String, enum: ['customer', 'restaurant', 'admin', 'system'] },
  cancelledAt: Date
}, { timestamps: true });

// Indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ shipperId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
