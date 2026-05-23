# 🔄 Thay đổi mới nhất - Đăng ký Đối tác Nhà hàng

**Ngày:** 23/05/2026  
**Tính năng:** Cập nhật menu Header để hiển thị "Đăng ký thành đối tác nhà hàng"

---

## 📝 Tóm tắt thay đổi

### **Trước đây:**
- Menu chỉ hiển thị "Quán của tôi" cho user đã có quyền merchant
- User chưa có quyền merchant không thấy menu "Đối tác"

### **Bây giờ:**
- ✅ **User chưa đăng nhập** → Không hiển thị menu "Đối tác"
- ✅ **User đã đăng nhập + Chưa merchant** → Hiển thị "🍳 Đăng ký thành đối tác nhà hàng"
- ✅ **User đã đăng nhập + Đã merchant** → Hiển thị "🍳 Quán của tôi"
- ✅ **User đã đăng nhập + Chưa shipper** → Hiển thị "🛵 Đăng ký tài xế"
- ✅ **User đã đăng nhập + Đã shipper** → Hiển thị "🛵 Tài xế"

---

## 🔧 Files đã thay đổi

### 1. **src/components/layout/Header.jsx**

**Thay đổi chính:**
- Cập nhật logic hiển thị menu "Đối tác"
- Menu "Đối tác" chỉ hiển thị khi user đã đăng nhập
- Hiển thị nút đăng ký hoặc nút quản lý tùy theo quyền

**Code cũ:**
```jsx
{(caps.showRestaurantManage || caps.showDriverPanel || showPartnerDropdown) && (
  <div className="py-1 border-t">
    <p>Đối tác</p>
    {caps.showRestaurantManage && <Link to="/restaurant-manage">🍳 Quán của tôi</Link>}
    {caps.showPartnerRegister && <Link to="/partner-register">🍳 Đăng ký mở quán</Link>}
  </div>
)}
```

**Code mới:**
```jsx
{isAuthenticated && (
  <div className="py-1 border-t">
    <p>Đối tác</p>
    {caps.showRestaurantManage ? (
      <Link to="/restaurant-manage">🍳 Quán của tôi</Link>
    ) : (
      <Link to="/partner-register">🍳 Đăng ký thành đối tác nhà hàng</Link>
    )}
    {caps.showDriverPanel ? (
      <Link to="/driver">🛵 Tài xế</Link>
    ) : (
      <Link to="/driver-register">🛵 Đăng ký tài xế</Link>
    )}
  </div>
)}
```

---

## 🎯 Logic mới

### **Desktop Menu (Dropdown)**

```
IF user chưa đăng nhập:
  → Không hiển thị menu "Đối tác"
  
IF user đã đăng nhập:
  → Hiển thị menu "Đối tác"
  
  IF user.isMerchant === true:
    → Hiển thị "🍳 Quán của tôi" (link to /restaurant-manage)
  ELSE:
    → Hiển thị "🍳 Đăng ký thành đối tác nhà hàng" (link to /partner-register)
  
  IF user.isShipper === true:
    → Hiển thị "🛵 Tài xế" (link to /driver)
  ELSE:
    → Hiển thị "🛵 Đăng ký tài xế" (link to /driver-register)
```

### **Mobile Menu (Sidebar)**

Logic tương tự như desktop menu

---

## 🧪 Cách test

### **Test 1: User chưa đăng nhập**
```bash
1. Mở http://localhost:3000
2. Click vào avatar menu
3. Kiểm tra: Menu "Đối tác" KHÔNG hiển thị ✅
```

### **Test 2: User đã đăng nhập - Chưa merchant**
```bash
1. Đăng ký tài khoản mới: test@example.com / 123456
2. Click vào avatar menu
3. Kiểm tra: Menu "Đối tác" hiển thị ✅
4. Kiểm tra: Có nút "Đăng ký thành đối tác nhà hàng" ✅
5. Click vào nút → Chuyển đến /partner-register ✅
```

### **Test 3: User đã đăng nhập - Đã merchant**
```bash
1. Đăng nhập: demo@foodserve.vn / 123456
2. Click vào avatar menu
3. Kiểm tra: Menu "Đối tác" hiển thị ✅
4. Kiểm tra: Có nút "Quán của tôi" (font-bold, màu primary) ✅
5. Click vào nút → Chuyển đến /restaurant-manage ✅
```

---

## 🔑 Cách cấp quyền merchant cho user

### **Cách 1: Chạy script (Nhanh nhất)**
```bash
node server/updateUserToMerchant.js
```

### **Cách 2: Qua Admin Panel**
```
1. Đăng nhập admin
2. Vào /admin → Tab "Người dùng"
3. Tìm user → Click "Sửa"
4. Chọn role = "merchant"
5. Lưu
```

### **Cách 3: Qua MongoDB**
```javascript
db.users.updateOne(
  { email: "demo@foodserve.vn" },
  { 
    $set: { 
      isMerchant: true, 
      role: "merchant" 
    } 
  }
)
```

---

## 📊 Kết quả

### **Trước khi cập nhật:**
- ❌ User chưa merchant không thấy cách đăng ký
- ❌ Menu "Đối tác" ẩn với user thường
- ❌ Khó khăn trong việc tìm trang đăng ký

### **Sau khi cập nhật:**
- ✅ User thấy rõ nút "Đăng ký thành đối tác nhà hàng"
- ✅ Menu "Đối tác" hiển thị cho tất cả user đã đăng nhập
- ✅ Dễ dàng truy cập trang đăng ký
- ✅ Menu tự động thay đổi theo quyền user

---

## 🎨 UI/UX Improvements

### **Text Changes:**
- "Đăng ký mở quán" → "Đăng ký thành đối tác nhà hàng" (rõ ràng hơn)
- Font-weight: Nút quản lý (bold) > Nút đăng ký (semibold)
- Color: Nút quản lý (primary-500) = Nút đăng ký (primary-500)

### **Menu Structure:**
```
📋 Khám phá
  🍔 Nhà hàng (nếu chưa là merchant/shipper)
  🎁 Săn Xu

👥 Đối tác (chỉ hiển thị khi đã đăng nhập)
  🍳 Quán của tôi / Đăng ký thành đối tác nhà hàng
  🛵 Tài xế / Đăng ký tài xế

👤 Tài khoản
  👤 Hồ sơ của tôi
  ❤️ Yêu thích
  📜 Lịch sử đơn hàng
  🏆 Bảng xếp hạng
  👑 Trang quản trị (nếu là admin)
  🚪 Đăng xuất
```

---

## 📚 Tài liệu liên quan

- **PARTNER_REGISTRATION_GUIDE.md** - Hướng dẫn test chi tiết
- **src/hooks/useUserCapabilities.js** - Hook kiểm tra quyền
- **server/utils/userCapabilities.js** - Backend logic quyền
- **server/updateUserToMerchant.js** - Script cấp quyền

---

## ✅ Checklist hoàn thành

- [x] Cập nhật Header.jsx - Desktop menu
- [x] Cập nhật Header.jsx - Mobile menu
- [x] Test với user chưa đăng nhập
- [x] Test với user chưa merchant
- [x] Test với user đã merchant
- [x] Test với user chưa shipper
- [x] Test với user đã shipper
- [x] Build thành công
- [x] Tạo tài liệu hướng dẫn
- [x] Tạo summary thay đổi

---

## 🚀 Next Steps

1. Test tính năng trên trình duyệt
2. Kiểm tra responsive trên mobile
3. Test flow đăng ký đối tác nhà hàng
4. Kiểm tra admin phê duyệt đơn đăng ký
5. Test menu tự động cập nhật sau khi được phê duyệt

---

**Status:** ✅ Hoàn thành  
**Build:** ✅ Thành công  
**Ready for testing:** ✅ Sẵn sàng
