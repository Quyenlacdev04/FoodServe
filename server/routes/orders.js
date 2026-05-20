import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';

const router = express.Router();

// Tạo đơn hàng mới
router.post('/', async (req, res) => {
  try {
    const newOrder = new Order({
      ...req.body,
      status: 'confirmed',
      steps: [{ status: 'confirmed', time: new Date() }]
    });
    const savedOrder = await newOrder.save();
    
    // Cộng thêm 1 lượt quay cho user và cộng tiền tích lũy (totalSpent)
    const userId = req.body.userId;
    if (userId && userId !== 'demo_user') {
      await User.findByIdAndUpdate(userId, { 
        $inc: { spins: 1, totalSpent: savedOrder.finalAmount } 
      });
    }
    
    // Bắn thông báo Socket.io cho Admin biết có đơn hàng mới
    req.app.get('io').emit('new-order', savedOrder);
    
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' });
  }
});

// Lấy chi tiết đơn hàng
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách đơn hàng (thường sẽ filter theo userId hoặc shipperId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    if (req.query.shipperId) {
      filter.shipperId = req.query.shipperId;
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật trạng thái đơn hàng
router.patch('/:id/status', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    
    const oldStatus = order.status;
    const newStatus = req.body.status;
    
    order.status = newStatus;
    order.steps.push({ status: newStatus, time: new Date() });
    
    if (req.body.shipperId) {
      order.shipperId = req.body.shipperId;
    }
    
    await order.save();
    
    // Nếu đơn hàng chuyển sang completed và shipperId được gán, cộng tiền cho shipper
    if (newStatus === 'completed' && oldStatus !== 'completed' && order.shipperId) {
      const shipper = await User.findById(order.shipperId);
      if (shipper) {
        // Cắt 10% phí ship, shipper nhận 90%. Quy đổi 1.000đ = 1 Xu
        const shipperEarningCoins = Number(((order.deliveryFee * 0.9) / 1000).toFixed(1));
        if (shipperEarningCoins > 0) {
          shipper.coins = Number(((shipper.coins || 0) + shipperEarningCoins).toFixed(1));
          await shipper.save();
        }
      }
    }
    
    // Phát sự kiện Socket.io đến client đang theo dõi đơn hàng này
    req.app.get('io').to(`order-${order._id}`).emit('order-status-updated', { 
      orderId: order._id, 
      status: order.status 
    });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Shipper nhận giao đơn hàng
router.patch('/:id/accept', async (req, res) => {
  try {
    const { shipperId } = req.body;
    if (!shipperId) return res.status(400).json({ message: 'Thiếu shipperId' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (order.shipperId) {
      return res.status(400).json({ message: 'Đơn hàng này đã có người nhận giao' });
    }

    order.shipperId = shipperId;
    order.status = 'preparing';
    order.steps.push({ status: 'preparing', time: new Date() });
    await order.save();

    req.app.get('io').to(`order-${order._id}`).emit('order-status-updated', { 
      orderId: order._id, 
      status: order.status 
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi nhận đơn' });
  }
});

// Lấy danh sách đơn hàng cho một nhà hàng cụ thể
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đơn hàng của nhà hàng' });
  }
});

export default router;
