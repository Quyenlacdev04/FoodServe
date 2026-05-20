import express from 'express';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import SystemSetting from '../models/SystemSetting.js';

const router = express.Router();

// Lấy tất cả nhà hàng
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
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

// Gia hạn phí duy trì nhà hàng
router.post('/:id/renew-subscription', async (req, res) => {
  try {
    const { paymentMethod, userId } = req.body; // paymentMethod: 'coins' | 'mockPayment'
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    // Lấy mức phí từ SystemSetting
    let settings = await SystemSetting.findOne();
    if (!settings) settings = await SystemSetting.create({});
    const fee = settings.monthlyRestaurantFee || 500000;
    const feeInCoins = Math.ceil(fee / 1000); // 1 Xu = 1.000 VNĐ

    if (paymentMethod === 'coins') {
      // Thanh toán bằng Xu
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
      if (user.coins < feeInCoins) {
        return res.status(400).json({ message: `Số xu không đủ. Bạn cần ${feeInCoins} Xu (hiện có ${user.coins} Xu)` });
      }
      user.coins -= feeInCoins;
      await user.save();
    }
    // mockPayment: không cần xử lý thêm, giả lập thành công

    // Gia hạn thêm 30 ngày từ ngày hết hạn hiện tại hoặc từ bây giờ (nếu đã hết hạn)
    const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
      ? new Date(restaurant.subscriptionExpiry)
      : new Date();
    restaurant.subscriptionExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    await restaurant.save();

    res.json({
      message: 'Gia hạn thành công!',
      subscriptionExpiry: restaurant.subscriptionExpiry,
      coinsRemaining: paymentMethod === 'coins' ? (await User.findById(userId)).coins : undefined
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({ message: 'Lỗi server khi gia hạn phí duy trì' });
  }
});

export default router;
