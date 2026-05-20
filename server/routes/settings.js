import express from 'express';
import SystemSetting from '../models/SystemSetting.js';

const router = express.Router();

// Lấy cấu hình hệ thống hiện tại
router.get('/', async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      // Nếu chưa có cấu hình trong DB, tạo cấu hình mặc định ban đầu
      settings = new SystemSetting();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ message: 'Lỗi server khi tải cài đặt hệ thống' });
  }
});

// Cập nhật cấu hình hệ thống
router.put('/', async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting(req.body);
    } else {
      // Cập nhật các trường gửi lên
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Lỗi server khi lưu cài đặt hệ thống' });
  }
});

export default router;
