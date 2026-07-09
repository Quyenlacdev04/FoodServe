import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0';

async function checkAllRestaurants() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('CONNECTED TO MONGO DB');

    const restaurants = await Restaurant.find({});
    console.log(`TOTAL RESTAURANTS IN DB: ${restaurants.length}`);
    
    for (const r of restaurants) {
      console.log(`- ID: ${r._id}`);
      console.log(`  Name: ${r.name}`);
      console.log(`  isActive: ${r.isActive}`);
      console.log(`  subscriptionExpiry: ${r.subscriptionExpiry}`);
      console.log(`  ownerId: ${r.ownerId}`);
      if (r.ownerId) {
        const owner = await User.findById(r.ownerId);
        console.log(`  Owner Name: ${owner ? owner.name : 'Not Found'}`);
        console.log(`  Owner Email: ${owner ? owner.email : 'Not Found'}`);
      }
      console.log('-----------------------------');
    }

    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

checkAllRestaurants();
