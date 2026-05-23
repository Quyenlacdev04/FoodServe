# 🍳 Hướng dẫn Test Tính năng Đăng ký Đối tác Nhà hàng

## 📋 Tổng quan

Tính năng này cho phép user thường đăng ký trở thành đối tác nhà hàng. Sau khi cập nhật:

- ✅ **User chưa có quyền merchant** → Hiển thị "Đăng ký thành đối tác nhà hàng"
- ✅ **User đã có quyền merchant** → Hiển thị "Quán của tôi"

---

## 🎯 Các trường hợp test

### **Test Case 1: User chưa đăng nhập**

**Kỳ vọng:**
- Menu "Đối tác" **KHÔNG hiển thị** trong dropdown menu
- Chỉ hiển thị các menu: Khám phá, Đăng nhập, Đăng ký

**Cách test:**
1. Mở trang chủ (http://localhost:3000)
2. Đảm bảo chưa đăng nhập
3. Click vào avatar menu (góc phải trên)
4. Kiểm tra menu dropdown

---

### **Test Case 2: User đã đăng nhập - Chưa có quyền merchant**

**Kỳ vọng:**
- Menu "Đối tác" **HIỂN THỊ**
- Trong menu "Đối tác" có:
  - 🍳 **Đăng ký thành đối tác nhà hàng** (màu primary)
  - 🛵 **Đăng ký tài xế** (màu thường)

**Cách test:**
1. Đăng ký tài khoản mới:
   - Email: `test@example.com`
   - Password: `123456`
   - Name: `Test User`
2. Đăng nhập với tài khoản vừa tạo
3. Click vào avatar menu
4. Kiểm tra menu "Đối tác"
5. Click vào "Đăng ký thành đối tác nhà hàng"
6. Điền form đăng ký và submit

---

### **Test Case 3: User đã có quyền merchant**

**Kỳ vọng:**
- Menu "Đối tác" **HIỂN THỊ**
- Trong menu "Đối tác" có:
  - 🍳 **Quán của tôi** (màu primary, font-bold)
  - 🛵 **Đăng ký tài xế** (nếu chưa là shipper)

**Cách test:**
1. Đăng nhập với tài khoản merchant:
   - Email: `demo@foodserve.vn`
   - Password: `123456`
2. Click vào avatar menu
3. Kiểm tra menu "Đối tác"
4. Click vào "Quán của tôi"
5. Kiểm tra trang quản lý nhà hàng hiển thị đúng

---

### **Test Case 4: User đã có quyền shipper**

**Kỳ vọng:**
- Menu "Đối tác" **HIỂN THỊ**
- Trong menu "Đối tác" có:
  - 🍳 **Đăng ký thành đối tác nhà hàng** (nếu chưa là merchant)
  - 🛵 **Tài xế** (màu primary, font-bold)

**Cách test:**
1. Tạo tài khoản shipper (hoặc dùng tài khoản có `isShipper: true`)
2. Đăng nhập
3. Click vào avatar menu
4. Kiểm tra menu "Đối tác"
5. Click vào "Tài xế"
6. Kiểm tra trang shipper dashboard hiển thị đúng

---

### **Test Case 5: User vừa là merchant vừa là shipper**

**Kỳ vọng:**
- Menu "Đối tác" **HIỂN THỊ**
- Trong menu "Đối tác" có:
  - 🍳 **Quán của tôi** (màu primary, font-bold)
  - 🛵 **Tài xế** (màu primary, font-bold)
- **KHÔNG hiển thị** các nút đăng ký

**Cách test:**
1. Cập nhật user có cả 2 quyền:
   ```javascript
   // Trong MongoDB hoặc qua Admin panel
   {
     isMerchant: true,
     isShipper: true,
     role: 'merchant' // hoặc 'shipper'
   }
   ```
2. Đăng nhập
3. Click vào avatar menu
4. Kiểm tra menu "Đối tác"

---

## 📱 Test trên Mobile

**Cách test:**
1. Mở DevTools (F12)
2. Chuyển sang chế độ mobile (Ctrl + Shift + M)
3. Click vào icon hamburger menu (☰)
4. Kiểm tra menu mobile sidebar
5. Các test case tương tự như desktop

---

## 🔧 Cách cấp quyền merchant cho user

### **Cách 1: Sử dụng script**

```bash
# Cập nhật user demo@foodserve.vn thành merchant
node server/updateUserToMerchant.js
```

### **Cách 2: Qua Admin Panel**

1. Đăng nhập với tài khoản admin
2. Vào trang Admin (http://localhost:3000/admin)
3. Tab "Người dùng"
4. Tìm user cần cấp quyền
5. Click "Sửa"
6. Chọn role = "merchant" hoặc check "isMerchant"
7. Lưu

### **Cách 3: Qua MongoDB Compass**

1. Mở MongoDB Compass
2. Connect tới database `foodserve`
3. Vào collection `users`
4. Tìm user cần cấp quyền
5. Cập nhật:
   ```json
   {
     "isMerchant": true,
     "role": "merchant"
   }
   ```
6. Lưu

### **Cách 4: User tự đăng ký qua form**

1. User đăng nhập
2. Click "Đăng ký thành đối tác nhà hàng"
3. Điền form đăng ký
4. Submit
5. Chờ Admin phê duyệt
6. Admin vào trang Admin → Tab "Đối tác" → Phê duyệt đơn

---

## ✅ Checklist Test

- [ ] User chưa đăng nhập → Không hiển thị menu "Đối tác"
- [ ] User đã đăng nhập, chưa merchant → Hiển thị "Đăng ký thành đối tác nhà hàng"
- [ ] User đã đăng nhập, đã merchant → Hiển thị "Quán của tôi"
- [ ] User đã đăng nhập, chưa shipper → Hiển thị "Đăng ký tài xế"
- [ ] User đã đăng nhập, đã shipper → Hiển thị "Tài xế"
- [ ] Click "Đăng ký thành đối tác nhà hàng" → Chuyển đến trang đăng ký
- [ ] Click "Quán của tôi" → Chuyển đến trang quản lý nhà hàng
- [ ] Click "Đăng ký tài xế" → Chuyển đến trang đăng ký tài xế
- [ ] Click "Tài xế" → Chuyển đến trang shipper dashboard
- [ ] Test trên mobile menu → Tất cả hoạt động tương tự
- [ ] Sau khi đăng ký merchant → Menu tự động cập nhật thành "Quán của tôi"

---

## 🐛 Các lỗi thường gặp

### **Lỗi 1: Menu không cập nhật sau khi cấp quyền**

**Nguyên nhân:** Redux state chưa được refresh

**Giải pháp:**
- Đăng xuất và đăng nhập lại
- Hoặc refresh trang (F5)

### **Lỗi 2: Click "Quán của tôi" bị chặn**

**Nguyên nhân:** User chưa có nhà hàng được liên kết

**Giải pháp:**
- Chạy script `updateUserToMerchant.js` để tạo nhà hàng
- Hoặc tạo nhà hàng thủ công trong MongoDB với `ownerId` = user._id

### **Lỗi 3: Menu "Đối tác" không hiển thị**

**Nguyên nhân:** User chưa đăng nhập

**Giải pháp:**
- Đăng nhập với tài khoản bất kỳ
- Menu "Đối tác" chỉ hiển thị khi user đã đăng nhập

---

## 📊 Kết quả mong đợi

Sau khi test xong, bạn sẽ thấy:

1. ✅ Menu hiển thị đúng theo quyền của user
2. ✅ User có thể đăng ký trở thành đối tác nhà hàng
3. ✅ User có thể truy cập trang quản lý nhà hàng sau khi được cấp quyền
4. ✅ Menu tự động cập nhật khi quyền thay đổi
5. ✅ Hoạt động tốt trên cả desktop và mobile

---

## 🎉 Hoàn thành!

Tính năng "Đăng ký thành đối tác nhà hàng" đã được triển khai thành công!

**Các file đã cập nhật:**
- `src/components/layout/Header.jsx` - Cập nhật logic hiển thị menu
- `src/hooks/useUserCapabilities.js` - Hook kiểm tra quyền user
- `server/updateUserToMerchant.js` - Script cấp quyền merchant

**Tính năng liên quan:**
- Đăng ký đối tác nhà hàng: `/partner-register`
- Quản lý nhà hàng: `/restaurant-manage`
- Đăng ký tài xế: `/driver-register`
- Shipper dashboard: `/driver`
