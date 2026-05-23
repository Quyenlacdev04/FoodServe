import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0'

async function updateUserToShipper() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('📦 Connected to MongoDB')

    // Tìm user demo
    const user = await User.findOne({ email: 'demo@foodserve.vn' })
    
    if (!user) {
      console.log('❌ User demo@foodserve.vn không tồn tại')
      process.exit(1)
    }

    console.log('✅ Tìm thấy user:', user.name)

    // Cập nhật user thành shipper
    user.isShipper = true
    user.vehicleType = 'motorbike' // Xe máy
    user.vehicleNumber = '29A-12345'
    user.isOnline = false
    user.shipperRating = 5.0
    user.totalDeliveries = 0
    
    await user.save()
    console.log('✅ Đã cập nhật user thành shipper')
    console.log('   - isShipper:', user.isShipper)
    console.log('   - vehicleType:', user.vehicleType)
    console.log('   - vehicleNumber:', user.vehicleNumber)

    console.log('\n🎉 Hoàn thành! Bây giờ bạn có thể:')
    console.log('1. Đăng xuất và đăng nhập lại với: demo@foodserve.vn / 123456')
    console.log('2. Vào /driver để truy cập trang tài xế')
    console.log('3. User này vừa là Merchant vừa là Shipper!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  }
}

updateUserToShipper()
