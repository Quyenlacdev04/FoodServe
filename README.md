# 🍽️ FoodServe - Ứng dụng đặt đồ ăn online

Nền tảng đặt đồ ăn online hiện đại, giao diện đẹp như ShopeeFood với đầy đủ tính năng thực tế.

---

## 🚀 Công nghệ sử dụng

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 18 + Vite + TailwindCSS + Framer Motion + Redux Toolkit |
| **Backend** | Node.js + Express.js + Socket.io + MongoDB Atlas |
| **Auth** | JWT Authentication |
| **Payment** | MoMo Sandbox |
| **AI Chatbot** | Groq AI (Llama 3.1-8b) |
| **Real-time** | Socket.io (Chat, Notifications, GPS Tracking) |
| **Upload** | Multer (local storage) |

---

## 📦 Cài đặt

```bash
# Cài dependencies frontend
npm install

# Cài dependencies backend
cd server && npm install
```

## ▶️ Chạy dự án

```bash
# Terminal 1 - Frontend (port 3000)
npm run dev

# Terminal 2 - Backend (port 5000)
cd server && npm run dev
```

---

## 🔑 Tài khoản demo

| Email | Password | Vai trò |
|-------|----------|---------|
| demo@foodserve.vn | 123456 | Người dùng |
| admin@foodserve.vn | admin123 | Admin |

## 🎫 Mã giảm giá demo

| Mã | Ưu đãi | Đơn tối thiểu |
|----|--------|---------------|
| FOOD50 | Giảm 50.000đ | 150.000đ |
| FREESHIP | Giảm 25.000đ | Không giới hạn |
| NEW30 | Giảm 30.000đ | 100.000đ |
| SALE20 | Giảm 20.000đ | Không giới hạn |
| VIP100 | Giảm 100.000đ | 300.000đ |

---

## ✨ Tính năng đầy đủ

### 🎨 Giao diện & UX
- ✅ UI Glassmorphism + Dark mode
- ✅ Responsive PC + Mobile
- ✅ Loading animation
- ✅ Framer Motion animations
- ✅ Trang 404 tùy chỉnh

### 👤 Người dùng
- ✅ Đăng ký / Đăng nhập
- ✅ Quên mật khẩu (OTP 6 số, hết hạn 5 phút)
- ✅ Đổi mật khẩu (có thanh độ mạnh)
- ✅ Cập nhật hồ sơ, avatar
- ✅ Lịch sử đơn hàng
- ✅ Theo dõi đơn hàng real-time + GPS
- ✅ Yêu thích nhà hàng ❤️
- ✅ Chat với shipper 💬
- ✅ Đánh giá & Review ⭐
- ✅ Kho voucher cá nhân
- ✅ Gamification: Xu, Vòng quay may mắn, Bảng xếp hạng
- ✅ 🤖 FoodBot AI gợi ý món ăn + đặt ngay từ chat

### 🔍 Tìm kiếm & Lọc
- ✅ Tìm kiếm nhà hàng, món ăn
- ✅ Lọc theo danh mục, rating
- ✅ Sắp xếp theo rating, đơn hàng, khoảng cách

### 🛒 Đặt hàng & Thanh toán
- ✅ Giỏ hàng với animation
- ✅ Áp mã giảm giá
- ✅ Miễn phí ship đơn trên 100.000đ
- ✅ **Tiền mặt (COD)**
- ✅ **MoMo** (Sandbox tích hợp đầy đủ)
- ✅ **Xu tích lũy** (1 Xu = 1.000đ)
- ✅ Thông báo xác nhận thanh toán cho shipper & admin
- ✅ Hiển thị 0đ khi đã thanh toán online

### 🏪 Đối tác nhà hàng
- ✅ Đăng ký làm đối tác (chờ admin duyệt)
- ✅ Quản lý menu: thêm/sửa/xóa món
- ✅ Upload ảnh món ăn & nhà hàng
- ✅ Thống kê doanh thu theo biểu đồ
- ✅ Hệ thống phí duy trì hàng tháng (subscription)
- ✅ Thanh toán phí bằng Xu hoặc chuyển khoản
- ✅ Phản hồi đánh giá khách hàng

### 🛵 Shipper (Tài xế)
- ✅ Đăng ký làm tài xế (chờ admin duyệt)
- ✅ Nhận đơn hàng real-time
- ✅ Cập nhật vị trí GPS real-time
- ✅ Chat với khách hàng
- ✅ Nhận đánh giá từ khách
- ✅ Kiếm Xu từ mỗi đơn giao (90% phí ship)
- ✅ Thông báo khi khách đã thanh toán online

### 👑 Admin
- ✅ Dashboard riêng biệt
- ✅ Quản lý đơn hàng + cập nhật trạng thái
- ✅ Quản lý người dùng (sửa/xóa)
- ✅ Quản lý nhà hàng & menu
- ✅ Duyệt đăng ký đối tác
- ✅ Duyệt đăng ký tài xế
- ✅ Duyệt yêu cầu thanh toán phí duy trì
- ✅ **Quản lý Voucher nâng cao:**
  - ✅ Tạo/sửa/xóa voucher
  - ✅ Phát voucher cho nhóm: Khách hàng / Tài xế / Đối tác / Tất cả
  - ✅ Tìm kiếm & lọc voucher (theo trạng thái, loại)
  - ✅ Xem chi tiết voucher & thống kê sử dụng
  - ✅ Nhân bản voucher nhanh chóng
  - ✅ Export danh sách voucher (CSV)
  - ✅ Theo dõi voucher hết hạn
- ✅ Cấu hình hệ thống
- ✅ Thông báo real-time đơn hàng mới + thanh toán

### 🤖 FoodBot AI
- ✅ Gợi ý món ăn theo thời tiết, tâm trạng, bữa ăn
- ✅ Dữ liệu gợi ý lấy từ menu thực tế trong DB
- ✅ Nút "Đặt ngay" trực tiếp từ chat
- ✅ Trả lời câu hỏi về FoodServe & tính năng
- ✅ Từ chối lịch sự khi hỏi ngoài phạm vi
- ✅ Fallback thông minh khi không có API key

### 🔔 Thông báo Real-time
- ✅ Thông báo đơn hàng mới (admin + shipper)
- ✅ Thông báo xác nhận thanh toán online
- ✅ Cập nhật trạng thái đơn hàng
- ✅ Cảnh báo hết hạn subscription nhà hàng
- ✅ Âm thanh thông báo

### 🔐 Bảo mật & Tối ưu
- ✅ JWT Authentication
- ✅ Rate limiting (15 phút / 1000 requests)
- ✅ Input validation & XSS sanitization
- ✅ Error handling middleware
- ✅ Request logging
- ✅ MongoDB indexes tối ưu
- ✅ Query optimization & Cache

---

## 📂 Cấu trúc dự án

```
FoodServe/
├── public/                     # Static assets
├── src/                        # Frontend React
│   ├── components/
│   │   ├── admin/              # AdminRestaurants, AdminUsers, AdminSettings
│   │   ├── auth/               # AuthModal (login, register, quên MK)
│   │   ├── cart/               # CartSidebar
│   │   ├── chat/               # ChatBox, ChatButton
│   │   ├── chatbot/            # FoodBot AI
│   │   ├── home/               # Hero, RestaurantList, MenuItems...
│   │   ├── layout/             # Header, BottomNav
│   │   ├── payment/            # PaymentMethodSelector
│   │   ├── shipper/            # AvailableOrders, ActiveDelivery
│   │   ├── tracking/           # MapView, SimpleMapView
│   │   └── ui/                 # NotificationBell, FavoriteButton...
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── PaymentResultPage.jsx
│   │   ├── OrderTrackingPage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   ├── ProfilePage.jsx     # Hồ sơ + đổi mật khẩu + FoodBot
│   │   ├── RestaurantPage.jsx
│   │   ├── RestaurantManagePage.jsx
│   │   ├── ShipperDashboardPage.jsx
│   │   ├── AdminPage.jsx
│   │   ├── GamesPage.jsx
│   │   ├── LeaderboardPage.jsx
│   │   ├── FavoritesPage.jsx
│   │   ├── PartnerRegisterPage.jsx
│   │   ├── DriverRegisterPage.jsx
│   │   └── NotFoundPage.jsx    # Trang 404
│   ├── store/slices/           # Redux: auth, cart, ui, restaurant
│   └── utils/                  # rankUtils, helpers
│
├── server/                     # Backend Node.js
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js, Order.js, Restaurant.js
│   │   ├── MenuItem.js, Review.js, Notification.js
│   │   ├── Message.js, Favorite.js, SystemSetting.js
│   │   ├── PartnerRequest.js, DriverRequest.js
│   ├── routes/
│   │   ├── auth.js             # Đăng nhập, đăng ký, quên/đổi MK
│   │   ├── orders.js           # CRUD đơn hàng, shipper routes
│   │   ├── restaurants.js      # CRUD nhà hàng, menu, subscription
│   │   ├── payment.js          # MoMo, Xu
│   │   ├── chatbot.js          # Groq AI FoodBot
│   │   ├── analytics.js        # Thống kê nhà hàng
│   │   ├── reviews.js, favorites.js, messages.js
│   │   ├── notifications.js, partner.js, settings.js
│   ├── middleware/             # auth, errorHandler, logger, validation
│   ├── utils/                  # dbOptimizer, subscriptionChecker
│   └── index.js                # Entry point + Socket.io
└── README.md
```

---

## 🌐 API Endpoints chính

### Auth
```
POST /api/auth/register          # Đăng ký
POST /api/auth/login             # Đăng nhập
GET  /api/auth/me                # Lấy thông tin user
PUT  /api/auth/profile           # Cập nhật hồ sơ
POST /api/auth/forgot-password   # Gửi OTP quên mật khẩu
POST /api/auth/verify-otp        # Xác nhận OTP
POST /api/auth/reset-password    # Đặt mật khẩu mới
POST /api/auth/change-password   # Đổi mật khẩu (đã đăng nhập)
```

### Restaurants & Menu
```
GET    /api/restaurants           # Danh sách + tìm kiếm + lọc
GET    /api/restaurants/:id       # Chi tiết + menu
POST   /api/restaurants           # Tạo nhà hàng
PUT    /api/restaurants/:id       # Cập nhật
DELETE /api/restaurants/:id       # Xóa
GET    /api/restaurants/search/menu # Tìm món ăn
POST   /api/restaurants/:id/menu  # Thêm món
PUT    /api/restaurants/menu/:itemId # Sửa món
DELETE /api/restaurants/menu/:itemId # Xóa món
```

### Orders
```
POST   /api/orders                       # Tạo đơn hàng
GET    /api/orders/:id                   # Chi tiết đơn
PATCH  /api/orders/:id/status            # Cập nhật trạng thái
GET    /api/orders/shipper/available     # Đơn có sẵn cho shipper
POST   /api/orders/:id/accept-shipper    # Shipper nhận đơn
PATCH  /api/orders/:id/update-location   # Cập nhật GPS
POST   /api/orders/:id/rate-shipper      # Đánh giá shipper
```

### Payment
```
POST /api/payment/momo/create-payment    # Tạo thanh toán MoMo
GET  /api/payment/momo/return            # Callback MoMo
POST /api/payment/momo/ipn               # IPN MoMo
POST /api/payment/coins/pay              # Thanh toán bằng Xu
```

### Chatbot AI
```
POST /api/chatbot/chat                   # Chat với FoodBot
```

### Upload
```
POST /api/upload                         # Upload ảnh (multipart)
```

---

## 🔌 Socket.io Events

### Client → Server
```js
socket.emit('join-user', userId)         // Nhận thông báo cá nhân
socket.emit('join-order', orderId)       // Theo dõi đơn hàng
```

### Server → Client
```js
socket.on('new-order', order)            // Đơn hàng mới (admin/shipper)
socket.on('order-status-updated', data)  // Cập nhật trạng thái
socket.on('shipper-location-updated', loc) // Vị trí shipper
socket.on('new-notification', notif)     // Thông báo mới
socket.on('new-message', message)        // Tin nhắn chat
socket.on('payment-confirmed', data)     // Xác nhận thanh toán online
socket.on('payment-approved', data)      // Phí duy trì được duyệt
```

---

## ⚙️ Cấu hình môi trường (`server/.env`)

```env
PORT=5000
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb+srv://...

# MoMo Sandbox
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_REDIRECT_URL=http://localhost:5000/api/payment/momo/return
MOMO_IPN_URL=http://localhost:5000/api/payment/momo/ipn

# Groq AI (lấy miễn phí tại console.groq.com)
GROQ_API_KEY=gsk_...

# Email (tùy chọn - cho OTP quên mật khẩu)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🧪 Test thanh toán MoMo

Dùng thẻ ATM test:

| Số thẻ | Tên | Ngày HH | OTP | Kết quả |
|--------|-----|---------|-----|---------|
| 9704 0000 0000 0018 | NGUYEN VAN A | 03/07 | otp | ✅ Thành công |
| 9704 0000 0000 0026 | NGUYEN VAN A | 03/07 | otp | ❌ Thẻ bị khóa |
| 9704 0000 0000 0034 | NGUYEN VAN A | 03/07 | otp | ❌ Không đủ số dư |

---

*FoodServe — Đồ án môn học, xây dựng với ❤️*
