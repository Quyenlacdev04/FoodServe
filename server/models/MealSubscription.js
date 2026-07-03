import mongoose from 'mongoose';

const mealSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  planType: { type: String, enum: ['weekly', 'monthly'], required: true }, // weekly = 5 ngày, monthly = 20 ngày
  deliveryTime: { type: String, required: true }, // e.g. "12:00", "18:30"
  daysOfWeek: { type: [Number], default: [1, 2, 3, 4, 5] }, // [1, 2, 3, 4, 5] = T2 -> T6
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
  ordersDispatched: [{
    date: { type: String }, // "YYYY-MM-DD"
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    dispatchedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

mealSubscriptionSchema.index({ userId: 1 });
mealSubscriptionSchema.index({ status: 1 });

export default mongoose.model('MealSubscription', mealSubscriptionSchema);
