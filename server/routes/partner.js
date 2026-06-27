import express from 'express';
import PartnerRequest from '../models/PartnerRequest.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import DriverRequest from '../models/DriverRequest.js';

const router = express.Router();

const statusLabels = {
  pending: 'đang chờ duyệt',
  reviewing: 'đang được xem xét',
  approved: 'đã được phê duyệt',
  rejected: 'đã bị từ chối',
};

async function getPartnerRegistrationStatus(user) {
  if (!user) {
    return { canRegister: false, reason: 'not_logged_in' };
  }

  if (user.isMerchant || user.role === 'merchant') {
    return {
      canRegister: false,
      reason: 'already_merchant',
      message: 'Tài khoản của bạn đã là đối tác nhà hàng.',
    };
  }

  const ownedRestaurant = await Restaurant.findOne({ ownerId: user._id });
  if (ownedRestaurant) {
    return {
      canRegister: false,
      reason: 'already_merchant',
      message: 'Tài khoản của bạn đã sở hữu nhà hàng trên FoodServe.',
    };
  }

  const existing = await PartnerRequest.findOne({
    $or: [{ userId: user._id }, { ownerEmail: user.email.toLowerCase() }],
  });

  if (existing) {
    const statusText = statusLabels[existing.status] || existing.status;
    return {
      canRegister: false,
      reason: 'already_registered',
      message: `Bạn đã đăng ký đối tác (${statusText}). Mỗi tài khoản chỉ được đăng ký một lần.`,
      request: {
        status: existing.status,
        restaurantName: existing.restaurantName,
        submittedAt: existing.submittedAt || existing.createdAt,
      },
    };
  }

  return { canRegister: true };
}

// Kiểm tra trạng thái đăng ký đối tác theo tài khoản
router.get('/register/status', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Thiếu thông tin tài khoản' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    const status = await getPartnerRegistrationStatus(user);
    res.json(status);
  } catch (error) {
    console.error('Partner status check error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đăng ký làm đối tác (mỗi tài khoản một lần)
router.post('/register', async (req, res) => {
  try {
    const { userId, ownerEmail, ...rest } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để đăng ký đối tác' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    const email = (ownerEmail || '').trim().toLowerCase();
    if (!email || email !== user.email.toLowerCase()) {
      return res.status(400).json({
        message: 'Email đăng ký phải trùng với email tài khoản của bạn',
      });
    }

    const registrationStatus = await getPartnerRegistrationStatus(user);
    if (!registrationStatus.canRegister) {
      return res.status(409).json({
        message: registrationStatus.message || 'Tài khoản này đã đăng ký đối tác',
        reason: registrationStatus.reason,
        request: registrationStatus.request,
      });
    }

    const partnerRequest = new PartnerRequest({
      ...rest,
      userId: user._id,
      ownerEmail: email,
      ownerName: rest.ownerName || user.name,
    });
    await partnerRequest.save();

    res.status(201).json({
      message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24-48 giờ.',
      request: partnerRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Tài khoản này đã đăng ký đối tác. Mỗi tài khoản chỉ được đăng ký một lần.',
        reason: 'already_registered',
      });
    }
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
      
      let location = { lat: 20.8907549, lng: 105.8587752 }; // Default to CTECH Thường Tín
      if (request.restaurantAddress) {
        try {
          const encodedAddress = encodeURIComponent(request.restaurantAddress + ', Việt Nam');
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            { headers: { 'User-Agent': 'FoodServe/1.0' } }
          );
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            location = {
              lat: parseFloat(geoData[0].lat),
              lng: parseFloat(geoData[0].lon)
            };
          }
        } catch (geoErr) {
          console.error('Failed to geocode restaurant address in partner approval:', geoErr.message);
        }
      }

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
        location: location,
        description: request.description || `Nhà hàng đối tác ${request.restaurantName}`,
        ownerId: user ? user._id : null,
        isActive: false, // Mới đăng ký cần đóng phí duy trì để kích hoạt
        subscriptionExpiry: new Date(0) // Hết hạn ngay lập tức để yêu cầu đóng phí
      });
      await newRestaurant.save();
      
      if (user) {
        user.isMerchant = true;
        if (!user.isShipper && user.role === 'user') user.role = 'merchant';
        await user.save();
      }
    }
    
    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

async function getDriverRegistrationStatus(user) {
  if (!user) {
    return { canAccessDriver: false, reason: 'not_logged_in' };
  }

  if (user.isShipper || user.role === 'shipper' || user.role === 'admin') {
    return {
      canAccessDriver: true,
      reason: user.role === 'admin' ? 'admin' : 'already_shipper',
      message: 'Bạn có thể vào trang tài xế để nhận đơn.',
    };
  }

  const existing = await DriverRequest.findOne({
    email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });

  if (!existing) {
    return {
      canAccessDriver: false,
      reason: 'not_registered',
      message: 'Bạn chưa đăng ký đối tác tài xế.',
    };
  }

  if (existing.status === 'approved') {
    return {
      canAccessDriver: false,
      reason: 'approved_sync_needed',
      message: 'Hồ sơ đã được duyệt. Hãy bấm "Làm mới quyền" hoặc đăng xuất rồi đăng nhập lại.',
      request: { status: existing.status, name: existing.name },
    };
  }

  if (existing.status === 'rejected') {
    return {
      canAccessDriver: false,
      reason: 'rejected',
      message: 'Hồ sơ đăng ký tài xế đã bị từ chối.',
      request: { status: existing.status, name: existing.name },
    };
  }

  return {
    canAccessDriver: false,
    reason: 'pending',
    message: 'Hồ sơ đang chờ admin duyệt. Sau khi duyệt bạn mới vào được trang tài xế.',
    request: { status: existing.status, name: existing.name },
  };
}

// Kiểm tra quyền / trạng thái đăng ký tài xế
router.get('/driver/register/status', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Thiếu thông tin tài khoản' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    const status = await getDriverRegistrationStatus(user);
    res.json(status);
  } catch (error) {
    console.error('Driver status check error:', error);
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
        user.isShipper = true;
        if (!user.isMerchant && user.role === 'user') user.role = 'shipper';
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
