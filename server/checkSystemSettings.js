import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import SystemSetting from './models/SystemSetting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const settings = await SystemSetting.findOne();
    console.log('--- SYSTEM SETTINGS ---');
    console.log(JSON.stringify(settings, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
