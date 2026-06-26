import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import SystemSetting from '../models/SystemSetting.js';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// Tạo đơn hàng mới
router.post('/', async (req, res) => {
  try {
    // Kiểm tra chế độ bảo trì
    const settings = await SystemSetting.findOne();
    if (settings?.maintenanceMode) {
      return res.status(503).json({ 
        message: '🔧 Hệ thống đang bảo trì. Vui lòng quay lại sau ít phút. Xin lỗi vì sự bất tiện!' 
      });
    }

    const newOrder = new Order({
      ...req.body,
      status: 'pending',
      steps: [{ status: 'pending', time: new Date() }]
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

    // ✅ Tạo thông báo cho Nhà hàng (Merchant) sở hữu cửa hàng này
    try {
      const restaurant = await Restaurant.findById(savedOrder.restaurantId);
      if (restaurant && restaurant.ownerId) {
        const notification = new Notification({
          userId: restaurant.ownerId,
          type: 'order_new',
          title: '🛎️ Đơn hàng mới cho cửa hàng!',
          message: `Cửa hàng "${restaurant.name}" có đơn hàng mới #${savedOrder._id.toString().slice(-6).toUpperCase()} đang chờ xác nhận`,
          data: {
            orderId: savedOrder._id.toString()
          },
          read: false
        });
        await notification.save();
        
        // Gửi real-time notification qua Socket.io trực tiếp tới chủ nhà hàng
        if (io) {
          io.to(`user-${restaurant.ownerId.toString()}`).emit('new-notification', notification);
          // Phát sự kiện reload đơn hàng thời gian thực cho chủ nhà hàng
          io.to(`user-${restaurant.ownerId.toString()}`).emit('new-order-merchant', savedOrder);
        }
      }
    } catch (merchantNotifError) {
      console.error('Error creating merchant notification for new order:', merchantNotifError);
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

    // Nếu có userId, lấy thông tin khách hàng để đồng bộ tên và SĐT
    if (order.userId) {
      try {
        const customer = await User.findById(order.userId).select('name phone').lean();
        if (customer) {
          order.userName = customer.name || 'Ẩn danh';
          order.userPhone = order.contactPhone || customer.phone || 'Không có';
          order.shippingAddress = order.deliveryAddress;
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin khách hàng:', err);
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
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('restaurantId', 'name address')
      .lean();

    // Ánh xạ thông tin khách hàng cho từng đơn hàng
    const ordersWithCustomer = await Promise.all(
      orders.map(async (order) => {
        order.shippingAddress = order.deliveryAddress;
        order.userPhone = order.contactPhone || 'Không có';
        order.userName = 'Ẩn danh';

        if (order.userId) {
          try {
            const user = await User.findById(order.userId).select('name phone').lean();
            if (user) {
              order.userName = user.name || 'Ẩn danh';
              order.userPhone = order.contactPhone || user.phone || 'Không có';
            }
          } catch (err) {
            console.error('Lỗi khi lấy thông tin khách hàng:', err);
          }
        }
        return order;
      })
    );
    res.json(ordersWithCustomer);
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
    
    // Nếu chuyển sang cancelled (hủy/từ chối đơn)
    let refundMessage = '';
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      order.cancelledBy = req.body.cancelledBy || 'merchant';
      order.cancellationReason = req.body.reason || 'Nhà hàng hết món hoặc gặp sự cố';
      order.cancelledAt = new Date();

      // Xử lý hoàn tiền nếu đã thanh toán online
      if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cash') {
        order.paymentStatus = 'refunded';
        
        // Hoàn xu nếu thanh toán bằng coins
        if (order.paymentMethod === 'coins' && order.userId) {
          const user = await User.findById(order.userId);
          if (user) {
            const refundCoins = Number((order.finalAmount / 1000).toFixed(1));
            user.coins = Number(((user.coins || 0) + refundCoins).toFixed(1));
            await user.save();
            refundMessage = ` Đã hoàn lại ${refundCoins} Xu vào ví của bạn.`;
          }
        } else {
          refundMessage = ' Tiền thanh toán online sẽ được hoàn lại vào tài khoản của bạn.';
        }
      }

      // Hoàn lại lượt quay và trừ totalSpent
      if (order.userId && order.userId !== 'demo_user') {
        await User.findByIdAndUpdate(order.userId, {
          $inc: { 
            spins: -1,
            totalSpent: -order.finalAmount
          }
        });
      }

      // Thông báo cho shipper nếu đơn hàng đã được shipper nhận trước đó
      if (order.shipperId) {
        try {
          const notification = new Notification({
            userId: order.shipperId,
            title: '❌ Đơn hàng đã bị hủy',
            message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã bị nhà hàng hủy. Lý do: ${order.cancellationReason}`,
            type: 'order_cancelled',
            data: { orderId: order._id.toString() },
            read: false
          });
          await notification.save();
          
          const io = req.app.get('io');
          if (io) {
            io.to(`user-${order.shipperId.toString()}`).emit('new-notification', notification);
          }
        } catch (shipperNotifErr) {
          console.error('Lỗi khi tạo thông báo hủy đơn cho shipper:', shipperNotifErr);
        }
      }
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
      pending: '⏳ Đơn hàng của bạn đang chờ nhà hàng xác nhận',
      confirmed: '✅ Đơn hàng đã được nhà hàng xác nhận',
      preparing: '👨‍🍳 Nhà hàng đang chuẩn bị món ăn của bạn',
      ready: '📦 Món ăn đã sẵn sàng, tài xế đang đến lấy',
      delivering: '🛵 Tài xế đang trên đường giao hàng đến bạn',
      completed: '🎉 Đơn hàng đã được giao thành công! Cảm ơn bạn',
      cancelled: `❌ Đơn hàng đã bị hủy bởi ${order.cancelledBy === 'merchant' || order.cancelledBy === 'restaurant' ? 'nhà hàng' : order.cancelledBy === 'shipper' ? 'tài xế' : 'khách hàng'}. Lý do: ${order.cancellationReason}.${refundMessage}`
    };
    
    if (statusMessages[newStatus] && order.userId) {
      try {
        const notification = new Notification({
          userId: order.userId,
          title: 'Cập nhật đơn hàng',
          message: statusMessages[newStatus],
          type: newStatus === 'cancelled' ? 'order_cancelled' : 'order_status',
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
      }
    }
    
    // Phát sự kiện Socket.io đến client đang theo dõi đơn hàng này
    const ioInstance = req.app.get('io');
    if (ioInstance) {
      ioInstance.to(`order-${order._id.toString()}`).emit('order-status-updated', { 
        orderId: order._id.toString(), 
        status: order.status 
      });
      
      // Phát sự kiện thời gian thực trực tiếp tới phòng của chủ nhà hàng làm lớp dự phòng
      try {
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (restaurant && restaurant.ownerId) {
          ioInstance.to(`user-${restaurant.ownerId.toString()}`).emit('order-status-updated', {
            orderId: order._id.toString(),
            status: order.status
          });
        }
      } catch (err) {
        console.error('Error emitting order-status-updated to merchant:', err);
      }
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

    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-status-updated', { 
        orderId: order._id, 
        status: order.status 
      });
      
      // Phát sự kiện thời gian thực trực tiếp tới phòng của chủ nhà hàng làm lớp dự phòng
      try {
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (restaurant && restaurant.ownerId) {
          io.to(`user-${restaurant.ownerId.toString()}`).emit('order-status-updated', {
            orderId: order._id.toString(),
            status: order.status
          });
        }
      } catch (err) {
        console.error('Error emitting accept order-status-updated to merchant:', err);
      }
    }

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
    
    // Populate thông tin nhà hàng để lấy địa chỉ và tọa độ
    const ordersWithLocations = await Promise.all(
      orders.map(async (order) => {
        // Nếu đã có restaurantLocation thì không cần populate
        if (order.restaurantLocation?.lat && order.restaurantLocation?.lng) {
          return order;
        }
        
        // Lấy thông tin nhà hàng
        try {
          const restaurant = await Restaurant.findById(order.restaurantId).lean();
          if (restaurant) {
            // Giả sử nhà hàng có địa chỉ, ta sẽ dùng tọa độ giả định dựa trên tên
            // Trong thực tế, bạn cần geocoding API hoặc lưu tọa độ trong DB
            // Tạm thời dùng tọa độ trung tâm TP.HCM với offset ngẫu nhiên
            const baseLat = 10.7756;
            const baseLng = 106.7019;
            const offset = 0.05; // ~5km radius
            
            order.restaurantLocation = {
              lat: baseLat + (Math.random() - 0.5) * offset,
              lng: baseLng + (Math.random() - 0.5) * offset,
              address: restaurant.address || restaurant.name
            };
          }
        } catch (err) {
          console.error('Error fetching restaurant location:', err);
        }
        
        // Tạo customerLocation từ deliveryAddress nếu chưa có
        if (!order.customerLocation?.lat && order.deliveryAddress) {
          const baseLat = 10.7756;
          const baseLng = 106.7019;
          const offset = 0.05;
          
          order.customerLocation = {
            lat: baseLat + (Math.random() - 0.5) * offset,
            lng: baseLng + (Math.random() - 0.5) * offset,
            address: order.deliveryAddress
          };
        }
        
        return order;
      })
    );
    
    res.json(ordersWithLocations);
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
    if (io) {
      io.to(`order-${order._id}`).emit('order-status-updated', {
        orderId: order._id,
        status: order.status,
        shipperId: order.shipperId
      });
      
      // Phát sự kiện thời gian thực trực tiếp tới phòng của chủ nhà hàng làm lớp dự phòng
      try {
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (restaurant && restaurant.ownerId) {
          io.to(`user-${restaurant.ownerId.toString()}`).emit('order-status-updated', {
            orderId: order._id.toString(),
            status: order.status
          });
        }
      } catch (err) {
        console.error('Error emitting accept-shipper order-status-updated to merchant:', err);
      }
    }

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
    const orders = await Order.find({ restaurantId: req.params.restaurantId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Ánh xạ thông tin khách hàng (tên, SĐT, địa chỉ) cho nhà hàng hiển thị
    const ordersWithCustomer = await Promise.all(
      orders.map(async (order) => {
        order.shippingAddress = order.deliveryAddress;
        order.userPhone = order.contactPhone || 'Không có';
        order.userName = 'Ẩn danh';

        if (order.userId) {
          try {
            const user = await User.findById(order.userId).select('name phone').lean();
            if (user) {
              order.userName = user.name || 'Ẩn danh';
              order.userPhone = order.contactPhone || user.phone || 'Không có';
            }
          } catch (err) {
            console.error('Lỗi khi lấy thông tin khách hàng:', err);
          }
        }
        return order;
      })
    );
    
    res.json(ordersWithCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đơn hàng của nhà hàng' });
  }
});

// Hủy đơn hàng (Customer)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason, userId } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Vui lòng chọn lý do hủy đơn' });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra quyền hủy đơn
    if (userId && order.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này' });
    }

    // Chỉ cho phép hủy ở một số trạng thái nhất định
    const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Đơn hàng đã được hủy trước đó.' 
      });
    }
    
    if (order.status === 'completed') {
      return res.status(400).json({ 
        message: 'Không thể hủy đơn hàng đã hoàn thành.' 
      });
    }
    
    if (order.status === 'delivering') {
      return res.status(400).json({ 
        message: 'Đơn hàng đang được giao, không thể hủy. Vui lòng liên hệ tài xế hoặc hỗ trợ.' 
      });
    }
    
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: `Không thể hủy đơn hàng ở trạng thái "${order.status}". Vui lòng liên hệ hỗ trợ.` 
      });
    }

    // Cập nhật trạng thái đơn hàng
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledBy = 'customer';
    order.cancelledAt = new Date();
    order.steps.push({ status: 'cancelled', time: new Date() });

    // Xử lý hoàn tiền nếu đã thanh toán online
    let refundMessage = '';
    if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cash') {
      order.paymentStatus = 'refunded';
      
      // Hoàn xu nếu thanh toán bằng coins
      if (order.paymentMethod === 'coins' && order.userId) {
        const user = await User.findById(order.userId);
        if (user) {
          const refundCoins = Number((order.finalAmount / 1000).toFixed(1));
          user.coins = Number(((user.coins || 0) + refundCoins).toFixed(1));
          await user.save();
          refundMessage = ` Đã hoàn ${refundCoins} Xu vào tài khoản.`;
        }
      } else {
        // Các phương thức thanh toán online khác (VNPay, MoMo, ZaloPay)
        // Trong thực tế cần gọi API hoàn tiền của từng cổng thanh toán
        refundMessage = ' Tiền sẽ được hoàn lại vào tài khoản trong 3-5 ngày làm việc.';
      }
    }

    // Hoàn lại lượt quay và trừ totalSpent nếu có
    if (order.userId && order.userId !== 'demo_user') {
      await User.findByIdAndUpdate(order.userId, {
        $inc: { 
          spins: -1,
          totalSpent: -order.finalAmount
        }
      });
    }

    await order.save();

    // Thông báo real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-status-updated', {
        orderId: order._id,
        status: order.status
      });
      
      // Phát sự kiện thời gian thực trực tiếp tới phòng của chủ nhà hàng làm lớp dự phòng
      try {
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (restaurant && restaurant.ownerId) {
          io.to(`user-${restaurant.ownerId.toString()}`).emit('order-status-updated', {
            orderId: order._id.toString(),
            status: order.status
          });
        }
      } catch (err) {
        console.error('Error emitting cancel order-status-updated to merchant:', err);
      }

      // Thông báo cho shipper nếu đã có người nhận
      if (order.shipperId) {
        const notification = new Notification({
          userId: order.shipperId,
          title: '❌ Đơn hàng đã bị hủy',
          message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã bị khách hàng hủy. Lý do: ${reason}`,
          type: 'order_cancelled',
          data: { orderId: order._id.toString() },
          read: false
        });
        await notification.save();
        io.to(`user-${order.shipperId.toString()}`).emit('new-notification', notification);
      }

      // Thông báo cho admin
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        const notification = new Notification({
          userId: admin._id,
          title: '❌ Đơn hàng bị hủy',
          message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã bị khách hàng hủy`,
          type: 'order_cancelled',
          data: { orderId: order._id.toString() },
          read: false
        });
        await notification.save();
        io.to(`user-${admin._id.toString()}`).emit('new-notification', notification);
      }

      // Thông báo cho khách hàng xác nhận đã hủy
      if (order.userId) {
        const notification = new Notification({
          userId: order.userId,
          title: '✅ Đã hủy đơn hàng',
          message: `Đơn hàng của bạn đã được hủy thành công.${refundMessage}`,
          type: 'order_cancelled',
          data: { orderId: order._id.toString() },
          read: false
        });
        await notification.save();
        io.to(`user-${order.userId.toString()}`).emit('new-notification', notification);
      }
    }

    res.json({
      message: `Đã hủy đơn hàng thành công.${refundMessage}`,
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Lỗi khi hủy đơn hàng' });
  }
});

// ===== SHIPPER NHẬN THƯỞNG MILESTONE CẤP BẬC =====
router.post('/claim-rank-bonus', async (req, res) => {
  try {
    const { userId, rank, bonusCoins } = req.body;
    if (!userId || !rank || bonusCoins === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin yêu cầu' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    if (!user.claimedRanks) user.claimedRanks = [];
    if (user.claimedRanks.includes(rank)) {
      return res.status(400).json({ message: 'Đã nhận thưởng cấp này rồi' });
    }
    user.coins = Number(((user.coins || 0) + bonusCoins).toFixed(1));
    user.claimedRanks.push(rank);
    await user.save();
    res.json({ message: `Nhận thưởng ${bonusCoins} Xu thành công!`, coins: user.coins, claimedRanks: user.claimedRanks });
  } catch (error) {
    console.error('Claim rank bonus error:', error);
    res.status(500).json({ message: 'Lỗi server khi nhận thưởng' });
  }
});

// Shipper nhận thưởng milestone cấp bậc
router.post('/claim-rank-bonus', async (req, res) => {
  try {
    const { userId, rank, bonusCoins } = req.body;
    if (!userId || !rank || bonusCoins === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin yêu cầu' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    if (!user.claimedRanks) user.claimedRanks = [];
    if (user.claimedRanks.includes(rank)) {
      return res.status(400).json({ message: 'Đã nhận thưởng cấp này rồi' });
    }
    user.coins = Number(((user.coins || 0) + bonusCoins).toFixed(1));
    user.claimedRanks.push(rank);
    await user.save();
    res.json({ message: `Nhận thưởng ${bonusCoins} Xu thành công!`, coins: user.coins, claimedRanks: user.claimedRanks });
  } catch (error) {
    console.error('Claim rank bonus error:', error);
    res.status(500).json({ message: 'Lỗi server khi nhận thưởng' });
  }
});

// ===== HỦY ĐƠN HÀNG BỞI TÀI XẾ (Shipper Cancel) =====
router.post('/:id/shipper-cancel', async (req, res) => {
  try {
    const { cancelReason, cancelReasonLabel, additionalNote, proofImage } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Chỉ cho phép hủy khi đơn đang giao hoặc chuẩn bị
    if (!['preparing', 'ready', 'delivering'].includes(order.status)) {
      return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái này' });
    }

    // Cập nhật trạng thái đơn hàng
    order.status = 'cancelled';
    order.cancellationReason = `[TÀI XẾ] ${cancelReasonLabel}${additionalNote ? ': ' + additionalNote : ''}`;
    order.cancelledBy = 'shipper';
    order.cancelledAt = new Date();
    order.shipperCancelData = {
      reason: cancelReason,
      reasonLabel: cancelReasonLabel,
      note: additionalNote,
      proofImage: proofImage || null,
      timestamp: new Date()
    };
    order.steps.push({ status: 'cancelled', time: new Date() });

    // Xử lý hoàn tiền nếu đã thanh toán online
    let refundMessage = '';
    if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cash') {
      order.paymentStatus = 'refunded';
      
      // Hoàn xu nếu thanh toán bằng coins
      if (order.paymentMethod === 'coins' && order.userId) {
        const user = await User.findById(order.userId);
        if (user) {
          const refundCoins = Number((order.finalAmount / 1000).toFixed(1));
          user.coins = Number(((user.coins || 0) + refundCoins).toFixed(1));
          await user.save();
          refundMessage = ` Đã hoàn ${refundCoins} Xu cho khách hàng.`;
        }
      } else {
        refundMessage = ' Tiền sẽ được hoàn lại cho khách hàng trong 3-5 ngày làm việc.';
      }
    }

    // Hoàn lại lượt quay và trừ totalSpent
    if (order.userId && order.userId !== 'demo_user') {
      await User.findByIdAndUpdate(order.userId, {
        $inc: { 
          spins: -1,
          totalSpent: -order.finalAmount
        }
      });
    }

    // Xóa shipper khỏi đơn hàng (để đơn có thể được giao cho shipper khác nếu cần)
    order.shipper = null;

    await order.save();

    // Thông báo cho khách hàng qua Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-status-updated', {
        orderId: order._id,
        status: 'cancelled',
        message: 'Tài xế đã hủy đơn hàng của bạn'
      });
      
      // Phát sự kiện thời gian thực trực tiếp tới phòng của chủ nhà hàng làm lớp dự phòng
      try {
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (restaurant && restaurant.ownerId) {
          io.to(`user-${restaurant.ownerId.toString()}`).emit('order-status-updated', {
            orderId: order._id.toString(),
            status: 'cancelled'
          });
        }
      } catch (err) {
        console.error('Error emitting shipper-cancel order-status-updated to merchant:', err);
      }
    }

    // Tạo thông báo cho khách hàng
    if (order.userId && order.userId !== 'demo_user') {
      const notification = new Notification({
        userId: order.userId,
        type: 'order_cancelled',
        title: '❌ Đơn hàng đã bị hủy',
        message: `Tài xế đã hủy đơn hàng #${order._id.toString().slice(-6).toUpperCase()}. Lý do: ${cancelReasonLabel}${refundMessage}`,
        data: { orderId: order._id.toString() },
        read: false
      });
      await notification.save();
      
      if (io) {
        io.to(`user-${order.userId.toString()}`).emit('new-notification', notification);
      }
    }

    // Tạo thông báo cho Admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const adminNotif = new Notification({
        userId: admin._id,
        type: 'order_cancelled',
        title: '⚠️ Tài xế hủy đơn',
        message: `Tài xế đã hủy đơn #${order._id.toString().slice(-6).toUpperCase()}. Lý do: ${cancelReasonLabel}`,
        data: { 
          orderId: order._id.toString(),
          reason: cancelReason,
          proofImage: proofImage
        },
        read: false
      });
      await adminNotif.save();
      
      if (io) {
        io.to(`user-${admin._id.toString()}`).emit('new-notification', adminNotif);
      }
    }

    res.json({ 
      message: 'Đã hủy đơn hàng thành công' + refundMessage,
      order 
    });
  } catch (error) {
    console.error('Shipper cancel order error:', error);
    res.status(500).json({ message: 'Lỗi server khi hủy đơn hàng' });
  }
});

export default router;
