import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Restaurant from './models/Restaurant.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0'

async function updateUserToMerchant() {
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

    // Cập nhật user thành merchant
    user.isMerchant = true
    user.role = 'merchant'
    await user.save()
    console.log('✅ Đã cập nhật user thành merchant')

    // Kiểm tra xem user đã có nhà hàng chưa
    let restaurant = await Restaurant.findOne({ ownerId: user._id })

    if (!restaurant) {
      // Tạo nhà hàng mới cho user
      restaurant = new Restaurant({
        name: 'Nhà hàng của ' + user.name,
        ownerId: user._id,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
        cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        rating: 5.0,
        reviews: 0,
        deliveryTime: '20-30',
        distance: 2.0,
        orders: 0,
        discount: 0,
        freeship: true,
        promo: 'Nhà hàng mới',
        categories: ['món việt', 'cơm'],
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        description: 'Nhà hàng của bạn',
        isActive: true,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày
      })
      await restaurant.save()
      console.log('✅ Đã tạo nhà hàng mới:', restaurant.name)
    } else {
      console.log('✅ User đã có nhà hàng:', restaurant.name)
    }

    console.log('\n🎉 Hoàn thành! Bây giờ bạn có thể:')
    console.log('1. Đăng nhập với: demo@foodserve.vn / 123456')
    console.log('2. Vào /restaurant-manage để quản lý nhà hàng')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  }
}

updateUserToMerchant()
