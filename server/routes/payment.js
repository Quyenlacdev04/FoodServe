import express from 'express';
import crypto from 'crypto';
import querystring from 'querystring';
import Order from '../models/Order.js';
import User from '../models/User.js';

const router = express.Router();

// Cấu hình VNPay (lấy từ .env)
const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return'
};

// Tạo URL thanh toán VNPay
router.post('/vnpay/create-payment', async (req, res) => {
  try {
    const { orderId, amount, orderInfo, bankCode = '' } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Thiếu thông tin orderId hoặc amount' });
    }
    
    // Kiểm tra đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    const date = new Date();
    const createDate = formatDate(date);
    const txnRef = `${orderId}_${Date.now()}`; // Mã giao dịch unique
    
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_CreateDate: createDate
    };
    
    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }
    
    // Sắp xếp params theo alphabet
    vnp_Params = sortObject(vnp_Params);
    
    // Tạo chữ ký
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params.vnp_SecureHash = signed;
    
    // Tạo URL
    const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
    
    res.json({
      message: 'Tạo URL thanh toán thành công',
      paymentUrl,
      txnRef
    });
  } catch (error) {
    console.error('Create VNPay payment error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo thanh toán VNPay' });
  }
});

// Xử lý callback từ VNPay
router.get('/vnpay/return', async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;
    
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;
    
    vnp_Params = sortObject(vnp_Params);
    
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    if (secureHash === signed) {
      const responseCode = vnp_Params.vnp_ResponseCode;
      const txnRef = vnp_Params.vnp_TxnRef;
      const amount = vnp_Params.vnp_Amount / 100;
      
      // Lấy orderId từ txnRef
      const orderId = txnRef.split('_')[0];
      
      if (responseCode === '00') {
        // Thanh toán thành công
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = 'paid';
          order.paymentMethod = 'vnpay';
          order.transactionId = vnp_Params.vnp_TransactionNo;
          await order.save();
        }
        
        res.json({
          success: true,
          message: 'Thanh toán thành công',
          orderId,
          amount,
          transactionId: vnp_Params.vnp_TransactionNo
        });
      } else {
        // Thanh toán thất bại
        res.json({
          success: false,
          message: 'Thanh toán thất bại',
          responseCode
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Chữ ký không hợp lệ'
      });
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    res.status(500).json({ message: 'Lỗi xử lý callback VNPay' });
  }
});

// Thanh toán bằng Xu (Coins)
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
    
    const coinsRequired = Math.ceil(amount / 1000); // 1 Xu = 1.000đ
    
    if (user.coins < coinsRequired) {
      return res.status(400).json({ 
        message: `Không đủ Xu. Cần ${coinsRequired} Xu, hiện có ${user.coins} Xu` 
      });
    }
    
    // Trừ xu
    user.coins -= coinsRequired;
    await user.save();
    
    // Cập nhật đơn hàng
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'coins';
      await order.save();
    }
    
    res.json({
      success: true,
      message: 'Thanh toán bằng Xu thành công',
      coinsRemaining: user.coins
    });
  } catch (error) {
    console.error('Coins payment error:', error);
    res.status(500).json({ message: 'Lỗi khi thanh toán bằng Xu' });
  }
});

// Helper functions
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export default router;
