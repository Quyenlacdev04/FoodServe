import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

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
    const io = req.app.get('io');
    if (io) {
      io.emit('new-order', savedOrder);
    }
    
    // ✅ Tạo thông báo cho tất cả admin
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        const notification = new Notification({
          userId: admin._id,
          type: 'order_new',
          title: '🛒 Đơn hàng mới!',
          message: `Có đơn hàng mới #${savedOrder._id.toString().slice(-6).toUpperCase()} từ khách hàng`,
          data: {
            orderId: savedOrder._id.toString()
          },
          read: false
        });
        await notification.save();
        
        // Gửi real-time notification qua Socket.io
        if (io) {
          io.to(`user-${admin._id.toString()}`).emit('new-notification', notification);
        }
      }
    } catch (notifError) {
      console.error('Error creating admin notification for new order:', notifError);
    }
    
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' });
  }
});

// Lấy chi tiết đơn hàng
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId').lean();
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    
    // Nếu có shipperId, lấy thông tin shipper
    if (order.shipperId) {
      try {
        const shipper = await User.findById(order.shipperId).select('name phone avatar shipperRating totalDeliveries vehicleType vehicleNumber').lean();
        if (shipper) {
          order.shipper = shipper;
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin shipper:', err);
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order by ID error:', error);
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
    const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('restaurantId', 'name address');
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
    
    // ✅ Tạo thông báo cho khách hàng khi trạng thái thay đổi
    const statusMessages = {
      confirmed: '✅ Đơn hàng đã được xác nhận',
      preparing: '👨‍🍳 Nhà hàng đang chuẩn bị món ăn của bạn',
      ready: '📦 Món ăn đã sẵn sàng, tài xế đang đến lấy',
      delivering: '🛵 Tài xế đang trên đường giao hàng đến bạn',
      completed: '🎉 Đơn hàng đã được giao thành công! Cảm ơn bạn',
      cancelled: '❌ Đơn hàng đã bị hủy'
    };
    
    if (statusMessages[newStatus] && order.userId) {
      try {
        const notification = new Notification({
          userId: order.userId,
          title: 'Cập nhật đơn hàng',
          message: statusMessages[newStatus],
          type: 'order_status',
          data: { orderId: order._id.toString() },
          read: false
        });
        await notification.save();
        
        // Gửi thông báo real-time qua Socket.io
        const io = req.app.get('io');
        if (io) {
          io.to(`user-${order.userId.toString()}`).emit('new-notification', notification);
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Không throw error, chỉ log để không ảnh hưởng đến việc cập nhật đơn hàng
      }
    }
    
    // Phát sự kiện Socket.io đến client đang theo dõi đơn hàng này
    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.to(`order-${order._id.toString()}`).emit('order-status-updated', { 
        orderId: order._id.toString(), 
        status: order.status 
      });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
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

// Lấy đơn hàng có sẵn cho shipper (chưa có người nhận)
router.get('/shipper/available', async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['confirmed', 'preparing'] },
      shipperId: { $exists: false }
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
    
    res.json(orders);
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy đơn hàng có sẵn' });
  }
});

// Shipper nhận đơn
router.post('/:id/accept-shipper', async (req, res) => {
  try {
    const { shipperId } = req.body;
    
    if (!shipperId) {
      return res.status(400).json({ message: 'Thiếu thông tin shipperId' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    if (order.shipperId) {
      return res.status(400).json({ message: 'Đơn hàng đã có shipper nhận' });
    }
    
    // Gán shipper
    order.shipperId = shipperId;
    order.status = 'preparing';
    order.steps.push({ status: 'preparing', time: new Date() });
    order.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
    
    await order.save();
    
    // Thông báo real-time
    const io = req.app.get('io');
    io.to(`order-${order._id}`).emit('order-status-updated', {
      orderId: order._id,
      status: order.status,
      shipperId: order.shipperId
    });

    // ✅ Gửi thông báo cho khách hàng
    if (order.userId) {
      try {
        const notification = new Notification({
          userId: order.userId,
          title: 'Tài xế đã nhận đơn',
          message: '🛵 Tài xế đã nhận đơn hàng của bạn và đang đến lấy món',
          type: 'order_status',
          data: { orderId: order._id.toString() },
          read: false
        });
        await notification.save();
        if (io) {
          io.to(`user-${order.userId.toString()}`).emit('new-notification', notification);
        }
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
    
    res.json({
      message: 'Đã nhận đơn hàng thành công',
      order
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ message: 'Lỗi khi nhận đơn hàng' });
  }
});

// Cập nhật vị trí shipper
router.patch('/:id/update-location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Thiếu thông tin vị trí' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        shipperLocation: {
          lat,
          lng,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Gửi vị trí real-time cho khách hàng
    const io = req.app.get('io');
    io.to(`order-${order._id}`).emit('shipper-location-updated', {
      orderId: order._id,
      location: { lat, lng }
    });
    
    res.json({
      message: 'Đã cập nhật vị trí',
      location: order.shipperLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật vị trí' });
  }
});

// Đánh giá shipper
router.post('/:id/rate-shipper', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Chỉ có thể đánh giá đơn hàng đã hoàn thành' });
    }
    
    if (order.shipperRating) {
      return res.status(400).json({ message: 'Đã đánh giá shipper rồi' });
    }
    
    // Lưu đánh giá
    order.shipperRating = rating;
    order.shipperComment = comment || '';
    await order.save();
    
    // Cập nhật rating trung bình cho shipper
    if (order.shipperId) {
      const allOrders = await Order.find({
        shipperId: order.shipperId,
        shipperRating: { $exists: true, $ne: null }
      });
      
      const avgRating = allOrders.reduce((sum, o) => sum + o.shipperRating, 0) / allOrders.length;
      
      await User.findByIdAndUpdate(order.shipperId, {
        shipperRating: Math.round(avgRating * 10) / 10,
        totalDeliveries: allOrders.length
      });
    }
    
    res.json({
      message: 'Đã đánh giá shipper thành công',
      order
    });
  } catch (error) {
    console.error('Rate shipper error:', error);
    res.status(500).json({ message: 'Lỗi khi đánh giá shipper' });
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
