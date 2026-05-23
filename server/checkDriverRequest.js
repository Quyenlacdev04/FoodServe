import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import DriverRequest from './models/DriverRequest.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0'

async function checkDriverRequest() {
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
    console.log('   - isShipper:', user.isShipper)
    console.log('   - vehicleType:', user.vehicleType || 'KHÔNG CÓ')
    console.log('   - vehicleNumber:', user.vehicleNumber || 'KHÔNG CÓ')
    console.log('')

    // Tìm đơn đăng ký tài xế
    const driverRequest = await DriverRequest.findOne({ email: user.email })
    
    if (!driverRequest) {
      console.log('❌ KHÔNG tìm thấy đơn đăng ký tài xế')
      console.log('')
      
      // Liệt kê tất cả đơn đăng ký
      const allRequests = await DriverRequest.find()
      console.log('📋 Danh sách tất cả đơn đăng ký tài xế:')
      if (allRequests.length === 0) {
        console.log('   (Không có đơn nào)')
      } else {
        allRequests.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.name} (${r.email})`)
          console.log(`      - Status: ${r.status}`)
          console.log(`      - Vehicle: ${r.vehicleType} - ${r.licensePlate}`)
          console.log(`      - Created: ${r.createdAt}`)
        })
      }
    } else {
      console.log('✅ Tìm thấy đơn đăng ký tài xế:')
      console.log('   - Status:', driverRequest.status)
      console.log('   - Vehicle Type:', driverRequest.vehicleType)
      console.log('   - License Plate:', driverRequest.licensePlate)
      console.log('   - Driver License:', driverRequest.driverLicense)
      console.log('   - Created:', driverRequest.createdAt)
      console.log('')
      
      if (driverRequest.status === 'pending') {
        console.log('⏳ Đơn đang chờ Admin phê duyệt')
        console.log('💡 Bạn cần Admin vào trang /admin → Tab "Tài xế" → Phê duyệt đơn')
      } else if (driverRequest.status === 'approved') {
        console.log('✅ Đơn đã được phê duyệt!')
        if (!user.isShipper) {
          console.log('⚠️  NHƯNG user.isShipper vẫn là false!')
          console.log('💡 Cần cập nhật user.isShipper = true')
        }
      } else if (driverRequest.status === 'rejected') {
        console.log('❌ Đơn đã bị từ chối')
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  }
}

checkDriverRequest()
