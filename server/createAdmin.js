import mongoose from 'mongoose'
import User from './models/User.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('📦 Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('✅ Admin account already exists:', existingAdmin.email)
      console.log('📧 Email:', existingAdmin.email)
      console.log('🔑 Password:', existingAdmin.password)
      process.exit(0)
    }

    // Create admin account
    const admin = new User({
      name: 'Administrator',
      email: 'admin@foodserve.vn',
      password: 'admin123',
      phone: '0123456789',
      role: 'admin',
      coins: 999999,
      spins: 999,
      totalSpent: 0
    })

    await admin.save()
    console.log('🎉 Admin account created successfully!')
    console.log('📧 Email: admin@foodserve.vn')
    console.log('🔑 Password: admin123')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()