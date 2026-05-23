import express from 'express';
import Favorite from '../models/Favorite.js';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// Lấy danh sách yêu thích của user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const favorites = await Favorite.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Lấy thông tin nhà hàng
    const restaurantIds = favorites.map(f => f.restaurantId);
    const restaurants = await Restaurant.find({ 
      _id: { $in: restaurantIds },
      isActive: { $ne: false }
    }).lean();
    
    res.json({
      favorites,
      restaurants
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích' });
  }
});

// Thêm vào yêu thích
router.post('/', async (req, res) => {
  try {
    const { userId, restaurantId } = req.body;
    
    if (!userId || !restaurantId) {
      return res.status(400).json({ message: 'Thiếu thông tin userId hoặc restaurantId' });
    }
    
    // Kiểm tra nhà hàng có tồn tại không
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }
    
    // Kiểm tra đã yêu thích chưa
    const existing = await Favorite.findOne({ userId, restaurantId });
    if (existing) {
      return res.status(400).json({ message: 'Đã có trong danh sách yêu thích' });
    }
    
    // Thêm mới
    const favorite = await Favorite.create({ userId, restaurantId });
    
    res.status(201).json({
      message: 'Đã thêm vào yêu thích',
      favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Lỗi khi thêm yêu thích' });
  }
});

// Xóa khỏi yêu thích
router.delete('/', async (req, res) => {
  try {
    const { userId, restaurantId } = req.body;
    
    if (!userId || !restaurantId) {
      return res.status(400).json({ message: 'Thiếu thông tin userId hoặc restaurantId' });
    }
    
    const result = await Favorite.findOneAndDelete({ userId, restaurantId });
    
    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy trong danh sách yêu thích' });
    }
    
    res.json({ message: 'Đã xóa khỏi yêu thích' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Lỗi khi xóa yêu thích' });
  }
});

// Kiểm tra nhà hàng có trong yêu thích không
router.get('/check/:userId/:restaurantId', async (req, res) => {
  try {
    const { userId, restaurantId } = req.params;
    
    const favorite = await Favorite.findOne({ userId, restaurantId });
    
    res.json({
      isFavorite: !!favorite
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Lỗi khi kiểm tra yêu thích' });
  }
});

// Toggle yêu thích (thêm nếu chưa có, xóa nếu đã có)
router.post('/toggle', async (req, res) => {
  try {
    const { userId, restaurantId } = req.body;
    
    if (!userId || !restaurantId) {
      return res.status(400).json({ message: 'Thiếu thông tin userId hoặc restaurantId' });
    }
    
    const existing = await Favorite.findOne({ userId, restaurantId });
    
    if (existing) {
      // Xóa
      await Favorite.findByIdAndDelete(existing._id);
      return res.json({
        message: 'Đã xóa khỏi yêu thích',
        isFavorite: false
      });
    } else {
      // Thêm
      await Favorite.create({ userId, restaurantId });
      return res.json({
        message: 'Đã thêm vào yêu thích',
        isFavorite: true
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Lỗi khi toggle yêu thích' });
  }
});

export default router;
