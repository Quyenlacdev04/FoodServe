import express from 'express';
import crypto from 'crypto';
import https from 'https';
import { PayOS } from '@payos/node';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import SystemSetting from '../models/SystemSetting.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const router = express.Router();

// Helper to handle restaurant subscription activation & renewal
async function processSubscriptionRenewal(restaurantId, orderId, amount) {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      console.error(`[Subscription] Restaurant not found: ${restaurantId}`);
      return null;
    }

    // Idempotency check: check if payment history already contains this transactionId
    if (!restaurant.paymentHistory) {
      restaurant.paymentHistory = [];
    }
    const alreadyProcessed = restaurant.paymentHistory.some(p => p._id === orderId);
    if (alreadyProcessed) {
      console.log(`[Subscription] OrderId ${orderId} already processed for restaurant: ${restaurant.name}`);
      return restaurant;
    }

    const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
      ? new Date(restaurant.subscriptionExpiry)
      : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

    restaurant.subscriptionExpiry = newExpiry;
    restaurant.isActive = true;

    restaurant.paymentHistory.push({
      _id: orderId,
      amount: Number(amount),
      paymentMethod: 'momo',
      status: 'completed',
      paidAt: new Date(),
      periodStart: currentExpiry,
      periodEnd: newExpiry,
      transactionNote: `Thanh toán phí duy trì tự động qua MoMo`
    });

    await restaurant.save();
    console.log(`✅ [Subscription] Renewed restaurant: ${restaurant.name} until ${newExpiry.toLocaleDateString('vi-VN')}`);

    // Create notification for the restaurant owner
    await Notification.create({
      userId: restaurant.ownerId,
      type: 'payment_approved',
      title: '✅ Gia hạn thành công qua MoMo',
      message: `Cửa hàng "${restaurant.name}" đã được gia hạn thêm 30 ngày qua MoMo. Hạn mới: ${newExpiry.toLocaleDateString('vi-VN')}`,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        amount: Number(amount),
        subscriptionExpiry: newExpiry
      }
    });

    return restaurant;
  } catch (error) {
    console.error('[Subscription] processSubscriptionRenewal error:', error);
    return null;
  }
}

// ===== MOMO CONFIG (Sandbox) =====
const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  endpoint: 'https://test-payment.momo.vn',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/api/payment/momo/return',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payment/momo/ipn',
};

// ===== MOMO: Tạo thanh toán =====
router.post('/momo/create-payment', async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Thiếu orderId hoặc amount' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Tự động detect server URL từ request nếu env chưa set đúng
    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    const redirectUrl = momoConfig.redirectUrl.includes('localhost')
      ? `${serverOrigin}/api/payment/momo/return`
      : momoConfig.redirectUrl;
    const ipnUrl = momoConfig.ipnUrl.includes('localhost')
      ? `${serverOrigin}/api/payment/momo/ipn`
      : momoConfig.ipnUrl;

    const requestId = momoConfig.partnerCode + Date.now();
    const orderInfo = 'Thanh toan don hang FoodServe';
    const requestType = 'payWithMethod';
    const extraData = '';
    const autoCapture = true;
    const lang = 'vi';

    const rawSignature =
      'accessKey=' + momoConfig.accessKey +
      '&amount=' + amount +
      '&extraData=' + extraData +
      '&ipnUrl=' + ipnUrl +
      '&orderId=' + requestId +
      '&orderInfo=' + orderInfo +
      '&partnerCode=' + momoConfig.partnerCode +
      '&redirectUrl=' + redirectUrl +
      '&requestId=' + requestId +
      '&requestType=' + requestType;

    const signature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      partnerCode: momoConfig.partnerCode,
      partnerName: 'FoodServe',
      storeId: 'FoodServeStore',
      requestId: requestId,
      amount: amount,
      orderId: requestId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      signature: signature,
    });

    const options = {
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const momoRes = await new Promise((resolve, reject) => {
      const momoReq = https.request(options, (momoResponse) => {
        let data = '';
        momoResponse.on('data', (chunk) => { data += chunk; });
        momoResponse.on('end', () => resolve(JSON.parse(data)));
      });
      momoReq.on('error', reject);
      momoReq.write(requestBody);
      momoReq.end();
    });

    console.log('✅ MoMo response:', momoRes);
    console.log('📌 MoMo redirectUrl used:', redirectUrl);
    console.log('📌 MoMo ipnUrl used:', ipnUrl);

    if (momoRes.resultCode === 0) {
      // Lưu requestId vào order để đối chiếu sau
      order.transactionId = requestId;
      await order.save();

      res.json({
        message: 'Tạo thanh toán MoMo thành công',
        paymentUrl: momoRes.payUrl,
        requestId: requestId,
      });
    } else {
      res.status(400).json({
        message: 'Lỗi MoMo: ' + momoRes.message,
        resultCode: momoRes.resultCode,
      });
    }
  } catch (error) {
    console.error('MoMo create payment error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo thanh toán MoMo' });
  }
});

// ===== MOMO: Tạo thanh toán phí duy trì (Subscription) =====
router.post('/momo/create-subscription-payment', async (req, res) => {
  try {
    const { restaurantId, amount } = req.body;

    if (!restaurantId || !amount) {
      return res.status(400).json({ message: 'Thiếu restaurantId hoặc amount' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }

    // Tự động detect server URL từ request nếu env chưa set đúng
    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    const redirectUrl = momoConfig.redirectUrl.includes('localhost')
      ? `${serverOrigin}/api/payment/momo/return`
      : momoConfig.redirectUrl;
    const ipnUrl = momoConfig.ipnUrl.includes('localhost')
      ? `${serverOrigin}/api/payment/momo/ipn`
      : momoConfig.ipnUrl;

    const requestId = `SUB_${restaurantId}_${Date.now()}`;
    const orderInfo = `Dong phi duy tri cua hang ${restaurant.name}`;
    const requestType = 'payWithMethod';
    const extraData = '';
    const autoCapture = true;
    const lang = 'vi';

    const rawSignature =
      'accessKey=' + momoConfig.accessKey +
      '&amount=' + amount +
      '&extraData=' + extraData +
      '&ipnUrl=' + ipnUrl +
      '&orderId=' + requestId +
      '&orderInfo=' + orderInfo +
      '&partnerCode=' + momoConfig.partnerCode +
      '&redirectUrl=' + redirectUrl +
      '&requestId=' + requestId +
      '&requestType=' + requestType;

    const signature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      partnerCode: momoConfig.partnerCode,
      partnerName: 'FoodServe',
      storeId: 'FoodServeStore',
      requestId: requestId,
      amount: amount,
      orderId: requestId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      signature: signature,
    });

    const options = {
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const momoRes = await new Promise((resolve, reject) => {
      const momoReq = https.request(options, (momoResponse) => {
        let data = '';
        momoResponse.on('data', (chunk) => { data += chunk; });
        momoResponse.on('end', () => resolve(JSON.parse(data)));
      });
      momoReq.on('error', reject);
      momoReq.write(requestBody);
      momoReq.end();
    });

    console.log('✅ MoMo subscription response:', momoRes);
    console.log('📌 MoMo subscription redirectUrl used:', redirectUrl);
    console.log('📌 MoMo subscription ipnUrl used:', ipnUrl);

    if (momoRes.resultCode === 0) {
      res.json({
        message: 'Tạo thanh toán MoMo thành công',
        paymentUrl: momoRes.payUrl,
        requestId: requestId,
      });
    } else {
      res.status(400).json({
        message: 'Lỗi MoMo: ' + momoRes.message,
        resultCode: momoRes.resultCode,
      });
    }
  } catch (error) {
    console.error('MoMo subscription create payment error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo thanh toán MoMo' });
  }
});

// ===== MOMO: IPN callback (server-to-server) =====
router.post('/momo/ipn', async (req, res) => {
  try {
    const { orderId, resultCode, amount, signature } = req.body;

    // Verify signature
    const rawSignature =
      'accessKey=' + momoConfig.accessKey +
      '&amount=' + req.body.amount +
      '&extraData=' + req.body.extraData +
      '&message=' + req.body.message +
      '&orderId=' + req.body.orderId +
      '&orderInfo=' + req.body.orderInfo +
      '&orderType=' + req.body.orderType +
      '&partnerCode=' + req.body.partnerCode +
      '&payType=' + req.body.payType +
      '&requestId=' + req.body.requestId +
      '&responseTime=' + req.body.responseTime +
      '&resultCode=' + req.body.resultCode +
      '&transId=' + req.body.transId;

    const expectedSignature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    if (String(resultCode) === '0') {
      if (orderId && orderId.startsWith('SUB_')) {
        const [_, restaurantId] = orderId.split('_');
        const renewedRestaurant = await processSubscriptionRenewal(restaurantId, orderId, amount);
        
        // Gửi real-time notification
        const io = req.app.get('io');
        if (io && renewedRestaurant) {
          io.to(`user-${renewedRestaurant.ownerId}`).emit('payment-approved', {
            restaurantId: renewedRestaurant._id,
            subscriptionExpiry: renewedRestaurant.subscriptionExpiry
          });
        }
      } else {
        // Tìm order theo transactionId
        const order = await Order.findOne({ transactionId: orderId });
        if (order) {
          order.paymentStatus = 'paid';
          order.paymentMethod = 'momo';
          await order.save();
          console.log('✅ MoMo payment confirmed for order:', order._id);
        }
      }
    }

    res.status(204).send();
  } catch (error) {
    console.error('MoMo IPN error:', error);
    res.status(500).json({ message: 'Lỗi xử lý IPN MoMo' });
  }
});

// ===== MOMO: Confirm khi redirect thẳng về frontend (fallback) =====
router.post('/momo/confirm-direct', async (req, res) => {
  try {
    const { orderId, transId, amount } = req.body;
    // orderId ở đây là requestId của MoMo (dạng MOMO17804...)
    const order = await Order.findOne({ transactionId: orderId });
    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'momo';
      order.paidAt = new Date();
      if (transId) order.transactionId = transId;
      await order.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ===== MOMO: Return URL callback =====
router.get('/momo/return', async (req, res) => {
  const { resultCode, orderId, amount, transId } = req.query;

  // Tự động detect frontend URL: ưu tiên env var, fallback dùng request origin
  const getFrontendUrl = () => {
    const envUrl = process.env.FRONTEND_URL;
    if (envUrl) return envUrl;
    // Trên production (Render), frontend và backend cùng origin
    const host = req.get('host');
    // Nếu đang chạy local dev, frontend ở port 3000 (Vite dev server)
    if (host && host.includes('localhost:5000')) {
      return 'http://localhost:3000';
    }
    return `${req.protocol}://${host}`;
  };

  try {
    // Check if subscription payment
    if (orderId && orderId.startsWith('SUB_')) {
      const [_, restaurantId] = orderId.split('_');
      const frontendUrl = getFrontendUrl();

      if (String(resultCode) === '0') {
        const renewedRestaurant = await processSubscriptionRenewal(restaurantId, orderId, amount);

        // Gửi real-time notification
        const io = req.app.get('io');
        if (io && renewedRestaurant) {
          io.to(`user-${renewedRestaurant.ownerId}`).emit('payment-approved', {
            restaurantId: renewedRestaurant._id,
            subscriptionExpiry: renewedRestaurant.subscriptionExpiry
          });
        }

        console.log('📌 MoMo subscription return - redirecting to restaurant-manage success:', frontendUrl);
        res.redirect(
          `${frontendUrl}/restaurant-manage?success=true&tab=subscription&amount=${amount || ''}&transactionId=${transId || ''}`
        );
      } else {
        console.log('📌 MoMo subscription return - redirecting to restaurant-manage failure:', frontendUrl);
        res.redirect(
          `${frontendUrl}/restaurant-manage?success=false&error=momo_failed&responseCode=${resultCode}`
        );
      }
      return;
    }

    // resultCode từ query param là string, '0' = thành công
    if (String(resultCode) === '0') {
      const order = await Order.findOne({ transactionId: orderId });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentMethod = 'momo';
        order.paidAt = new Date();
        await order.save();

        // Emit thông báo real-time
        const io = req.app.get('io');
        if (io) {
          io.emit('payment-confirmed', {
            orderId: order._id,
            paymentMethod: 'MoMo 💜',
            amount: order.finalAmount,
            message: `Khách hàng đã thanh toán qua MoMo 💜`
          });
        }
      }

      const realOrderId = order ? order._id : orderId;
      const frontendUrl = getFrontendUrl();
      console.log('📌 MoMo return - redirecting to:', frontendUrl);
      res.redirect(
        `${frontendUrl}/payment-result?success=true&orderId=${realOrderId}&amount=${amount || ''}&transactionId=${transId || ''}`
      );
    } else {
      const order = await Order.findOne({ transactionId: orderId });
      const realOrderId = order ? order._id : '';
      const frontendUrl = getFrontendUrl();
      res.redirect(
        `${frontendUrl}/payment-result?success=false&orderId=${realOrderId}&responseCode=${resultCode}`
      );
    }
  } catch (error) {
    console.error('MoMo return error:', error);
    const frontendUrl = getFrontendUrl();
    if (orderId && orderId.startsWith('SUB_')) {
      res.redirect(`${frontendUrl}/restaurant-manage?success=false&error=server_error`);
    } else {
      res.redirect(`${frontendUrl}/payment-result?success=false&responseCode=99`);
    }
  }
});

// ===== COINS: Thanh toán bằng Xu =====
router.post('/coins/pay', async (req, res) => {
  try {
    const { userId, orderId, amount } = req.body;

    if (!userId || !orderId || !amount) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const coinsRequired = Math.ceil(amount / 1000);

    if (user.coins < coinsRequired) {
      return res.status(400).json({
        message: `Không đủ Xu. Cần ${coinsRequired} Xu, hiện có ${user.coins} Xu`,
      });
    }

    user.coins -= coinsRequired;
    await user.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'coins';
      await order.save();

      // Emit thông báo real-time
      const io = req.body._io || req.app.get('io');
      if (io) {
        io.emit('payment-confirmed', {
          orderId: order._id,
          paymentMethod: 'Xu 🪙',
          amount: order.finalAmount,
          message: `Khách hàng đã thanh toán bằng Xu 🪙`
        });
      }
    }

    res.json({
      success: true,
      message: 'Thanh toán bằng Xu thành công',
      coinsRemaining: user.coins,
    });
  } catch (error) {
    console.error('Coins payment error:', error);
    res.status(500).json({ message: 'Lỗi khi thanh toán bằng Xu' });
  }
});

// ===== PAYOS: Tích hợp thanh toán QR tự động qua PayOS =====

// Helper to get PayOS instance configured via database settings or environment variables
async function getPayOSInstance() {
  try {
    const settings = await SystemSetting.findOne();
    const clientId = settings?.payosClientId || process.env.PAYOS_CLIENT_ID;
    const apiKey = settings?.payosApiKey || process.env.PAYOS_API_KEY;
    const checksumKey = settings?.payosChecksumKey || process.env.PAYOS_CHECKSUM_KEY;

    if (clientId && apiKey && checksumKey) {
      return new PayOS({ clientId, apiKey, checksumKey });
    }
    return null;
  } catch (error) {
    console.error('Error fetching PayOS configuration from DB:', error);
    return null;
  }
}

// Route tạo link thanh toán PayOS
router.post('/payos/create-subscription-payment', async (req, res) => {
  try {
    const { restaurantId, amount } = req.body;

    if (!restaurantId || !amount) {
      return res.status(400).json({ message: 'Thiếu restaurantId hoặc amount' });
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });
    }

    // Lấy cấu hình hệ thống từ DB hoặc Env
    const settings = await SystemSetting.findOne();
    const clientId = settings?.payosClientId || process.env.PAYOS_CLIENT_ID;
    const apiKey = settings?.payosApiKey || process.env.PAYOS_API_KEY;
    const checksumKey = settings?.payosChecksumKey || process.env.PAYOS_CHECKSUM_KEY;

    const hasPayOSConfig = clientId && apiKey && checksumKey;

    if (!hasPayOSConfig) {
      console.log('⚠️ [PayOS] Chưa cấu hình API Keys. Chuyển sang chế độ GIẢ LẬP ĐỂ DEMO.');

      // 1. Gia hạn nhà hàng ngay lập tức
      const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
        ? new Date(restaurant.subscriptionExpiry)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
      restaurant.subscriptionExpiry = newExpiry;
      restaurant.isActive = true;

      // 2. Tạo yêu cầu thanh toán đã duyệt
      const orderCode = Number(String(Date.now()).slice(-8) + Math.floor(10 + Math.random() * 90));
      const paymentRequest = {
        _id: orderCode.toString(),
        orderCode: orderCode,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        userId: restaurant.ownerId,
        amount: Number(amount),
        paymentMethod: 'bank_transfer',
        status: 'approved',
        approvedBy: 'system_demo',
        approvedAt: new Date(),
        createdAt: new Date(),
        note: `Gia hạn phí duy trì (Giả lập Demo VietQR do chưa cấu hình API)`
      };

      if (!restaurant.paymentRequests) {
        restaurant.paymentRequests = [];
      }
      restaurant.paymentRequests.push(paymentRequest);

      // 3. Ghi nhận lịch sử giao dịch thành công
      if (!restaurant.paymentHistory) {
        restaurant.paymentHistory = [];
      }
      restaurant.paymentHistory.push({
        _id: orderCode.toString(),
        amount: amount,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        paidAt: new Date(),
        periodStart: currentExpiry,
        periodEnd: newExpiry,
        transactionNote: `Thanh toán phí duy trì tự động VietQR (Giả lập Demo)`,
        approvedBy: 'system_demo'
      });

      await restaurant.save();

      // 4. Tạo thông báo cho đối tác
      const notification = await Notification.create({
        userId: restaurant.ownerId,
        type: 'payment_approved',
        title: '✅ Gia hạn thành công VietQR (Demo)',
        message: `Cửa hàng "${restaurant.name}" đã được gia hạn thêm 30 ngày (Chế độ giả lập VietQR). Hạn mới: ${newExpiry.toLocaleDateString('vi-VN')}`,
        data: {
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          amount: amount,
          subscriptionExpiry: restaurant.subscriptionExpiry
        }
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user-${restaurant.ownerId}`).emit('new-notification', notification);
        io.to(`user-${restaurant.ownerId}`).emit('payment-approved', { 
          restaurantId: restaurant._id,
          subscriptionExpiry: restaurant.subscriptionExpiry 
        });
      }

      return res.json({
        success: true,
        isDemo: true,
        message: 'Thanh toán VietQR giả lập thành công! Cửa hàng đã được gia hạn tự động.',
        subscriptionExpiry: restaurant.subscriptionExpiry
      });
    }

    // Tự động thiết lập redirect URL
    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = serverOrigin.includes('localhost')
      ? 'http://localhost:3000'
      : serverOrigin;
      
    const redirectUrl = `${frontendUrl}/restaurant-manage?success=true&tab=subscription&method=payos`;
    const cancelUrl = `${frontendUrl}/restaurant-manage?success=false&tab=subscription&method=payos`;

    // Tạo mã orderCode ngẫu nhiên duy nhất dạng số nguyên
    const orderCode = Number(String(Date.now()).slice(-8) + Math.floor(10 + Math.random() * 90));

    // Làm sạch chuỗi mô tả (Tiếng Việt không dấu, không ký tự đặc biệt, max 25 ký tự)
    const cleanName = restaurant.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .slice(0, 15);
    const description = `Gia han ${cleanName}`.slice(0, 25);

    // Lưu yêu cầu thanh toán ở trạng thái pending
    const paymentRequest = {
      _id: orderCode.toString(),
      orderCode: orderCode,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      userId: restaurant.ownerId,
      amount: Number(amount),
      paymentMethod: 'bank_transfer',
      status: 'pending',
      createdAt: new Date(),
      note: `Yêu cầu gia hạn phí duy trì qua PayOS cho ${restaurant.name}`
    };

    if (!restaurant.paymentRequests) {
      restaurant.paymentRequests = [];
    }
    restaurant.paymentRequests.push(paymentRequest);
    await restaurant.save();

    // Dữ liệu thanh toán gửi tới PayOS
    const paymentData = {
      orderCode: orderCode,
      amount: Number(amount),
      description: description,
      cancelUrl: cancelUrl,
      returnUrl: redirectUrl
    };

    console.log('📌 Tạo cổng thanh toán PayOS:', paymentData);
    const payOSInstance = new PayOS({ clientId, apiKey, checksumKey });
    const paymentLinkRes = await payOSInstance.paymentRequests.create(paymentData);
    
    res.json({
      message: 'Tạo liên kết thanh toán PayOS thành công',
      paymentUrl: paymentLinkRes.checkoutUrl,
      orderCode: orderCode
    });
  } catch (error) {
    console.error('PayOS create payment error:', error);
    res.status(500).json({ message: 'Lỗi khi kết nối với cổng thanh toán PayOS: ' + error.message });
  }
});

// Webhook xử lý thông báo thanh toán thành công của PayOS gửi về
router.post('/payos/webhook', async (req, res) => {
  try {
    const { code, data } = req.body;
    
    // Check webhook confirmation ping from PayOS
    if (req.body.desc === 'confirm' || (data && data.description === 'demo')) {
      return res.json({ success: true, message: 'Webhook confirmed' });
    }

    // Khởi tạo dynamic PayOS instance
    const payOSInstance = await getPayOSInstance();
    if (!payOSInstance) {
      console.error('[PayOS Webhook] Không tìm thấy cấu hình PayOS trong DB hoặc Env');
      return res.status(400).json({ message: 'PayOS not configured' });
    }

    // Xác thực chữ ký webhook để đảm bảo an toàn
    const webhookData = payOSInstance.webhooks.verify(req.body);
    
    if (webhookData && webhookData.code === '00') {
      const orderCode = webhookData.orderCode;
      const amount = webhookData.amount;
      
      console.log(`[PayOS Webhook] Giao dịch thành công. OrderCode: ${orderCode}, Số tiền: ${amount}`);

      // Tìm nhà hàng
      const restaurant = await Restaurant.findOne({
        'paymentRequests.orderCode': orderCode
      });
      
      if (!restaurant) {
        console.error(`[PayOS Webhook] Không tìm thấy nhà hàng có orderCode: ${orderCode}`);
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán' });
      }
      
      // Tìm yêu cầu thanh toán cụ thể
      const request = restaurant.paymentRequests.find(r => r.orderCode === orderCode);
      if (!request) {
        console.error(`[PayOS Webhook] Không tìm thấy request có orderCode: ${orderCode}`);
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán' });
      }
      
      if (request.status === 'approved') {
        console.log(`[PayOS Webhook] Giao dịch ${orderCode} đã được xử lý từ trước`);
        return res.json({ success: true, message: 'Already processed' });
      }
      
      // Cập nhật trạng thái duyệt thanh toán
      request.status = 'approved';
      request.approvedBy = 'system_payos';
      request.approvedAt = new Date();
      
      // Gia hạn thêm 30 ngày sử dụng
      const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
        ? new Date(restaurant.subscriptionExpiry)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
      restaurant.subscriptionExpiry = newExpiry;
      restaurant.isActive = true;
      
      // Ghi nhận lịch sử giao dịch thành công
      if (!restaurant.paymentHistory) {
        restaurant.paymentHistory = [];
      }
      restaurant.paymentHistory.push({
        _id: orderCode.toString(),
        amount: amount,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        paidAt: new Date(),
        periodStart: currentExpiry,
        periodEnd: newExpiry,
        transactionNote: `Thanh toán phí duy trì tự động qua VietQR (PayOS)`,
        approvedBy: 'system_payos'
      });
      
      await restaurant.save();
      console.log(`✅ [PayOS Webhook] Đã tự động gia hạn thành công cho: ${restaurant.name}`);
      
      // Tạo thông báo cho đối tác
      const notification = await Notification.create({
        userId: request.userId,
        type: 'payment_approved',
        title: '✅ Gia hạn tự động thành công qua VietQR',
        message: `Hệ thống đã nhận được số tiền ${amount.toLocaleString()}đ chuyển khoản qua VietQR. Cửa hàng "${restaurant.name}" đã được gia hạn thêm 30 ngày. Hạn mới: ${newExpiry.toLocaleDateString('vi-VN')}`,
        data: {
          restaurantId: restaurant.ownerId, // Lưu thông tin ownerId hoặc user
          restaurantName: restaurant.name,
          amount: amount,
          subscriptionExpiry: restaurant.subscriptionExpiry
        }
      });
      
      // Gửi real-time notifications
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${request.userId}`).emit('new-notification', notification);
        io.to(`user-${request.userId}`).emit('payment-approved', { 
          restaurantId: restaurant._id,
          subscriptionExpiry: restaurant.subscriptionExpiry 
        });
      }
      
      // Tạo thông báo cho Admin biết có thanh toán tự động mới
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        const adminNotification = await Notification.create({
          userId: admin._id,
          type: 'payment_approved',
          title: '💳 Thanh toán tự động QR mới',
          message: `${restaurant.name} đã hoàn tất thanh toán phí duy trì ${amount.toLocaleString()}đ qua VietQR`,
          data: {
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            amount: amount,
            requestId: request._id
          }
        });
        if (io) {
          io.to(`user-${admin._id}`).emit('new-notification', adminNotification);
        }
      }
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('PayOS Webhook error:', error);
    res.status(500).json({ message: 'Lỗi xử lý webhook PayOS' });
  }
});

export default router;
