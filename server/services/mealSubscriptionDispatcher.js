import MealSubscription from '../models/MealSubscription.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';

/**
 * Service tự động kiểm tra và tạo đơn hàng từ gói đăng ký ăn uống (Meal Subscription)
 */

export async function checkAndDispatchSubscriptions(io) {
  try {
    const now = new Date();
    
    // Múi giờ Việt Nam (UTC + 7)
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const vnDay = vnTime.getUTCDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    const vnDateStr = vnTime.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const vnHour = vnTime.getUTCHours();
    const vnMinute = vnTime.getUTCMinutes();
    const currentMinutes = vnHour * 60 + vnMinute;

    // Tìm các gói đăng ký đang hoạt động và trong thời gian hiệu lực
    const activeSubs = await MealSubscription.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      daysOfWeek: vnDay // Trùng ngày trong tuần
    });

    if (activeSubs.length === 0) return;

    for (const sub of activeSubs) {
      // 1. Kiểm tra xem hôm nay gói này đã giao đơn chưa để tránh trùng đơn
      const alreadyDispatched = sub.ordersDispatched.some(d => d.date === vnDateStr);
      if (alreadyDispatched) continue;

      // 2. Kiểm tra thời gian giao hàng (đặt đơn trước 30-45 phút để quán chuẩn bị và giao kịp giờ)
      const [deliveryHour, deliveryMinute] = sub.deliveryTime.split(':').map(Number);
      const targetTimeMinutes = deliveryHour * 60 + deliveryMinute;
      
      // Thời điểm kích hoạt tự động đặt đơn (trước giờ giao 35 phút)
      const dispatchTriggerMinutes = targetTimeMinutes - 35;

      if (currentMinutes >= dispatchTriggerMinutes) {
        console.log(`🚀 [MealSubscription] Tự động tạo đơn cho gói của User ${sub.userId} từ quán ${sub.restaurantId} (Hẹn giao: ${sub.deliveryTime})`);

        try {
          // Lấy thông tin user
          const user = await User.findById(sub.userId);
          if (!user) {
            console.error(`❌ [MealSubscription] Không tìm thấy user ${sub.userId}`);
            continue;
          }

          // Lấy thông tin nhà hàng
          const restaurant = await Restaurant.findById(sub.restaurantId);
          if (!restaurant) {
            console.error(`❌ [MealSubscription] Không tìm thấy nhà hàng ${sub.restaurantId}`);
            continue;
          }

          // Tính tổng số tiền đơn hàng
          const totalAmount = sub.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          // Tạo đơn hàng mới
          const newOrder = new Order({
            userId: sub.userId.toString(),
            restaurantId: sub.restaurantId.toString(),
            items: sub.items.map(item => ({
              menuItemId: item.menuItemId.toString(),
              name: item.name,
              price: item.price,
              quantity: item.quantity
            })),
            totalAmount,
            discount: 0,
            deliveryFee: 0, // Miễn phí giao hàng cho gói ăn đăng ký
            finalAmount: totalAmount,
            status: 'pending',
            deliveryAddress: user.address || 'Địa chỉ đăng ký gói ăn',
            contactPhone: user.phone || '0000000000',
            paymentMethod: 'coins',
            paymentStatus: 'paid', // Gói ăn đã được trả tiền trước
            note: `[ĐƠN GÓI ĐĂNG KÝ] Hẹn giao lúc: ${sub.deliveryTime}`,
            restaurant: {
              name: restaurant.name,
              address: restaurant.address,
              location: restaurant.location
            }
          });

          await newOrder.save();

          // Cập nhật thông tin giao của gói đăng ký
          sub.ordersDispatched.push({
            date: vnDateStr,
            orderId: newOrder._id,
            dispatchedAt: new Date()
          });

          // Nếu số lượng đơn hàng giao đã bằng số ngày đăng ký ban đầu, cập nhật hoàn thành
          const maxDays = sub.planType === 'weekly' ? 5 : 20;
          if (sub.ordersDispatched.length >= maxDays) {
            sub.status = 'completed';
          }

          await sub.save();

          // Gửi thông báo cho khách hàng
          const notification = new Notification({
            userId: sub.userId,
            type: 'order_status',
            title: '📅 Đơn hàng định kỳ đã lên lịch!',
            message: `Hệ thống đã tự động tạo đơn hàng từ Gói Đăng Ký của bạn. Giao đến lúc ${sub.deliveryTime}.`,
            data: { orderId: newOrder._id },
            read: false
          });

          await notification.save();

          // Emit thông báo qua Socket.io
          if (io) {
            io.to(`user-${sub.userId.toString()}`).emit('new-notification', notification);
            io.emit('new-order', newOrder); // Gửi đơn mới cho admin & chủ quán
          }

        } catch (dispatchErr) {
          console.error(`❌ [MealSubscription] Lỗi khi tạo đơn hàng tự động:`, dispatchErr.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ [MealSubscription] Lỗi hệ thống check meal subscriptions:', error);
  }
}

/**
 * Khởi động cron job định kỳ kiểm tra gói ăn
 */
export function startMealSubscriptionJob(io) {
  console.log('🚀 [MealSubscription] Khởi động cron job kiểm tra gói ăn đăng ký');

  // Chạy ngay khi khởi động
  setTimeout(() => {
    checkAndDispatchSubscriptions(io);
  }, 10000); // Trì hoãn 10 giây sau startup

  // Kiểm tra định kỳ mỗi 5 phút một lần
  setInterval(async () => {
    await checkAndDispatchSubscriptions(io);
  }, 5 * 60 * 1000);

  console.log('✅ [MealSubscription] Cron job đã được thiết lập (chạy mỗi 5 phút)');
}
