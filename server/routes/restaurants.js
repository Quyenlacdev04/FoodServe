import express from 'express';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import SystemSetting from '../models/SystemSetting.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Lấy tất cả nhà hàng với tìm kiếm, lọc, sắp xếp
router.get('/', async (req, res) => {
  try {
    const { 
      search,           // Tìm kiếm theo tên, địa chỉ
      category,         // Lọc theo danh mục
      minRating,        // Lọc rating tối thiểu
      maxPrice,         // Lọc giá tối đa
      freeship,         // Chỉ lấy nhà hàng freeship
      sortBy,           // Sắp xếp: rating, orders, distance, name
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { isActive: { $ne: false } };

    // Tìm kiếm theo tên hoặc địa chỉ
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Lọc theo danh mục
    if (category) {
      query.categories = category;
    }

    // Lọc theo rating
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Lọc freeship
    if (freeship === 'true') {
      query.freeship = true;
    }

    // Sắp xếp
    let sort = { createdAt: -1 }; // Mặc định: mới nhất
    if (sortBy === 'rating') sort = { rating: -1, reviews: -1 };
    if (sortBy === 'orders') sort = { orders: -1 };
    if (sortBy === 'distance') sort = { distance: 1 };
    if (sortBy === 'name') sort = { name: 1 };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Restaurant.countDocuments(query);

    res.json({
      restaurants,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tìm kiếm món ăn theo tên
router.get('/search/menu', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự' });
    }

    // Tìm món ăn
    const menuItems = await MenuItem.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(parseInt(limit))
    .lean();

    // Lấy thông tin nhà hàng cho mỗi món
    const restaurantIds = [...new Set(menuItems.map(item => item.restaurantId))];
    const restaurants = await Restaurant.find({ 
      _id: { $in: restaurantIds },
      isActive: { $ne: false }
    }).lean();

    const restaurantMap = {};
    restaurants.forEach(r => {
      restaurantMap[r._id.toString()] = r;
    });

    // Kết hợp dữ liệu
    const results = menuItems
      .filter(item => restaurantMap[item.restaurantId.toString()])
      .map(item => ({
        ...item,
        restaurant: restaurantMap[item.restaurantId.toString()]
      }));

    res.json({
      results,
      total: results.length
    });
  } catch (error) {
    console.error('Search menu error:', error);
    res.status(500).json({ message: 'Lỗi khi tìm kiếm món ăn' });
  }
});

// Lấy tất cả món ăn (mới thêm)
router.get('/menu/all', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy tất cả món ăn
    const menuItems = await MenuItem.find()
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Lấy thông tin nhà hàng cho mỗi món
    const restaurantIds = [...new Set(menuItems.map(item => item.restaurantId))];
    const restaurants = await Restaurant.find({ 
      _id: { $in: restaurantIds },
      isActive: { $ne: false }
    }).lean();

    const restaurantMap = {};
    restaurants.forEach(r => {
      restaurantMap[r._id.toString()] = r;
    });

    // Kết hợp dữ liệu
    const results = menuItems
      .filter(item => restaurantMap[item.restaurantId.toString()])
      .map(item => ({
        ...item,
        restaurant: restaurantMap[item.restaurantId.toString()]
      }));

    const total = await MenuItem.countDocuments();

    res.json({
      results,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách món ăn' });
  }
});

// Lấy chi tiết nhà hàng và menu của nó
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    
    const menuItems = await MenuItem.find({ restaurantId: req.params.id });
    
    res.json({ restaurant, menuItems });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thêm nhà hàng mới
router.post('/', async (req, res) => {
  try {
    const newRestaurant = new Restaurant(req.body);
    const saved = await newRestaurant.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo nhà hàng', error });
  }
});

// Xóa nhà hàng
router.delete('/:id', async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    await MenuItem.deleteMany({ restaurantId: req.params.id });
    res.json({ message: 'Đã xóa nhà hàng' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật thông tin nhà hàng
router.put('/:id', async (req, res) => {
  try {
    const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhà hàng' });
  }
});

// Lấy nhà hàng theo ownerId
router.get('/owned/:ownerId', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.params.ownerId });
    if (!restaurant) return res.status(404).json({ message: 'Bạn chưa có nhà hàng nào được đăng ký!' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thêm món ăn mới vào nhà hàng
router.post('/:id/menu', async (req, res) => {
  try {
    const { name, price, image, description, category, popular } = req.body;
    const newItem = new MenuItem({
      restaurantId: req.params.id,
      name,
      price,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
      description,
      category: category || 'Món khác',
      popular: !!popular
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm món ăn', error });
  }
});

// Sửa thông tin món ăn
router.put('/menu/:itemId', async (req, res) => {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.itemId, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi sửa món ăn' });
  }
});

// Xóa món ăn
router.delete('/menu/:itemId', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.itemId);
    res.json({ message: 'Đã xóa món ăn' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa món ăn' });
  }
});

// Gia hạn phí duy trì nhà hàng (chỉ thanh toán bằng xu - tự động)
router.post('/:id/renew-subscription', async (req, res) => {
  try {
    const { paymentMethod, userId } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    // Chỉ xử lý thanh toán bằng xu (tự động)
    if (paymentMethod !== 'coins') {
      return res.status(400).json({ message: 'Chỉ hỗ trợ thanh toán bằng xu tự động' });
    }

    // Lấy mức phí từ SystemSetting
    let settings = await SystemSetting.findOne();
    if (!settings) settings = await SystemSetting.create({});
    const fee = settings.monthlyRestaurantFee || 500000;
    const feeInCoins = Math.ceil(fee / 1000); // 1 Xu = 1.000 VNĐ

    // Thanh toán bằng Xu
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    if (user.coins < feeInCoins) {
      return res.status(400).json({ message: `Số xu không đủ. Bạn cần ${feeInCoins} Xu (hiện có ${user.coins} Xu)` });
    }
    user.coins -= feeInCoins;
    await user.save();

    // Gia hạn nhà hàng
    const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
      ? new Date(restaurant.subscriptionExpiry)
      : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    restaurant.subscriptionExpiry = newExpiry;
    
    // Mở khóa nhà hàng nếu đang bị khóa
    if (restaurant.isActive === false) {
      restaurant.isActive = true;
    }
    
    // Lưu lịch sử thanh toán
    if (!restaurant.paymentHistory) {
      restaurant.paymentHistory = [];
    }
    restaurant.paymentHistory.push({
      _id: new Date().getTime().toString(),
      amount: feeInCoins,
      paymentMethod: 'coins',
      status: 'completed',
      paidAt: new Date(),
      periodStart: currentExpiry,
      periodEnd: newExpiry,
      transactionNote: `Thanh toán phí duy trì bằng ${feeInCoins} Xu`
    });
    
    await restaurant.save();
    
    // Tạo thông báo cho nhà hàng
    const notification = await Notification.create({
      userId: userId,
      type: 'payment_approved',
      title: '✅ Gia hạn thành công bằng Xu',
      message: `Cửa hàng "${restaurant.name}" đã được gia hạn thêm 30 ngày bằng ${feeInCoins} Xu. Hạn mới: ${restaurant.subscriptionExpiry.toLocaleDateString('vi-VN')}`,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        subscriptionExpiry: restaurant.subscriptionExpiry
      }
    });

    res.json({
      message: 'Gia hạn thành công bằng xu!',
      subscriptionExpiry: restaurant.subscriptionExpiry,
      coinsRemaining: user.coins
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({ message: 'Lỗi server khi gia hạn phí duy trì' });
  }
});

// Gửi yêu cầu thanh toán (chờ admin duyệt)
router.post('/:id/request-payment', async (req, res) => {
  try {
    const { paymentMethod, amount, userId, restaurantName } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    // Tạo yêu cầu thanh toán
    const paymentRequest = {
      _id: new Date().getTime().toString(), // Simple ID
      restaurantId: req.params.id,
      restaurantName: restaurantName,
      userId: userId,
      amount: amount,
      paymentMethod: paymentMethod,
      status: 'pending',
      createdAt: new Date(),
      note: `Yêu cầu gia hạn phí duy trì cho ${restaurantName}`
    };

    // Lưu vào restaurant
    if (!restaurant.paymentRequests) {
      restaurant.paymentRequests = [];
    }
    restaurant.paymentRequests.push(paymentRequest);
    await restaurant.save();

    // Tạo thông báo cho tất cả admin
    const admins = await User.find({ role: 'admin' });
    const io = req.app.get('io');
    
    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin._id,
        type: 'payment_request',
        title: '💳 Yêu cầu thanh toán mới',
        message: `${restaurantName} đã gửi yêu cầu thanh toán phí duy trì ${amount.toLocaleString()}đ`,
        data: {
          restaurantId: req.params.id,
          restaurantName: restaurantName,
          amount: amount,
          requestId: paymentRequest._id
        }
      });
      
      // Gửi real-time notification
      io.to(`user-${admin._id}`).emit('new-notification', notification);
    }

    res.json({
      message: 'Đã gửi yêu cầu thanh toán! Admin sẽ xác nhận trong vòng 24h.',
      requestId: paymentRequest._id
    });
  } catch (error) {
    console.error('Request payment error:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu thanh toán' });
  }
});

// Lấy danh sách yêu cầu thanh toán (cho admin)
router.get('/payment-requests/all', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ 
      paymentRequests: { $exists: true, $ne: [] } 
    }).select('name paymentRequests');
    
    let allRequests = [];
    restaurants.forEach(restaurant => {
      if (restaurant.paymentRequests) {
        restaurant.paymentRequests.forEach(request => {
          allRequests.push({
            ...request,
            restaurantName: restaurant.name
          });
        });
      }
    });
    
    // Sắp xếp theo thời gian tạo mới nhất
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(allRequests);
  } catch (error) {
    console.error('Get payment requests error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy yêu cầu thanh toán' });
  }
});

// Duyệt yêu cầu thanh toán (cho admin)
router.post('/payment-requests/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId } = req.body;
    
    // Tìm restaurant chứa request này
    const restaurant = await Restaurant.findOne({
      'paymentRequests._id': requestId
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán' });
    }
    
    // Tìm và cập nhật request
    const request = restaurant.paymentRequests.find(r => r._id === requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu này đã được xử lý' });
    }
    
    // Cập nhật trạng thái request
    request.status = 'approved';
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    
    // Gia hạn nhà hàng
    const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
      ? new Date(restaurant.subscriptionExpiry)
      : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    restaurant.subscriptionExpiry = newExpiry;
    
    // Mở khóa nhà hàng nếu đang bị khóa
    if (restaurant.isActive === false) {
      restaurant.isActive = true;
    }
    
    // Lưu lịch sử thanh toán
    if (!restaurant.paymentHistory) {
      restaurant.paymentHistory = [];
    }
    restaurant.paymentHistory.push({
      _id: new Date().getTime().toString(),
      amount: request.amount,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      paidAt: new Date(),
      periodStart: currentExpiry,
      periodEnd: newExpiry,
      transactionNote: `Thanh toán phí duy trì bằng chuyển khoản ngân hàng`,
      approvedBy: adminId
    });
    
    await restaurant.save();
    
    // Tạo thông báo cho nhà hàng
    const notification = await Notification.create({
      userId: request.userId,
      type: 'payment_approved',
      title: '✅ Thanh toán đã được duyệt',
      message: `Yêu cầu thanh toán ${request.amount.toLocaleString()}đ của ${restaurant.name} đã được admin phê duyệt. Cửa hàng đã được gia hạn thêm 30 ngày.`,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        amount: request.amount,
        subscriptionExpiry: restaurant.subscriptionExpiry
      }
    });
    
    // Gửi real-time notification
    const io = req.app.get('io');
    io.to(`user-${request.userId}`).emit('new-notification', notification);
    io.to(`user-${request.userId}`).emit('payment-approved', { 
      restaurantId: restaurant._id,
      subscriptionExpiry: restaurant.subscriptionExpiry 
    });
    
    res.json({
      message: 'Đã duyệt thanh toán và gia hạn nhà hàng thành công!',
      subscriptionExpiry: restaurant.subscriptionExpiry
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ message: 'Lỗi server khi duyệt thanh toán' });
  }
});

// Từ chối yêu cầu thanh toán (cho admin)
router.post('/payment-requests/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId, reason } = req.body;
    
    // Tìm restaurant chứa request này
    const restaurant = await Restaurant.findOne({
      'paymentRequests._id': requestId
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán' });
    }
    
    // Tìm và cập nhật request
    const request = restaurant.paymentRequests.find(r => r._id === requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu này đã được xử lý' });
    }
    
    // Cập nhật trạng thái request
    request.status = 'rejected';
    request.rejectedBy = adminId;
    request.rejectedAt = new Date();
    request.rejectReason = reason;
    
    await restaurant.save();
    
    // Tạo thông báo cho nhà hàng
    const notification = await Notification.create({
      userId: request.userId,
      type: 'payment_rejected',
      title: '❌ Thanh toán bị từ chối',
      message: `Yêu cầu thanh toán ${request.amount.toLocaleString()}đ của ${restaurant.name} đã bị từ chối. ${reason ? `Lý do: ${reason}` : ''}`,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        amount: request.amount,
        reason: reason
      }
    });
    
    // Gửi real-time notification
    const io = req.app.get('io');
    io.to(`user-${request.userId}`).emit('new-notification', notification);
    io.to(`user-${request.userId}`).emit('payment-rejected', { 
      restaurantId: restaurant._id,
      reason: reason 
    });
    
    res.json({
      message: 'Đã từ chối yêu cầu thanh toán',
      reason: reason
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ message: 'Lỗi server khi từ chối thanh toán' });
  }
});

export default router;
