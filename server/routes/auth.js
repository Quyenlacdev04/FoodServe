import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { getUserCapabilities, attachCapabilities } from '../utils/userCapabilities.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'foodserve_secret_2026';

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = new Map();

// Tạo email transporter (dùng Gmail hoặc Ethereal test)
const createTransporter = () => {
  // Nếu có cấu hình Gmail thật
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // Dùng Ethereal (email test, không cần cấu hình)
  return null;
};

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
    const capabilities = await getUserCapabilities(user);
    const userData = attachCapabilities(user, capabilities);
    delete userData.password;
    
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
    const capabilities = await getUserCapabilities(user);
    const userData = attachCapabilities(user, capabilities);
    delete userData.password;
    
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
    
    const capabilities = await getUserCapabilities(user);
    res.json(attachCapabilities(user, capabilities));
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

// Verify token (for admin dashboard)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const capabilities = await getUserCapabilities(user);
    res.json({ user: attachCapabilities(user, capabilities) });
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

// Quyền đối tác (quán / tài xế) — dùng cho menu Header
router.get('/capabilities', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Thiếu userId' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }
    const capabilities = await getUserCapabilities(user);
    res.json(capabilities);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// API cập nhật thông tin cá nhân (Profile)
router.put('/profile', async (req, res) => {
  try {
    const { userId, name, phone, address, avatar, vehicleType, vehicleNumber } = req.body;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;
    if (vehicleType !== undefined) user.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber;

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

// API đổi mật khẩu
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    // Kiểm tra mật khẩu hiện tại
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu cũ' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu' });
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
    if (req.body.isOnline !== undefined) user.isOnline = req.body.isOnline;
    if (req.body.vehicleType !== undefined) user.vehicleType = req.body.vehicleType;
    if (req.body.vehicleNumber !== undefined) user.vehicleNumber = req.body.vehicleNumber;
    if (req.body.shipperRating !== undefined) user.shipperRating = Number(req.body.shipperRating);

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

// ===== QUÊN MẬT KHẨU =====

// Bước 1: Gửi OTP về email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });

    const user = await User.findOne({ email });
    if (!user) {
      // Trả về success để tránh lộ thông tin email có tồn tại không
      return res.json({ message: 'Nếu email tồn tại, OTP đã được gửi!' });
    }

    // Tạo OTP 6 số
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    otpStore.set(email, { otp, expiresAt });

    // Gửi email
    const transporter = createTransporter();

    if (transporter) {
      try {
        // Gửi email thật qua Gmail
        await transporter.sendMail({
          from: `"FoodServe 🍽️" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: '🔐 Mã OTP đặt lại mật khẩu FoodServe',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #ff6b35, #f7c948); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🍽️ FoodServe</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Ăn ngon mỗi ngày</p>
              </div>
              <div style="padding: 32px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 8px;">Đặt lại mật khẩu</h2>
                <p style="color: #666; margin-bottom: 24px;">Mã OTP của bạn là:</p>
                <div style="background: #f8f9fa; border: 2px dashed #ff6b35; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 200px;">
                  <span style="font-size: 36px; font-weight: bold; color: #ff6b35; letter-spacing: 8px;">${otp}</span>
                </div>
                <p style="color: #999; font-size: 13px; margin-top: 20px;">⏰ Mã có hiệu lực trong <strong>5 phút</strong></p>
                <p style="color: #bbb; font-size: 12px; margin-top: 8px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
              </div>
            </div>
          `,
        });
      } catch (mailError) {
        console.error('Mail sending error:', mailError);
        return res.status(500).json({ 
          message: 'Không thể gửi email OTP. Vui lòng kiểm tra lại cấu hình EMAIL_USER và EMAIL_PASS trong file .env!' 
        });
      }
    } else {
      // Không có email config — log OTP ra console cho demo/đồ án
      console.log(`\n🔐 OTP cho ${email}: ${otp} (hết hạn sau 5 phút)\n`);
    }

    res.json({ message: 'OTP đã được gửi! Kiểm tra email của bạn.', demo: !transporter ? otp : undefined });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi OTP' });
  }
});

// Bước 2: Xác nhận OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Thiếu email hoặc OTP' });

    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ message: 'OTP không tồn tại hoặc đã hết hạn' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP đã hết hạn. Vui lòng yêu cầu lại.' });
    }
    if (record.otp !== String(otp)) {
      return res.status(400).json({ message: 'OTP không chính xác' });
    }

    // OTP đúng — tạo reset token tạm thời (10 phút)
    const resetToken = crypto.randomBytes(32).toString('hex');
    otpStore.set(email, { ...record, verified: true, resetToken, resetTokenExpiry: Date.now() + 10 * 60 * 1000 });

    res.json({ message: 'OTP hợp lệ!', resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xác nhận OTP' });
  }
});

// Bước 3: Đặt mật khẩu mới
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const record = otpStore.get(email);
    if (!record || !record.verified || record.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    if (Date.now() > record.resetTokenExpiry) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại.' });
    }

    // Cập nhật mật khẩu
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.password = newPassword;
    await user.save();

    // Xóa OTP sau khi dùng
    otpStore.delete(email);

    res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu' });
  }
});

export default router;
