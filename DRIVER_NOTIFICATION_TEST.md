# 🧪 Hướng dẫn Test: Tài xế cập nhật trạng thái & Khách hàng nhận thông báo

## 📋 Tổng quan

Tính năng này cho phép:
- ✅ **Tài xế** cập nhật trạng thái đơn hàng (preparing → delivering → completed)
- ✅ **Khách hàng** nhận thông báo real-time khi trạng thái thay đổi
- ✅ **Socket.io** gửi thông báo ngay lập tức không cần refresh

---

## 🎯 Chuẩn bị

### **1. Tạo 2 tài khoản**

**Tài khoản 1: Khách hàng**
- Email: `customer@test.com`
- Password: `123456`
- Role: `user`

**Tài khoản 2: Tài xế**
- Email: `demo@foodserve.vn`
- Password: `123456`
- Role: `merchant` (đã có quyền shipper)

### **2. Mở 2 trình duyệt/tab**

- **Tab 1 (Khách hàng)**: Đăng nhập với `customer@test.com`
- **Tab 2 (Tài xế)**: Đăng nhập với `demo@foodserve.vn`

---

## 🧪 Test Case 1: Khách hàng đặt hàng

### **Bước 1: Khách hàng đặt hàng (Tab 1)**

1. Đăng nhập với `customer@test.com`
2. Chọn một nhà hàng
3. Thêm món vào giỏ hàng
4. Vào trang Checkout
5. Điền thông tin giao hàng
6. Chọn phương thức thanh toán: **Tiền mặt**
7. Click **"Đặt hàng"**
8. Vào trang **"Theo dõi đơn hàng"** (`/tracking`)

**Kết quả mong đợi:**
- ✅ Đơn hàng được tạo với trạng thái `pending`
- ✅ Hiển thị thông tin đơn hàng
- ✅ Trạng thái: "Chờ xác nhận"

---

## 🧪 Test Case 2: Tài xế nhận đơn

### **Bước 2: Tài xế nhận đơn (Tab 2)**

1. Đăng nhập với `demo@foodserve.vn`
2. Click vào avatar menu → **"Tài xế"**
3. Vào trang `/driver`
4. Chuyển trạng thái sang **"Đang hoạt động"** (toggle button)
5. Tab **"Đơn có sẵn"** → Tìm đơn hàng vừa tạo
6. Click **"Nhận giao"**

**Kết quả mong đợi:**
- ✅ Đơn hàng chuyển sang tab **"Đơn đang giao"**
- ✅ Trạng thái đơn: `preparing` (Đang chuẩn bị)

### **Bước 3: Kiểm tra thông báo khách hàng (Tab 1)**

Quay lại **Tab 1 (Khách hàng)**:

1. Kiểm tra icon chuông 🔔 (góc phải trên)
2. Click vào icon chuông

**Kết quả mong đợi:**
- ✅ Có thông báo mới: **"👨‍🍳 Nhà hàng đang chuẩn bị món ăn"**
- ✅ Thông báo hiển thị ngay lập tức (không cần refresh)
- ✅ Trang tracking tự động cập nhật trạng thái

---

## 🧪 Test Case 3: Tài xế bắt đầu giao hàng

### **Bước 4: Tài xế cập nhật trạng thái "Đang giao" (Tab 2)**

Ở **Tab 2 (Tài xế)**:

1. Tab **"Đơn đang giao"**
2. Tìm đơn hàng đang chuẩn bị
3. Click **"Bắt đầu mô phỏng"** (GPS simulator)
4. Đợi progress bar chạy đến 100%
5. Click **"Lấy món & Giao"**

**Kết quả mong đợi:**
- ✅ Trạng thái đơn: `delivering` (Đang giao hàng)
- ✅ Bản đồ GPS hiển thị lộ trình từ nhà hàng → khách hàng

### **Bước 5: Kiểm tra thông báo khách hàng (Tab 1)**

Quay lại **Tab 1 (Khách hàng)**:

1. Kiểm tra icon chuông 🔔
2. Click vào icon chuông

**Kết quả mong đợi:**
- ✅ Có thông báo mới: **"🛵 Tài xế đang giao hàng đến bạn"**
- ✅ Thông báo hiển thị ngay lập tức
- ✅ Trang tracking hiển thị bản đồ GPS với vị trí tài xế

---

## 🧪 Test Case 4: Tài xế hoàn thành giao hàng

### **Bước 6: Tài xế hoàn thành đơn (Tab 2)**

Ở **Tab 2 (Tài xế)**:

1. Click **"Bắt đầu mô phỏng"** lần nữa
2. Đợi progress bar chạy đến 100%
3. Click **"Đã giao xong"**

**Kết quả mong đợi:**
- ✅ Trạng thái đơn: `completed` (Hoàn thành)
- ✅ Đơn hàng chuyển sang tab **"Lịch sử"**
- ✅ Xu được cộng vào ví tài xế (90% phí ship)

### **Bước 7: Kiểm tra thông báo khách hàng (Tab 1)**

Quay lại **Tab 1 (Khách hàng)**:

1. Kiểm tra icon chuông 🔔
2. Click vào icon chuông

**Kết quả mong đợi:**
- ✅ Có thông báo mới: **"🎉 Đơn hàng đã được giao thành công"**
- ✅ Thông báo hiển thị ngay lập tức
- ✅ Trang tracking hiển thị trạng thái "Hoàn thành"
- ✅ Hiển thị nút **"Đánh giá"**

---

## 📊 Bảng trạng thái và thông báo

| Trạng thái | Tên hiển thị | Thông báo cho khách hàng | Icon |
|------------|--------------|--------------------------|------|
| `pending` | Chờ xác nhận | (Không có) | ⏳ |
| `confirmed` | Đã xác nhận | ✅ Đơn hàng đã được xác nhận | ✅ |
| `preparing` | Đang chuẩn bị | 👨‍🍳 Nhà hàng đang chuẩn bị món ăn | 👨‍🍳 |
| `delivering` | Đang giao | 🛵 Tài xế đang giao hàng đến bạn | 🛵 |
| `completed` | Hoàn thành | 🎉 Đơn hàng đã được giao thành công | 🎉 |
| `cancelled` | Đã hủy | ❌ Đơn hàng đã bị hủy | ❌ |

---

## 🔧 Kiểm tra kỹ thuật

### **1. Kiểm tra Socket.io connection**

Mở Console (F12) trong **Tab 1 (Khách hàng)**, tìm log:

```
Socket.io connected
User [userId] joined their notification room
```

### **2. Kiểm tra Socket.io events**

Khi tài xế cập nhật trạng thái, Console sẽ hiển thị:

```
Socket event received: new-notification
Socket event received: order-status-updated
```

### **3. Kiểm tra API**

Mở Network tab (F12), tìm request:

```
PATCH /api/orders/:id/status
Response: 200 OK
```

### **4. Kiểm tra Database**

Chạy script kiểm tra:

```bash
node server/checkDB.js
```

Kiểm tra collection `notifications`:
- ✅ Có thông báo mới với `userId` của khách hàng
- ✅ `type: "order"`
- ✅ `relatedId` = orderId
- ✅ `read: false`

---

## 🐛 Troubleshooting

### **Vấn đề 1: Không nhận được thông báo**

**Nguyên nhân:**
- Socket.io chưa kết nối
- User chưa join notification room

**Giải pháp:**
1. Refresh trang (F5)
2. Đăng xuất và đăng nhập lại
3. Kiểm tra Console có lỗi Socket.io không

### **Vấn đề 2: Thông báo bị trùng**

**Nguyên nhân:**
- Socket.io kết nối nhiều lần
- Event listener bị duplicate

**Giải pháp:**
1. Đảm bảo chỉ có 1 tab đang mở
2. Refresh trang
3. Kiểm tra code có cleanup Socket.io không

### **Vấn đề 3: Trạng thái không cập nhật**

**Nguyên nhân:**
- API call thất bại
- Redux state chưa được cập nhật

**Giải pháp:**
1. Kiểm tra Network tab có lỗi API không
2. Kiểm tra Console có lỗi JavaScript không
3. Refresh trang để reload state

---

## ✅ Checklist Test

- [ ] Khách hàng đặt hàng thành công
- [ ] Tài xế nhận đơn thành công
- [ ] Khách hàng nhận thông báo "Đang chuẩn bị"
- [ ] Tài xế cập nhật trạng thái "Đang giao"
- [ ] Khách hàng nhận thông báo "Đang giao"
- [ ] Bản đồ GPS hiển thị vị trí tài xế
- [ ] Tài xế hoàn thành đơn
- [ ] Khách hàng nhận thông báo "Hoàn thành"
- [ ] Xu được cộng vào ví tài xế
- [ ] Thông báo hiển thị real-time (không cần refresh)
- [ ] Icon chuông hiển thị số lượng thông báo chưa đọc
- [ ] Click vào thông báo → Chuyển đến trang tracking

---

## 🎉 Kết quả mong đợi

Sau khi test xong, bạn sẽ thấy:

1. ✅ Tài xế có thể cập nhật trạng thái đơn hàng
2. ✅ Khách hàng nhận thông báo real-time qua Socket.io
3. ✅ Thông báo hiển thị ngay lập tức không cần refresh
4. ✅ Icon chuông hiển thị số lượng thông báo chưa đọc
5. ✅ Trang tracking tự động cập nhật trạng thái
6. ✅ Bản đồ GPS hiển thị vị trí tài xế real-time
7. ✅ Xu được cộng vào ví tài xế khi hoàn thành đơn

---

## 📚 Tài liệu liên quan

- **Socket.io Events**: `server/index.js` - Socket.io setup
- **Notification Model**: `server/models/Notification.js`
- **Order Routes**: `server/routes/orders.js`
- **NotificationBell Component**: `src/components/ui/NotificationBell.jsx`
- **OrderTrackingPage**: `src/pages/OrderTrackingPage.jsx`
- **ShipperDashboardPage**: `src/pages/ShipperDashboardPage.jsx`

---

**Status:** ✅ Hoàn thành  
**Ready for testing:** ✅ Sẵn sàng
