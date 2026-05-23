# 📍 HƯỚNG DẪN TEST GPS TRACKING

## ✅ Đã hoàn thành

### Components đã tạo:
1. **MapView.jsx** - Bản đồ Google Maps với markers động
2. **SimpleMapView.jsx** - Fallback static map khi Google Maps không load
3. **useGoogleMaps.js** - Hook tự động load Google Maps API

### Tính năng:
- ✅ Hiển thị 3 markers: Nhà hàng (🏪), Địa chỉ giao (🏠), Shipper (🛵)
- ✅ Cập nhật vị trí shipper real-time mỗi 10 giây
- ✅ Tính khoảng cách và thời gian dự kiến (ETA)
- ✅ Auto-fit map để hiển thị tất cả markers
- ✅ Animation bounce cho shipper marker

---

## 🧪 CÁCH TEST

### Bước 1: Khởi động ứng dụng
```bash
npm run dev:all
```

### Bước 2: Tạo đơn hàng
1. Đăng nhập tài khoản khách hàng
2. Đặt món ăn từ nhà hàng
3. Checkout và thanh toán
4. Vào trang OrderTracking

### Bước 3: Shipper nhận đơn
1. Mở tab mới, đăng nhập tài khoản shipper
2. Vào `/shipper` → Tab "Đơn hàng có sẵn"
3. Click "Nhận đơn"
4. Chuyển sang tab "Đang giao"

### Bước 4: Cập nhật trạng thái
1. Click "Đã lấy hàng" (status → ready)
2. Click "Bắt đầu giao hàng" (status → delivering)
3. **Bản đồ sẽ xuất hiện ở trang OrderTracking của khách hàng**

### Bước 5: Xem vị trí real-time
1. Quay lại tab khách hàng (OrderTracking)
2. Bạn sẽ thấy bản đồ với 3 markers
3. Marker shipper (🛵 xanh lá) sẽ cập nhật vị trí mỗi 10 giây
4. Khoảng cách và ETA hiển thị ở dưới bản đồ

---

## 🔍 KIỂM TRA TÍNH NĂNG

### ✅ Checklist:
- [ ] Bản đồ hiển thị khi đơn hàng status = preparing/ready/delivering
- [ ] Marker nhà hàng (🏪 đỏ) hiển thị đúng vị trí
- [ ] Marker địa chỉ giao (🏠 xanh) hiển thị đúng vị trí
- [ ] Marker shipper (🛵 xanh lá) xuất hiện khi status = ready/delivering
- [ ] Shipper marker có animation bounce khi mới xuất hiện
- [ ] Vị trí shipper cập nhật real-time (check console log)
- [ ] Khoảng cách tính toán đúng (km)
- [ ] ETA (thời gian dự kiến) hiển thị (phút)
- [ ] Map auto-fit để hiển thị tất cả markers
- [ ] Legend hiển thị ý nghĩa các marker
- [ ] Fallback SimpleMapView hoạt động nếu Google Maps lỗi

---

## 🐛 DEBUG

### Nếu bản đồ không hiển thị:

#### 1. Kiểm tra Google Maps API Key
```javascript
// File: src/hooks/useGoogleMaps.js
// Đảm bảo API key hợp lệ
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';
```

#### 2. Kiểm tra console
```bash
# Mở DevTools (F12) → Console
# Xem có lỗi Google Maps không
```

#### 3. Kiểm tra Socket.io
```bash
# Console phải có log:
# "Shipper location update: { orderId: ..., location: { lat: ..., lng: ... } }"
```

#### 4. Kiểm tra order status
```javascript
// Bản đồ chỉ hiển thị khi:
order.status === 'preparing' || 
order.status === 'ready' || 
order.status === 'delivering'
```

#### 5. Kiểm tra vị trí shipper
```bash
# Backend phải có endpoint:
PATCH /api/orders/:id/update-location
Body: { lat: number, lng: number }

# ActiveDelivery component tự động gọi mỗi 10s
```

---

## 📝 CÁCH HOẠT ĐỘNG

### 1. Load Google Maps
- Hook `useGoogleMaps` tự động load script Google Maps API
- Thêm library `geometry` để tính khoảng cách

### 2. Hiển thị markers
- **Nhà hàng**: Lấy từ `order.restaurant.location`
- **Khách hàng**: Lấy từ `order.deliveryLocation`
- **Shipper**: Lấy từ state `shipperLocation` (cập nhật real-time)

### 3. Cập nhật vị trí shipper
```
Shipper (ActiveDelivery) 
  → Gọi navigator.geolocation.getCurrentPosition() mỗi 10s
  → PATCH /api/orders/:id/update-location
  → Backend emit Socket.io: 'shipper-location-updated'
  → OrderTrackingPage nhận event
  → Update state shipperLocation
  → MapView re-render với vị trí mới
```

### 4. Tính toán ETA
```javascript
// Sử dụng Google Maps Geometry Library
const distance = google.maps.geometry.spherical.computeDistanceBetween(
  shipperLatLng, 
  customerLatLng
);

// Giả sử tốc độ trung bình 20km/h
const eta = (distance / 1000) / 20 * 60; // phút
```

---

## 🎨 CUSTOMIZATION

### Thay đổi màu markers:
```javascript
// File: MapView.jsx
// Restaurant marker
fillColor: '#EF4444', // Đỏ

// Customer marker
fillColor: '#3B82F6', // Xanh dương

// Shipper marker
fillColor: '#10B981', // Xanh lá
```

### Thay đổi tốc độ cập nhật:
```javascript
// File: ActiveDelivery.jsx
// Hiện tại: 10 giây
const interval = setInterval(updateLocation, 10000);

// Thay đổi thành 5 giây:
const interval = setInterval(updateLocation, 5000);
```

### Thay đổi zoom level:
```javascript
// File: MapView.jsx
zoom: 14, // Mặc định

// Zoom gần hơn:
zoom: 16,

// Zoom xa hơn:
zoom: 12,
```

---

## 🚀 KẾT QUẢ MONG ĐỢI

Sau khi test thành công:
1. ✅ Bản đồ hiển thị mượt mà với 3 markers
2. ✅ Vị trí shipper cập nhật real-time không cần refresh
3. ✅ Khoảng cách và ETA tính toán chính xác
4. ✅ Map tự động zoom để hiển thị tất cả điểm
5. ✅ Animation đẹp mắt, UX tốt

---

## 📱 LƯU Ý

### Google Maps API Key:
- Key demo trong code có giới hạn requests
- Trong production, cần tạo key riêng tại: https://console.cloud.google.com/
- Enable APIs: Maps JavaScript API, Static Maps API, Geometry API

### Geolocation:
- Cần HTTPS hoặc localhost để sử dụng `navigator.geolocation`
- User phải cho phép truy cập vị trí
- Trên mobile, độ chính xác cao hơn desktop

### Performance:
- Cập nhật mỗi 10s là hợp lý (không quá tải server)
- Có thể tăng lên 30s nếu muốn tiết kiệm bandwidth
- Socket.io chỉ emit cho users trong room của đơn hàng

---

**🎉 Chúc bạn test thành công!**
