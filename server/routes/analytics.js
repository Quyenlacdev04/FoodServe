import express from 'express';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

const router = express.Router();

// Thống kê tổng quan cho admin
router.get('/admin/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Tổng số đơn hàng
    const totalOrders = await Order.countDocuments(dateFilter);
    
    // Đơn hàng hoàn thành
    const completedOrders = await Order.countDocuments({ 
      ...dateFilter, 
      status: 'completed' 
    });
    
    // Tổng doanh thu
    const revenueData = await Order.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;
    
    // Số người dùng mới
    const newUsers = await User.countDocuments(dateFilter);
    
    // Số nhà hàng hoạt động
    const activeRestaurants = await Restaurant.countDocuments({ isActive: { $ne: false } });
    
    res.json({
      totalOrders,
      completedOrders,
      totalRevenue,
      newUsers,
      activeRestaurants
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê tổng quan' });
  }
});

// Thống kê doanh thu theo ngày (7 ngày gần nhất)
router.get('/admin/revenue-by-day', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const data = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(data);
  } catch (error) {
    console.error('Revenue by day error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy doanh thu theo ngày' });
  }
});

// Thống kê cho nhà hàng
router.get('/restaurant/:restaurantId/overview', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    const dateFilter = { restaurantId };
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Tổng đơn hàng
    const totalOrders = await Order.countDocuments(dateFilter);
    
    // Đơn hoàn thành
    const completedOrders = await Order.countDocuments({ 
      ...dateFilter, 
      status: 'completed' 
    });
    
    // Doanh thu
    const revenueData = await Order.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;
    
    // Đơn hàng trung bình
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    
    res.json({
      totalOrders,
      completedOrders,
      totalRevenue,
      avgOrderValue
    });
  } catch (error) {
    console.error('Restaurant overview error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê nhà hàng' });
  }
});

// Món ăn bán chạy nhất
router.get('/restaurant/:restaurantId/top-items', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 10 } = req.query;
    
    const topItems = await Order.aggregate([
      { $match: { restaurantId, status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(topItems);
  } catch (error) {
    console.error('Top items error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy món bán chạy' });
  }
});

// Thống kê theo giờ (giờ cao điểm)
router.get('/restaurant/:restaurantId/peak-hours', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const hourlyData = await Order.aggregate([
      { $match: { restaurantId, status: 'completed' } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(hourlyData);
  } catch (error) {
    console.error('Peak hours error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy giờ cao điểm' });
  }
});

// Doanh thu theo ngày cho nhà hàng
router.get('/restaurant/:restaurantId/revenue-by-day', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { days = 7 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const data = await Order.aggregate([
      {
        $match: {
          restaurantId,
          status: 'completed',
          createdAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(data);
  } catch (error) {
    console.error('Restaurant revenue by day error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy doanh thu theo ngày' });
  }
});

export default router;
