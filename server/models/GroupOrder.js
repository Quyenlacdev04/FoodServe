import mongoose from 'mongoose';

const groupOrderSessionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Mã phòng đặt chung
  hostId: { type: String, required: true },
  hostName: { type: String, required: true },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, required: true },
  members: [{
    userId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
    joinedAt: { type: Date, default: Date.now }
  }],
  items: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  }],
  status: {
    type: String,
    enum: ['active', 'locked', 'ordered', 'cancelled'],
    default: 'active'
  },
  orderId: { type: String }, // Mã đơn hàng sau khi thanh toán
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('GroupOrderSession', groupOrderSessionSchema);
