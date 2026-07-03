import express from 'express';
import Voucher from '../models/Voucher.js';
import User from '../models/User.js';

const router = express.Router();

// ===== LẤY TẤT CẢ VOUCHER (Admin) =====
router.get('/', async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===== TẠO VOUCHER MỚI (Admin) =====
router.post('/', async (req, res) => {
  try {
    const { code, description, type, value, minOrder, maxDiscount, usageLimit, expiresAt, isActive, createdBy } = req.body;

    if (!code || !value) return res.status(400).json({ message: 'Thiếu mã hoặc giá trị voucher' });

    const existing = await Voucher.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Mã voucher đã tồn tại' });

    const voucher = new Voucher({
      code: code.toUpperCase(),
      description, type, value,
      minOrder: minOrder || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || 0,
      expiresAt: expiresAt || null,
      isActive: isActive !== false,
      createdBy
    });

    await voucher.save();
    res.status(201).json({ message: 'Tạo voucher thành công!', voucher });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo voucher' });
  }
});

// ===== CẬP NHẬT VOUCHER (Admin) =====
router.put('/:id', async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher' });
    res.json({ message: 'Cập nhật thành công!', voucher });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===== XÓA VOUCHER (Admin) =====
router.delete('/:id', async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa voucher' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===== PHÁT VOUCHER CHO TẤT CẢ USER (Admin) =====
router.post('/:id/broadcast', async (req, res) => {
  try {
    const { targetRole = 'user' } = req.body; // user | shipper | merchant | all
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher' });

    // Lấy danh sách user cần phát
    let filter = {};
    if (targetRole === 'user') filter = { role: 'user' };
    else if (targetRole === 'shipper') filter = { role: 'shipper' };
    else if (targetRole === 'merchant') filter = { role: 'merchant' };
    // targetRole === 'all' thì không filter

    const users = await User.find(filter).select('_id vouchers role');

    let count = 0;
    for (const user of users) {
      if (!user.vouchers) user.vouchers = [];
      if (!user.vouchers.includes(voucher.code)) {
        user.vouchers.push(voucher.code);
        await user.save();
        count++;
      }
    }

    // Cập nhật targetUsers
    voucher.targetUsers = targetRole === 'all' ? 'all' : 'specific';
    await voucher.save();

    const roleText = targetRole === 'user' ? 'khách hàng' : targetRole === 'shipper' ? 'tài xế' : targetRole === 'merchant' ? 'đối tác' : 'tài khoản';
    res.json({ message: `Đã phát voucher "${voucher.code}" cho ${count} ${roleText}!`, count });
  } catch (error) {
    console.error('Broadcast voucher error:', error);
    res.status(500).json({ message: 'Lỗi server khi phát voucher' });
  }
});

// ===== PHÁT VOUCHER CHO USER CỤ THỂ (Admin) =====
router.post('/:id/assign', async (req, res) => {
  try {
    const { userIds } = req.body; // mảng user IDs
    if (!userIds || !userIds.length) return res.status(400).json({ message: 'Thiếu danh sách user' });

    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher' });

    let count = 0;
    for (const uid of userIds) {
      const user = await User.findById(uid);
      if (user) {
        if (!user.vouchers) user.vouchers = [];
        if (!user.vouchers.includes(voucher.code)) {
          user.vouchers.push(voucher.code);
          await user.save();
          count++;
        }
      }
    }

    res.json({ message: `Đã phát cho ${count} user!`, count });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===== VALIDATE VOUCHER (User dùng khi checkout) =====
router.post('/validate', async (req, res) => {
  try {
    const { code, userId, orderTotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Thiếu mã voucher' });

    const upperCode = code.toUpperCase();

    // Tìm trong DB trước
    let voucher = await Voucher.findOne({ code: upperCode, isActive: true });

    // Fallback: vouchers mặc định trong hệ thống (tương thích ngược)
    const defaultVouchers = {
      'SALE10':  { type: 'percent', value: 10, minOrder: 0, description: 'Giảm 10%', maxDiscount: 0 },
      'FOOD50':  { type: 'fixed', value: 50000, minOrder: 150000, description: 'Giảm 50.000đ' },
      'FREESHIP':{ type: 'fixed', value: 25000, minOrder: 0, description: 'Freeship 25.000đ' },
      'NEW30':   { type: 'fixed', value: 30000, minOrder: 100000, description: 'Giảm 30.000đ' },
      'VIP100':  { type: 'fixed', value: 100000, minOrder: 300000, description: 'Giảm 100.000đ' },
      'SALE20':  { type: 'fixed', value: 20000, minOrder: 0, description: 'Giảm 20.000đ' },
      'SAVE15':  { type: 'percent', value: 15, minOrder: 100000, description: 'Giảm 15% tối đa 40k cho giỏ hàng bỏ quên', maxDiscount: 40000 },
    };

    let voucherData;

    if (voucher) {
      // Kiểm tra hết hạn
      if (voucher.expiresAt && new Date() > new Date(voucher.expiresAt)) {
        return res.status(400).json({ message: 'Mã voucher đã hết hạn' });
      }
      // Kiểm tra giới hạn sử dụng
      if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).json({ message: 'Mã voucher đã hết lượt sử dụng' });
      }
      // Kiểm tra user có trong danh sách nếu targetUsers = specific
      if (voucher.targetUsers === 'specific' && userId) {
        const user = await User.findById(userId);
        const hasVoucher = user?.vouchers?.includes(upperCode);
        if (!hasVoucher) {
          return res.status(403).json({ message: 'Mã voucher này không dành cho bạn' });
        }
      }
      voucherData = {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        minOrder: voucher.minOrder,
        maxDiscount: voucher.maxDiscount,
        description: voucher.description,
      };
    } else if (defaultVouchers[upperCode]) {
      // Dùng voucher mặc định
      voucherData = { code: upperCode, ...defaultVouchers[upperCode] };
    } else {
      // Kiểm tra trong vouchers của user (từ minigame)
      if (userId) {
        const user = await User.findById(userId);
        if (user?.vouchers?.includes(upperCode)) {
          // Voucher từ minigame — tạo data tạm
          voucherData = { code: upperCode, type: 'fixed', value: 20000, minOrder: 0, description: 'Voucher thưởng' };
        }
      }
      if (!voucherData) {
        return res.status(404).json({ message: 'Mã voucher không hợp lệ hoặc đã hết hạn' });
      }
    }

    // Kiểm tra đơn tối thiểu
    if (orderTotal !== undefined && voucherData.minOrder > 0 && orderTotal < voucherData.minOrder) {
      const shortage = voucherData.minOrder - orderTotal;
      return res.status(400).json({
        message: `Bạn còn thiếu ${new Intl.NumberFormat('vi-VN').format(shortage)}đ để sử dụng mã này (đơn tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucherData.minOrder)}đ)`,
        minOrder: voucherData.minOrder,
        currentTotal: orderTotal,
        shortage
      });
    }

    // Tính discount
    let discount;
    if (voucherData.type === 'percent') {
      discount = orderTotal ? (orderTotal * voucherData.value) / 100 : 0;
      if (voucherData.maxDiscount > 0) discount = Math.min(discount, voucherData.maxDiscount);
    } else {
      discount = voucherData.value;
    }

    res.json({
      valid: true,
      voucher: voucherData,
      discount,
      message: `Áp dụng "${voucherData.code}" thành công! Giảm ${new Intl.NumberFormat('vi-VN').format(discount)}đ`
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra voucher' });
  }
});

// ===== ĐÁNH DẤU ĐÃ DÙNG (sau khi đặt hàng thành công) =====
router.post('/use', async (req, res) => {
  try {
    const { code, userId } = req.body;
    const upperCode = code?.toUpperCase();

    // Cập nhật usedCount trong DB
    const voucher = await Voucher.findOne({ code: upperCode });
    if (voucher) {
      voucher.usedCount += 1;
      if (userId && !voucher.usedBy.includes(userId)) {
        voucher.usedBy.push(userId);
      }
      await voucher.save();
    }

    // Xóa voucher khỏi user (nếu có)
    if (userId) {
      await User.findByIdAndUpdate(userId, { $pull: { vouchers: upperCode } });
    }

    res.json({ message: 'OK' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
