import Voucher from '../models/Voucher.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * Service kiểm tra voucher sắp hết hạn và tự động xóa voucher đã hết hạn
 */

// Kiểm tra voucher sắp hết hạn (còn < 24h) và gửi thông báo
export async function notifyExpiringVouchers(io) {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

    // Tìm voucher sắp hết hạn (expiresAt trong vòng 24h tới)
    const expiringVouchers = await Voucher.find({
      isActive: true,
      expiresAt: {
        $gte: now,
        $lte: tomorrow
      }
    }).lean();

    if (expiringVouchers.length === 0) {
      console.log('✅ [VoucherExpiry] Không có voucher nào sắp hết hạn');
      return;
    }

    console.log(`⚠️  [VoucherExpiry] Phát hiện ${expiringVouchers.length} voucher sắp hết hạn`);

    for (const voucher of expiringVouchers) {
      const hoursLeft = Math.ceil((new Date(voucher.expiresAt) - now) / (1000 * 60 * 60));
      
      // Tìm tất cả user có voucher này
      const users = await User.find({
        vouchers: voucher.code
      }).select('_id name email');

      console.log(`   📢 Voucher "${voucher.code}" còn ${hoursLeft}h - Gửi thông báo cho ${users.length} user`);

      // Gửi thông báo cho từng user
      for (const user of users) {
        try {
          const notification = new Notification({
            userId: user._id,
            type: 'voucher_expiring',
            title: '⏰ Voucher sắp hết hạn!',
            message: `Mã "${voucher.code}" chỉ còn ${hoursLeft} giờ nữa hết hạn. Dùng ngay kẻo lỡ!`,
            data: {
              voucherCode: voucher.code,
              expiresAt: voucher.expiresAt,
              hoursLeft
            },
            read: false
          });

          await notification.save();

          // Gửi real-time notification qua Socket.io
          if (io) {
            io.to(`user-${user._id.toString()}`).emit('new-notification', notification);
          }
        } catch (err) {
          console.error(`   ❌ Lỗi gửi thông báo cho user ${user._id}:`, err.message);
        }
      }
    }

    console.log('✅ [VoucherExpiry] Hoàn thành gửi thông báo voucher sắp hết hạn');
  } catch (error) {
    console.error('❌ [VoucherExpiry] Lỗi khi kiểm tra voucher sắp hết hạn:', error);
  }
}

// Xóa voucher đã hết hạn và loại bỏ khỏi user
export async function removeExpiredVouchers() {
  try {
    const now = new Date();

    // Tìm voucher đã hết hạn
    const expiredVouchers = await Voucher.find({
      expiresAt: {
        $lt: now
      }
    }).lean();

    if (expiredVouchers.length === 0) {
      console.log('✅ [VoucherExpiry] Không có voucher nào hết hạn');
      return { removed: 0, users: 0 };
    }

    console.log(`🗑️  [VoucherExpiry] Phát hiện ${expiredVouchers.length} voucher đã hết hạn`);

    let totalUsersAffected = 0;

    for (const voucher of expiredVouchers) {
      // Đánh dấu voucher không còn active (giữ lại record để tracking)
      await Voucher.findByIdAndUpdate(voucher._id, { isActive: false });

      // Xóa voucher khỏi tất cả user
      const result = await User.updateMany(
        { vouchers: voucher.code },
        { $pull: { vouchers: voucher.code } }
      );

      totalUsersAffected += result.modifiedCount;

      console.log(`   🗑️ Voucher "${voucher.code}" - Xóa khỏi ${result.modifiedCount} user`);
    }

    console.log(`✅ [VoucherExpiry] Đã xóa ${expiredVouchers.length} voucher khỏi ${totalUsersAffected} user`);

    return {
      removed: expiredVouchers.length,
      users: totalUsersAffected
    };
  } catch (error) {
    console.error('❌ [VoucherExpiry] Lỗi khi xóa voucher hết hạn:', error);
    return { removed: 0, users: 0 };
  }
}

// Khởi động cron job (chạy mỗi 6 giờ)
export function startVoucherExpiryJob(io) {
  console.log('🚀 [VoucherExpiry] Khởi động cron job kiểm tra voucher hết hạn');

  // Chạy ngay khi khởi động
  setTimeout(() => {
    notifyExpiringVouchers(io);
    removeExpiredVouchers();
  }, 5000); // Delay 5s để server startup hoàn toàn

  // Chạy mỗi 6 giờ
  setInterval(async () => {
    console.log('\n⏰ [VoucherExpiry] Chạy job định kỳ...');
    await notifyExpiringVouchers(io);
    await removeExpiredVouchers();
  }, 6 * 60 * 60 * 1000); // 6 giờ = 6 * 60 * 60 * 1000 ms

  console.log('✅ [VoucherExpiry] Cron job đã được thiết lập (chạy mỗi 6 giờ)');
}

export default {
  notifyExpiringVouchers,
  removeExpiredVouchers,
  startVoucherExpiryJob
};
