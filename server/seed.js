import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';
import { restaurants, menuItems } from '../src/data/mockData.js';

dotenv.config();

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear old data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('🧹 Cleared old data');

    // Seed users
    await User.create([
      { name: 'Nguyễn Văn A', email: 'demo@foodserve.vn', password: '123456', phone: '0901234567', role: 'user' },
      { name: 'Admin', email: 'admin@foodserve.vn', password: 'admin123', phone: '0909999999', role: 'admin' },
    ]);
    console.log('👤 Seeded users');

    // Seed restaurants and menu items
    for (const r of restaurants) {
      const newRest = await Restaurant.create({
        name: r.name,
        image: r.image,
        cover: r.cover,
        rating: r.rating,
        reviews: r.reviews,
        deliveryTime: r.deliveryTime,
        distance: r.distance,
        orders: r.orders,
        discount: r.discount,
        freeship: r.freeship,
        promo: r.promo,
        categories: r.categories,
        address: r.address,
        description: r.description
      });

      const items = menuItems[r.id];
      if (items) {
        const itemsToInsert = items.map(item => ({
          restaurantId: newRest._id,
          name: item.name,
          price: item.price,
          image: item.image,
          description: item.description,
          popular: item.popular,
          category: item.category
        }));
        await MenuItem.insertMany(itemsToInsert);
      }
    }
    console.log('🍔 Seeded restaurants and menu items');

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
