import express from 'express';
import crypto from 'crypto';
import https from 'https';
import Order from '../models/Order.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const router = express.Router();

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
      '&ipnUrl=' + momoConfig.ipnUrl +
      '&orderId=' + requestId +
      '&orderInfo=' + orderInfo +
      '&partnerCode=' + momoConfig.partnerCode +
      '&redirectUrl=' + momoConfig.redirectUrl +
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
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
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
      // Tìm order theo transactionId
      const order = await Order.findOne({ transactionId: orderId });
      if (order) {
        order.paymentStatus = 'paid';
        order.paymentMethod = 'momo';
        await order.save();
        console.log('✅ MoMo payment confirmed for order:', order._id);
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

  try {
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
      res.redirect(
        `http://localhost:3000/payment-result?success=true&orderId=${realOrderId}&amount=${amount || ''}&transactionId=${transId || ''}`
      );
    } else {
      const order = await Order.findOne({ transactionId: orderId });
      const realOrderId = order ? order._id : '';
      res.redirect(
        `http://localhost:3000/payment-result?success=false&orderId=${realOrderId}&responseCode=${resultCode}`
      );
    }
  } catch (error) {
    console.error('MoMo return error:', error);
    res.redirect('http://localhost:3000/payment-result?success=false&responseCode=99');
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

export default router;
