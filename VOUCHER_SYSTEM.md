# 🎫 Hệ thống Quản lý Voucher - FoodServe

## ✨ Tính năng đầy đủ

### 📊 **Dashboard & Thống kê**
- Tổng số voucher
- Voucher đang hoạt động
- Tổng lượt sử dụng
- Voucher đã hết hạn

### 🔍 **Tìm kiếm & Lọc**
- Tìm kiếm theo mã voucher hoặc mô tả
- Lọc theo trạng thái: Active / Inactive / Hết hạn
- Lọc theo loại: Tiền mặt / Phần trăm

### ➕ **Tạo & Quản lý Voucher**
- Tạo voucher mới với form đầy đủ
- Sửa thông tin voucher
- Xóa voucher
- Toggle Active/Inactive
- Preview real-time khi tạo

#### Các field hỗ trợ:
- **Mã voucher**: Tự động uppercase, unique
- **Mô tả**: Mô tả chi tiết
- **Loại giảm**: Tiền mặt (đ) / Phần trăm (%)
- **Giá trị**: Số tiền hoặc % giảm
- **Đơn tối thiểu**: Giá trị đơn hàng tối thiểu
- **Giảm tối đa**: Áp dụng cho voucher %
- **Giới hạn sử dụng**: Số lần dùng tối đa (0 = không giới hạn)
- **Ngày hết hạn**: Tự động vô hiệu hóa sau ngày này
- **Trạng thái**: Active/Inactive

### 📡 **Phát Voucher cho Nhóm**
Phát voucher cho các nhóm người dùng:
- 👥 **Tất cả khách hàng** (role: user)
- 🛵 **Tất cả tài xế** (role: shipper)
- 🏪 **Tất cả đối tác** (role: merchant)

#### Cách hoạt động:
1. Hover vào nút "Phát" trên mỗi voucher
2. Chọn nhóm mục tiêu
3. Xác nhận
4. Voucher tự động thêm vào `user.vouchers` của từng user

### 👁️ **Xem Chi tiết Voucher**
Modal chi tiết hiển thị:
- Thông tin voucher đầy đủ
- Điều kiện áp dụng
- Progress bar sử dụng
- Thống kê:
  - Lượt sử dụng
  - Số người dùng
  - Tỷ lệ sử dụng
- Ngày tạo
- Trạng thái hiện tại

### 📋 **Nhân bản Voucher**
- Click icon copy để sao chép voucher
- Tự động thêm "_COPY" vào mã
- Sửa thông tin và lưu làm voucher mới

### 📤 **Export CSV**
Xuất danh sách voucher ra file CSV với các cột:
- Mã
- Loại
- Giá trị
- Đơn tối thiểu
- Giới hạn
- Đã dùng
- Hết hạn
- Trạng thái

File: `vouchers_YYYY-MM-DD.csv`

---

## 🎨 **UI/UX Highlights**

### Stats Cards
4 cards thống kê nổi bật:
```
🎫 Tổng voucher       ✅ Đang hoạt động
📊 Tổng lượt dùng     ⚠️ Đã hết hạn
```

### Bảng Voucher
Hiển thị đầy đủ:
- Mã & mô tả
- Giảm giá (với badge màu)
- Điều kiện áp dụng
- Progress bar sử dụng
- Trạng thái với toggle button
- Actions: Chi tiết / Phát / Nhân bản / Sửa / Xóa

### Dropdown Phát Voucher
Hover vào nút "Phát" hiện dropdown:
```
👥 Tất cả khách hàng
🛵 Tất cả tài xế
🏪 Tất cả đối tác
```

### Form Tạo/Sửa
- Responsive 2-column layout
- Disabled mã khi sửa (tránh conflict)
- Preview real-time
- Validation rules
- Loading states

---

## 🔌 **API Endpoints**

### GET `/api/vouchers`
Lấy tất cả voucher

### POST `/api/vouchers`
Tạo voucher mới
```json
{
  "code": "SUMMER30",
  "description": "Giảm giá mùa hè",
  "type": "percent",
  "value": 30,
  "minOrder": 100000,
  "maxDiscount": 50000,
  "usageLimit": 100,
  "expiresAt": "2026-08-31",
  "isActive": true,
  "createdBy": "admin_id"
}
```

### PUT `/api/vouchers/:id`
Cập nhật voucher

### DELETE `/api/vouchers/:id`
Xóa voucher

### POST `/api/vouchers/:id/broadcast`
Phát voucher cho nhóm
```json
{
  "targetRole": "user" // user | shipper | merchant | all
}
```

**Response:**
```json
{
  "message": "Đã phát voucher 'SUMMER30' cho 150 khách hàng!",
  "count": 150
}
```

### POST `/api/vouchers/validate`
Validate voucher khi checkout
```json
{
  "code": "SUMMER30",
  "userId": "user_id",
  "orderTotal": 200000
}
```

**Response:**
```json
{
  "valid": true,
  "voucher": { ... },
  "discount": 50000,
  "message": "Áp dụng 'SUMMER30' thành công! Giảm 50.000đ"
}
```

### POST `/api/vouchers/use`
Đánh dấu đã dùng (sau khi đặt hàng thành công)
```json
{
  "code": "SUMMER30",
  "userId": "user_id"
}
```

---

## 📱 **User Experience**

### CartSidebar (User)
1. Nhập mã voucher thủ công
2. **HOẶC** click voucher có sẵn (từ kho `user.vouchers`)
3. API validate real-time
4. Hiển thị discount
5. Xóa voucher khỏi user sau khi dùng thành công

### Ví dụ:
```jsx
user.vouchers = ["SUMMER30", "FREESHIP", "NEW50"]

// Hiển thị 3 nút quick-apply:
[SUMMER30] [FREESHIP] [NEW50]

// Click 1 lần → validate & áp dụng
```

---

## 🔐 **Business Logic**

### Validate Rules:
1. Voucher phải tồn tại trong DB hoặc là hardcode voucher
2. `isActive = true`
3. Chưa hết hạn (`expiresAt > now`)
4. Chưa hết lượt dùng (`usedCount < usageLimit`)
5. Đơn hàng đạt `minOrder`
6. User có voucher (nếu `targetUsers = 'specific'`)

### Sau khi đặt hàng thành công:
1. `usedCount++`
2. `usedBy.push(userId)`
3. `user.vouchers.pull(code)` (xóa khỏi user)

---

## 🚀 **Tương thích ngược**

Hệ thống vẫn hỗ trợ các voucher hardcode cũ:
```javascript
const defaultVouchers = {
  'SALE10':  { type: 'percent', value: 10, minOrder: 0 },
  'FOOD50':  { type: 'fixed', value: 50000, minOrder: 150000 },
  'FREESHIP':{ type: 'fixed', value: 25000, minOrder: 0 },
  'NEW30':   { type: 'fixed', value: 30000, minOrder: 100000 },
  'VIP100':  { type: 'fixed', value: 100000, minOrder: 300000 },
  'SALE20':  { type: 'fixed', value: 20000, minOrder: 0 },
}
```

**Priority:** DB voucher → Default voucher → User's voucher (minigame)

---

## 📈 **Thống kê & Insights**

### Trong Detail Modal:
- **Lượt sử dụng**: Số lần voucher được dùng
- **Người dùng**: Số user unique đã dùng (`usedBy.length`)
- **Tỷ lệ dùng**: `(usedCount / usageLimit) * 100%`
- **Progress bar** trực quan

### Trong Bảng:
- Progress bar nhỏ hiển thị % sử dụng
- Badge trạng thái (Active/Inactive)
- Warning icon nếu hết hạn

---

## 🎯 **Use Cases**

### 1. Khuyến mãi mùa hè
```
Mã: SUMMER50
Loại: Phần trăm - 50%
Tối thiểu: 200.000đ
Tối đa: 100.000đ
Giới hạn: 500 lượt
Hết hạn: 31/08/2026
→ Phát cho: Tất cả khách hàng
```

### 2. Voucher tri ân tài xế
```
Mã: THANKYOU
Loại: Tiền mặt - 30.000đ
Tối thiểu: 0đ
Giới hạn: Không
Hết hạn: Không
→ Phát cho: Tất cả tài xế
```

### 3. Freeship cho đối tác mới
```
Mã: PARTNER_FREESHIP
Loại: Tiền mặt - 25.000đ
Tối thiểu: 50.000đ
Giới hạn: 1 lượt/user
Hết hạn: 31/12/2026
→ Phát cho: Tất cả đối tác
```

---

## 🔧 **Technical Notes**

### Frontend State Management:
- `vouchers`: Tất cả voucher từ API
- `filteredVouchers`: Sau filter & search
- `searchTerm`, `filterStatus`, `filterType`: Filter controls
- `isDetailOpen`: Modal chi tiết
- `broadcasting`: Loading state khi phát

### Performance:
- Debounce search (nếu cần)
- Lazy load modal content
- Optimistic UI updates
- Cache voucher list

### Security:
- Admin-only routes
- JWT authentication
- Input validation
- Rate limiting

---

## 📝 **Future Enhancements**

### Có thể thêm:
1. ⏱️ **Lên lịch phát voucher tự động** (cron jobs)
2. 🎯 **Targeting nâng cao** (theo địa lý, lịch sử mua hàng)
3. 📊 **Analytics dashboard** (conversion rate, ROI)
4. 🔔 **Cảnh báo voucher sắp hết hạn** (email/notification)
5. 📧 **Email marketing** khi phát voucher
6. 🎨 **Voucher templates** (preset configurations)
7. 📱 **QR code voucher** (scan to apply)
8. 🤖 **Auto-apply best voucher** (AI recommendation)

---

*Hệ thống quản lý voucher hoàn chỉnh cho FoodServe — Built with ❤️*
