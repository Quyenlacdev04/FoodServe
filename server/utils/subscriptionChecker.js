import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Kiểm tra và cảnh báo nhà hàng sắp hết hạn
export async function checkExpiringSubscriptions(io) {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Tìm nhà hàng sắp hết hạn trong 7 ngày
    const restaurants = await Restaurant.find({
      subscriptionExpiry: {
        $gte: now,
        $lte: sevenDaysFromNow
      }
    });

    for (const restaurant of restaurants) {
      const daysLeft = Math.ceil((new Date(restaurant.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24));
      
      // Gửi thông báo cho tất cả nhà hàng sắp hết hạn (trong vòng 7 ngày)
      // Chỉ gửi 1 lần mỗi ngày để tránh spam
      const owner = await User.findById(restaurant.ownerId);
      if (!owner) continue;

      // Kiểm tra xem đã gửi thông báo hôm nay chưa
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingNotification = await Notification.findOne({
        userId: owner._id,
        type: 'subscription_expiring',
        'data.restaurantId': restaurant._id.toString(),
        createdAt: { $gte: today }
      });

      if (existingNotification) {
        console.log(`⏭️  Skipped ${restaurant.name} - already notified today`);
        continue;
      }

      const notification = await Notification.create({
        userId: owner._id,
        type: 'subscription_expiring',
        title: `⏰ Phí duy trì sắp hết hạn`,
        message: `Cửa hàng "${restaurant.name}" sẽ hết hạn trong ${daysLeft} ngày (${new Date(restaurant.subscriptionExpiry).toLocaleDateString('vi-VN')}). Vui lòng gia hạn để tiếp tục kinh doanh.`,
        data: {
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          daysLeft: daysLeft,
          expiryDate: restaurant.subscriptionExpiry
        }
      });

      // Gửi real-time notification
      if (io) {
        io.to(`user-${owner._id}`).emit('new-notification', notification);
      }

      console.log(`⏰ Sent expiry warning to ${restaurant.name} (${daysLeft} days left)`);
    }

    // Tìm và khóa nhà hàng đã hết hạn
    const expiredRestaurants = await Restaurant.find({
      subscriptionExpiry: { $lt: now },
      isActive: { $ne: false } // Chỉ xử lý những nhà hàng chưa bị khóa
    });

    for (const restaurant of expiredRestaurants) {
      // Đánh dấu nhà hàng không hoạt động
      restaurant.isActive = false;
      await restaurant.save();

      const owner = await User.findById(restaurant.ownerId);
      if (!owner) continue;

      const notification = await Notification.create({
        userId: owner._id,
        type: 'subscription_expiring',
        title: `🔒 Cửa hàng đã bị tạm khóa`,
        message: `Cửa hàng "${restaurant.name}" đã hết hạn phí duy trì và bị tạm khóa. Khách hàng không thể xem hoặc đặt hàng. Vui lòng gia hạn ngay để mở lại.`,
        data: {
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          expiryDate: restaurant.subscriptionExpiry
        }
      });

      // Gửi real-time notification
      if (io) {
        io.to(`user-${owner._id}`).emit('new-notification', notification);
      }

      console.log(`🔒 Locked expired restaurant: ${restaurant.name}`);
    }

    console.log(`✅ Subscription check completed: ${restaurants.length} expiring, ${expiredRestaurants.length} expired`);
  } catch (error) {
    console.error('❌ Subscription check error:', error);
  }
}

// Kiểm tra ngay khi server khởi động
export async function checkOnStartup(io) {
  console.log('🔍 Running initial subscription check...');
  await checkExpiringSubscriptions(io);
}
