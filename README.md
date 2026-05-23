# 🍽️ FoodServe - Ứng dụng đặt đồ ăn online

Nền tảng đặt đồ ăn online hiện đại, giao diện đẹp như ShopeeFood với đầy đủ tính năng.

## 🚀 Công nghệ

- **Frontend:** React 18 + Vite + TailwindCSS + Framer Motion + Redux Toolkit
- **Backend:** Node.js + Express.js + Socket.io + MongoDB
- **Auth:** JWT Authentication
- **Payment:** VNPay Integration
- **Real-time:** Socket.io (Chat, Notifications, Tracking)

## 📦 Cài đặt

```bash
# Cài dependencies frontend
npm install

# Cài dependencies backend
cd server && npm install && cd ..
```

## ▶️ Chạy dự án

```bash
# Chạy cả frontend + backend cùng lúc
npm run dev:all

# Hoặc chạy riêng:
npm run dev        # Frontend (port 3000)
npm run server     # Backend (port 5000)
```

## 🔑 Tài khoản demo

| Email | Password | Role |
|-------|----------|------|
| demo@foodserve.vn | 123456 | User |
| admin@foodserve.vn | admin123 | Admin |

## 🎫 Mã giảm giá demo

| Mã | Giảm |
|----|------|
| FOOD50 | 50.000₫ |
| FREESHIP | 25.000₫ |
| NEW30 | 30.000₫ |
| SALE20 | 20.000₫ |

## 📂 Cấu trúc

```
FoodServe/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── cart/
│   │   ├── home/
│   │   ├── layout/
│   │   └── ui/
│   ├── data/
│   ├── pages/
│   ├── store/slices/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── routes/
│   └── index.js
└── README.md
```

## ✨ Tính năng

### 🎨 **Giao diện & UX**
- ✅ UI glassmorphism + dark mode
- ✅ Responsive PC + Mobile
- ✅ Loading animation đẹp
- ✅ Slide animation cho giỏ hàng

### 👤 **Người dùng**
- ✅ Đăng nhập / Đăng ký
- ✅ Trang cá nhân
- ✅ Lịch sử đơn hàng
- ✅ Theo dõi đơn hàng real-time
- ✅ Yêu thích nhà hàng ❤️
- ✅ Chat với nhà hàng/shipper 💬
- ✅ Đánh giá & Review ⭐
- ✅ Gamification (Xu, Vòng quay)

### 🔍 **Tìm kiếm & Lọc**
- ✅ Tìm kiếm nhà hàng theo tên, địa chỉ
- ✅ Tìm kiếm món ăn
- ✅ Lọc theo danh mục, rating, giá
- ✅ Sắp xếp theo rating, đơn hàng, khoảng cách

### 🛒 **Đặt hàng**
- ✅ Giỏ hàng với animation
- ✅ Mã giảm giá
- ✅ Nhiều phương thức thanh toán:
  - 💵 Tiền mặt (COD)
  - 💳 VNPay
  - 🪙 Xu (Coins)

### 🏪 **Quản lý nhà hàng**
- ✅ Đăng ký làm đối tác
- ✅ Quản lý menu (thêm/sửa/xóa món)
- ✅ Upload ảnh đại diện & bìa
- ✅ Hệ thống phí duy trì (subscription)
- ✅ Thanh toán phí (Xu hoặc chuyển khoản)
- ✅ Lịch sử thanh toán
- ✅ Báo cáo thống kê nâng cao 📊
- ✅ Phản hồi đánh giá khách hàng

### 🚗 **Shipper**
- ✅ Đăng ký làm shipper
- ✅ Nhận đơn hàng có sẵn
- ✅ Cập nhật vị trí real-time
- ✅ Chat với khách hàng
- ✅ Nhận đánh giá từ khách hàng
- ✅ Kiếm Xu từ giao hàng

### 👑 **Admin**
- ✅ Trang admin riêng biệt
- ✅ Quản lý người dùng
- ✅ Quản lý nhà hàng
- ✅ Duyệt yêu cầu thanh toán
- ✅ Cấu hình hệ thống
- ✅ Quản lý đánh giá
- ✅ Thống kê tổng quan

### 🔔 **Thông báo Real-time**
- ✅ Thông báo đơn hàng mới
- ✅ Thông báo thanh toán
- ✅ Cảnh báo hết hạn subscription
- ✅ Âm thanh thông báo
- ✅ Socket.io real-time

### 🛡️ **Bảo mật & Tối ưu**
- ✅ JWT Authentication
- ✅ Rate limiting
- ✅ Input validation & sanitization
- ✅ Error handling middleware
- ✅ Request logging
- ✅ Database indexes
- ✅ Query optimization
- ✅ Cache manager

---

## 📚 Tài liệu

- 📖 **[NEW_FEATURES.md](./NEW_FEATURES.md)** - Chi tiết tất cả chức năng mới
- 💳 **[VNPAY_GUIDE.md](./VNPAY_GUIDE.md)** - Hướng dẫn tích hợp VNPay

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify
```

### Restaurants
```
GET    /api/restaurants                    # Tìm kiếm, lọc, sắp xếp
GET    /api/restaurants/:id
GET    /api/restaurants/search/menu        # Tìm món ăn
POST   /api/restaurants
PUT    /api/restaurants/:id
DELETE /api/restaurants/:id
```

### Orders
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
GET    /api/orders/shipper/available       # Đơn hàng có sẵn cho shipper
POST   /api/orders/:id/accept-shipper      # Shipper nhận đơn
PATCH  /api/orders/:id/update-location     # Cập nhật vị trí
POST   /api/orders/:id/rate-shipper        # Đánh giá shipper
```

### Favorites
```
GET    /api/favorites/user/:userId
POST   /api/favorites
DELETE /api/favorites
POST   /api/favorites/toggle
```

### Messages (Chat)
```
GET    /api/messages/order/:orderId
POST   /api/messages
PATCH  /api/messages/:messageId/read
GET    /api/messages/unread/:userId
```

### Payment
```
POST /api/payment/vnpay/create-payment
GET  /api/payment/vnpay/return
POST /api/payment/coins/pay
```

### Reviews
```
POST   /api/reviews
GET    /api/reviews/restaurant/:id
POST   /api/reviews/:id/reply
POST   /api/reviews/:id/helpful
```

### Analytics
```
GET /api/analytics/restaurant/:id/overview
GET /api/analytics/restaurant/:id/revenue-by-day
GET /api/analytics/restaurant/:id/top-items
```

### Notifications
```
GET    /api/notifications/user/:userId
PATCH  /api/notifications/:id/read
DELETE /api/notifications/:id
```

---

## 🔌 Socket.io Events

### Client → Server
```javascript
socket.emit('join-user', userId)           // Join room nhận thông báo
socket.emit('join-order', orderId)         // Join room theo dõi đơn hàng
```

### Server → Client
```javascript
socket.on('new-notification', notification) // Thông báo mới
socket.on('order-status-updated', data)    // Cập nhật trạng thái đơn
socket.on('shipper-location-updated', loc) // Vị trí shipper
socket.on('new-message', message)          // Tin nhắn mới
socket.on('payment-approved', data)        // Thanh toán được duyệt
```
