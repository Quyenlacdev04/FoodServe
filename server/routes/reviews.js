import express from 'express';
import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import { analyzeSentiment } from '../utils/sentiment.js';

const router = express.Router();

// Tạo review mới
router.post('/', async (req, res) => {
  try {
    const { orderId, userId, restaurantId, restaurantRating, restaurantComment, itemReviews, driverRating, driverComment, images } = req.body;
    
    // Nếu có orderId thì kiểm tra đơn hàng
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
      if (order.status !== 'completed') {
        return res.status(400).json({ message: 'Chỉ có thể đánh giá đơn hàng đã hoàn thành' });
      }
      // Kiểm tra đã review chưa
      const existingReview = await Review.findOne({ orderId });
      if (existingReview) {
        return res.status(400).json({ message: 'Bạn đã đánh giá đơn hàng này rồi' });
      }
    } else {
      // Không có orderId: kiểm tra user đã review nhà hàng này chưa (trong 7 ngày)
      const recentReview = await Review.findOne({
        userId,
        restaurantId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      if (recentReview) {
        return res.status(400).json({ message: 'Bạn đã đánh giá nhà hàng này trong 7 ngày qua' });
      }
    }
    
    // Phân tích cảm xúc AI
    const aiAnalysis = analyzeSentiment(restaurantComment, restaurantRating);

    // Tạo review
    const review = await Review.create({
      orderId: orderId || null,
      userId,
      restaurantId,
      restaurantRating,
      restaurantComment,
      itemReviews,
      driverRating,
      driverComment,
      images: images || [],
      aiSentiment: aiAnalysis.sentiment,
      aiSentimentScore: aiAnalysis.score,
      aiTags: aiAnalysis.tags
    });
    
    // Cập nhật rating trung bình của nhà hàng
    await updateRestaurantRating(restaurantId);
    
    res.status(201).json({ message: 'Đánh giá thành công!', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo đánh giá' });
  }
});

// Lấy reviews của nhà hàng
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    const query = { restaurantId, status: 'active' };
    
    let sortOption = { createdAt: -1 }; // newest
    if (sort === 'highest') sortOption = { restaurantRating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { restaurantRating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };
    
    const reviews = await Review.find(query)
      .populate('userId', 'name email')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá' });
  }
});

// Lấy thống kê cảm xúc AI của nhà hàng
router.get('/restaurant/:restaurantId/sentiment', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Đếm tổng quan cảm xúc
    const stats = await Review.aggregate([
      { $match: { restaurantId, status: 'active' } },
      {
        $group: {
          _id: '$aiSentiment',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0
    };

    stats.forEach(s => {
      if (s._id) result[s._id] = s.count;
    });
    result.total = result.positive + result.neutral + result.negative;

    // Tìm các tag xuất hiện nhiều nhất
    const reviewsWithTags = await Review.find({ 
      restaurantId, 
      status: 'active',
      aiTags: { $exists: true, $not: { $size: 0 } } 
    }).lean();

    const tagCounts = {
      positive: {},
      negative: {}
    };

    reviewsWithTags.forEach(r => {
      const sentimentType = r.aiSentiment === 'positive' ? 'positive' : 'negative';
      (r.aiTags || []).forEach(tag => {
        tagCounts[sentimentType][tag] = (tagCounts[sentimentType][tag] || 0) + 1;
      });
    });

    // Sắp xếp và lấy top 5 tags tích cực & tiêu cực
    const formatTopTags = (counts) => {
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
    };

    res.json({
      summary: result,
      topPositiveTags: formatTopTags(tagCounts.positive),
      topNegativeTags: formatTopTags(tagCounts.negative)
    });
  } catch (error) {
    console.error('Get review sentiment stats error:', error);
    res.status(500).json({ message: 'Lỗi server khi thống kê cảm xúc AI' });
  }
});

// Lấy reviews của user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá của người dùng' });
  }
});

// Kiểm tra đơn hàng đã review chưa
router.get('/check/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const review = await Review.findOne({ orderId });
    res.json({ hasReview: !!review, review });
  } catch (error) {
    console.error('Check review error:', error);
    res.status(500).json({ message: 'Lỗi khi kiểm tra đánh giá' });
  }
});

// Nhà hàng phản hồi review
router.post('/:reviewId/reply', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text, restaurantId } = req.body;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }
    
    if (review.restaurantId !== restaurantId) {
      return res.status(403).json({ message: 'Bạn không có quyền phản hồi đánh giá này' });
    }
    
    review.restaurantReply = {
      text,
      repliedAt: new Date()
    };
    await review.save();
    
    res.json({ message: 'Phản hồi thành công!', review });
  } catch (error) {
    console.error('Reply review error:', error);
    res.status(500).json({ message: 'Lỗi khi phản hồi đánh giá' });
  }
});

// Đánh dấu review hữu ích
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }
    
    res.json({ message: 'Đã đánh dấu hữu ích', review });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Lỗi khi đánh dấu hữu ích' });
  }
});

// Report review
router.post('/:reviewId/report', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { 
        $inc: { reportCount: 1 },
        status: 'reported'
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }
    
    res.json({ message: 'Đã báo cáo đánh giá', review });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ message: 'Lỗi khi báo cáo đánh giá' });
  }
});

// Admin: Lấy tất cả reviews (bao gồm reported)
router.get('/admin/all', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const reviews = await Review.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đánh giá' });
  }
});

// Admin: Ẩn/hiện review
router.patch('/admin/:reviewId/status', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }
    
    // Cập nhật lại rating nhà hàng
    await updateRestaurantRating(review.restaurantId);
    
    res.json({ message: 'Đã cập nhật trạng thái', review });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
});

// Helper function: Cập nhật rating trung bình của nhà hàng
async function updateRestaurantRating(restaurantId) {
  try {
    const stats = await Review.aggregate([
      { $match: { restaurantId, status: 'active' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$restaurantRating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (stats.length > 0) {
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
        reviews: stats[0].totalReviews
      });
    }
  } catch (error) {
    console.error('Update restaurant rating error:', error);
  }
}

export default router;
