# Tính năng hiển thị khoảng cách cho Shipper

## 📍 Mô tả
Đã thêm tính năng hiển thị khoảng cách từ vị trí hiện tại của shipper đến:
- **🏪 Nhà hàng** (nơi lấy món)
- **📍 Địa chỉ giao hàng** (nơi giao cho khách)

## ✅ Các thay đổi đã thực hiện

### 1. Frontend - AvailableOrders Component
**File:** `src/components/shipper/AvailableOrders.jsx`

#### Thêm hàm tính khoảng cách:
- `calculateDistance(lat1, lng1, lat2, lng2)`: Sử dụng công thức Haversine để tính khoảng cách giữa 2 tọa độ
- `formatDistance(km)`: Format hiển thị khoảng cách (m hoặc km)

#### Cập nhật Props:
```javascript
AvailableOrders({ shipperId, onOrderAccepted, isOnline, shipperLocation })
```
- Thêm prop `shipperLocation` để nhận vị trí hiện tại của shipper

#### Hiển thị khoảng cách:
- **Popup đơn mới:** Hiển thị khoảng cách trong popup thông báo đơn hàng mới
- **Card đơn hàng:** Hiển thị khoảng cách trong mỗi card đơn hàng với:
  - Màu xanh dương cho "Đến quán"
  - Màu xanh lá cho "Giao hàng"
  - Background gradient từ xanh dương sang xanh lá

### 2. Frontend - ShipperDashboardPage
**File:** `src/pages/ShipperDashboardPage.jsx`

#### Truyền vị trí shipper:
```javascript
<AvailableOrders 
  shipperId={user?._id || user?.id} 
  onOrderAccepted={() => setActiveTab('active')} 
  isOnline={isOnline} 
  shipperLocation={position ? { lat: position[0], lng: position[1] } : null} 
/>
```

### 3. Backend - Orders Route
**File:** `server/routes/orders.js`

#### Cập nhật API `/shipper/available`:
- Tự động populate thông tin `restaurantLocation` và `customerLocation` cho mỗi đơn hàng
- Nếu chưa có tọa độ, tạo tọa độ giả định dựa trên TP.HCM (có thể thay bằng geocoding API thực tế)
- Đảm bảo mỗi đơn hàng trả về đều có:
  ```javascript
  {
    restaurantLocation: { lat, lng, address },
    customerLocation: { lat, lng, address }
  }
  ```

## 🎨 Giao diện

### Popup đơn mới:
```
┌─────────────────────────┐
│ 🛒 Đơn hàng mới!        │
├─────────────────────────┤
│ Mã đơn: #A1B2C3D4       │
│                         │
│ ┌───────────────────┐   │
│ │ 🏪 Đến quán       │   │
│ │      1.2km        │   │
│ │ 📍 Giao hàng      │   │
│ │      3.5km        │   │
│ └───────────────────┘   │
│                         │
│ 📍 123 Nguyễn Huệ...    │
│ Tổng đơn: 145.000đ      │
│ Bạn nhận: 🪙 +13.5 Xu   │
│                         │
│ [Bỏ qua]  [Nhận ngay!]  │
└─────────────────────────┘
```

### Card đơn hàng:
```
┌─────────────────────────┐
│ #A1B2C3D4    145.000đ   │
│ 14:30        🪙 +13.5 Xu│
│                         │
│ ┌───────────────────┐   │
│ │ 🏪 Đến quán  1.2km│   │
│ │ 📍 Giao hàng 3.5km│   │
│ └───────────────────┘   │
│                         │
│ 🍽️ 3 món               │
│ • 2x Phở bò            │
│ • 1x Cơm tấm           │
│                         │
│ 📍 123 Nguyễn Huệ, Q1  │
│ 📞 0987654321 💬 Có ghi │
│                         │
│ ⏳ 1:45 ▓▓▓▓▓▓░░░░     │
│                         │
│ [    Nhận đơn hàng    ] │
└─────────────────────────┘
```

## 📝 Lưu ý

### Tọa độ giả định (Development):
Hiện tại backend sử dụng tọa độ giả định cho demo:
- **Trung tâm TP.HCM:** `lat: 10.7756, lng: 106.7019`
- **Offset ngẫu nhiên:** ±0.05 độ (~5km)

### Để production, cần:
1. **Lưu tọa độ thực:** Khi tạo đơn hàng, sử dụng Geocoding API (Google Maps, OpenStreetMap) để chuyển địa chỉ thành tọa độ
2. **Lưu vào DB:** Cập nhật `customerLocation` và `restaurantLocation` khi tạo đơn
3. **Cập nhật Restaurant model:** Thêm fields `location: { lat, lng }` vào schema Restaurant

## 🚀 Cách test

1. Đăng nhập với tài khoản shipper
2. Bật **Online**
3. Đảm bảo trình duyệt cho phép truy cập vị trí (GPS)
4. Tạo đơn hàng mới từ tài khoản khác
5. Shipper sẽ nhận popup đơn mới với **khoảng cách** hiển thị
6. Xem danh sách đơn hàng có sẵn - mỗi card sẽ hiển thị khoảng cách

## 🔄 Cải tiến sau này

1. **Sắp xếp theo khoảng cách:** Ưu tiên hiển thị đơn gần nhất
2. **Lọc theo bán kính:** Chỉ hiện đơn trong vòng X km
3. **Hiển thị trên bản đồ:** Pin các đơn hàng trên map
4. **Tính thời gian di chuyển:** Thêm estimated time dựa trên traffic
5. **Route optimization:** Gợi ý route tối ưu khi nhận nhiều đơn

## ✨ Hoàn thành
- ✅ Tính khoảng cách từ shipper đến nhà hàng
- ✅ Tính khoảng cách từ shipper đến khách hàng
- ✅ Hiển thị trong popup đơn mới
- ✅ Hiển thị trong danh sách đơn hàng
- ✅ Format đẹp với màu sắc phân biệt
- ✅ Responsive và animations mượt mà
