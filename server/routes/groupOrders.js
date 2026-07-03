import express from 'express';
import GroupOrderSession from '../models/GroupOrder.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

const router = express.Router();

// Hàm sinh mã phòng ngắn ngẫu nhiên 6 ký tự viết hoa
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Tạo phòng đặt chung mới
router.post('/create', async (req, res) => {
  try {
    const { hostId, hostName, restaurantId, restaurantName } = req.body;
    if (!hostId || !restaurantId) {
      return res.status(400).json({ message: 'Thiếu thông tin host hoặc nhà hàng' });
    }

    let code = generateRoomCode();
    // Đảm bảo mã phòng là độc nhất
    let existing = await GroupOrderSession.findOne({ code });
    while (existing) {
      code = generateRoomCode();
      existing = await GroupOrderSession.findOne({ code });
    }

    const hostUser = await User.findById(hostId).lean();

    const session = new GroupOrderSession({
      code,
      hostId,
      hostName,
      restaurantId,
      restaurantName,
      members: [{
        userId: hostId,
        name: hostName,
        avatar: hostUser?.avatar || ''
      }],
      items: []
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Create group order session error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo phòng đặt chung' });
  }
});

// 2. Lấy thông tin phòng đặt chung theo mã phòng
router.get('/session/:code', async (req, res) => {
  try {
    const session = await GroupOrderSession.findOne({ code: req.params.code.toUpperCase() });
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phòng đặt chung hoặc phòng đã hết hạn' });
    }
    res.json(session);
  } catch (error) {
    console.error('Get group order session error:', error);
    res.status(500).json({ message: 'Lỗi server khi tìm phòng' });
  }
});

// 3. Tham gia phòng đặt chung
router.post('/join', async (req, res) => {
  try {
    const { code, userId, name } = req.body;
    if (!code || !userId || !name) {
      return res.status(400).json({ message: 'Thiếu thông tin tham gia' });
    }

    const session = await GroupOrderSession.findOne({ code: code.toUpperCase() });
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phòng đặt chung' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Phòng này đã bị khóa hoặc đã chốt đơn' });
    }

    // Kiểm tra xem đã là thành viên chưa
    const isMember = session.members.some(m => m.userId === userId);
    if (!isMember) {
      const user = await User.findById(userId).lean();
      session.members.push({
        userId,
        name,
        avatar: user?.avatar || ''
      });
      await session.save();

      // Bắn sự kiện Socket.io cập nhật phòng thời gian thực
      const io = req.app.get('io');
      if (io) {
        io.to(`group-order-${session.code}`).emit('group-order-updated', session);
      }
    }

    res.json(session);
  } catch (error) {
    console.error('Join group order session error:', error);
    res.status(500).json({ message: 'Lỗi server khi tham gia phòng' });
  }
});

// 4. Cập nhật món ăn của thành viên trong phòng
router.post('/update-item', async (req, res) => {
  try {
    const { code, userId, userName, menuItemId, name, price, quantity, image } = req.body;
    if (!code || !userId || !menuItemId) {
      return res.status(400).json({ message: 'Thiếu dữ liệu cập nhật món ăn' });
    }

    const session = await GroupOrderSession.findOne({ code: code.toUpperCase() });
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phòng đặt chung' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Phòng này đã khóa, không thể chỉnh sửa món ăn' });
    }

    // Tìm xem món này của userId đã có trong giỏ chưa
    const itemIndex = session.items.findIndex(
      item => item.userId === userId && item.menuItemId === menuItemId
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        // Xóa món ăn khỏi giỏ hàng đặt chung
        session.items.splice(itemIndex, 1);
      } else {
        // Cập nhật số lượng
        session.items[itemIndex].quantity = quantity;
      }
    } else if (quantity > 0) {
      // Thêm mới món ăn
      session.items.push({
        userId,
        userName,
        menuItemId,
        name,
        price,
        quantity,
        image
      });
    }

    await session.save();

    // Bắn sự kiện Socket.io cập nhật giỏ hàng đặt chung thời gian thực
    const io = req.app.get('io');
    if (io) {
      io.to(`group-order-${session.code}`).emit('group-order-updated', session);
    }

    res.json(session);
  } catch (error) {
    console.error('Update item in group order error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật món ăn' });
  }
});

// 5. Khóa/Mở khóa phòng đặt chung (Chỉ Host mới có quyền)
router.post('/lock', async (req, res) => {
  try {
    const { code, hostId, lock } = req.body;
    const session = await GroupOrderSession.findOne({ code: code.toUpperCase() });
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    if (session.hostId !== hostId) {
      return res.status(403).json({ message: 'Chỉ chủ phòng mới có quyền khóa/mở khóa' });
    }

    session.status = lock ? 'locked' : 'active';
    await session.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`group-order-${session.code}`).emit('group-order-updated', session);
    }

    res.json(session);
  } catch (error) {
    console.error('Lock session error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// 6. Xử lý đặt đơn hàng nhóm & Chia hóa đơn (Checkout)
router.post('/checkout', async (req, res) => {
  try {
    const { code, hostId, deliveryAddress, contactPhone, deliveryFee, discount, paymentMethod } = req.body;
    
    const session = await GroupOrderSession.findOne({ code: code.toUpperCase() });
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phòng đặt chung' });
    }

    if (session.hostId !== hostId) {
      return res.status(403).json({ message: 'Chỉ chủ phòng mới có quyền đặt hàng' });
    }

    if (session.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng đặt chung trống, vui lòng thêm món' });
    }

    // 1. Tính toán giá trị giỏ hàng đặt chung
    const subtotal = session.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalAmount = Math.max(0, subtotal + (deliveryFee || 0) - (discount || 0));

    // 2. Tạo đơn hàng chính trong DB
    const restaurant = await Restaurant.findById(session.restaurantId).lean();
    let restaurantLocation = { lat: 10.762622, lng: 106.660172 };
    if (restaurant && restaurant.location?.lat) {
      restaurantLocation = { lat: restaurant.location.lat, lng: restaurant.location.lng };
    }

    // Gộp các món trùng nhau để lưu đơn hàng gọn gàng
    const aggregatedItems = [];
    session.items.forEach(item => {
      const existing = aggregatedItems.find(i => i.menuItemId === item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        aggregatedItems.push({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        });
      }
    });

    const newOrder = new Order({
      userId: hostId,
      restaurantId: session.restaurantId,
      items: aggregatedItems,
      totalAmount: subtotal,
      discount: discount || 0,
      deliveryFee: deliveryFee || 0,
      finalAmount: finalAmount,
      status: 'pending',
      deliveryAddress,
      contactPhone,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending',
      restaurant: {
        location: restaurantLocation,
        address: restaurant?.address || '',
        name: restaurant?.name || session.restaurantName
      },
      note: `Đơn hàng đặt chung từ nhóm của ${session.hostName} (Mã phòng: ${session.code})`,
      steps: [{ status: 'pending', time: new Date() }]
    });

    const savedOrder = await newOrder.save();

    // 3. Cập nhật trạng thái session đặt chung
    session.status = 'ordered';
    session.orderId = savedOrder._id.toString();
    await session.save();

    // Trừ xu host hoặc cộng lượt quay nếu thanh toán hoàn tất
    if (userId && userId !== 'demo_user') {
      await User.findByIdAndUpdate(hostId, {
        $inc: { spins: 1, totalSpent: finalAmount }
      });
    }

    // Báo Socket.io cho phòng đặt chung biết đơn đã được chốt và đặt thành công
    const io = req.app.get('io');
    if (io) {
      io.to(`group-order-${session.code}`).emit('group-order-ordered', {
        session,
        orderId: savedOrder._id.toString()
      });
      io.emit('new-order', savedOrder);
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Group order checkout error:', error);
    res.status(500).json({ message: 'Lỗi server khi chốt đơn đặt chung' });
  }
});

// 7. Lấy thông tin chia tiền hóa đơn chi tiết (Split Bill)
router.get('/split-bill/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    // Tìm session đặt chung có liên quan đến orderId này
    const session = await GroupOrderSession.findOne({ orderId }).lean();
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin chia hóa đơn đặt chung cho đơn hàng này' });
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng tương ứng' });
    }

    // Tính toán tỷ lệ chia tiền
    const subtotal = session.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = order.deliveryFee || 0;
    const discount = order.discount || 0;

    // Chia tỷ lệ: mỗi người chịu phí ship và được giảm giá tỷ lệ thuận theo giá trị món họ đặt
    const memberBills = {};
    
    // Khởi tạo hóa đơn thành viên
    session.members.forEach(member => {
      memberBills[member.userId] = {
        userId: member.userId,
        name: member.name,
        avatar: member.avatar,
        items: [],
        itemsTotal: 0,
        proportion: 0,
        shareDeliveryFee: 0,
        shareDiscount: 0,
        finalBill: 0
      };
    });

    // Gom món ăn về từng thành viên
    session.items.forEach(item => {
      if (memberBills[item.userId]) {
        memberBills[item.userId].items.push({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        });
        memberBills[item.userId].itemsTotal += item.price * item.quantity;
      }
    });

    // Tính toán chi tiết chia tiền tỷ lệ
    Object.keys(memberBills).forEach(userId => {
      const bill = memberBills[userId];
      if (subtotal > 0) {
        bill.proportion = bill.itemsTotal / subtotal;
        bill.shareDeliveryFee = Math.round(bill.proportion * deliveryFee);
        bill.shareDiscount = Math.round(bill.proportion * discount);
        bill.finalBill = Math.max(0, bill.itemsTotal + bill.shareDeliveryFee - bill.shareDiscount);
      }
    });

    res.json({
      code: session.code,
      restaurantName: session.restaurantName,
      orderId,
      orderStatus: order.status,
      totals: {
        itemsTotal: subtotal,
        deliveryFee,
        discount,
        finalAmount: order.finalAmount
      },
      memberBills: Object.values(memberBills)
    });
  } catch (error) {
    console.error('Get split bill error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy hóa đơn chia tiền' });
  }
});

export default router;
