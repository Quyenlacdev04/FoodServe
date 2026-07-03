import express from 'express';
import MealSubscription from '../models/MealSubscription.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// ===== ĐĂNG KÝ GÓI ĂN MỚI (POST /) =====
router.post('/', async (req, res) => {
  try {
    const { userId, restaurantId, items, planType, deliveryTime } = req.body;

    if (!userId || !restaurantId || !items || !items.length || !planType || !deliveryTime) {
      return res.status(400).json({ message: 'Thiếu thông tin đăng ký bắt buộc' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng' });

    // Tính tiền một bữa ăn đơn lẻ
    const mealPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Tính tổng số ngày và giá trị gói ăn sau khi giảm giá
    const days = planType === 'weekly' ? 5 : 20;
    const discount = planType === 'weekly' ? 0.10 : 0.20; // 10% cho tuần, 20% cho tháng
    const totalPrice = Math.round(mealPrice * days * (1 - discount));

    // Quy đổi Xu: 1 Xu = 1.000đ
    const requiredCoins = totalPrice / 1000;

    if ((user.coins || 0) < requiredCoins) {
      return res.status(400).json({ 
        message: `Tài khoản không đủ xu. Cần ${requiredCoins} Xu (tương đương ${new Intl.NumberFormat('vi-VN').format(totalPrice)}đ). Hiện có: ${user.coins || 0} Xu. Vui lòng nạp thêm!` 
      });
    }

    // Tính toán ngày bắt đầu và ngày kết thúc (bỏ qua ngày cuối tuần)
    const startDate = new Date();
    const endDate = new Date();
    // Thêm số ngày tương đương để giao đủ số bữa (weekly = 7 ngày lịch, monthly = 28 ngày lịch)
    const calendarDaysToAdd = planType === 'weekly' ? 7 : 28;
    endDate.setDate(startDate.getDate() + calendarDaysToAdd);

    // Trừ xu của user
    user.coins = Math.round((user.coins - requiredCoins) * 100) / 100;
    user.totalSpent = (user.totalSpent || 0) + totalPrice;
    await user.save();

    // Tạo gói đăng ký
    const subscription = new MealSubscription({
      userId,
      restaurantId,
      items,
      planType,
      deliveryTime,
      daysOfWeek: [1, 2, 3, 4, 5], // Giao từ thứ 2 đến thứ 6
      startDate,
      endDate,
      totalPrice,
      status: 'active',
      paymentStatus: 'paid'
    });

    await subscription.save();

    // Tạo thông báo cho user
    const notification = new Notification({
      userId,
      type: 'voucher_received', // sử dụng chung type thông báo thưởng
      title: '📅 Đăng ký Gói Ăn thành công! 🎉',
      message: `Bạn đã đăng ký thành công Gói Ăn ${planType === 'weekly' ? 'Tuần (5 bữa)' : 'Tháng (20 bữa)'}. Giao lúc ${deliveryTime} mỗi ngày.`,
      read: false
    });
    await notification.save();

    res.status(201).json({ 
      message: 'Đăng ký gói ăn thành công!', 
      subscription,
      updatedCoins: user.coins 
    });

  } catch (error) {
    console.error('Create meal subscription error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký gói ăn' });
  }
});

// ===== LẤY DANH SÁCH GÓI ĂN CỦA USER (GET /user/:userId) =====
router.get('/user/:userId', async (req, res) => {
  try {
    const subs = await MealSubscription.find({ userId: req.params.userId })
      .populate('restaurantId', 'name image address')
      .sort({ createdAt: -1 })
      .lean();
    res.json(subs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi tải danh sách gói ăn' });
  }
});

// ===== TẠM DỪNG GÓI ĂN (PUT /:id/pause) =====
router.put('/:id/pause', async (req, res) => {
  try {
    const sub = await MealSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Không tìm thấy gói đăng ký' });

    sub.status = 'paused';
    await sub.save();
    res.json({ message: 'Đã tạm dừng gói ăn thành công!', subscription: sub });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===== KÍCH HOẠT LẠI GÓI ĂN (PUT /:id/resume) =====
router.put('/:id/resume', async (req, res) => {
  try {
    const sub = await MealSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Không tìm thấy gói đăng ký' });

    sub.status = 'active';
    // Đẩy lùi ngày kết thúc tương ứng với khoảng thời gian tạm dừng (tùy chọn đơn giản)
    await sub.save();
    res.json({ message: 'Đã kích hoạt lại gói ăn thành công!', subscription: sub });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===== HỦY GÓI ĂN & HOÀN TIỀN CÒN LẠI (DELETE /:id) =====
router.delete('/:id', async (req, res) => {
  try {
    const sub = await MealSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Không tìm thấy gói đăng ký' });
    if (sub.status === 'cancelled' || sub.status === 'completed') {
      return res.status(400).json({ message: 'Gói ăn này đã kết thúc hoặc đã hủy từ trước' });
    }

    const user = await User.findById(sub.userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng' });

    // Tính toán số ngày chưa giao
    const maxDays = sub.planType === 'weekly' ? 5 : 20;
    const deliveredCount = sub.ordersDispatched.length;
    const remainingDays = maxDays - deliveredCount;

    let refundAmount = 0;
    if (remainingDays > 0) {
      // Hoàn tiền dựa trên tỷ lệ ngày chưa giao / tổng số ngày nhân với tổng số tiền
      const pricePerDay = sub.totalPrice / maxDays;
      refundAmount = Math.round(pricePerDay * remainingDays);
    }

    // Hoàn xu lại ví
    const refundCoins = refundAmount / 1000;
    if (refundCoins > 0) {
      user.coins = Math.round((user.coins + refundCoins) * 100) / 100;
      await user.save();
    }

    sub.status = 'cancelled';
    await sub.save();

    // Tạo thông báo hoàn tiền
    const notification = new Notification({
      userId: sub.userId,
      type: 'coins_received',
      title: '💸 Đã hủy gói ăn & Hoàn xu!',
      message: `Đã hủy gói ăn thành công. Hoàn lại ${refundCoins} Xu vào ví của bạn cho ${remainingDays} ngày chưa giao.`,
      read: false
    });
    await notification.save();

    res.json({ 
      message: `Đã hủy gói ăn thành công. Hoàn lại ${refundCoins} Xu cho ${remainingDays} ngày chưa giao.`, 
      subscription: sub,
      updatedCoins: user.coins
    });

  } catch (error) {
    console.error('Cancel meal subscription error:', error);
    res.status(500).json({ message: 'Lỗi server khi hủy gói ăn' });
  }
});

export default router;
