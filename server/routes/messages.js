import express from 'express';
import Message from '../models/Message.js';
import Order from '../models/Order.js';

const router = express.Router();

// Lấy tin nhắn của đơn hàng
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { limit = 50 } = req.query;
    
    const messages = await Message.find({ orderId })
      .populate('senderId', 'name avatar role')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy tin nhắn' });
  }
});

// Gửi tin nhắn
router.post('/', async (req, res) => {
  try {
    const { orderId, senderId, senderRole, message, type = 'text' } = req.body;
    
    if (!orderId || !senderId || !senderRole || !message) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    
    // Kiểm tra đơn hàng tồn tại
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Tạo tin nhắn
    const newMessage = await Message.create({
      orderId,
      senderId,
      senderRole,
      message,
      type
    });
    
    // Populate sender info
    await newMessage.populate('senderId', 'name avatar role');
    
    // Gửi real-time qua Socket.io
    const io = req.app.get('io');
    io.to(`order-${orderId}`).emit('new-message', newMessage);
    
    res.status(201).json({
      message: 'Đã gửi tin nhắn',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Lỗi khi gửi tin nhắn' });
  }
});

// Đánh dấu tin nhắn đã đọc
router.patch('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });
    }
    
    res.json({ message: 'Đã đánh dấu đã đọc', data: message });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Lỗi khi đánh dấu đã đọc' });
  }
});

// Đánh dấu tất cả tin nhắn của đơn hàng đã đọc
router.patch('/order/:orderId/read-all', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body;
    
    await Message.updateMany(
      { 
        orderId, 
        senderId: { $ne: userId },
        read: false 
      },
      { read: true, readAt: new Date() }
    );
    
    res.json({ message: 'Đã đánh dấu tất cả tin nhắn đã đọc' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Lỗi khi đánh dấu tất cả đã đọc' });
  }
});

// Lấy số tin nhắn chưa đọc
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Lấy tất cả đơn hàng của user
    const orders = await Order.find({
      $or: [
        { userId },
        { shipperId: userId }
      ]
    }).select('_id');
    
    const orderIds = orders.map(o => o._id);
    
    // Đếm tin nhắn chưa đọc (không phải của user gửi)
    const unreadCount = await Message.countDocuments({
      orderId: { $in: orderIds },
      senderId: { $ne: userId },
      read: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy số tin nhắn chưa đọc' });
  }
});

export default router;
