import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Restaurant from './models/Restaurant.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0'

async function checkUserRestaurant() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('📦 Connected to MongoDB\n')

    // Tìm user demo
    const user = await User.findOne({ email: 'demo@foodserve.vn' })
    
    if (!user) {
      console.log('❌ User demo@foodserve.vn không tồn tại')
      process.exit(1)
    }

    console.log('✅ User info:')
    console.log('   - ID:', user._id.toString())
    console.log('   - Name:', user.name)
    console.log('   - Email:', user.email)
    console.log('   - Role:', user.role)
    console.log('   - isMerchant:', user.isMerchant)
    console.log('')

    // Tìm nhà hàng của user
    const restaurant = await Restaurant.findOne({ ownerId: user._id })
    
    if (!restaurant) {
      console.log('❌ KHÔNG tìm thấy nhà hàng với ownerId:', user._id.toString())
      console.log('')
      
      // Liệt kê tất cả nhà hàng và ownerId của chúng
      const allRestaurants = await Restaurant.find()
      console.log('📋 Danh sách tất cả nhà hàng:')
      allRestaurants.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.name}`)
        console.log(`      - ID: ${r._id}`)
        console.log(`      - ownerId: ${r.ownerId || 'KHÔNG CÓ'}`)
      })
    } else {
      console.log('✅ Tìm thấy nhà hàng:')
      console.log('   - ID:', restaurant._id)
      console.log('   - Name:', restaurant.name)
      console.log('   - ownerId:', restaurant.ownerId)
      console.log('   - Address:', restaurant.address)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  }
}

checkUserRestaurant()
