import express from 'express';
import crypto from 'crypto';
import https from 'https';
import { PayOS } from '@payos/node';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import SystemSetting from '../models/SystemSetting.js';
import CoinTransaction from '../models/CoinTransaction.js';
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
      } else if (orderId && orderId.startsWith('TOPUP_')) {
        const [_, userId, transactionId] = orderId.split('_');
        const coinTx = await CoinTransaction.findById(transactionId);
        if (coinTx && coinTx.status !== 'completed') {
          coinTx.status = 'completed';
          coinTx.referenceId = req.body.transId || coinTx.referenceId;
          await coinTx.save();
          
          const user = await User.findById(userId);
          if (user) {
            user.coins += coinTx.coins;
            await user.save();
            
            const io = req.app.get('io');
            if (io) {
              io.to(`user-${userId}`).emit('topup-success', {
                coins: user.coins,
                coinsAdded: coinTx.coins,
                message: `Nạp xu thành công! Bạn nhận được ${coinTx.coins} xu.`
              });
            }
          }
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
    // Check if coin top-up payment
    if (orderId && orderId.startsWith('TOPUP_')) {
      const [_, userId, transactionId] = orderId.split('_');
      const frontendUrl = getFrontendUrl();
      
      if (String(resultCode) === '0') {
        const coinTx = await CoinTransaction.findById(transactionId);
        if (coinTx && coinTx.status !== 'completed') {
          coinTx.status = 'completed';
          coinTx.referenceId = transId || coinTx.referenceId;
          await coinTx.save();
          
          const user = await User.findById(userId);
          if (user) {
            user.coins += coinTx.coins;
            await user.save();
            
            const io = req.app.get('io');
            if (io) {
              io.to(`user-${userId}`).emit('topup-success', {
                coins: user.coins,
                coinsAdded: coinTx.coins
              });
            }
          }
        }
        res.redirect(`${frontendUrl}/profile?success=true&tab=wallet&type=topup&amount=${amount || ''}`);
      } else {
        res.redirect(`${frontendUrl}/profile?success=false&error=momo_failed&responseCode=${resultCode}`);
      }
      return;
    }

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

// ===== COINS: Lấy lịch sử giao dịch xu =====
router.get('/coins/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await CoinTransaction.find({ userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('Get coin history error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử giao dịch xu' });
  }
});

// ===== COINS: Rút xu về tài khoản ngân hàng (Payout) =====
router.post('/coins/withdraw', async (req, res) => {
  try {
    const { userId, coins, bankName, accountNumber, accountName } = req.body;

    if (!userId || !coins || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin yêu cầu rút tiền' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng' });
    }

    const coinsToWithdraw = Number(coins);
    if (isNaN(coinsToWithdraw) || coinsToWithdraw <= 0) {
      return res.status(400).json({ message: 'Số lượng xu không hợp lệ' });
    }

    if (user.coins < coinsToWithdraw) {
      return res.status(400).json({ message: `Số dư Xu không đủ. Bạn chỉ có ${user.coins} Xu.` });
    }

    if (coinsToWithdraw < 50) {
      return res.status(400).json({ message: 'Số lượng rút tối thiểu là 50 Xu (50.000đ).' });
    }

    // Trừ xu của người dùng
    user.coins -= coinsToWithdraw;
    await user.save();

    // Tạo giao dịch rút tiền
    const amountVnd = coinsToWithdraw * 1000;
    const coinTx = await CoinTransaction.create({
      userId,
      amount: amountVnd,
      coins: coinsToWithdraw,
      type: 'withdraw',
      paymentMethod: 'bank',
      status: 'completed', // Cho phép hoàn tất trực tiếp ở bản demo
      referenceId: `WITHDRAW_${Date.now()}`,
      description: `Rút tiền về ngân hàng ${bankName.toUpperCase()} - Số TK: ${accountNumber} (${accountName.toUpperCase()})`
    });

    // Phát socket cập nhật số dư cho client real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user._id}`).emit('withdraw-success', {
        coins: user.coins,
        coinsSubtracted: coinsToWithdraw,
        message: `Rút thành công ${coinsToWithdraw} Xu về ngân hàng!`
      });
    }

    res.json({
      success: true,
      coins: user.coins,
      message: `Đã xử lý yêu cầu rút ${coinsToWithdraw} Xu (${amountVnd.toLocaleString('vi-VN')} đ) thành công!`,
      transaction: coinTx
    });

  } catch (error) {
    console.error('Coins withdraw error:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi xử lý yêu cầu rút tiền' });
  }
});

// ===== COINS: Tạo link nạp xu (MoMo / PayOS) =====
router.post('/coins/create-topup', async (req, res) => {
  try {
    const { userId, amount, paymentMethod } = req.body;

    if (!userId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const coinsToCredit = Math.floor(amount / 1000);
    if (coinsToCredit <= 0) {
      return res.status(400).json({ message: 'Số tiền nạp tối thiểu là 1.000đ (tương đương 1 Xu)' });
    }

    // 1. Tạo bản ghi giao dịch xu tạm thời ở trạng thái pending
    const coinTx = await CoinTransaction.create({
      userId,
      amount,
      coins: coinsToCredit,
      type: 'topup',
      paymentMethod,
      status: 'pending',
      description: `Nạp ${coinsToCredit} Xu qua cổng ${paymentMethod.toUpperCase()}`
    });

    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = serverOrigin.includes('localhost')
      ? 'http://localhost:3000'
      : serverOrigin;

    if (paymentMethod === 'momo') {
      const redirectUrl = momoConfig.redirectUrl.includes('localhost')
        ? `${serverOrigin}/api/payment/momo/return`
        : momoConfig.redirectUrl;
      const ipnUrl = momoConfig.ipnUrl.includes('localhost')
        ? `${serverOrigin}/api/payment/momo/ipn`
        : momoConfig.ipnUrl;

      const orderId = `TOPUP_${userId}_${coinTx._id}`;
      const orderInfo = `Nap ${coinsToCredit} Xu vao tai khoan FoodServe`;
      const requestId = orderId;
      const requestType = 'payWithMethod';
      const extraData = '';
      const autoCapture = true;
      const lang = 'vi';

      const rawSignature =
        'accessKey=' + momoConfig.accessKey +
        '&amount=' + amount +
        '&extraData=' + extraData +
        '&ipnUrl=' + ipnUrl +
        '&orderId=' + orderId +
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
        orderId: orderId,
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

      if (momoRes.resultCode === 0) {
        // Cập nhật referenceId bằng orderId của MoMo
        coinTx.referenceId = orderId;
        await coinTx.save();

        res.json({
          success: true,
          paymentUrl: momoRes.payUrl,
          transactionId: coinTx._id
        });
      } else {
        coinTx.status = 'failed';
        await coinTx.save();
        res.status(400).json({ message: 'Lỗi tạo cổng MoMo: ' + momoRes.message });
      }
      return;
    }

    if (paymentMethod === 'payos') {
      const payOSInstance = await getPayOSInstance();
      if (!payOSInstance) {
        // Nếu chưa cấu hình PayOS -> sử dụng Mock / Giả lập thanh toán
        const orderCode = Number(String(Date.now()).slice(-8) + Math.floor(10 + Math.random() * 90));
        coinTx.referenceId = orderCode.toString();
        coinTx.description = `Nạp ${coinsToCredit} Xu (Giả lập QR)`;
        await coinTx.save();

        const settings = await SystemSetting.findOne();
        const adminBankName = settings?.adminBankName || 'Techcombank';
        const adminAccountNumber = settings?.adminAccountNumber || '509868686868';
        const adminAccountName = settings?.adminAccountName || 'VU VAN QUYEN';
        
        const binMap = {
          'Techcombank': '970407',
          'Vietcombank': '970436',
          'MBBank': '970422',
          'VietinBank': '970415',
          'BIDV': '970418',
          'Agribank': '970405',
          'ACB': '970416'
        };
        const bin = binMap[adminBankName] || '970407';

        return res.json({
          success: true,
          isDemo: true,
          orderCode: orderCode,
          bin: bin,
          accountNumber: adminAccountNumber,
          accountName: adminAccountName,
          amount: Number(amount),
          description: `Nap ${coinsToCredit} xu`.slice(0, 25)
        });
      }

      // Nếu có PayOS thật
      const orderCode = Number(String(Date.now()).slice(-8) + Math.floor(10 + Math.random() * 90));
      const description = `Nap ${coinsToCredit} xu`.slice(0, 25);
      const returnUrl = `${frontendUrl}/profile?success=true&tab=wallet&type=topup&method=payos&orderCode=${orderCode}`;
      const cancelUrl = `${frontendUrl}/profile?success=false&tab=wallet&type=topup&method=payos&orderCode=${orderCode}`;

      const paymentData = {
        orderCode: orderCode,
        amount: Number(amount),
        description: description,
        returnUrl: returnUrl,
        cancelUrl: cancelUrl
      };

      const paymentLinkRes = await payOSInstance.paymentRequests.create(paymentData);
      
      coinTx.referenceId = orderCode.toString();
      await coinTx.save();

      res.json({
        success: true,
        paymentUrl: paymentLinkRes.checkoutUrl,
        orderCode: orderCode
      });
      return;
    }

    res.status(400).json({ message: 'Phương thức thanh toán không được hỗ trợ' });
  } catch (error) {
    console.error('Create coin topup error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi khởi tạo nạp xu' });
  }
});

// ===== COINS: Check status nạp xu VietQR (Chỉ dùng cho Demo / Giả lập hoặc đối soát nhanh) =====
router.post('/coins/check-topup-status/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;
    const coinTx = await CoinTransaction.findOne({ referenceId: orderCode });
    if (!coinTx) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch nạp xu này' });
    }

    if (coinTx.status === 'completed') {
      return res.json({ success: true, message: 'Giao dịch đã hoàn tất trước đó', coins: coinTx.coins });
    }

    // Kiểm tra xem PayOS cấu hình thật hay demo
    const payOSInstance = await getPayOSInstance();
    let isPaid = false;

    if (payOSInstance) {
      const paymentInfo = await payOSInstance.paymentRequests.get(Number(orderCode));
      if (paymentInfo.status === 'PAID') {
        isPaid = true;
      }
    } else {
      // Giả lập Demo: Tự động cho thành công sau khi click kiểm tra để test
      isPaid = true;
    }

    if (isPaid) {
      coinTx.status = 'completed';
      await coinTx.save();

      const user = await User.findById(coinTx.userId);
      if (user) {
        user.coins += coinTx.coins;
        await user.save();

        const io = req.app.get('io');
        if (io) {
          io.to(`user-${user._id}`).emit('topup-success', {
            coins: user.coins,
            coinsAdded: coinTx.coins,
            message: `Nạp xu thành công! Bạn nhận được ${coinTx.coins} xu.`
          });
        }

        return res.json({
          success: true,
          coins: user.coins,
          coinsAdded: coinTx.coins,
          message: 'Thanh toán thành công và xu đã được cộng!'
        });
      }
    }

    res.json({ success: false, message: 'Giao dịch chưa được thanh toán hoặc đang xử lý' });
  } catch (error) {
    console.error('Check topup status error:', error);
    res.status(500).json({ message: 'Lỗi kiểm tra trạng thái giao dịch' });
  }
});

// ===== PAYOS: Thanh toán đơn hàng khách qua PayOS (VietQR) =====
router.post('/payos/create-payment', async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Thiếu orderId hoặc amount' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const payOSInstance = await getPayOSInstance();
    if (!payOSInstance) {
      return res.status(400).json({ message: 'Cổng thanh toán PayOS chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
    }

    // Tạo mã orderCode duy nhất dạng số nguyên
    const orderCode = Number(String(Date.now()).slice(-8) + Math.floor(10 + Math.random() * 90));

    // Mô tả không dấu, max 25 ký tự
    const description = `DH ${orderId.toString().slice(-6).toUpperCase()}`.slice(0, 25);

    // Tự động detect URL
    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = serverOrigin.includes('localhost')
      ? 'http://localhost:3000'
      : serverOrigin;

    const returnUrl = `${frontendUrl}/payment-result?success=true&orderId=${orderId}&method=payos`;
    const cancelUrl = `${frontendUrl}/payment-result?success=false&orderId=${orderId}&method=payos`;

    const paymentData = {
      orderCode: orderCode,
      amount: Number(amount),
      description: description,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl
    };

    console.log('📌 [PayOS] Tạo thanh toán đơn hàng khách:', paymentData);
    const paymentLinkRes = await payOSInstance.paymentRequests.create(paymentData);

    // Lưu orderCode vào order để đối chiếu sau
    order.transactionId = orderCode.toString();
    order.paymentMethod = 'payos';
    await order.save();

    res.json({
      success: true,
      message: 'Tạo liên kết thanh toán PayOS thành công',
      paymentUrl: paymentLinkRes.checkoutUrl,
      orderCode: orderCode
    });
  } catch (error) {
    console.error('PayOS create order payment error:', error);
    res.status(500).json({ message: 'Lỗi khi kết nối cổng thanh toán PayOS: ' + error.message });
  }
});

// ===== PAYOS: Return URL cho đơn hàng khách =====
router.get('/payos/return', async (req, res) => {
  const { orderCode } = req.query;
  
  const serverOrigin = `${req.protocol}://${req.get('host')}`;
  const frontendUrl = serverOrigin.includes('localhost')
    ? 'http://localhost:3000'
    : serverOrigin;

  try {
    if (!orderCode) {
      return res.redirect(`${frontendUrl}/payment-result?success=false&responseCode=missing_orderCode`);
    }

    const payOSInstance = await getPayOSInstance();
    if (!payOSInstance) {
      return res.redirect(`${frontendUrl}/payment-result?success=false&responseCode=payos_not_configured`);
    }

    const paymentInfo = await payOSInstance.paymentRequests.get(Number(orderCode));
    
    if (paymentInfo.status === 'PAID') {
      // Tìm và cập nhật order
      const order = await Order.findOne({ transactionId: orderCode.toString() });
      if (order) {
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.paymentMethod = 'payos';
          order.paidAt = new Date();
          await order.save();

          // Emit thông báo real-time
          const io = req.app.get('io');
          if (io) {
            io.emit('payment-confirmed', {
              orderId: order._id,
              paymentMethod: 'VietQR (PayOS) 🏦',
              amount: order.finalAmount,
              message: `Khách hàng đã thanh toán qua VietQR (PayOS) 🏦`
            });
          }
        }
        res.redirect(`${frontendUrl}/payment-result?success=true&orderId=${order._id}&amount=${paymentInfo.amount}&transactionId=${orderCode}`);
      } else {
        // Có thể là nạp xu?
        const coinTx = await CoinTransaction.findOne({ referenceId: orderCode.toString() });
        if (coinTx) {
          if (coinTx.status !== 'completed') {
            coinTx.status = 'completed';
            await coinTx.save();

            const user = await User.findById(coinTx.userId);
            if (user) {
              user.coins += coinTx.coins;
              await user.save();

              const io = req.app.get('io');
              if (io) {
                io.to(`user-${user._id}`).emit('topup-success', {
                  coins: user.coins,
                  coinsAdded: coinTx.coins,
                  message: `Nạp xu thành công! Bạn nhận được ${coinTx.coins} xu.`
                });
              }
            }
          }
          res.redirect(`${frontendUrl}/profile?success=true&tab=wallet&type=topup&amount=${paymentInfo.amount}`);
        } else {
          res.redirect(`${frontendUrl}/payment-result?success=false&responseCode=transaction_not_found`);
        }
      }
    } else {
      const order = await Order.findOne({ transactionId: orderCode.toString() });
      if (order) {
        res.redirect(`${frontendUrl}/payment-result?success=false&orderId=${order._id}&responseCode=${paymentInfo.status}`);
      } else {
        res.redirect(`${frontendUrl}/profile?success=false&error=payos_failed&responseCode=${paymentInfo.status}`);
      }
    }
  } catch (error) {
    console.error('PayOS return error:', error);
    res.redirect(`${frontendUrl}/payment-result?success=false&responseCode=99`);
  }
});


// ===== PAYOS: Tích hợp thanh toán QR tự động qua PayOS =====

// Bộ nhớ tạm để theo dõi số lần bấm kiểm tra thanh toán giả lập
const demoCheckAttempts = new Map();

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

    if (!hasPayOSConfig) {
      console.log('⚠️ [PayOS] Chưa cấu hình API Keys. Chuyển sang chế độ GIẢ LẬP ĐỂ DEMO.');

      // Tạo yêu cầu thanh toán ở trạng thái pending
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
        note: `Gia hạn phí duy trì (Giả lập Demo VietQR do chưa cấu hình API)`
      };

      if (!restaurant.paymentRequests) {
        restaurant.paymentRequests = [];
      }
      restaurant.paymentRequests.push(paymentRequest);
      await restaurant.save();

      // Lấy thông tin tài khoản admin từ cài đặt hệ thống để hiển thị trên QR code
      const adminBankName = settings?.adminBankName || 'Techcombank';
      const adminAccountNumber = settings?.adminAccountNumber || '509868686868';
      const adminAccountName = settings?.adminAccountName || 'VU VAN QUYEN';
      const binMap = {
        'Techcombank': '970407',
        'Vietcombank': '970436',
        'MBBank': '970422',
        'VietinBank': '970415',
        'BIDV': '970418',
        'Agribank': '970405',
        'ACB': '970416'
      };
      const bin = binMap[adminBankName] || '970407';

      return res.json({
        success: true,
        isDemo: true,
        message: 'Tạo yêu cầu thanh toán VietQR giả lập thành công! Vui lòng thực hiện chuyển khoản.',
        orderCode: orderCode,
        bin: bin,
        accountNumber: adminAccountNumber,
        accountName: adminAccountName,
        amount: Number(amount),
        description: `Phi ${cleanName}`.slice(0, 25)
      });
    }

    // Tự động thiết lập redirect URL
    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = serverOrigin.includes('localhost')
      ? 'http://localhost:3000'
      : serverOrigin;
      
    const redirectUrl = `${frontendUrl}/restaurant-manage?success=true&tab=subscription&method=payos`;
    const cancelUrl = `${frontendUrl}/restaurant-manage?success=false&tab=subscription&method=payos`;

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
      success: true,
      isDemo: false,
      message: 'Tạo liên kết thanh toán PayOS thành công',
      paymentUrl: paymentLinkRes.checkoutUrl,
      orderCode: orderCode,
      qrCode: paymentLinkRes.qrCode,
      accountNumber: paymentLinkRes.accountNumber,
      accountName: paymentLinkRes.accountName,
      bin: paymentLinkRes.bin,
      amount: paymentLinkRes.amount,
      description: paymentLinkRes.description
    });
  } catch (error) {
    console.error('PayOS create payment error:', error);
    res.status(500).json({ message: 'Lỗi khi kết nối với cổng thanh toán PayOS: ' + error.message });
  }
});

// Route kiểm tra trạng thái thanh toán PayOS hoặc Demo
router.get('/payos/check-status/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({ message: 'Thiếu mã orderCode' });
    }

    const restaurant = await Restaurant.findOne({
      $or: [
        { 'paymentRequests.orderCode': Number(orderCode) },
        { 'paymentRequests.orderCode': String(orderCode) },
        { 'paymentRequests._id': String(orderCode) }
      ]
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán phù hợp.' });
    }

    const request = restaurant.paymentRequests.find(r => 
      String(r.orderCode) === String(orderCode) || String(r._id) === String(orderCode)
    );
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán.' });
    }

    // Nếu yêu cầu thanh toán đã được duyệt (qua webhook hoặc check trước đó)
    if (request.status === 'approved') {
      return res.json({
        success: true,
        paid: true,
        message: 'Thanh toán của bạn đã được xác nhận thành công!',
        subscriptionExpiry: restaurant.subscriptionExpiry
      });
    }

    // Lấy cấu hình hệ thống
    const settings = await SystemSetting.findOne();
    const clientId = settings?.payosClientId || process.env.PAYOS_CLIENT_ID;
    const apiKey = settings?.payosApiKey || process.env.PAYOS_API_KEY;
    const checksumKey = settings?.payosChecksumKey || process.env.PAYOS_CHECKSUM_KEY;

    const hasPayOSConfig = clientId && apiKey && checksumKey;

    if (!hasPayOSConfig) {
      // ===== LOGIC KIỂM TRA GIẢ LẬP (DEMO) =====
      let checks = demoCheckAttempts.get(orderCode) || 0;
      checks += 1;
      demoCheckAttempts.set(orderCode, checks);

      if (checks < 2) {
        return res.json({
          success: true,
          paid: false,
          message: 'Bạn chưa thanh toán. Vui lòng chuyển khoản đúng số tiền và nội dung.'
        });
      }

      // Đã ấn kiểm tra lần 2 -> Kích hoạt duyệt tự động
      request.status = 'approved';
      request.approvedBy = 'system_demo_check';
      request.approvedAt = new Date();

      const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
        ? new Date(restaurant.subscriptionExpiry)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
      restaurant.subscriptionExpiry = newExpiry;
      restaurant.isActive = true;

      if (!restaurant.paymentHistory) {
        restaurant.paymentHistory = [];
      }
      restaurant.paymentHistory.push({
        _id: orderCode.toString(),
        amount: request.amount,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        paidAt: new Date(),
        periodStart: currentExpiry,
        periodEnd: newExpiry,
        transactionNote: `Thanh toán phí duy trì qua VietQR (Giả lập Demo Check)`,
        approvedBy: 'system_demo_check'
      });

      await restaurant.save();

      // Gửi real-time notifications
      const io = req.app.get('io');
      const notification = await Notification.create({
        userId: restaurant.ownerId,
        type: 'payment_approved',
        title: '✅ Gia hạn thành công VietQR (Demo Check)',
        message: `Cửa hàng "${restaurant.name}" đã được gia hạn thêm 30 ngày (Chế độ giả lập). Hạn mới: ${newExpiry.toLocaleDateString('vi-VN')}`,
        data: {
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          amount: request.amount,
          subscriptionExpiry: restaurant.subscriptionExpiry
        }
      });

      if (io) {
        io.to(`user-${restaurant.ownerId}`).emit('new-notification', notification);
        io.to(`user-${restaurant.ownerId}`).emit('payment-approved', { 
          restaurantId: restaurant._id,
          subscriptionExpiry: restaurant.subscriptionExpiry 
        });
      }

      // Xóa bộ nhớ tạm
      demoCheckAttempts.delete(orderCode);

      return res.json({
        success: true,
        paid: true,
        message: 'Thanh toán VietQR giả lập thành công!',
        subscriptionExpiry: newExpiry
      });
    }

    // ===== LOGIC CHẠY THẬT QUA PAYOS =====
    const payOSInstance = new PayOS({ clientId, apiKey, checksumKey });
    console.log(`[PayOS Check] Đang kiểm tra giao dịch qua PayOS: ${orderCode}`);
    const paymentLinkInfo = await payOSInstance.paymentRequests.get(Number(orderCode));
    console.log(`[PayOS Check] Trạng thái PayOS: ${paymentLinkInfo.status} cho mã ${orderCode}`);

    if (paymentLinkInfo.status === 'PAID') {
      request.status = 'approved';
      request.approvedBy = 'system_payos_check';
      request.approvedAt = new Date();

      const currentExpiry = restaurant.subscriptionExpiry && new Date(restaurant.subscriptionExpiry) > new Date()
        ? new Date(restaurant.subscriptionExpiry)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
      restaurant.subscriptionExpiry = newExpiry;
      restaurant.isActive = true;

      if (!restaurant.paymentHistory) {
        restaurant.paymentHistory = [];
      }
      restaurant.paymentHistory.push({
        _id: orderCode.toString(),
        amount: paymentLinkInfo.amount,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        paidAt: new Date(),
        periodStart: currentExpiry,
        periodEnd: newExpiry,
        transactionNote: `Thanh toán phí duy trì tự động qua VietQR (PayOS Check)`,
        approvedBy: 'system_payos_check'
      });

      await restaurant.save();

      // Gửi notifications
      const io = req.app.get('io');
      const notification = await Notification.create({
        userId: request.userId,
        type: 'payment_approved',
        title: '✅ Gia hạn thành công qua VietQR (PayOS Check)',
        message: `Hệ thống đã xác nhận số tiền chuyển khoản qua VietQR. Cửa hàng "${restaurant.name}" đã được gia hạn thêm 30 ngày. Hạn mới: ${newExpiry.toLocaleDateString('vi-VN')}`,
        data: {
          restaurantId: restaurant.ownerId,
          restaurantName: restaurant.name,
          amount: paymentLinkInfo.amount,
          subscriptionExpiry: restaurant.subscriptionExpiry
        }
      });

      if (io) {
        io.to(`user-${request.userId}`).emit('new-notification', notification);
        io.to(`user-${request.userId}`).emit('payment-approved', { 
          restaurantId: restaurant._id,
          subscriptionExpiry: restaurant.subscriptionExpiry 
        });
      }

      // Thông báo cho admin
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        const adminNotification = await Notification.create({
          userId: admin._id,
          type: 'payment_approved',
          title: '💳 Thanh toán tự động QR mới (Check)',
          message: `${restaurant.name} đã hoàn tất thanh toán phí duy trì ${paymentLinkInfo.amount.toLocaleString()}đ qua VietQR`,
          data: {
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            amount: paymentLinkInfo.amount,
            requestId: request._id
          }
        });
        if (io) {
          io.to(`user-${admin._id}`).emit('new-notification', adminNotification);
        }
      }

      return res.json({
        success: true,
        paid: true,
        message: 'Thanh toán thành công qua VietQR!',
        subscriptionExpiry: newExpiry
      });
    } else if (paymentLinkInfo.status === 'PENDING') {
      return res.json({
        success: true,
        paid: false,
        message: 'Bạn chưa thanh toán. Vui lòng chuyển khoản đúng số tiền và nội dung.'
      });
    } else {
      // Giao dịch thất bại / hết hạn / bị hủy
      request.status = 'rejected';
      request.rejectedBy = 'system_payos_check';
      request.rejectedAt = new Date();
      request.rejectReason = `Trạng thái PayOS: ${paymentLinkInfo.status}`;
      await restaurant.save();

      return res.json({
        success: true,
        paid: false,
        status: paymentLinkInfo.status,
        message: `Giao dịch thất bại, hết hạn hoặc đã bị hủy (Trạng thái: ${paymentLinkInfo.status})`
      });
    }
  } catch (error) {
    console.error('PayOS check status error:', error);
    res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái thanh toán: ' + error.message });
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

      // Tìm nhà hàng (thanh toán phí duy trì)
      const restaurant = await Restaurant.findOne({
        'paymentRequests.orderCode': orderCode
      });
      
      if (!restaurant) {
        // Kiểm tra xem có phải đơn hàng khách không
        const customerOrder = await Order.findOne({ transactionId: orderCode.toString() });
        if (customerOrder && customerOrder.paymentStatus !== 'paid') {
          customerOrder.paymentStatus = 'paid';
          customerOrder.paymentMethod = 'payos';
          customerOrder.paidAt = new Date();
          await customerOrder.save();
          
          console.log(`✅ [PayOS Webhook] Đã xác nhận thanh toán đơn hàng khách: ${customerOrder._id}`);
          
          // Emit thông báo real-time
          const io = req.app.get('io');
          if (io) {
            io.emit('payment-confirmed', {
              orderId: customerOrder._id,
              paymentMethod: 'VietQR (PayOS) 🏦',
              amount: customerOrder.finalAmount,
              message: `Khách hàng đã thanh toán qua VietQR (PayOS) 🏦`
            });
          }
          
          return res.json({ success: true, message: 'Customer order payment processed' });
        }
        
        console.error(`[PayOS Webhook] Không tìm thấy nhà hàng hoặc đơn hàng có orderCode: ${orderCode}`);
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
