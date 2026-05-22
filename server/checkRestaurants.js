import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Restaurant from './models/Restaurant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkRestaurants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    const restaurants = await Restaurant.find();
    console.log(`Tổng số nhà hàng: ${restaurants.length}\n`);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    restaurants.forEach((r, index) => {
      const daysLeft = Math.ceil((new Date(r.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24));
      const isExpiring = r.subscriptionExpiry >= now && r.subscriptionExpiry <= sevenDaysFromNow;
      
      console.log(`${index + 1}. ${r.name}`);
      console.log(`   ID: ${r._id}`);
      console.log(`   Owner ID: ${r.ownerId}`);
      console.log(`   Hết hạn: ${new Date(r.subscriptionExpiry).toLocaleString('vi-VN')}`);
      console.log(`   Còn: ${daysLeft} ngày`);
      console.log(`   Sắp hết hạn (≤7 ngày): ${isExpiring ? '✅ CÓ' : '❌ KHÔNG'}`);
      console.log(`   Trạng thái: ${r.isActive !== false ? '✅ Hoạt động' : '🔒 Bị khóa'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkRestaurants();
