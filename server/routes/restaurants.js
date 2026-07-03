import express from 'express';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import SystemSetting from '../models/SystemSetting.js';
import Notification from '../models/Notification.js';
import Order from '../models/Order.js';

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

// ===== SYSTEM DE XUAT AI: De xuat nha hang & mon an cho nguoi dung =====
router.get('/recommendations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentHour = new Date().getHours();

    // 1. Dinh nghia cac danh muc theo khung gio
    let timeSlot = 'lunch';
    let timeLabel = 'Gợi ý bữa trưa';
    let timeCategories = ['Cơm', 'Bún', 'Phở', 'Mỳ', 'Cơm văn phòng'];
    if (currentHour >= 5 && currentHour < 10) {
      timeSlot = 'breakfast';
      timeLabel = 'Gợi ý bữa sáng';
      timeCategories = ['Cà phê', 'Trà', 'Bánh mỳ', 'Bún', 'Phở', 'Ăn sáng'];
    } else if (currentHour >= 10 && currentHour < 14) {
      timeSlot = 'lunch';
      timeLabel = 'Ăn trưa thôi';
      timeCategories = ['Cơm', 'Bún', 'Phở', 'Mỳ', 'Cơm văn phòng'];
    } else if (currentHour >= 14 && currentHour < 17) {
      timeSlot = 'afternoon';
      timeLabel = 'Ăn vặt chiều nha';
      timeCategories = ['Trà sữa', 'Ăn vặt', 'Đồ ngọt', 'Tráng miệng', 'Sinh tố'];
    } else if (currentHour >= 17 && currentHour < 22) {
      timeSlot = 'dinner';
      timeLabel = 'Gợi ý bữa tối';
      timeCategories = ['Cơm', 'Mỳ', 'Nướng', 'Lẩu', 'Gà rán', 'Pizza'];
    } else {
      timeSlot = 'night';
      timeLabel = 'Ăn đêm không đói';
      timeCategories = ['Mỳ', 'Ăn vặt', 'Cháo', 'Đồ đêm'];
    }

    // 2. Lay lich su danh muc ua thich cua user
    const preferredCategories = {};
    let hasHistory = false;

    if (userId && userId !== 'guest') {
      const orders = await Order.find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (orders.length > 0) {
        hasHistory = true;
        const menuItemIds = [...new Set(orders.flatMap(o => o.items.map(i => i.menuItemId).filter(id => id)))];
        
        if (menuItemIds.length > 0) {
          const orderedItems = await MenuItem.find({ _id: { $in: menuItemIds } }).lean();
          const itemCategoryMap = {};
          orderedItems.forEach(item => {
            if (item.category) {
              itemCategoryMap[item._id.toString()] = item.category;
            }
          });

          // Tinh tan suat danh muc
          orders.forEach(order => {
            order.items.forEach(item => {
              const cat = itemCategoryMap[item.menuItemId?.toString()];
              if (cat) {
                preferredCategories[cat] = (preferredCategories[cat] || 0) + item.quantity;
              }
            });
          });
        }
      }
    }

    // 3. Lay tat ca nha hang dang hoat dong va menu
    const activeRestaurants = await Restaurant.find({ isActive: { $ne: false } }).lean();
    const activeMenu = await MenuItem.find().lean();

    // Group menu by restaurantId
    const menuMap = {};
    activeMenu.forEach(item => {
      if (!menuMap[item.restaurantId]) menuMap[item.restaurantId] = [];
      menuMap[item.restaurantId].push(item);
    });

    // 4. Tinh diem va de xuat nha hang
    const scoredRestaurants = activeRestaurants.map(rest => {
      let score = (rest.rating || 4.0) * 10; // Base score
      score += Math.min(50, (rest.reviews || 0) * 0.2); // Reviews boost

      // Kiem tra muc do phu hop voi so thich user (Content-based)
      let matchCount = 0;
      const restMenu = menuMap[rest._id.toString()] || [];
      const restCategories = [...new Set(restMenu.map(m => m.category).filter(c => c))];

      restCategories.forEach(cat => {
        if (preferredCategories[cat]) {
          score += preferredCategories[cat] * 15; // History score boost
          matchCount++;
        }
      });

      // Kiem tra muc do phu hop voi khung gio (Context-aware)
      const matchesTime = restCategories.some(cat => timeCategories.includes(cat));
      if (matchesTime) {
        score += 25; // Time based boost
      }

      // Xac dinh nhan ly do de xuat
      let reasonTag = '';
      if (matchCount > 0) {
        reasonTag = 'Hợp gu đặt hàng';
      } else if (matchesTime) {
        reasonTag = timeLabel;
      } else if (rest.rating >= 4.5 && rest.orders >= 50) {
        reasonTag = 'Được yêu thích nhất';
      } else {
        reasonTag = 'Gợi ý cho bạn';
      }

      return {
        ...rest,
        aiScore: score,
        reasonTag
      };
    });

    // Sap xep va lay top 6 nha hang de xuat
    const recommendedRestaurants = scoredRestaurants
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 6);

    // 5. Tinh diem va de xuat mon an
    // Chi lay mon an tu cac nha hang dang hoat dong
    const activeRestIds = activeRestaurants.map(r => r._id.toString());
    const filteredMenu = activeMenu.filter(item => activeRestIds.includes(item.restaurantId.toString()));

    const scoredItems = filteredMenu.map(item => {
      const rest = activeRestaurants.find(r => r._id.toString() === item.restaurantId.toString());
      let score = 50; // Base score

      if (rest) {
        score += (rest.rating || 4.0) * 5;
      }

      if (item.popular) {
        score += 15; // Mon noi tieng
      }

      // So thich nguoi dung
      if (item.category && preferredCategories[item.category]) {
        score += preferredCategories[item.category] * 20;
      }

      // Khung gio thuc te
      const isTimeMatch = item.category && timeCategories.includes(item.category);
      if (isTimeMatch) {
        score += 30;
      }

      // Huy hieu ly do de xuat
      let badge = 'Đề xuất';
      if (item.category && preferredCategories[item.category]) {
        badge = 'Theo gu bạn';
      } else if (isTimeMatch) {
        badge = timeLabel;
      } else if (item.popular) {
        badge = 'Bán chạy';
      }

      return {
        ...item,
        aiScore: score,
        badge,
        restaurantName: rest ? rest.name : ''
      };
    });

    // Sap xep va lay top 8 mon de xuat
    const recommendedItems = scoredItems
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 8);

    res.json({
      recommendedRestaurants,
      recommendedItems,
      context: {
        timeSlot,
        timeLabel,
        hasHistory
      }
    });
  } catch (error) {
    console.error('AI Recommendation endpoint error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy đề xuất AI' });
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
    const body = { ...req.body };
    if (body.address) {
      try {
        const encodedAddress = encodeURIComponent(body.address + ', Việt Nam');
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
          { headers: { 'User-Agent': 'FoodServe/1.0' } }
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          body.location = {
            lat: parseFloat(geoData[0].lat),
            lng: parseFloat(geoData[0].lon)
          };
        }
      } catch (geoErr) {
        console.error('Failed to geocode restaurant address:', geoErr.message);
      }
    }
    const newRestaurant = new Restaurant(body);
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
    const body = { ...req.body };

    // Parse các trường Number để tránh lỗi cast
    if (body.discount !== undefined) {
      // Chấp nhận "30k", "30K", "30000", 30000, "" => convert sang Number
      const raw = String(body.discount).toLowerCase().replace('k', '000').replace('đ', '').replace(/\s/g, '').replace('%', '');
      const parsed = parseFloat(raw);
      body.discount = isNaN(parsed) ? 0 : parsed;
    }
    if (body.rating !== undefined) body.rating = parseFloat(body.rating) || 0;
    if (body.distance !== undefined) body.distance = parseFloat(body.distance) || 0;
    if (body.orders !== undefined) body.orders = parseInt(body.orders) || 0;
    if (body.reviews !== undefined) body.reviews = parseInt(body.reviews) || 0;
    if (body.minOrder !== undefined) body.minOrder = parseInt(body.minOrder) || 0;

    // Geocode address via Nominatim if provided
    if (body.address) {
      try {
        const encodedAddress = encodeURIComponent(body.address + ', Việt Nam');
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
          { headers: { 'User-Agent': 'FoodServe/1.0' } }
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          body.location = {
            lat: parseFloat(geoData[0].lat),
            lng: parseFloat(geoData[0].lon)
          };
          console.log(`📌 Geocoded address to coordinates:`, body.location);
        }
      } catch (geoErr) {
        console.error('Failed to geocode restaurant address:', geoErr.message);
      }
    }

    const updated = await Restaurant.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: false });
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

// Gửi yêu cầu thanh toán (tự động duyệt luôn theo yêu cầu)
router.post('/:id/request-payment', async (req, res) => {
  try {
    const { paymentMethod, amount, userId, restaurantName } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    // Gia hạn nhà hàng
    const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
      ? new Date(restaurant.subscriptionExpiry)
      : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    restaurant.subscriptionExpiry = newExpiry;

    if (restaurant.isActive === false) {
      restaurant.isActive = true;
    }

    // Tạo yêu cầu thanh toán
    const paymentRequest = {
      _id: new Date().getTime().toString(), // Simple ID
      restaurantId: req.params.id,
      restaurantName: restaurantName,
      userId: userId,
      amount: amount,
      paymentMethod: paymentMethod,
      status: 'approved',
      approvedBy: 'system',
      approvedAt: new Date(),
      createdAt: new Date(),
      note: `Yêu cầu gia hạn phí duy trì cho ${restaurantName} (Tự động duyệt)`
    };

    // Lưu vào restaurant
    if (!restaurant.paymentRequests) {
      restaurant.paymentRequests = [];
    }
    restaurant.paymentRequests.push(paymentRequest);

    // Lưu lịch sử thanh toán
    if (!restaurant.paymentHistory) {
      restaurant.paymentHistory = [];
    }
    restaurant.paymentHistory.push({
      _id: new Date().getTime().toString(),
      amount: amount,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      paidAt: new Date(),
      periodStart: currentExpiry,
      periodEnd: newExpiry,
      transactionNote: `Thanh toán phí duy trì tự động qua QR Ngân hàng`,
      approvedBy: 'system'
    });

    await restaurant.save();

    // Tạo thông báo cho nhà hàng
    const notification = await Notification.create({
      userId: userId,
      type: 'payment_approved',
      title: '✅ Gia hạn thành công bằng QR',
      message: `Cửa hàng "${restaurant.name}" đã được gia hạn thêm 30 ngày qua thanh toán QR. Hạn mới: ${newExpiry.toLocaleDateString('vi-VN')}`,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        amount: amount,
        subscriptionExpiry: restaurant.subscriptionExpiry
      }
    });

    // Gửi real-time notification cho nhà hàng
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('new-notification', notification);
      io.to(`user-${userId}`).emit('payment-approved', { 
        restaurantId: restaurant._id,
        subscriptionExpiry: restaurant.subscriptionExpiry 
      });
    }

    // Tạo thông báo cho tất cả admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const adminNotification = await Notification.create({
        userId: admin._id,
        type: 'payment_approved',
        title: '💳 Thanh toán tự động QR mới',
        message: `${restaurantName} đã tự động thanh toán & duyệt phí duy trì ${amount.toLocaleString()}đ`,
        data: {
          restaurantId: req.params.id,
          restaurantName: restaurantName,
          amount: amount,
          requestId: paymentRequest._id
        }
      });
      if (io) {
        io.to(`user-${admin._id}`).emit('new-notification', adminNotification);
      }
    }

    res.json({
      message: 'Thanh toán thành công! Cửa hàng đã được gia hạn tự động.',
      subscriptionExpiry: restaurant.subscriptionExpiry
    });
  } catch (error) {
    console.error('Request payment error:', error);
    res.status(500).json({ message: 'Lỗi server khi xử lý thanh toán' });
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

// ===== TÍNH PHÍ GIAO HÀNG THEO KM =====
// 5.000đ/km, tối thiểu 10.000đ, tối đa 50.000đ
// Dùng Haversine giữa tọa độ nhà hàng và địa chỉ khách
router.post('/calculate-fee', async (req, res) => {
  try {
    const { restaurantId, deliveryAddress } = req.body;
    if (!restaurantId || !deliveryAddress) {
      return res.json({ deliveryFee: 15000, distance: null, message: 'Thiếu thông tin' });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) return res.json({ deliveryFee: 15000, distance: null });

    // Geocode địa chỉ khách qua Nominatim (OpenStreetMap - miễn phí)
    const encodedAddress = encodeURIComponent(deliveryAddress + ', Việt Nam');
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      { headers: { 'User-Agent': 'FoodServe/1.0' } }
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return res.json({ deliveryFee: 15000, distance: null, message: 'Không geocode được địa chỉ' });
    }

    const customerLat = parseFloat(geoData[0].lat);
    const customerLng = parseFloat(geoData[0].lon);

    // Tọa độ nhà hàng (dùng distance từ DB hoặc tọa độ mặc định TP.HCM)
    // Nếu nhà hàng chưa có tọa độ → dùng trung tâm TP.HCM
    const restLat = restaurant.location?.lat || 10.762622;
    const restLng = restaurant.location?.lng || 106.660172;

    // Tính khoảng cách Haversine (km)
    const R = 6371;
    const dLat = (customerLat - restLat) * Math.PI / 180;
    const dLon = (customerLng - restLng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
      Math.cos(restLat * Math.PI/180) * Math.cos(customerLat * Math.PI/180) * Math.sin(dLon/2)**2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    // Tính phí: 5.000đ/km, tối thiểu 10.000đ, tối đa 50.000đ
    const fee = Math.min(50000, Math.max(10000, Math.round(distanceKm * 5000 / 1000) * 1000));

    res.json({
      deliveryFee: fee,
      distance: Math.round(distanceKm * 10) / 10, // km, 1 chữ số thập phân
      customerLat,
      customerLng
    });
  } catch (error) {
    console.error('Calculate fee error:', error.message);
    res.json({ deliveryFee: 15000, distance: null });
  }
});

export default router;
