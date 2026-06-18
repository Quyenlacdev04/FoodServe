# 🎫 Hướng Dẫn Hệ Thống Voucher Hết Hạn

## 📋 Tổng Quan

Hệ thống voucher đã được cập nhật với 3 tính năng chính:
1. ✅ **Sửa lỗi NaN** khi áp dụng mã giảm giá
2. ✅ **Thông báo voucher sắp hết hạn** (còn < 24h)
3. ✅ **Tự động xóa voucher hết hạn** khỏi user

---

## 🐛 Sửa Lỗi NaN

### **Vấn đề:**
Khi áp dụng voucher, tổng tiền hiển thị `NaN đ` do biến `discount` có giá trị `undefined`.

### **Nguyên nhân:**
```javascript
// CheckoutPage.jsx (TRƯỚC)
const finalTotal = Math.max(0, total + deliveryFee - discount)
// discount có thể là undefined → NaN
```

### **Giải pháp:**
```javascript
// CheckoutPage.jsx (SAU)
const finalTotal = Math.max(0, total + deliveryFee - (discount || 0))
// Luôn fallback về 0 nếu discount undefined
```

### **Files đã sửa:**
- ✅ `src/pages/CheckoutPage.jsx` - 3 chỗ sử dụng `discount`
  ```javascript
  // Line 43
  const finalTotal = Math.max(0, total + deliveryFee - (discount || 0))
  
  // Line 98
  discount: discount || 0,
  
  // Line 347
  {(discount || 0) > 0 && (
    <div className="flex justify-between text-green-500">
      <span>Giảm giá khuyến mãi</span>
      <span>-{formatPrice(discount || 0)}</span>
    </div>
  )}
  ```

---

## 🔔 Thông Báo Voucher Sắp Hết Hạn

### **Tính năng:**
Khi voucher còn **ít hơn 24 giờ** là hết hạn:
- ✅ Hệ thống tự động gửi thông báo cho tất cả user có voucher đó
- ✅ Thông báo hiển thị số giờ còn lại
- ✅ Gửi qua Socket.io (real-time) + lưu vào database

### **Logic:**
```javascript
// Tìm voucher sắp hết hạn
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

const expiringVouchers = await Voucher.find({
  isActive: true,
  expiresAt: {
    $gte: now,    // Chưa hết hạn
    $lte: tomorrow // Trong vòng 24h tới
  }
});

// Tính số giờ còn lại
const hoursLeft = Math.ceil(
  (new Date(voucher.expiresAt) - now) / (1000 * 60 * 60)
);

// Tìm tất cả user có voucher này
const users = await User.find({
  vouchers: voucher.code
});

// Gửi thông báo cho từng user
for (const user of users) {
  const notification = new Notification({
    userId: user._id,
    type: 'voucher_expiring',
    title: '⏰ Voucher sắp hết hạn!',
    message: `Mã "${voucher.code}" chỉ còn ${hoursLeft} giờ nữa hết hạn. Dùng ngay kẻo lỡ!`,
    data: {
      voucherCode: voucher.code,
      expiresAt: voucher.expiresAt,
      hoursLeft
    }
  });
  
  await notification.save();
  io.to(`user-${user._id}`).emit('new-notification', notification);
}
```

### **Example Notification:**
```
📬 Thông báo mới
⏰ Voucher sắp hết hạn!
Mã "SALE50" chỉ còn 12 giờ nữa hết hạn. Dùng ngay kẻo lỡ!
```

---

## 🗑️ Tự Động Xóa Voucher Hết Hạn

### **Tính năng:**
Khi voucher **hết hạn**:
- ✅ Đánh dấu voucher `isActive = false` (giữ lại record để tracking)
- ✅ Xóa voucher khỏi tất cả user (`$pull` khỏi `user.vouchers`)
- ✅ User không thể sử dụng voucher đã hết hạn

### **Logic:**
```javascript
// Tìm voucher đã hết hạn
const now = new Date();
const expiredVouchers = await Voucher.find({
  expiresAt: { $lt: now }  // expiresAt < now
});

for (const voucher of expiredVouchers) {
  // 1. Đánh dấu không còn active
  await Voucher.findByIdAndUpdate(voucher._id, { 
    isActive: false 
  });

  // 2. Xóa khỏi tất cả user
  const result = await User.updateMany(
    { vouchers: voucher.code },
    { $pull: { vouchers: voucher.code } }
  );

  console.log(`Xóa voucher "${voucher.code}" khỏi ${result.modifiedCount} user`);
}
```

### **Database Changes:**
```javascript
// TRƯỚC khi hết hạn
Voucher: { code: 'SALE50', isActive: true, expiresAt: '2026-06-20' }
User: { vouchers: ['SALE50', 'FOOD30'] }

// SAU khi hết hạn
Voucher: { code: 'SALE50', isActive: false, expiresAt: '2026-06-20' }
User: { vouchers: ['FOOD30'] }  // Đã xóa SALE50
```

---

## ⏰ Cron Job Schedule

### **Cấu hình:**
```javascript
// server/index.js
import { startVoucherExpiryJob } from './services/voucherExpiry.js';

httpServer.listen(PORT, () => {
  // ...
  startVoucherExpiryJob(io);  // Khởi động job
});
```

### **Lịch chạy:**
```javascript
// 1. Chạy ngay khi server khởi động (delay 5s)
setTimeout(() => {
  notifyExpiringVouchers(io);
  removeExpiredVouchers();
}, 5000);

// 2. Chạy định kỳ mỗi 6 giờ
setInterval(() => {
  notifyExpiringVouchers(io);
  removeExpiredVouchers();
}, 6 * 60 * 60 * 1000);  // 6 giờ
```

### **Timeline:**
```
00:00 → Chạy job
06:00 → Chạy job
12:00 → Chạy job
18:00 → Chạy job
24:00 → Chạy job (ngày mới)
...
```

### **Log Output:**
```bash
🚀 [VoucherExpiry] Khởi động cron job kiểm tra voucher hết hạn
✅ [VoucherExpiry] Cron job đã được thiết lập (chạy mỗi 6 giờ)

⏰ [VoucherExpiry] Chạy job định kỳ...
⚠️  [VoucherExpiry] Phát hiện 3 voucher sắp hết hạn
   📢 Voucher "SALE50" còn 12h - Gửi thông báo cho 245 user
   📢 Voucher "FOOD30" còn 5h - Gửi thông báo cho 89 user
   📢 Voucher "FREESHIP" còn 2h - Gửi thông báo cho 567 user
✅ [VoucherExpiry] Hoàn thành gửi thông báo voucher sắp hết hạn

🗑️  [VoucherExpiry] Phát hiện 2 voucher đã hết hạn
   🗑️ Voucher "OLD20" - Xóa khỏi 123 user
   🗑️ Voucher "EXPIRED10" - Xóa khỏi 45 user
✅ [VoucherExpiry] Đã xóa 2 voucher khỏi 168 user
```

---

## 📁 Files Mới/Sửa

### **Mới tạo:**
- ✅ `server/services/voucherExpiry.js` - Service xử lý voucher hết hạn

### **Đã sửa:**
- ✅ `server/index.js` - Thêm import và khởi động job
- ✅ `src/pages/CheckoutPage.jsx` - Sửa lỗi NaN với discount

---

## 🧪 Testing

### **1. Test sửa lỗi NaN:**

**Steps:**
```bash
1. Vào trang checkout: http://localhost:5173/checkout
2. KHÔNG áp dụng voucher
3. Kiểm tra "Tổng cộng"
```

**Expected:**
- ✅ Hiển thị số tiền đúng (VD: `120.000đ`)
- ❌ KHÔNG hiển thị `NaN đ`

---

### **2. Test thông báo voucher sắp hết hạn:**

**Setup:**
```bash
# Tạo voucher hết hạn sau 12 giờ
POST http://localhost:5000/api/vouchers
{
  "code": "TEST12H",
  "description": "Test voucher sắp hết hạn",
  "type": "fixed",
  "value": 50000,
  "minOrder": 100000,
  "expiresAt": "2026-06-19T12:00:00.000Z",  // 12h từ bây giờ
  "isActive": true,
  "createdBy": "ADMIN_ID"
}

# Phát cho user
POST http://localhost:5000/api/vouchers/VOUCHER_ID/broadcast
{ "targetRole": "user" }
```

**Execute:**
```bash
# Option 1: Đợi job tự chạy (mỗi 6h)
# Option 2: Restart server (sẽ chạy ngay sau 5s)
# Option 3: Gọi trực tiếp
node -e "
  import('./server/services/voucherExpiry.js').then(m => {
    m.notifyExpiringVouchers(null);
  });
"
```

**Expected:**
- ✅ User nhận thông báo: "⏰ Voucher sắp hết hạn! Mã TEST12H chỉ còn 12 giờ..."
- ✅ Console log: `📢 Voucher "TEST12H" còn 12h - Gửi thông báo cho X user`

---

### **3. Test tự động xóa voucher hết hạn:**

**Setup:**
```bash
# Tạo voucher đã hết hạn (expiresAt trong quá khứ)
POST http://localhost:5000/api/vouchers
{
  "code": "EXPIRED",
  "type": "fixed",
  "value": 20000,
  "expiresAt": "2026-06-17T00:00:00.000Z",  // Ngày hôm qua
  "isActive": true
}

# Phát cho user
POST http://localhost:5000/api/vouchers/VOUCHER_ID/broadcast
{ "targetRole": "user" }
```

**Execute:**
```bash
# Restart server hoặc đợi job chạy
```

**Expected:**
- ✅ Voucher có `isActive = false`
- ✅ Voucher bị xóa khỏi `user.vouchers`
- ✅ Console log: `🗑️ Voucher "EXPIRED" - Xóa khỏi X user`

**Verify:**
```bash
# Kiểm tra database
GET http://localhost:5000/api/users/USER_ID
# Response: { vouchers: [] }  // Không còn "EXPIRED"

# Thử validate voucher
POST http://localhost:5000/api/vouchers/validate
{ "code": "EXPIRED", "userId": "USER_ID", "orderTotal": 150000 }
# Response: { "message": "Mã voucher đã hết hạn" }
```

---

## 📊 Monitoring

### **Kiểm tra server logs:**
```bash
# Xem log trong console server
✅ [VoucherExpiry] Không có voucher nào sắp hết hạn
✅ [VoucherExpiry] Không có voucher nào hết hạn
```

### **Kiểm tra database:**
```javascript
// MongoDB Shell hoặc Compass
db.vouchers.find({ 
  expiresAt: { $lt: new Date() } 
})
// Nên trả về 0 kết quả hoặc có isActive = false

db.notifications.find({ 
  type: 'voucher_expiring' 
}).sort({ createdAt: -1 })
// Xem thông báo gần nhất
```

---

## 🎯 Kết Quả

### **Trước khi sửa:**
- ❌ Tổng tiền hiển thị `NaN đ` khi không có voucher
- ❌ Voucher hết hạn vẫn nằm trong user
- ❌ Không có thông báo khi voucher sắp hết hạn

### **Sau khi sửa:**
- ✅ Tổng tiền luôn hiển thị đúng
- ✅ Voucher hết hạn tự động bị xóa khỏi user
- ✅ User nhận thông báo khi voucher còn < 24h
- ✅ Hệ thống chạy tự động mỗi 6 giờ

---

## 🔧 Tùy Chỉnh

### **Thay đổi thời gian thông báo (VD: 48h thay vì 24h):**
```javascript
// server/services/voucherExpiry.js
const tomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h
```

### **Thay đổi tần suất chạy job (VD: mỗi 1 giờ):**
```javascript
// server/services/voucherExpiry.js
setInterval(() => {
  // ...
}, 1 * 60 * 60 * 1000); // 1 giờ
```

### **Xóa hẳn voucher thay vì đánh dấu isActive = false:**
```javascript
// server/services/voucherExpiry.js
await Voucher.findByIdAndDelete(voucher._id);  // Xóa hẳn
```

---

## ✅ Hoàn Thành

Hệ thống voucher đã được hoàn thiện với:
- 🐛 Sửa lỗi NaN
- ⏰ Thông báo sắp hết hạn
- 🗑️ Tự động xóa hết hạn

**Chúc bạn thành công! 🎉**
