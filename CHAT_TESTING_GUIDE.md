# 💬 HƯỚNG DẪN TEST TÍNH NĂNG CHAT

## ✅ Đã hoàn thành

### Components đã tạo:
1. **ChatBox.jsx** - Chat box chính với Socket.io integration
2. **MessageList.jsx** - Hiển thị danh sách tin nhắn
3. **MessageInput.jsx** - Input để gửi tin nhắn
4. **ChatButton.jsx** - Nút floating chat với unread badge

### Tích hợp vào các trang:
1. **OrderTrackingPage** - Khách hàng chat khi theo dõi đơn hàng
2. **RestaurantManagePage** - Nhà hàng chat với khách từ tab "Đơn hàng gửi tới"
3. **ShipperDashboardPage** - Shipper chat khi đang giao hàng

---

## 🧪 CÁCH TEST

### Bước 1: Khởi động server
```bash
# Terminal 1: Khởi động backend + frontend
npm run dev:all
```

### Bước 2: Tạo đơn hàng test
1. Mở trình duyệt: `http://localhost:3000`
2. Đăng nhập tài khoản khách hàng (demo@foodserve.vn / 123456)
3. Chọn nhà hàng → Thêm món vào giỏ → Checkout
4. Chọn phương thức thanh toán → Đặt hàng
5. Lưu lại **Order ID** từ trang OrderTracking

### Bước 3: Test chat từ phía khách hàng
1. Ở trang OrderTracking, bạn sẽ thấy nút chat floating ở góc dưới bên phải
2. Click vào nút chat → Chat box sẽ mở ra
3. Gửi tin nhắn: "Xin chào, đơn hàng của tôi đến khi nào?"
4. Tin nhắn sẽ được gửi lên server

### Bước 4: Test chat từ phía nhà hàng
1. Mở tab mới hoặc cửa sổ ẩn danh
2. Đăng nhập tài khoản merchant
3. Vào `/restaurant-manage` → Tab "Đơn hàng gửi tới"
4. Tìm đơn hàng vừa tạo
5. Click nút "Chat với khách"
6. Gửi tin nhắn: "Đơn hàng đang được chuẩn bị, khoảng 15 phút nữa nhé!"
7. Quay lại tab khách hàng → Tin nhắn sẽ hiện real-time

### Bước 5: Test chat từ phía shipper
1. Mở tab mới
2. Đăng nhập tài khoản shipper
3. Vào `/shipper` → Tab "Đơn hàng có sẵn"
4. Nhận đơn hàng
5. Chuyển sang tab "Đang giao"
6. Nút chat sẽ xuất hiện tự động
7. Gửi tin nhắn: "Tôi đang trên đường giao hàng!"
8. Quay lại tab khách hàng → Tin nhắn hiện real-time

---

## 🔍 KIỂM TRA TÍNH NĂNG

### ✅ Checklist:
- [ ] Chat button hiển thị ở OrderTrackingPage
- [ ] Chat button hiển thị ở RestaurantManagePage (tab orders)
- [ ] Chat button hiển thị ở ShipperDashboardPage (tab active)
- [ ] Click chat button → Chat box mở ra
- [ ] Gửi tin nhắn từ khách hàng → Tin nhắn xuất hiện
- [ ] Gửi tin nhắn từ nhà hàng → Tin nhắn xuất hiện real-time ở khách
- [ ] Gửi tin nhắn từ shipper → Tin nhắn xuất hiện real-time ở khách
- [ ] Tin nhắn hiển thị đúng avatar/role (user/merchant/shipper)
- [ ] Unread badge hiển thị số tin nhắn chưa đọc
- [ ] Socket.io kết nối thành công (check console)
- [ ] Scroll tự động xuống tin nhắn mới nhất

---

## 🐛 DEBUG

### Nếu chat không hoạt động:

#### 1. Kiểm tra Socket.io server
```bash
# Mở console trình duyệt (F12)
# Xem có lỗi kết nối Socket.io không
```

#### 2. Kiểm tra backend
```bash
# Terminal backend phải có log:
# "Socket.io client connected"
# "User joined order room: <orderId>"
```

#### 3. Kiểm tra API
```bash
# Test API gửi tin nhắn
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "YOUR_ORDER_ID",
    "senderId": "USER_ID",
    "senderRole": "user",
    "message": "Test message",
    "type": "text"
  }'
```

#### 4. Kiểm tra orderId
- OrderTrackingPage: orderId lấy từ `order._id`
- RestaurantManagePage: orderId lấy từ `selectedOrderId` state
- ShipperDashboardPage: orderId lấy từ `activeOrderId` state

---

## 📝 GHI CHÚ

### Socket.io Events:
- **join-order**: Client join vào room của đơn hàng
- **new-message**: Server broadcast tin nhắn mới đến tất cả clients trong room

### API Endpoints:
- `GET /api/messages/order/:orderId` - Lấy tin nhắn của đơn hàng
- `POST /api/messages` - Gửi tin nhắn mới
- `GET /api/messages/unread/:userId` - Lấy số tin nhắn chưa đọc

### Roles:
- **user**: Khách hàng (màu xanh)
- **merchant**: Nhà hàng (màu cam)
- **shipper**: Shipper (màu tím)

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi test thành công, bạn sẽ thấy:
1. ✅ Khách hàng, nhà hàng, shipper đều có thể chat với nhau
2. ✅ Tin nhắn hiển thị real-time không cần refresh
3. ✅ Mỗi role có màu sắc riêng để phân biệt
4. ✅ Chat box có animation mượt mà
5. ✅ Unread badge cập nhật đúng

---

**🚀 Chúc bạn test thành công!**
