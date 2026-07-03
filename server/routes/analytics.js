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

// ===== HEATMAP: Dữ liệu bản đồ nhiệt nhu cầu ăn uống =====
router.get('/heatmap/demand', async (req, res) => {
  try {
    const { timeRange = '7d', type = 'delivery', hour } = req.query;

    // Tính ngày bắt đầu dựa trên timeRange
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Chọn field tọa độ dựa trên type
    const latField = type === 'restaurant' ? '$restaurant.location.lat' : '$deliveryLocation.lat';
    const lngField = type === 'restaurant' ? '$restaurant.location.lng' : '$deliveryLocation.lng';

    // Match filter
    const matchFilter = {
      createdAt: { $gte: startDate },
      status: { $in: ['completed', 'delivering', 'preparing', 'confirmed'] }
    };

    // Thêm filter theo giờ nếu có
    const hourMatch = hour !== undefined && hour !== '' ? {
      $expr: { $eq: [{ $hour: '$createdAt' }, parseInt(hour)] }
    } : {};

    const pipeline = [
      { $match: { ...matchFilter, ...hourMatch } },
      // Chỉ lấy đơn có tọa độ hợp lệ
      {
        $match: type === 'restaurant'
          ? { 'restaurant.location.lat': { $exists: true, $ne: null, $ne: 0 } }
          : { 'deliveryLocation.lat': { $exists: true, $ne: null, $ne: 0 } }
      },
      // Group theo geo-grid (làm tròn 3 chữ số thập phân ≈ 110m)
      {
        $group: {
          _id: {
            lat: { $round: [latField, 3] },
            lng: { $round: [lngField, 3] }
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$finalAmount', 0] } },
          avgHour: { $avg: { $hour: '$createdAt' } },
          // Lấy ngày mới nhất trong cluster
          lastOrder: { $max: '$createdAt' }
        }
      },
      // Chỉ lấy các cluster có tọa độ hợp lệ
      {
        $match: {
          '_id.lat': { $ne: null },
          '_id.lng': { $ne: null }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 500 } // Giới hạn để đảm bảo performance
    ];

    const heatmapData = await Order.aggregate(pipeline);

    // Tính max count để normalize intensity
    const maxCount = heatmapData.length > 0 ? Math.max(...heatmapData.map(d => d.count)) : 1;

    // Format dữ liệu cho frontend
    const points = heatmapData.map(d => ({
      lat: d._id.lat,
      lng: d._id.lng,
      count: d.count,
      intensity: d.count / maxCount,
      revenue: d.totalRevenue,
      avgHour: Math.round(d.avgHour),
      lastOrder: d.lastOrder
    }));

    // Thống kê tổng hợp
    const totalOrders = points.reduce((s, p) => s + p.count, 0);
    const totalRevenue = points.reduce((s, p) => s + p.revenue, 0);
    const hotspotCount = points.filter(p => p.intensity >= 0.5).length;

    res.json({
      points,
      stats: {
        totalOrders,
        totalRevenue,
        hotspotCount,
        pointCount: points.length,
        timeRange,
        type
      }
    });
  } catch (error) {
    console.error('Heatmap demand error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu bản đồ nhiệt' });
  }
});

// ===== HEATMAP: Dự báo nhu cầu theo khung giờ hiện tại =====
router.get('/heatmap/forecast', async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0=CN, 1=T2, ..., 6=T7

    // Phân tích pattern: cùng ngày trong tuần, cùng khung giờ (±1h), trong 8 tuần qua
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: eightWeeksAgo },
          status: { $in: ['completed', 'delivering'] },
          'deliveryLocation.lat': { $exists: true, $ne: null, $ne: 0 }
        }
      },
      // Lọc theo cùng ngày trong tuần và cùng khung giờ (±1h)
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $dayOfWeek: '$createdAt' }, currentDay + 1] }, // MongoDB dayOfWeek: 1=CN
              { $gte: [{ $hour: '$createdAt' }, Math.max(0, currentHour - 1)] },
              { $lte: [{ $hour: '$createdAt' }, Math.min(23, currentHour + 1)] }
            ]
          }
        }
      },
      // Group theo vùng
      {
        $group: {
          _id: {
            lat: { $round: ['$deliveryLocation.lat', 3] },
            lng: { $round: ['$deliveryLocation.lng', 3] }
          },
          weeklyCount: { $sum: 1 },
          avgRevenue: { $avg: { $ifNull: ['$finalAmount', 0] } }
        }
      },
      {
        $match: {
          '_id.lat': { $ne: null },
          '_id.lng': { $ne: null }
        }
      },
      { $sort: { weeklyCount: -1 } },
      { $limit: 100 }
    ];

    const forecastData = await Order.aggregate(pipeline);

    // Normalize: chia cho 8 tuần → trung bình mỗi tuần tại slot này
    const maxWeekly = forecastData.length > 0 ? Math.max(...forecastData.map(d => d.weeklyCount)) : 1;

    const hotspots = forecastData.map(d => ({
      lat: d._id.lat,
      lng: d._id.lng,
      predictedOrders: Math.round(d.weeklyCount / 8 * 10) / 10, // TB mỗi tuần
      avgRevenue: Math.round(d.avgRevenue),
      confidence: Math.min(1, d.weeklyCount / maxWeekly),
    }));

    // Phân tích giờ cao điểm trong ngày hôm nay (cùng ngày trong tuần)
    const peakHoursPipeline = [
      {
        $match: {
          createdAt: { $gte: eightWeeksAgo },
          status: 'completed',
          $expr: { $eq: [{ $dayOfWeek: '$createdAt' }, currentDay + 1] }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ];

    const peakHours = await Order.aggregate(peakHoursPipeline);

    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    res.json({
      hotspots,
      currentSlot: {
        day: dayNames[currentDay],
        hour: `${currentHour}:00 - ${currentHour + 1}:00`,
        dayOfWeek: currentDay
      },
      peakHours: peakHours.map(h => ({
        hour: `${h._id}:00`,
        orders: Math.round(h.count / 8) // TB mỗi tuần
      })),
      totalHotspots: hotspots.length
    });
  } catch (error) {
    console.error('Heatmap forecast error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu dự báo nhu cầu' });
  }
});

export default router;

