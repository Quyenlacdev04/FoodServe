import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkExpiringSubscriptions } from './utils/subscriptionChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function triggerCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    console.log('🔍 Running subscription check...\n');

    await checkExpiringSubscriptions(null); // null vì không có io trong script

    console.log('\n✅ Check completed! Thông báo đã được tạo trong database.');
    console.log('💡 Đăng nhập vào app để xem thông báo!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

triggerCheck();
