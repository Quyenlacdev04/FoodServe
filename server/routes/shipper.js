import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// ===== CẬP NHẬT VỊ TRÍ SHIPPER REAL-TIME =====
router.post('/update-location', async (req, res) => {
  try {
    const { shipperId, lat, lng } = req.body;
    
    if (!shipperId || !lat || !lng) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Tìm tất cả đơn hàng đang giao của shipper này
    const deliveringOrders = await Order.find({
      'shipper._id': shipperId,
      status: { $in: ['delivering', 'ready'] }
    });

    // Broadcast vị trí shipper đến tất cả đơn hàng đang giao
    const io = req.app.get('io');
    deliveringOrders.forEach(order => {
      io.to(`order-${order._id}`).emit('shipper-location-updated', {
        orderId: order._id.toString(),
        location: { lat, lng }
      });
    });

    res.json({ 
      success: true, 
      message: 'Location updated',
      ordersUpdated: deliveringOrders.length 
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
