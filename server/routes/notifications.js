import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// Lấy danh sách thông báo của user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, unreadOnly = false } = req.query;
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông báo' });
  }
});

// Đánh dấu đã đọc
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Lỗi khi đánh dấu đã đọc' });
  }
});

// Đánh dấu tất cả đã đọc
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Lỗi khi đánh dấu tất cả đã đọc' });
  }
});

// Xóa thông báo
router.delete('/:notificationId', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
  }
});

export default router;
