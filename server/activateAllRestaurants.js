import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0';

async function activateAllRestaurants() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('CONNECTED TO MONGO DB');

    // Cập nhật tất cả nhà hàng: isActive = true và subscriptionExpiry = 365 ngày tiếp theo
    const oneYearFromNow = new Date();
    oneYearFromNow.setDate(oneYearFromNow.getDate() + 365);

    const result = await Restaurant.updateMany(
      {},
      { 
        $set: { 
          isActive: true,
          subscriptionExpiry: oneYearFromNow
        } 
      }
    );

    console.log(`✅ SUCCESS! Updated ${result.modifiedCount} restaurants.`);

    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

activateAllRestaurants();
