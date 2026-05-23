# 🏦 HƯỚNG DẪN TÍCH HỢP VNPAY

## 📋 Các bước tích hợp VNPay

### 1. Đăng ký tài khoản VNPay Sandbox (Test)

1. Truy cập: https://sandbox.vnpayment.vn/
2. Đăng ký tài khoản merchant (miễn phí)
3. Sau khi đăng ký, bạn sẽ nhận được:
   - **TMN Code** (Mã website)
   - **Hash Secret** (Mã bảo mật)

### 2. Cấu hình trong file `.env`

```env
VNPAY_TMN_CODE=YOUR_TMN_CODE_HERE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET_HERE
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/vnpay-return
```

### 3. API Endpoints đã có sẵn

#### 🔹 Tạo URL thanh toán
```
POST /api/payment/vnpay/create-payment
```

**Request Body:**
```json
{
  "orderId": "673abc123def456",
  "amount": 150000,
  "orderInfo": "Thanh toan don hang #123",
  "bankCode": "NCB" // Optional: NCB, VIETCOMBANK, TECHCOMBANK, etc.
}
```

**Response:**
```json
{
  "message": "Tạo URL thanh toán thành công",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "txnRef": "673abc123def456_1234567890"
}
```

#### 🔹 Xử lý callback từ VNPay
```
GET /api/payment/vnpay/return?vnp_ResponseCode=00&...
```

**Response (Thành công):**
```json
{
  "success": true,
  "message": "Thanh toán thành công",
  "orderId": "673abc123def456",
  "amount": 150000,
  "transactionId": "14123456"
}
```

#### 🔹 Thanh toán bằng Xu (Coins)
```
POST /api/payment/coins/pay
```

**Request Body:**
```json
{
  "userId": "673abc123def456",
  "orderId": "673abc123def789",
  "amount": 150000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thanh toán bằng Xu thành công",
  "coinsRemaining": 350
}
```

### 4. Luồng thanh toán VNPay

```
1. Khách hàng chọn "Thanh toán VNPay" → Frontend gọi API create-payment
2. Backend tạo URL thanh toán → Trả về paymentUrl
3. Frontend redirect khách hàng đến paymentUrl
4. Khách hàng nhập thông tin thẻ trên trang VNPay
5. VNPay xử lý thanh toán → Redirect về vnp_ReturnUrl
6. Backend xử lý callback → Cập nhật trạng thái đơn hàng
7. Frontend hiển thị kết quả thanh toán
```

### 5. Thông tin test VNPay Sandbox

**Thẻ test (Nội địa):**
- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- Mật khẩu OTP: `123456`

**Thẻ test (Quốc tế):**
- Số thẻ: `4456530000001005`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày hết hạn: `12/25`
- CVV: `123`

### 6. Mã ngân hàng (bankCode)

- `NCB` - Ngân hàng NCB
- `VIETCOMBANK` - Vietcombank
- `TECHCOMBANK` - Techcombank
- `BIDV` - BIDV
- `AGRIBANK` - Agribank
- `SACOMBANK` - Sacombank
- `VIB` - VIB
- `MBBANK` - MB Bank
- `VPBANK` - VPBank
- Để trống = Khách chọn ngân hàng trên trang VNPay

### 7. Response Code từ VNPay

- `00` - Giao dịch thành công
- `07` - Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)
- `09` - Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng
- `10` - Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần
- `11` - Giao dịch không thành công do: Đã hết hạn chờ thanh toán
- `12` - Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa
- `13` - Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)
- `24` - Giao dịch không thành công do: Khách hàng hủy giao dịch
- `51` - Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch
- `65` - Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày
- `75` - Ngân hàng thanh toán đang bảo trì
- `79` - Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định

### 8. Chuyển sang Production

Khi đã test xong, để chuyển sang môi trường thật:

1. Đăng ký tài khoản VNPay Production tại: https://vnpay.vn/
2. Cập nhật `.env`:
```env
VNPAY_TMN_CODE=YOUR_PRODUCTION_TMN_CODE
VNPAY_HASH_SECRET=YOUR_PRODUCTION_HASH_SECRET
VNPAY_URL=https://pay.vnpay.vn/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/payment/vnpay-return
```

### 9. Bảo mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG BAO GIỜ** commit file `.env` lên Git
- **KHÔNG BAO GIỜ** để lộ `VNPAY_HASH_SECRET`
- Luôn validate chữ ký (`vnp_SecureHash`) khi nhận callback
- Kiểm tra `vnp_Amount` khớp với số tiền đơn hàng
- Log tất cả giao dịch để đối soát

### 10. Đối soát giao dịch

VNPay cung cấp API để đối soát:
- Truy vấn giao dịch: `/merchant_webapi/api/transaction`
- Hoàn tiền: `/merchant_webapi/api/refund`

Tham khảo tài liệu: https://sandbox.vnpayment.vn/apis/docs/

---

## 🎯 Ví dụ sử dụng trong Frontend

```javascript
// Tạo thanh toán VNPay
const handleVNPayPayment = async (orderId, amount) => {
  try {
    const response = await fetch('http://localhost:5000/api/payment/vnpay/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        amount,
        orderInfo: `Thanh toán đơn hàng #${orderId}`,
        bankCode: 'NCB' // Optional
      })
    });
    
    const data = await response.json();
    
    if (data.paymentUrl) {
      // Redirect đến trang thanh toán VNPay
      window.location.href = data.paymentUrl;
    }
  } catch (error) {
    console.error('Lỗi tạo thanh toán:', error);
  }
};

// Xử lý kết quả thanh toán (trang return)
const handlePaymentReturn = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const responseCode = urlParams.get('vnp_ResponseCode');
  
  if (responseCode === '00') {
    alert('Thanh toán thành công!');
    // Redirect về trang đơn hàng
  } else {
    alert('Thanh toán thất bại!');
  }
};
```

---

## 📞 Hỗ trợ

- Tài liệu VNPay: https://sandbox.vnpayment.vn/apis/docs/
- Hotline VNPay: 1900 55 55 77
- Email: support@vnpay.vn
