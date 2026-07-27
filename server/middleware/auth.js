import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware xác thực JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }
    
    req.user = user;
    req.user.userId = user._id; // Add userId to user object for compatibility
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }
    return res.status(500).json({ message: 'Lỗi xác thực' });
  }
};

// Legacy support - alias
export const authenticate = authenticateToken;

// Middleware kiểm tra quyền admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập. Chỉ admin mới được phép.' });
  }
  
  next();
};

// Middleware kiểm tra quyền merchant (chủ nhà hàng)
export const requireMerchant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập. Chỉ chủ nhà hàng mới được phép.' });
  }
  
  next();
};

// Middleware kiểm tra quyền shipper
export const requireShipper = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (req.user.role !== 'shipper' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập. Chỉ shipper mới được phép.' });
  }
  
  next();
};

// Middleware kiểm tra quyền sở hữu nhà hàng
export const requireRestaurantOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }
    
    // Admin có thể truy cập tất cả
    if (req.user.role === 'admin') {
      return next();
    }
    
    const restaurantId = req.params.id || req.params.restaurantId || req.body.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: 'Không tìm thấy ID nhà hàng' });
    }
    
    const Restaurant = (await import('../models/Restaurant.js')).default;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }
    
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập nhà hàng này' });
    }
    
    req.restaurant = restaurant;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi kiểm tra quyền sở hữu' });
  }
};
