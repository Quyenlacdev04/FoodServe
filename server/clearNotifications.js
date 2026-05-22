import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Notification from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function clearNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    const result = await Notification.deleteMany({ type: 'subscription_expiring' });
    console.log(`✅ Đã xóa ${result.deletedCount} thông báo cũ`);
    console.log('💡 Bây giờ chạy: node triggerCheck.js để tạo thông báo mới');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

clearNotifications();
