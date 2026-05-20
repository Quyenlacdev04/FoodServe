import express from 'express';
import PartnerRequest from '../models/PartnerRequest.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import DriverRequest from '../models/DriverRequest.js';

const router = express.Router();

// Đăng ký làm đối tác
router.post('/register', async (req, res) => {
  try {
    const partnerRequest = new PartnerRequest(req.body);
    await partnerRequest.save();
    
    // TODO: Gửi email thông báo cho admin
    
    res.status(201).json({ 
      message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24-48 giờ.',
      request: partnerRequest 
    });
  } catch (error) {
    console.error('Partner registration error:', error);
    res.status(500).json({ message: 'Lỗi khi đăng ký. Vui lòng thử lại sau.' });
  }
});

// Lấy danh sách đăng ký (Admin only)
router.get('/requests', async (req, res) => {
  try {
    const requests = await PartnerRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật trạng thái đăng ký (Admin only)
router.patch('/requests/:id', async (req, res) => {
  try {
    const { status, adminNote, reviewedBy } = req.body;
    
    const request = await PartnerRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký' });
    }
    
    request.status = status;
    if (adminNote !== undefined) request.adminNote = adminNote;
    if (reviewedBy !== undefined) request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    
    await request.save();
    
    // Tự động tạo nhà hàng và nâng cấp user thành merchant khi duyệt thành công
    if (status === 'approved') {
      const user = await User.findOne({ email: request.ownerEmail });
      
      const newRestaurant = new Restaurant({
        name: request.restaurantName,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
        cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        rating: 5.0,
        reviews: 0,
        deliveryTime: '20-30',
        distance: 1.5,
        discount: 0,
        categories: request.cuisineTypes,
        address: request.restaurantAddress,
        description: request.description || `Nhà hàng đối tác ${request.restaurantName}`,
        ownerId: user ? user._id : null
      });
      await newRestaurant.save();
      
      if (user) {
        user.role = 'merchant';
        await user.save();
      }
    }
    
    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đăng ký làm đối tác tài xế
router.post('/driver/register', async (req, res) => {
  try {
    const driverRequest = new DriverRequest(req.body);
    await driverRequest.save();
    
    res.status(201).json({ 
      message: 'Đăng ký tài xế thành công! Chúng tôi sẽ xem xét và liên hệ trong vòng 24 giờ.',
      request: driverRequest 
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    res.status(500).json({ message: 'Lỗi khi đăng ký tài xế. Vui lòng thử lại sau.' });
  }
});

// Lấy danh sách đăng ký tài xế (Admin only)
router.get('/driver/requests', async (req, res) => {
  try {
    const requests = await DriverRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đăng ký tài xế' });
  }
});

// Cập nhật trạng thái đăng ký tài xế (Admin only)
router.patch('/driver/requests/:id', async (req, res) => {
  try {
    const { status, adminNote, reviewedBy } = req.body;
    
    const request = await DriverRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký tài xế' });
    }
    
    request.status = status;
    if (adminNote !== undefined) request.adminNote = adminNote;
    if (reviewedBy !== undefined) request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    
    await request.save();
    
    // Tự động nâng cấp user thành shipper khi duyệt thành công
    if (status === 'approved') {
      const user = await User.findOne({ email: request.email });
      if (user) {
        user.role = 'shipper';
        await user.save();
      }
    }
    
    res.json(request);
  } catch (error) {
    console.error('Update driver request error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái đăng ký tài xế' });
  }
});

export default router;
