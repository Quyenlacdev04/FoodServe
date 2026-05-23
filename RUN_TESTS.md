# 🧪 HƯỚNG DẪN CHẠY TEST

## ⚡ Test nhanh (5 phút)

### 1. Khởi động server
```bash
npm run dev:all
```

Đợi cho đến khi thấy:
```
✓ Frontend ready at http://localhost:3000
✓ Backend ready at http://localhost:5000
```

### 2. Mở trình duyệt
```
http://localhost:3000
```

### 3. Test flow cơ bản

#### A. Đăng nhập
```
Email: demo@foodserve.vn
Password: 123456
```

#### B. Test Tìm kiếm & Lọc
1. Scroll xuống "Nhà hàng nổi bật"
2. Gõ "pizza" vào thanh tìm kiếm
3. Click nút "Filter"
4. Chọn category "FastFood"
5. Chọn rating "4 sao"
6. Click "Áp dụng"
7. ✅ Kiểm tra: Danh sách nhà hàng được lọc

#### C. Test Yêu thích
1. Click icon ❤️ trên một nhà hàng
2. Click menu "❤️ Yêu thích" ở Header
3. ✅ Kiểm tra: Nhà hàng vừa thích xuất hiện

#### D. Test Đặt hàng
1. Click vào một nhà hàng
2. Thêm món vào giỏ
3. Click "Thanh toán"
4. Chọn phương thức "Tiền mặt"
5. Click "Đặt hàng"
6. ✅ Kiểm tra: Chuyển đến OrderTracking

---

## 🔥 Test đầy đủ (15 phút)

### Test 1: Thanh toán VNPay
```bash
1. Đặt hàng như trên
2. Chọn "VNPay" thay vì "Tiền mặt"
3. Click "Đặt hàng"
4. ✅ Kiểm tra: Redirect đến trang VNPay demo
5. Click "Quay lại" để test callback
```

### Test 2: Thanh toán bằng Xu
```bash
1. Đặt hàng
2. Chọn "Xu (Coins)"
3. ✅ Kiểm tra: Hiển thị số Xu hiện có
4. Click "Đặt hàng"
5. ✅ Kiểm tra: Số Xu giảm đi
```

### Test 3: Shipper Dashboard
```bash
# Mở tab mới hoặc cửa sổ ẩn danh
1. Đăng nhập: shipper@foodserve.vn / 123456
2. Vào /shipper
3. Tab "Đơn hàng có sẵn"
4. ✅ Kiểm tra: Hiển thị đơn vừa đặt
5. Click "Nhận đơn"
6. Tab "Đang giao"
7. ✅ Kiểm tra: Đơn xuất hiện
8. Click "Đã lấy hàng"
9. Click "Bắt đầu giao hàng"
10. ✅ Kiểm tra: Status cập nhật
```

### Test 4: GPS Tracking
```bash
# Quay lại tab khách hàng (OrderTracking)
1. ✅ Kiểm tra: Bản đồ xuất hiện
2. ✅ Kiểm tra: 3 markers hiển thị (🏪 🏠 🛵)
3. ✅ Kiểm tra: Marker shipper có animation
4. Đợi 10 giây
5. ✅ Kiểm tra: Vị trí shipper cập nhật (check console log)
6. ✅ Kiểm tra: Khoảng cách và ETA hiển thị
```

### Test 5: Chat Real-time
```bash
# Tab khách hàng (OrderTracking)
1. Click nút chat floating (góc dưới phải)
2. ✅ Kiểm tra: Chat box mở ra
3. Gửi tin nhắn: "Xin chào!"
4. ✅ Kiểm tra: Tin nhắn xuất hiện

# Tab shipper
5. Click nút chat
6. ✅ Kiểm tra: Tin nhắn từ khách hiển thị
7. Gửi tin nhắn: "Tôi đang trên đường!"
8. ✅ Kiểm tra: Tin nhắn gửi thành công

# Quay lại tab khách hàng
9. ✅ Kiểm tra: Tin nhắn từ shipper hiển thị real-time
10. ✅ Kiểm tra: Badge unread count cập nhật
```

### Test 6: Nhà hàng quản lý đơn
```bash
# Mở tab mới
1. Đăng nhập: merchant@foodserve.vn / 123456
2. Vào /restaurant-manage
3. Tab "Đơn hàng gửi tới"
4. ✅ Kiểm tra: Đơn vừa đặt hiển thị
5. Chọn status "Đang làm món"
6. ✅ Kiểm tra: Status cập nhật
7. Click "Chat với khách"
8. ✅ Kiểm tra: Chat box mở
9. Gửi tin nhắn: "Đơn hàng đang được chuẩn bị!"
10. ✅ Kiểm tra: Tin nhắn gửi thành công
```

---

## 🔍 Debug Commands

### Kiểm tra console logs
```javascript
// Mở DevTools (F12) → Console

// Socket.io connection
"Socket.io client connected"

// Shipper location update
"Shipper location update: { orderId: ..., location: { lat: ..., lng: ... } }"

// Order status update
"Real-time update: { status: ... }"

// New message
"New message received"
```

### Kiểm tra Network
```bash
# DevTools → Network tab

# Kiểm tra API calls
GET /api/restaurants
GET /api/orders/:id
POST /api/messages
PATCH /api/orders/:id/update-location

# Kiểm tra WebSocket
WS ws://localhost:5000/socket.io/
```

### Kiểm tra Redux State
```javascript
// DevTools → Redux tab (nếu có extension)

// Kiểm tra auth state
auth.user
auth.isAuthenticated

// Kiểm tra cart state
cart.items
cart.totalAmount
```

---

## 🐛 Common Issues

### Issue 1: Bản đồ không hiển thị
**Nguyên nhân**: Google Maps API key không hợp lệ  
**Giải pháp**: 
```javascript
// File: src/hooks/useGoogleMaps.js
// Thay API key bằng key của bạn
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';
```

### Issue 2: Socket.io không kết nối
**Nguyên nhân**: Backend chưa chạy  
**Giải pháp**: 
```bash
# Kiểm tra backend đang chạy
curl http://localhost:5000/api/restaurants
```

### Issue 3: Chat không real-time
**Nguyên nhân**: Chưa join room  
**Giải pháp**: 
```javascript
// Check console log
"join-order" event should be emitted
```

### Issue 4: Vị trí shipper không cập nhật
**Nguyên nhân**: Geolocation bị từ chối  
**Giải pháp**: 
```bash
# Cho phép truy cập vị trí trong browser
Settings → Privacy → Location → Allow
```

---

## ✅ Test Checklist

### Tính năng cơ bản
- [ ] Đăng nhập thành công
- [ ] Tìm kiếm nhà hàng
- [ ] Lọc theo category
- [ ] Thêm yêu thích
- [ ] Đặt hàng

### Tính năng nâng cao
- [ ] Thanh toán VNPay
- [ ] Thanh toán bằng Xu
- [ ] Shipper nhận đơn
- [ ] GPS tracking
- [ ] Chat real-time

### Edge cases
- [ ] Không đủ Xu
- [ ] Đơn hàng không tồn tại
- [ ] Socket.io disconnect
- [ ] Google Maps không load

---

## 📊 Expected Results

### Performance
- ✅ First load < 3s
- ✅ API response < 500ms
- ✅ Socket.io latency < 100ms
- ✅ Map render < 2s

### Functionality
- ✅ 100% features working
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Dark mode support

---

## 🎉 Success Criteria

Tất cả tests PASS = **READY FOR PRODUCTION** 🚀

---

**Happy Testing! 🧪**
