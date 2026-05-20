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
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'], default: 'pending' },
  deliveryAddress: String,
  contactPhone: String,
  steps: [{
    status: String,
    time: Date
  }]
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
