import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDatabase() {
  try {
    console.log('🔌 Đang kết nối MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối thành công!\n');

    // Kiểm tra các collections
    console.log('📊 THỐNG KÊ DATABASE:');
    console.log('='.repeat(60));

    // Users
    const userCount = await User.countDocuments();
    console.log(`\n👤 USERS: ${userCount} tài khoản`);
    if (userCount > 0) {
      const users = await User.find().select('-password').limit(5);
      console.log('   Mẫu dữ liệu:');
      users.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - Role: ${u.role} - Coins: ${u.coins || 0} - Spins: ${u.spins || 0}`);
      });
    }

    // Restaurants
    const restaurantCount = await Restaurant.countDocuments();
    console.log(`\n🍽️  RESTAURANTS: ${restaurantCount} nhà hàng`);
    if (restaurantCount > 0) {
      const restaurants = await Restaurant.find().limit(5);
      console.log('   Mẫu dữ liệu:');
      restaurants.forEach(r => {
        console.log(`   - ${r.name} (⭐${r.rating}) - ${r.categories.join(', ')}`);
      });
    }

    // Menu Items
    const menuCount = await MenuItem.countDocuments();
    console.log(`\n🍔 MENU ITEMS: ${menuCount} món ăn`);
    if (menuCount > 0) {
      const items = await MenuItem.find().limit(5);
      console.log('   Mẫu dữ liệu:');
      for (const item of items) {
        const restaurant = await Restaurant.findById(item.restaurantId);
        console.log(`   - ${item.name} (${item.price.toLocaleString('vi-VN')}đ) - ${restaurant?.name || 'N/A'}`);
      }
    }

    // Orders
    const orderCount = await Order.countDocuments();
    console.log(`\n📦 ORDERS: ${orderCount} đơn hàng`);
    if (orderCount > 0) {
      const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
      console.log('   Mẫu dữ liệu:');
      orders.forEach(o => {
        console.log(`   - #${o._id.toString().substring(0, 8)} - ${o.status} - ${o.finalAmount?.toLocaleString('vi-VN') || o.totalAmount?.toLocaleString('vi-VN')}đ`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 CẤU TRÚC COLLECTIONS:');
    console.log('='.repeat(60));

    // Lấy schema info
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCác collections trong database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Sample document structure
    console.log('\n📄 CẤU TRÚC MẪU:');
    console.log('='.repeat(60));

    if (userCount > 0) {
      const sampleUser = await User.findOne();
      console.log('\n👤 User Schema:');
      console.log(JSON.stringify(sampleUser.toObject(), null, 2));
    }

    if (restaurantCount > 0) {
      const sampleRestaurant = await Restaurant.findOne();
      console.log('\n🍽️  Restaurant Schema:');
      console.log(JSON.stringify(sampleRestaurant.toObject(), null, 2));
    }

    if (menuCount > 0) {
      const sampleMenuItem = await MenuItem.findOne();
      console.log('\n🍔 MenuItem Schema:');
      console.log(JSON.stringify(sampleMenuItem.toObject(), null, 2));
    }

    if (orderCount > 0) {
      const sampleOrder = await Order.findOne();
      console.log('\n📦 Order Schema:');
      console.log(JSON.stringify(sampleOrder.toObject(), null, 2));
    }

    console.log('\n✅ Hoàn tất kiểm tra database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkDatabase();
