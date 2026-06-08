/**
 * Script: Đồng bộ cover = image cho tất cả nhà hàng
 * Chạy: node server/syncRestaurantCovers.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Restaurant from './models/Restaurant.js';

async function syncCovers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Lấy tất cả nhà hàng mà cover khác image (hoặc cover rỗng)
    const restaurants = await Restaurant.find({});
    let updated = 0;

    for (const r of restaurants) {
      // Nếu cover trống hoặc khác image → đồng bộ cover = image
      if (!r.cover || r.cover !== r.image) {
        r.cover = r.image;
        await r.save();
        updated++;
        console.log(`  🔄 ${r.name}: cover → ${r.image}`);
      }
    }

    console.log(`\n✅ Đã đồng bộ ${updated}/${restaurants.length} nhà hàng`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

syncCovers();
