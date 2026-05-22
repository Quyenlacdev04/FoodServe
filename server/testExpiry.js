import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Restaurant from './models/Restaurant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function setExpiringRestaurant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Lấy nhà hàng có ownerId (CANTEEN CTECH)
    const restaurant = await Restaurant.findOne({ ownerId: { $exists: true, $ne: null } });
    
    if (!restaurant) {
      console.log('❌ Không tìm thấy nhà hàng nào có owner');
      process.exit(1);
    }

    // Set subscription sắp hết hạn sau 5 ngày
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    
    restaurant.subscriptionExpiry = fiveDaysFromNow;
    restaurant.isActive = true; // Đảm bảo nhà hàng đang hoạt động
    await restaurant.save();

    console.log('✅ Đã set nhà hàng sắp hết hạn:');
    console.log(`   Tên: ${restaurant.name}`);
    console.log(`   ID: ${restaurant._id}`);
    console.log(`   Owner ID: ${restaurant.ownerId}`);
    console.log(`   Hết hạn: ${fiveDaysFromNow.toLocaleString('vi-VN')}`);
    console.log(`   Còn: 5 ngày`);
    console.log('\n🔔 Bây giờ bạn có thể đăng nhập vào tài khoản chủ nhà hàng để xem cảnh báo!');
    console.log(`💡 Chạy: node triggerCheck.js để gửi thông báo`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

setExpiringRestaurant();
