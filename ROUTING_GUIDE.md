# 🗺️ Hướng Dẫn Tính Năng Vẽ Đường Đi (Route Tracking)

## 📋 Tổng Quan

Tính năng vẽ đường đi giúp khách hàng theo dõi shipper đang giao hàng đến đâu thông qua:
- ✅ **Vẽ đường đi thực tế** từ nhà hàng → địa chỉ khách hàng
- ✅ **Hiển thị vị trí shipper** di chuyển trên đường (real-time)
- ✅ **Tính khoảng cách và thời gian** dự kiến chính xác theo đường đi
- ✅ **Tự động cập nhật** khi shipper thay đổi vị trí (mỗi 10 giây)

---

## 🛠️ Công Nghệ Sử Dụng

| Công nghệ | Mục đích |
|-----------|----------|
| **Leaflet** | Thư viện bản đồ chính (miễn phí) |
| **Leaflet Routing Machine** | Vẽ đường đi và tính toán route |
| **OpenStreetMap** | Cung cấp tile bản đồ miễn phí |
| **OSRM (Open Source Routing Machine)** | API tính đường đi (driving mode) |
| **Socket.io** | Cập nhật vị trí shipper real-time |
| **Geolocation API** | Lấy GPS shipper từ điện thoại |

---

## 🎯 Cách Hoạt Động

### 1️⃣ **Khi đơn hàng ở trạng thái `preparing` hoặc `ready`**
- Hiển thị 3 markers: 🏪 Nhà hàng, 🏠 Khách hàng, 🛵 Shipper
- **Vẽ đường đi**: Shipper → Nhà hàng → Khách hàng
- Shipper đang trên đường đi lấy hàng

### 2️⃣ **Khi đơn hàng ở trạng thái `delivering`**
- Shipper đã lấy hàng xong
- **Vẽ đường đi**: Shipper → Khách hàng (trực tiếp)
- Màu đường: Xanh lá (#10B981), độ dày 5px

### 3️⃣ **Cập nhật real-time**
```javascript
// Shipper cập nhật vị trí mỗi 10 giây (ActiveDelivery.jsx)
navigator.geolocation.getCurrentPosition((position) => {
  fetch(`/api/orders/${orderId}/update-location`, {
    method: 'PATCH',
    body: JSON.stringify({
      lat: position.coords.latitude,
      lng: position.coords.longitude
    })
  });
});

// Backend phát sự kiện Socket.io
io.to(`order-${orderId}`).emit('shipper-location-updated', {
  orderId,
  location: { lat, lng }
});

// Client nhận và cập nhật marker + route
socket.on('shipper-location-updated', (data) => {
  setShipperLocation(data.location);
});
```

---

## 📁 Files Đã Chỉnh Sửa

### `src/components/tracking/SimpleMapView.jsx`

**Thay đổi chính:**

1. **Import thêm Routing Machine:**
```jsx
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
```

2. **Thêm refs cho routing:**
```jsx
const routingControl = useRef(null);
const routeInfo = useRef({ distance: null, duration: null });
```

3. **Logic vẽ đường đi:**
```jsx
if (restaurantLocation && customerLocation && isDelivering) {
  let waypoints = [];
  
  if (isPickedUp && shipperLocation) {
    // Đã lấy hàng → shipper → khách hàng
    waypoints = [
      L.latLng(shipperLocation.lat, shipperLocation.lng),
      L.latLng(customerLocation.lat, customerLocation.lng)
    ];
  } else if (!isPickedUp && shipperLocation) {
    // Chưa lấy hàng → shipper → nhà hàng → khách hàng
    waypoints = [
      L.latLng(shipperLocation.lat, shipperLocation.lng),
      L.latLng(restaurantLocation.lat, restaurantLocation.lng),
      L.latLng(customerLocation.lat, customerLocation.lng)
    ];
  } else {
    // Không có vị trí shipper → nhà hàng → khách hàng
    waypoints = [
      L.latLng(restaurantLocation.lat, restaurantLocation.lng),
      L.latLng(customerLocation.lat, customerLocation.lng)
    ];
  }

  routingControl.current = L.Routing.control({
    waypoints,
    lineOptions: {
      styles: [{ color: '#10B981', opacity: 0.8, weight: 5 }]
    },
    createMarker: () => null, // Ẩn marker mặc định
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      profile: 'driving'
    })
  }).addTo(map);

  // Ẩn bảng hướng dẫn chi tiết
  setTimeout(() => {
    document.querySelector('.leaflet-routing-container').style.display = 'none';
  }, 100);
}
```

4. **Tính khoảng cách từ route:**
```jsx
routingControl.current.on('routesfound', (e) => {
  const summary = e.routes[0].summary;
  routeInfo.current = {
    distance: (summary.totalDistance / 1000).toFixed(1), // km
    duration: Math.ceil(summary.totalTime / 60) // phút
  };
});
```

5. **Cleanup khi unmount:**
```jsx
return () => {
  if (routingControl.current) {
    map.removeControl(routingControl.current);
    routingControl.current = null;
  }
  map.remove();
};
```

---

## 🎨 Giao Diện

### Màu sắc markers:
- 🏪 **Nhà hàng**: Đỏ (#EF4444)
- 🏠 **Khách hàng**: Xanh dương (#3B82F6)
- 🛵 **Shipper**: Xanh lá (#10B981)

### Thông tin hiển thị:
```
┌─────────────────────────────────┐
│  📍 Khoảng cách   ⏱️ Dự kiến    │
│     2.4 km          ~12 phút    │
└─────────────────────────────────┘
```

### Badge Live:
```
[●] Live
```
- Màu xanh lá, chấm tròn nhấp nháy
- Hiển thị khi `orderStatus` = `delivering` hoặc `ready`

---

## 🧪 Kiểm Tra Tính Năng

### 1. **Khởi động server**
```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend
npm run dev
```

### 2. **Tạo đơn hàng mẫu**
- Đăng nhập như khách hàng
- Đặt món ăn → Thanh toán
- Đơn hàng chuyển sang trạng thái `confirmed`

### 3. **Shipper nhận đơn**
- Đăng nhập như shipper
- Vào **Dashboard Shipper** → tab "Đơn hàng có sẵn"
- Nhận đơn → trạng thái chuyển `preparing`
- Vào tab "Đang giao hàng"

### 4. **Kiểm tra trên màn hình khách hàng**
- Vào **Đơn hàng của tôi** → Chọn đơn vừa tạo
- Hoặc truy cập: `http://localhost:5173/tracking`

**Bạn sẽ thấy:**
- ✅ 3 markers xuất hiện trên bản đồ
- ✅ **Đường màu xanh lá** vẽ từ shipper → nhà hàng → khách hàng
- ✅ Thông tin khoảng cách và thời gian dự kiến
- ✅ Badge "Live" màu xanh
- ✅ Marker shipper di chuyển mỗi 10 giây (nếu bạn bật GPS)

### 5. **Test cập nhật vị trí**
Nếu muốn giả lập GPS:
```javascript
// Trong ActiveDelivery.jsx hoặc console trình duyệt
fetch('http://localhost:5000/api/orders/<ORDER_ID>/update-location', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lat: 10.7756,  // Thay bằng tọa độ mới
    lng: 106.7019
  })
});
```

---

## 📊 So Sánh Trước & Sau

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| **Đường đi** | ❌ Không có | ✅ Vẽ đường thực tế |
| **Khoảng cách** | ✅ Đường thẳng (không chính xác) | ✅ Theo đường đi (chính xác) |
| **Thời gian** | ✅ Ước lượng (20km/h) | ✅ Tính từ OSRM routing |
| **Cập nhật** | ✅ Marker di chuyển | ✅ Marker + Route cập nhật |
| **Trải nghiệm** | Đơn giản | Chuyên nghiệp như Grab/Shopee |

---

## 🚀 Tối Ưu Hóa (Tùy chọn)

### 1. **Thêm animation cho shipper marker**
```jsx
// Tạo icon shipper có animation
const shipperIcon = L.divIcon({
  html: `
    <div class="shipper-marker">
      <div class="pulse"></div>
      <span>🛵</span>
    </div>
  `,
  className: ''
});

// CSS
<style>
.shipper-marker {
  position: relative;
  animation: bounce 2s infinite;
}
.shipper-marker .pulse {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.3);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
</style>
```

### 2. **Thêm âm thanh khi shipper gần đến**
```jsx
useEffect(() => {
  if (distInfo && distInfo.distance < 0.5) { // < 500m
    const audio = new Audio('/notification.mp3');
    audio.play();
    toast.success('Tài xế sắp đến nơi!', { icon: '🎉' });
  }
}, [distInfo]);
```

### 3. **Hiển thị tốc độ shipper**
```jsx
// Tính tốc độ từ 2 điểm GPS liên tiếp
const [prevLocation, setPrevLocation] = useState(null);
const [speed, setSpeed] = useState(0);

useEffect(() => {
  if (prevLocation && shipperLocation) {
    const distance = calculateDistance(prevLocation, shipperLocation);
    const timeElapsed = 10; // giây
    const speedKmH = (distance / timeElapsed) * 3600;
    setSpeed(speedKmH.toFixed(0));
  }
  setPrevLocation(shipperLocation);
}, [shipperLocation]);

// Hiển thị
<div>🚀 Tốc độ: {speed} km/h</div>
```

### 4. **Dự đoán thời gian đến nơi chính xác hơn**
```jsx
// Sử dụng Google Maps Distance Matrix API (có phí)
// hoặc OSRM Table Service (miễn phí)
fetch(`https://router.project-osrm.org/table/v1/driving/${shipperLng},${shipperLat};${customerLng},${customerLat}?annotations=duration`)
  .then(res => res.json())
  .then(data => {
    const etaSeconds = data.durations[0][1];
    setETA(Math.ceil(etaSeconds / 60)); // phút
  });
```

---

## ❓ Troubleshooting

### ⚠️ Đường đi không hiển thị
**Nguyên nhân:**
- OSRM API bị lỗi hoặc chậm
- Tọa độ không hợp lệ (null/undefined)
- Thứ tự waypoints sai

**Giải quyết:**
```jsx
// Thêm error handling
routingControl.current.on('routingerror', (e) => {
  console.error('Routing error:', e);
  toast.error('Không thể tính đường đi. Vui lòng thử lại.');
});

// Fallback: vẽ đường thẳng nếu OSRM fail
if (!routingControl.current) {
  const polyline = L.polyline([
    [restaurantLocation.lat, restaurantLocation.lng],
    [customerLocation.lat, customerLocation.lng]
  ], {
    color: '#10B981',
    weight: 5,
    dashArray: '10, 10'
  }).addTo(map);
}
```

### ⚠️ Marker shipper không di chuyển
**Kiểm tra:**
1. GPS có bật trên thiết bị shipper không?
2. Socket.io có kết nối không?
3. API `/update-location` có gửi thành công không?

**Debug:**
```jsx
// Trong OrderTrackingPage.jsx
socket.on('shipper-location-updated', (data) => {
  console.log('📍 Shipper location:', data);
  setShipperLocation(data.location);
});
```

### ⚠️ CSS routing bị vỡ
**Giải quyết:**
```jsx
// Đảm bảo import CSS
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Hoặc thêm vào index.html
<link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
```

---

## 📚 Tài Liệu Tham Khảo

- [Leaflet Routing Machine Docs](https://www.liedman.net/leaflet-routing-machine/)
- [OSRM API Documentation](http://project-osrm.org/docs/v5.24.0/api/)
- [Leaflet Official Docs](https://leafletjs.com/)
- [OpenStreetMap Usage Policy](https://operations.osmfoundation.org/policies/tiles/)

---

## ✨ Kết Quả

Giờ đây, khách hàng có thể:
- ✅ Xem shipper đang ở đâu trên đường
- ✅ Biết chính xác bao xa và bao lâu nữa đến
- ✅ Yên tâm hơn khi theo dõi đơn hàng
- ✅ Trải nghiệm giống như các app giao hàng lớn (Grab, ShopeeFood, etc.)

**Chúc bạn thành công! 🎉**
