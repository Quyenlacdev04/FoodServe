# 🧪 Kiểm Tra Tính Năng Vẽ Đường Đi

## 🚀 Khởi động hệ thống

```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend  
npm run dev
```

## 📋 Các Bước Test

### 1️⃣ **Tạo đơn hàng**

**Option A: Sử dụng UI (Khách hàng)**
1. Truy cập: `http://localhost:5173`
2. Đăng nhập/Đăng ký tài khoản
3. Chọn nhà hàng → Thêm món vào giỏ
4. Đặt hàng và thanh toán
5. Lưu lại **Order ID** (hiện trong popup hoặc trang đơn hàng)

**Option B: API trực tiếp**
```bash
# POST http://localhost:5000/api/orders
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "restaurantId": "YOUR_RESTAURANT_ID",
    "items": [
      {
        "menuItemId": "MENU_ITEM_ID",
        "name": "Phở bò",
        "price": 50000,
        "quantity": 1
      }
    ],
    "totalAmount": 50000,
    "deliveryFee": 15000,
    "finalAmount": 65000,
    "deliveryAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "contactPhone": "0123456789",
    "deliveryLocation": {
      "lat": 10.773996,
      "lng": 106.700981
    }
  }'
```

### 2️⃣ **Shipper nhận đơn**

**Option A: Sử dụng UI (Shipper)**
1. Đăng nhập tài khoản shipper
2. Vào **Dashboard Shipper** → Tab "Đơn hàng có sẵn"
3. Chọn đơn hàng vừa tạo → Nhấn **"Nhận đơn"**
4. Đơn sẽ chuyển sang tab "Đang giao hàng"

**Option B: API trực tiếp**
```bash
# PATCH http://localhost:5000/api/orders/:id/accept
curl -X PATCH http://localhost:5000/api/orders/YOUR_ORDER_ID/accept \
  -H "Content-Type: application/json" \
  -d '{
    "shipperId": "YOUR_SHIPPER_ID"
  }'
```

### 3️⃣ **Xem bản đồ vẽ đường (Khách hàng)**

Truy cập: `http://localhost:5173/tracking`

**Bạn sẽ thấy:**
- ✅ Bản đồ với 3 markers: 🏪 Nhà hàng, 🏠 Địa chỉ giao, 🛵 Shipper
- ✅ **Đường màu xanh lá** vẽ từ shipper → nhà hàng → khách hàng
- ✅ Thông tin khoảng cách và ETA (dự kiến)
- ✅ Badge "Live" màu xanh ở góc dưới phải

### 4️⃣ **Giả lập shipper di chuyển**

**Cách 1: Thủ công qua API**
```bash
# Cập nhật vị trí shipper (gọi mỗi 10 giây)
curl -X PATCH http://localhost:5000/api/orders/YOUR_ORDER_ID/update-location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 10.7756,
    "lng": 106.7019
  }'

# Thay đổi lat/lng để mô phỏng di chuyển
# Ví dụ:
# Lần 1: lat=10.7756, lng=106.7019
# Lần 2: lat=10.7766, lng=106.7029
# Lần 3: lat=10.7776, lng=106.7039
```

**Cách 2: Script tự động**
```javascript
// Chạy trong Console trình duyệt (trang shipper)
let lat = 10.7756;
let lng = 106.7019;

const interval = setInterval(() => {
  lat += 0.001;  // Di chuyển ~100m mỗi lần
  lng += 0.001;
  
  fetch('http://localhost:5000/api/orders/YOUR_ORDER_ID/update-location', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  })
  .then(res => res.json())
  .then(data => console.log('✅ Updated:', data))
  .catch(err => console.error('❌ Error:', err));
}, 10000); // Mỗi 10 giây

// Dừng: clearInterval(interval)
```

**Cách 3: Bật GPS thực (nếu test trên điện thoại)**
- Mở trình duyệt di động
- Truy cập dashboard shipper
- Nhận đơn → Component `ActiveDelivery` sẽ tự động gửi GPS mỗi 10s

### 5️⃣ **Kiểm tra real-time update**

**Mở 2 tab trình duyệt:**

**Tab 1 (Khách hàng):** `http://localhost:5173/tracking`
- Quan sát bản đồ

**Tab 2 (Shipper):** Dashboard hoặc Console
- Chạy script cập nhật vị trí (xem bước 4)

**Kết quả mong đợi:**
- Marker 🛵 di chuyển trên Tab 1 (khách hàng)
- Đường vẽ cập nhật theo vị trí mới
- Khoảng cách và ETA thay đổi

---

## 🔍 Kiểm Tra Chi Tiết

### ✅ **Test Case 1: Đơn hàng status = `preparing`**
**Mong đợi:**
- Vẽ đường: Shipper → Nhà hàng → Khách hàng (3 điểm)
- Shipper đang đi lấy hàng

**Cách test:**
```bash
# Shipper vừa nhận đơn (status tự động = preparing)
curl -X PATCH http://localhost:5000/api/orders/YOUR_ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "preparing" }'
```

### ✅ **Test Case 2: Đơn hàng status = `ready`**
**Mong đợi:**
- Vẽ đường: Shipper → Nhà hàng → Khách hàng
- Đồ ăn đã sẵn sàng, shipper đang đến lấy

**Cách test:**
```bash
curl -X PATCH http://localhost:5000/api/orders/YOUR_ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "ready" }'
```

### ✅ **Test Case 3: Đơn hàng status = `delivering`**
**Mong đợi:**
- Vẽ đường: Shipper → Khách hàng (2 điểm - trực tiếp)
- Shipper đã lấy hàng, đang giao

**Cách test:**
```bash
curl -X PATCH http://localhost:5000/api/orders/YOUR_ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "delivering" }'
```

### ✅ **Test Case 4: Shipper di chuyển liên tục**
**Mong đợi:**
- Marker shipper di chuyển mượt mà
- Đường vẽ cập nhật theo
- Khoảng cách giảm dần

**Cách test:**
```javascript
// Script mô phỏng di chuyển từ A → B
const startLat = 10.7756;
const startLng = 106.7019;
const endLat = 10.7840;
const endLng = 106.7100;
const steps = 20;

let currentStep = 0;
const interval = setInterval(() => {
  const lat = startLat + (endLat - startLat) * (currentStep / steps);
  const lng = startLng + (endLng - startLng) * (currentStep / steps);
  
  fetch(`http://localhost:5000/api/orders/YOUR_ORDER_ID/update-location`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  });
  
  currentStep++;
  if (currentStep > steps) clearInterval(interval);
}, 5000); // Mỗi 5 giây
```

### ✅ **Test Case 5: Không có vị trí shipper**
**Mong đợi:**
- Vẽ đường: Nhà hàng → Khách hàng
- Không hiển thị marker shipper

**Cách test:**
```bash
# Xóa shipperLocation
curl -X PATCH http://localhost:5000/api/orders/YOUR_ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{ "$unset": { "shipperLocation": "" } }'
```

---

## 🐛 Debug

### 🔧 **Kiểm tra Socket.io**
```javascript
// Console trình duyệt (trang khách hàng)
const socket = io('http://localhost:5000');
socket.emit('join-order', 'YOUR_ORDER_ID');

socket.on('shipper-location-updated', (data) => {
  console.log('📍 Received location:', data);
});

// Test phát sự kiện
socket.emit('update-shipper-location', {
  orderId: 'YOUR_ORDER_ID',
  location: { lat: 10.7756, lng: 106.7019 }
});
```

### 🔧 **Kiểm tra OSRM API**
```bash
# Test API routing trực tiếp
curl "https://router.project-osrm.org/route/v1/driving/106.7019,10.7756;106.7100,10.7840?overview=full&geometries=geojson"

# Kết quả mong đợi: JSON với routes[0].geometry (đường đi)
```

### 🔧 **Kiểm tra Component render**
```javascript
// Thêm vào SimpleMapView.jsx
useEffect(() => {
  console.log('🗺️ Map data:', {
    restaurantLocation,
    customerLocation,
    shipperLocation,
    orderStatus
  });
}, [restaurantLocation, customerLocation, shipperLocation, orderStatus]);
```

### 🔧 **Kiểm tra Routing Control**
```javascript
// Thêm vào useEffect vẽ đường
if (routingControl.current) {
  routingControl.current.on('routesfound', (e) => {
    console.log('✅ Route found:', e.routes[0]);
  });
  
  routingControl.current.on('routingerror', (e) => {
    console.error('❌ Routing error:', e);
  });
}
```

---

## 📊 Kết Quả Mong Đợi

| Thời điểm | Marker 🏪 | Marker 🏠 | Marker 🛵 | Đường vẽ |
|-----------|-----------|-----------|-----------|----------|
| Shipper nhận đơn | ✅ | ✅ | ✅ | Shipper → Nhà hàng → Khách |
| Shipper lấy hàng xong | ✅ | ✅ | ✅ | Shipper → Khách |
| Shipper di chuyển | ✅ | ✅ | ✅ (di chuyển) | Cập nhật real-time |
| Đơn hoàn thành | ✅ | ✅ | ❌ | Không vẽ |

---

## ✅ Checklist Hoàn Thành

- [ ] Đơn hàng tạo thành công
- [ ] Shipper nhận đơn thành công
- [ ] Bản đồ hiển thị 3 markers
- [ ] Đường màu xanh lá được vẽ
- [ ] Thông tin khoảng cách/ETA hiển thị
- [ ] Badge "Live" xuất hiện
- [ ] Marker shipper di chuyển khi cập nhật vị trí
- [ ] Đường vẽ tự động cập nhật
- [ ] Socket.io hoạt động (real-time)
- [ ] Console không có lỗi

---

## 🎉 Hoàn thành!

Nếu tất cả checklist trên đều ✅, chúc mừng bạn đã tích hợp thành công tính năng vẽ đường đi!

**Lưu ý:**
- Đường vẽ sử dụng OSRM API miễn phí → có thể chậm nếu traffic cao
- GPS chỉ hoạt động trên HTTPS hoặc localhost
- Nếu test trên production, cần domain HTTPS

**Next steps:**
- Thêm animation cho marker shipper
- Hiển thị tốc độ di chuyển
- Thông báo khi shipper gần đến (< 500m)
- Tích hợp Google Maps Direction API (chính xác hơn, có phí)
