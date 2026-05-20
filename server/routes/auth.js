import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'foodserve_secret_2026';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
    user = new User({ name, email, password, phone, role });
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userData } = user.toObject();
    
    res.status(201).json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userData } = user.toObject();
    
    res.json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

// API cập nhật thông tin cá nhân (Profile)
router.put('/profile', async (req, res) => {
  try {
    const { userId, name, phone, address, avatar } = req.body;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const { password: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ' });
  }
});

// API cập nhật số xu, lượt quay, chi tiêu và voucher của user
router.post('/update-coins', async (req, res) => {
  try {
    const { userId, coins, spins, totalSpent, addVoucher, removeVoucher } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    
    if (coins !== undefined) user.coins = (user.coins || 0) + coins;
    if (spins !== undefined) user.spins = (user.spins || 0) + spins;
    if (totalSpent !== undefined) user.totalSpent = (user.totalSpent || 0) + totalSpent;
    
    if (addVoucher) {
      if (!user.vouchers) user.vouchers = [];
      if (!user.vouchers.includes(addVoucher)) {
        user.vouchers.push(addVoucher);
      }
    }
    
    if (removeVoucher && user.vouchers) {
      user.vouchers = user.vouchers.filter(v => v !== removeVoucher);
    }
    
    await user.save();
    
    // Trả về dữ liệu user mới nhất
    const { password: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật' });
  }
});

// API lấy bảng xếp hạng Đại Gia
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({ role: 'user', totalSpent: { $gt: 0 } })
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name avatar totalSpent role');
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy BXH' });
  }
});

// API lấy tất cả users (dành cho Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng' });
  }
});

// API chỉnh sửa thông tin user (dành cho Admin)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, phone, role, coins, spins, totalSpent } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (coins !== undefined) user.coins = Number(coins);
    if (spins !== undefined) user.spins = Number(spins);
    if (totalSpent !== undefined) user.totalSpent = Number(totalSpent);

    await user.save();
    const { password: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin người dùng' });
  }
});

// API xóa user (dành cho Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa người dùng' });
  }
});

export default router;
