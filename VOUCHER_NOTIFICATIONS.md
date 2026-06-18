# 🎫 THÔNG BÁO VOUCHER THÔNG MINH

**Ngày cập nhật**: 18/06/2026  
**Trạng thái**: ✅ Hoàn tất

---

## 🎯 TÍNH NĂNG

Hệ thống thông báo thông minh khi áp dụng voucher, bao gồm:

1. ✅ **Thông báo thành công** - Khi áp dụng voucher hợp lệ
2. ✅ **Thông báo thiếu tiền** - Khi đơn hàng chưa đủ giá trị tối thiểu
3. ✅ **Thông báo lỗi khác** - Hết hạn, hết lượt, không hợp lệ, v.v.
4. ✅ **Thông báo mất kết nối** - Khi không kết nối được server

---

## 📋 CÁC LOẠI THÔNG BÁO

### 1️⃣ **Thành công** ✅
```
🎉 Áp dụng "SALE10" thành công! Giảm 20.000đ
```
- **Màu nền**: Xanh lá (#10b981)
- **Icon**: 🎉
- **Thời gian hiển thị**: 3 giây
- **Khi nào**: Voucher hợp lệ và đơn hàng đủ điều kiện

### 2️⃣ **Thiếu tiền** 💰
```
💰 Bạn còn thiếu 50.000đ để sử dụng mã này (đơn tối thiểu 150.000đ)
```
- **Màu nền**: Đỏ (#ef4444)
- **Icon**: 💰
- **Thời gian hiển thị**: 5 giây
- **Khi nào**: Tổng đơn hàng < Giá trị tối thiểu của voucher
- **Chi tiết**:
  - Hiển thị số tiền còn thiếu
  - Hiển thị giá trị đơn tối thiểu

### 3️⃣ **Mã không hợp lệ** ❌
```
❌ Mã voucher không hợp lệ hoặc đã hết hạn
```
- **Màu nền**: Đỏ (#ef4444)
- **Icon**: ❌
- **Thời gian hiển thị**: 5 giây
- **Khi nào**: 
  - Mã không tồn tại
  - Mã đã hết hạn
  - Mã không dành cho user này

### 4️⃣ **Hết lượt sử dụng** ❌
```
❌ Mã voucher đã hết lượt sử dụng
```
- **Màu nền**: Đỏ (#ef4444)
- **Icon**: ❌
- **Thời gian hiển thị**: 5 giây
- **Khi nào**: Voucher đã đạt giới hạn sử dụng

### 5️⃣ **Không có quyền** ❌
```
❌ Mã voucher này không dành cho bạn
```
- **Màu nền**: Đỏ (#ef4444)
- **Icon**: ❌
- **Thời gian hiển thị**: 5 giây
- **Khi nào**: Voucher có targetUsers = 'specific' và user không có trong danh sách

### 6️⃣ **Lỗi kết nối** ⚠️
```
⚠️ Không thể kết nối đến server. Vui lòng thử lại!
```
- **Icon**: ⚠️
- **Thời gian hiển thị**: 4 giây
- **Khi nào**: Network error, server down

### 7️⃣ **Chưa nhập mã** ⚠️
```
⚠️ Vui lòng nhập mã voucher
```
- **Icon**: ⚠️
- **Thời gian hiển thị**: 3 giây
- **Khi nào**: User click "Áp dụng" mà input trống

---

## 🔧 IMPLEMENTATION

### **Backend API** (`server/routes/vouchers.js`)

```javascript
// Kiểm tra đơn tối thiểu
if (orderTotal !== undefined && voucherData.minOrder > 0 && orderTotal < voucherData.minOrder) {
  const shortage = voucherData.minOrder - orderTotal;
  return res.status(400).json({
    message: `Bạn còn thiếu ${new Intl.NumberFormat('vi-VN').format(shortage)}đ để sử dụng mã này (đơn tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucherData.minOrder)}đ)`,
    minOrder: voucherData.minOrder,
    currentTotal: orderTotal,
    shortage  // ✅ Trả về số tiền thiếu
  });
}
```

**Response JSON khi thiếu tiền:**
```json
{
  "message": "Bạn còn thiếu 50.000đ để sử dụng mã này (đơn tối thiểu 150.000đ)",
  "minOrder": 150000,
  "currentTotal": 100000,
  "shortage": 50000
}
```

### **Frontend** (`src/components/cart/CartSidebar.jsx`)

```javascript
if (res.ok && data.valid) {
  // ✅ Thành công
  toast.success(data.message || `Áp dụng mã ${c} thành công!`, { 
    icon: '🎉',
    duration: 3000,
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: 'bold'
    }
  })
} else {
  // ❌ Lỗi - Tự động phát hiện icon phù hợp
  const errorIcon = data.shortage ? '💰' : '❌'
  toast.error(data.message || 'Mã voucher không hợp lệ', { 
    icon: errorIcon,
    duration: 5000,
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: 'bold',
      maxWidth: '400px'
    }
  })
}
```

---

## 🧪 DEMO SCENARIOS

### **Scenario 1: Đơn hàng thiếu tiền**
```
Tình huống:
- Voucher: FOOD50 (giảm 50.000đ, đơn tối thiểu 150.000đ)
- Giỏ hàng: 100.000đ

Kết quả:
💰 Bạn còn thiếu 50.000đ để sử dụng mã này (đơn tối thiểu 150.000đ)
```

### **Scenario 2: Đơn hàng đủ điều kiện**
```
Tình huống:
- Voucher: FOOD50 (giảm 50.000đ, đơn tối thiểu 150.000đ)
- Giỏ hàng: 200.000đ

Kết quả:
🎉 Áp dụng "FOOD50" thành công! Giảm 50.000đ
```

### **Scenario 3: Mã không tồn tại**
```
Tình huống:
- User nhập: INVALID123

Kết quả:
❌ Mã voucher không hợp lệ hoặc đã hết hạn
```

### **Scenario 4: Mã đã hết hạn**
```
Tình huống:
- Voucher: EXPIRED2024 (expiresAt: 01/01/2025)
- Ngày hiện tại: 18/06/2026

Kết quả:
❌ Mã voucher đã hết hạn
```

### **Scenario 5: Không có quyền dùng**
```
Tình huống:
- Voucher: VIP100 (chỉ dành cho VIP members)
- User: Regular customer

Kết quả:
❌ Mã voucher này không dành cho bạn
```

---

## 🎨 UI/UX IMPROVEMENTS

### **Trước khi fix:**
```
❌ "Mã không hợp lệ"
   → User không biết lý do tại sao
```

### **Sau khi fix:**
```
✅ "Bạn còn thiếu 50.000đ để sử dụng mã này (đơn tối thiểu 150.000đ)"
   → User biết chính xác cần thêm bao nhiêu tiền
   → Khuyến khích user thêm món để đủ điều kiện
```

### **Benefits:**
1. **Thông tin rõ ràng** - User biết lý do không áp dụng được
2. **Hướng dẫn hành động** - Biết cần thêm bao nhiêu tiền
3. **Tăng conversion** - User có động lực thêm món để dùng voucher
4. **Giảm frustration** - Không bị confused về lỗi

---

## 📊 VOUCHER TYPES & EXAMPLES

### **1. Vouchers mặc định trong hệ thống:**
```javascript
'SALE10':   { type: 'percent', value: 10, minOrder: 0 }
'FOOD50':   { type: 'fixed', value: 50000, minOrder: 150000 }
'FREESHIP': { type: 'fixed', value: 25000, minOrder: 0 }
'NEW30':    { type: 'fixed', value: 30000, minOrder: 100000 }
'VIP100':   { type: 'fixed', value: 100000, minOrder: 300000 }
'SALE20':   { type: 'fixed', value: 20000, minOrder: 0 }
```

### **2. Vouchers từ Database:**
- Admin tạo qua Admin Panel
- Có thể giới hạn: usageLimit, expiresAt, targetUsers
- Tự động validate và cập nhật usedCount

### **3. Vouchers từ Minigames:**
- User nhận từ trò chơi (Lucky Wheel, Scratch Card)
- Lưu trong `user.vouchers` array
- Mặc định: 20.000đ, không giới hạn đơn tối thiểu

---

## 🔐 VALIDATION FLOW

```mermaid
User nhập mã voucher
    ↓
Kiểm tra rỗng?
    ↓ Có → ⚠️ "Vui lòng nhập mã voucher"
    ↓ Không
Gửi API validation
    ↓
Server kiểm tra:
    ├─ Có trong DB?
    ├─ Còn hạn?
    ├─ Còn lượt?
    ├─ User có quyền?
    └─ Đơn đủ tối thiểu?
        ↓ Không → 💰 "Còn thiếu X đ"
        ↓ Có
    🎉 Success → Apply voucher
```

---

## 📝 TESTING CHECKLIST

- [x] ✅ Áp dụng voucher hợp lệ → Hiển thị success
- [x] ✅ Đơn hàng < minOrder → Hiển thị số tiền thiếu
- [x] ✅ Mã không tồn tại → Hiển thị lỗi
- [x] ✅ Mã hết hạn → Hiển thị lỗi
- [x] ✅ Mã hết lượt → Hiển thị lỗi
- [x] ✅ User không có quyền → Hiển thị lỗi
- [x] ✅ Server down → Hiển thị lỗi kết nối
- [x] ✅ Input trống → Hiển thị warning
- [x] ✅ Loading state khi đang validate
- [x] ✅ Build production success

---

## 🎁 EXAMPLE VOUCHERS FOR TESTING

```
1. SALE10 - Giảm 10%, không tối thiểu
   ✅ Luôn dùng được

2. FOOD50 - Giảm 50.000đ, tối thiểu 150.000đ
   ✅ Dùng được nếu đơn ≥ 150k
   💰 Thiếu tiền nếu đơn < 150k

3. NEW30 - Giảm 30.000đ, tối thiểu 100.000đ
   ✅ Dùng được nếu đơn ≥ 100k
   💰 Thiếu tiền nếu đơn < 100k

4. VIP100 - Giảm 100.000đ, tối thiểu 300.000đ
   ✅ Dùng được nếu đơn ≥ 300k
   💰 Thiếu tiền nếu đơn < 300k

5. FREESHIP - Giảm 25.000đ phí ship, không tối thiểu
   ✅ Luôn dùng được
```

---

## 📚 FILES MODIFIED

1. ✅ `server/routes/vouchers.js` - Thêm logic tính shortage
2. ✅ `src/components/cart/CartSidebar.jsx` - Cải thiện toast notifications
3. ✅ Build production - Success (7.20s)

---

**Kết luận**: Hệ thống thông báo voucher đã được cải thiện đáng kể, giúp user có trải nghiệm tốt hơn và hiểu rõ lý do tại sao mã không áp dụng được! 🎉
