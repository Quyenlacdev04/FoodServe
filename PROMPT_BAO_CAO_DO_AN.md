# 📝 PROMPT VIẾT BÁO CÁO ĐỒ ÁN TỐT NGHIỆP - FOODSERVE

> **Hướng dẫn:** Copy toàn bộ nội dung dưới đây và paste vào AI (ChatGPT, Claude, Gemini...) để tạo báo cáo đồ án tốt nghiệp hoàn chỉnh.

---

## 🎯 YÊU CẦU VỚI AI

Bạn là chuyên gia viết báo cáo đồ án tốt nghiệp chuyên ngành **Công nghệ Thông tin**, đặc biệt là các đề tài về **Phát triển ứng dụng Web Full-stack**.

Hãy viết cho tôi một **BÁO CÁO ĐỒ ÁN TỐT NGHIỆP** hoàn chỉnh, chuyên nghiệp, học thuật cho dự án **FoodServe - Ứng dụng đặt đồ ăn trực tuyến**.

### 📋 CẤU TRÚC BÁO CÁO YÊU CẦU:

```
PHẦN I: GIỚI THIỆU
  1. Lý do chọn đề tài
  2. Mục tiêu nghiên cứu
  3. Đối tượng và phạm vi nghiên cứu
  4. Phương pháp nghiên cứu
  5. Kết quả đạt được
  6. Cấu trúc báo cáo

PHẦN II: CƠ SỞ LÝ THUYẾT
  1. Tổng quan về ứng dụng đặt đồ ăn trực tuyến
  2. Phân tích các ứng dụng hiện có (Grab Food, ShopeeFood, GoFood)
  3. Công nghệ sử dụng
     - React.js và hệ sinh thái
     - Node.js & Express.js
     - MongoDB & NoSQL
     - Socket.io & WebSocket
     - JWT Authentication
     - Payment Gateway Integration
  4. Kiến trúc hệ thống
     - Client-Server Architecture
     - RESTful API Design
     - Real-time Communication
     - Database Design Patterns

PHẦN III: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
  1. Phân tích yêu cầu hệ thống
     - Yêu cầu chức năng
     - Yêu cầu phi chức năng
  2. Phân tích nghiệp vụ
     - Use Case Diagram (4 vai trò)
     - Sequence Diagram (các luồng chính)
     - Activity Diagram
  3. Thiết kế cơ sở dữ liệu
     - ERD (Entity Relationship Diagram)
     - Database Schema
     - Indexes & Optimization
  4. Thiết kế kiến trúc hệ thống
     - System Architecture Diagram
     - Component Diagram
     - Deployment Diagram
  5. Thiết kế giao diện
     - Wireframe/Mockup
     - User Flow
     - Responsive Design Strategy

PHẦN IV: XÂY DỰNG HỆ THỐNG
  1. Môi trường phát triển
  2. Quy trình phát triển (Agile/Scrum)
  3. Cài đặt Backend
     - API Endpoints chi tiết
     - Authentication & Authorization
     - Real-time Features (Socket.io)
     - Payment Integration (MoMo)
     - AI Chatbot (Groq API)
  4. Cài đặt Frontend
     - Component Structure
     - State Management (Redux)
     - Routing Strategy
     - UI/UX Implementation
  5. Tích hợp hệ thống
  6. Testing & Quality Assurance

PHẦN V: ĐÁNH GIÁ VÀ KẾT QUẢ
  1. Kết quả đạt được
  2. Đánh giá tính năng
  3. Testing Results
  4. Performance Evaluation
  5. So sánh với các hệ thống tương tự

PHẦN VI: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
  1. Kết luận
  2. Hạn chế của hệ thống
  3. Hướng phát triển trong tương lai

TÀI LIỆU THAM KHẢO
PHỤ LỤC
  - Mã nguồn quan trọng
  - Screenshots giao diện
  - API Documentation
  - Database Schema chi tiết
```

---

## 📊 THÔNG TIN CHI TIẾT DỰ ÁN

### 1. THÔNG TIN CƠ BẢN

**Tên đề tài:** Xây dựng ứng dụng đặt đồ ăn trực tuyến FoodServe

**Mục tiêu:** 
- Xây dựng hệ thống đặt đồ ăn trực tuyến hoàn chỉnh với 4 vai trò: Khách hàng, Nhà hàng, Tài xế, Admin
- Tích hợp thanh toán điện tử (MoMo Sandbox)
- Real-time tracking đơn hàng với GPS
- AI Chatbot hỗ trợ gợi ý món ăn
- Hệ thống gamification với Xu tích lũy, vòng quay may mắn

**Công nghệ:**

- **Frontend:** React 18.3.1, Vite 5.4.0, TailwindCSS 3.4.7, Framer Motion 11.3.0, Redux Toolkit 2.2.0, React Router 6.26.0, Socket.io-client 4.7.0, React Leaflet 4.2.1, Recharts 3.8.1
- **Backend:** Node.js, Express.js 4.19.0, MongoDB + Mongoose 8.5.0, Socket.io 4.7.0, JWT 9.0.0, Multer 1.4.5, Nodemailer 6.9.13, Groq SDK 0.9.1, Node-cron 4.2.1, bcryptjs 2.4.3
- **Database:** MongoDB Atlas (Cloud NoSQL)
- **Payment:** MoMo Sandbox
- **AI:** Groq AI (Llama 3.1-8b)
- **Maps:** OpenStreetMap + Leaflet.js

---

### 2. CHỨC NĂNG CHI TIẾT (105 chức năng - 98% hoàn thành)

#### 👤 Module Khách hàng (Customer) - 100%
1. Đăng ký/Đăng nhập tài khoản (JWT Authentication)
2. Quên mật khẩu (OTP 6 số qua email, hết hạn 5 phút)
3. Đổi mật khẩu (thanh kiểm tra độ mạnh mật khẩu)
4. Cập nhật hồ sơ cá nhân (tên, SĐT, địa chỉ, avatar)
5. Tìm kiếm nhà hàng theo tên
6. Tìm kiếm món ăn cross-restaurant
7. Lọc nhà hàng theo danh mục (Phở, Cơm, Gà rán, Đồ uống...)
8. Lọc theo rating (4+ sao, 5 sao)
9. Sắp xếp theo rating, khoảng cách, số đơn hàng
10. Xem chi tiết nhà hàng + menu đầy đủ
11. Thêm món vào giỏ hàng (Cart Sidebar animation)
12. Cập nhật số lượng, xóa món khỏi giỏ
13. Áp mã giảm giá (validate API real-time)
14. Quick-apply voucher có sẵn trong giỏ hàng
15. Miễn phí ship cho đơn trên 100.000đ
16. Thanh toán COD (tiền mặt)
17. Thanh toán MoMo Sandbox (tích hợp đầy đủ IPN)
18. Thanh toán bằng Xu tích lũy (1 Xu = 1.000đ)
19. Theo dõi đơn hàng real-time (trạng thái + GPS tracking)
20. Xem lịch sử đơn hàng
21. Chat real-time với shipper
22. Đánh giá nhà hàng & món ăn (1-5 sao + comment + upload ảnh)
23. Đánh giá tài xế sau khi hoàn thành
24. Yêu thích nhà hàng (❤️ toggle, persist DB)
25. Xem danh sách nhà hàng yêu thích
26. Nhận thông báo real-time (đơn hàng, thanh toán)
27. Chơi vòng quay may mắn (đổi Xu lấy voucher)
28. Tích lũy Xu khi đặt hàng (1.000đ = 1 lượt quay)
29. Xem bảng xếp hạng top 10 khách hàng
30. Chat với FoodBot AI gợi ý món ăn
31. Đặt món ngay từ gợi ý của AI Chatbot
32. Kho voucher cá nhân (hiển thị voucher đã nhận)
33. Responsive design (PC + Mobile)
34. Dark mode support

#### 🏪 Module Nhà hàng (Merchant/Partner) - 100%
35. Đăng ký làm đối tác nhà hàng (chờ admin phê duyệt)
36. Dashboard tổng quan (doanh thu, đơn hàng, rating)
37. Quản lý menu: thêm món mới
38. Quản lý menu: sửa thông tin món (tên, giá, mô tả, ảnh)
39. Quản lý menu: xóa món
40. Upload ảnh món ăn (Multer local storage)
41. Upload ảnh cover nhà hàng
42. Xem danh sách đơn hàng của nhà hàng
43. Cập nhật trạng thái đơn (confirmed → preparing → ready)
44. Thống kê doanh thu theo biểu đồ (Recharts)
45. Thống kê số đơn, rating trung bình
46. Hệ thống phí duy trì hàng tháng (subscription)
47. Thanh toán phí bằng Xu
48. Thanh toán phí bằng chuyển khoản (chờ admin duyệt)
49. Xem lịch sử thanh toán phí
50. Cảnh báo hết hạn subscription (3 ngày trước)
51. Tự động khóa nhà hàng khi hết hạn phí (Node-cron)
52. Phản hồi đánh giá của khách hàng
53. Chat với khách hàng (trong đơn hàng)

#### 🛵 Module Tài xế (Shipper) - 93%
54. Đăng ký làm tài xế (chờ admin phê duyệt)
55. Dashboard riêng (bật/tắt Online/Offline)
56. Nhận đơn hàng real-time (popup 2 phút tự động ẩn)
57. Xem danh sách "Đơn có thể nhận" (đơn bị bỏ lỡ)
58. Nhận đơn hàng
59. Xem thông tin chi tiết đơn (món ăn, địa chỉ, SĐT, ghi chú)
60. Hiển thị khoảng cách từ vị trí hiện tại đến nhà hàng
61. Hiển thị khoảng cách giao hàng (đến khách)
62. Cập nhật GPS real-time (Leaflet.js + OpenStreetMap)
63. Tự động chuyển bước: Lấy hàng → Đang giao → Hoàn thành
64. Tính phí ship theo km (1km = 5.000đ, fee cơ bản 15.000đ)
65. Chat real-time với khách hàng
66. Nhận đánh giá từ khách (1-5 sao)
67. Tính rating trung bình của shipper
68. Thống kê tổng đơn đã giao
69. Xem lịch sử đơn đã giao
70. Kiếm Xu (90% phí ship mỗi đơn, 10% cho hệ thống)
71. Thông báo khi khách thanh toán online (MoMo/Xu)
72. Xem số dư Xu hiện tại
73. Cập nhật thông tin cá nhân (tên, SĐT, avatar, loại xe, biển số)
74. Hệ thống cấp bậc Shipper (Đồng, Bạc, Vàng, Kim Cương)
75. Thưởng milestone khi đạt cấp bậc
76. Hiển thị vị trí trên bản đồ Leaflet
77. ⚠️ Route navigation chi tiết (chưa hoàn chỉnh, chỉ hiển thị vị trí)

#### 👑 Module Admin - 100%
78. Trang login riêng (/admin-login)
79. Dashboard tổng quan (doanh thu, đơn hàng, users)
80. Quản lý đơn hàng: xem tất cả đơn
81. Quản lý đơn hàng: cập nhật trạng thái bất kỳ
82. Quản lý đơn hàng: tìm kiếm & lọc theo trạng thái
83. Quản lý người dùng: xem danh sách
84. Quản lý người dùng: tìm kiếm theo tên/email
85. Quản lý người dùng: chỉnh sửa thông tin
86. Quản lý người dùng: xóa user
87. Quản lý nhà hàng: xem danh sách
88. Quản lý nhà hàng: tạo nhà hàng mới
89. Quản lý nhà hàng: sửa thông tin nhà hàng
90. Quản lý nhà hàng: xóa nhà hàng
91. Quản lý nhà hàng: mở/đóng nhà hàng (isActive toggle)
92. Duyệt đơn đăng ký đối tác nhà hàng (approve/reject)
93. Quản lý tài xế: xem danh sách
94. Quản lý tài xế: xem chi tiết (thống kê đơn giao, rating)
95. Duyệt đơn đăng ký tài xế (approve/reject)
96. Quản lý tài xế: khóa/mở tài xế
97. Quản lý tài xế: xóa tài xế
98. Duyệt yêu cầu thanh toán phí duy trì (chuyển khoản)
99. **Quản lý Voucher:**
    - Tạo voucher mới (giảm giá % hoặc cố định)
    - Sửa voucher
    - Xóa voucher
    - Bật/tắt voucher (isActive)
    - Phát voucher cho nhóm: Khách hàng / Tài xế / Đối tác / Tất cả
    - Tìm kiếm voucher (theo mã, tên)
    - Lọc voucher (theo trạng thái active/inactive, loại giảm giá)
    - Xem chi tiết voucher (lượt dùng, hạn sử dụng)
    - Nhân bản voucher nhanh
    - Export danh sách voucher (CSV)
    - Theo dõi voucher sắp hết hạn
100. Cấu hình hệ thống (phí duy trì, % hoa hồng, phí ship)
101. Thông báo real-time: đơn hàng mới
102. Thông báo real-time: thanh toán thành công
103. Thống kê doanh thu tổng (Admin ăn 10% phí ship)
104. Âm thanh thông báo đơn mới

#### 🔔 Module Thông báo Real-time - 100%
- Notification Bell với badge số chưa đọc
- Socket.io real-time updates
- Thông báo cho mỗi vai trò:
  - Admin: Đơn mới, thanh toán, subscription hết hạn
  - Shipper: Đơn mới, khách thanh toán online
  - Merchant: Đơn mới cho nhà hàng của mình
  - Customer: Trạng thái đơn hàng

#### 💬 Module Chat Real-time - 100%
105. Chat Button floating
106. Socket.io messaging
107. Hiển thị avatar user
108. Trạng thái đã đọc/chưa đọc
109. Lưu lịch sử tin nhắn vào DB

---

### 3. DATABASE SCHEMA (12 Collections)

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (bcrypt hash),
  phone: String,
  address: String,
  avatar: String (URL),
  role: String (enum: 'user', 'merchant', 'shipper', 'admin'),
  isMerchant: Boolean,
  isShipper: Boolean,
  isOnline: Boolean,
  
  // Gamification
  coins: Number (default: 0),
  spins: Number (default: 0),
  totalSpent: Number (default: 0),
  vouchers: [String],
  
  // Shipper specific
  shipperRating: Number,
  totalDeliveries: Number,
  vehicleType: String (enum: 'motorbike', 'bike', 'car'),
  vehicleNumber: String,
  claimedRanks: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Restaurants Collection
```javascript
{
  _id: ObjectId,
  name: String (indexed),
  ownerId: ObjectId (ref: User, indexed),
  image: String (URL),
  cover: String (URL),
  rating: Number (default: 0),
  reviews: Number (default: 0),
  deliveryTime: String,
  distance: Number,
  orders: Number (default: 0),
  discount: Number (default: 0),
  freeship: Boolean (default: false),
  promo: String,
  categories: [String] (indexed),
  address: String,
  description: String (text indexed),
  
  // Subscription
  isActive: Boolean (default: true, indexed),
  subscriptionExpiry: Date (default: +30 days, indexed),
  paymentHistory: [{
    _id: String,
    amount: Number,
    paymentMethod: String,
    status: String,
    paidAt: Date,
    periodStart: Date,
    periodEnd: Date,
    transactionNote: String,
    approvedBy: String
  }],
  paymentRequests: [{
    _id: String,
    restaurantId: String,
    restaurantName: String,
    userId: String,
    amount: Number,
    paymentMethod: String,
    status: String (enum: 'pending', 'approved', 'rejected'),
    note: String,
    createdAt: Date,
    approvedBy: String,
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
    rejectReason: String
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

#### MenuItems Collection
```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId (ref: Restaurant, indexed),
  name: String (indexed),
  price: Number,
  image: String (URL),
  description: String,
  popular: Boolean (default: false),
  category: String (indexed),
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: String (indexed),
  restaurantId: String (indexed),
  shipperId: ObjectId (ref: User, indexed),
  
  items: [{
    menuItemId: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  
  totalAmount: Number,
  discount: Number,
  deliveryFee: Number,
  finalAmount: Number,
  
  status: String (enum: 'pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled', indexed),
  
  deliveryAddress: String,
  contactPhone: String,
  note: String,
  
  // Location tracking
  customerLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  restaurantLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  shipperLocation: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  
  // Payment
  paymentMethod: String (enum: 'cash', 'vnpay', 'momo', 'zalopay', 'coins'),
  paymentStatus: String (enum: 'pending', 'paid', 'failed', 'refunded'),
  transactionId: String,
  paidAt: Date,
  
  // Ratings
  shipperRating: Number (min: 1, max: 5),
  shipperComment: String,
  
  // Tracking
  steps: [{
    status: String,
    time: Date
  }],
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  
  createdAt: Date (indexed),
  updatedAt: Date
}
```

#### Reviews Collection
```javascript
{
  _id: ObjectId,
  orderId: ObjectId (ref: Order),
  userId: ObjectId (ref: User, indexed),
  restaurantId: ObjectId (ref: Restaurant, indexed),
  
  restaurantRating: Number (min: 1, max: 5),
  restaurantComment: String,
  
  itemReviews: [{
    menuItemId: String,
    rating: Number,
    comment: String
  }],
  
  driverRating: Number (min: 1, max: 5),
  driverComment: String,
  
  images: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Favorites Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  restaurantId: ObjectId (ref: Restaurant, indexed),
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Messages Collection
```javascript
{
  _id: ObjectId,
  orderId: ObjectId (ref: Order, indexed),
  senderId: ObjectId (ref: User),
  senderRole: String (enum: 'user', 'shipper', 'merchant'),
  message: String,
  type: String (default: 'text'),
  read: Boolean (default: false),
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  title: String,
  message: String,
  type: String (enum: 'order_new', 'order_status', 'payment', 'subscription', 'system'),
  data: {
    orderId: String,
    restaurantId: String,
    // ... other contextual data
  },
  read: Boolean (default: false, indexed),
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Vouchers Collection
```javascript
{
  _id: ObjectId,
  code: String (unique, indexed),
  description: String,
  type: String (enum: 'percentage', 'fixed'),
  value: Number,
  minOrder: Number (default: 0),
  maxDiscount: Number,
  usageLimit: Number,
  usedCount: Number (default: 0),
  expiresAt: Date,
  isActive: Boolean (default: true, indexed),
  createdBy: ObjectId (ref: User),
  
  createdAt: Date,
  updatedAt: Date
}
```

#### PartnerRequests Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  restaurantName: String,
  address: String,
  phone: String,
  description: String,
  image: String (URL),
  
  status: String (enum: 'pending', 'approved', 'rejected', default: 'pending', indexed),
  adminNote: String,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### DriverRequests Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  idCard: String,
  vehicleType: String,
  licensePlate: String,
  driverLicense: String,
  operationArea: String,
  
  status: String (enum: 'pending', 'approved', 'rejected', default: 'pending', indexed),
  adminNote: String,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### SystemSettings Collection
```javascript
{
  _id: ObjectId,
  monthlyRestaurantFee: Number (default: 500000), // 500k VND/tháng
  commissionRate: Number (default: 0.1), // 10% hoa hồng từ phí ship
  deliveryFeePerKm: Number (default: 5000), // 5k/km
  baseDeliveryFee: Number (default: 15000), // Phí cơ bản 15k
  
  updatedBy: ObjectId (ref: User),
  updatedAt: Date
}
```

### Indexes quan trọng:
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ isOnline: 1 })

// Restaurants  
db.restaurants.createIndex({ ownerId: 1 })
db.restaurants.createIndex({ isActive: 1 })
db.restaurants.createIndex({ subscriptionExpiry: 1 })
db.restaurants.createIndex({ rating: -1 })
db.restaurants.createIndex({ categories: 1 })
db.restaurants.createIndex({ name: 'text', description: 'text' })

// MenuItems
db.menuitems.createIndex({ restaurantId: 1 })
db.menuitems.createIndex({ name: 'text' })
db.menuitems.createIndex({ category: 1 })

// Orders
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.createIndex({ restaurantId: 1, createdAt: -1 })
db.orders.createIndex({ shipperId: 1, status: 1 })
db.orders.createIndex({ status: 1, createdAt: -1 })
db.orders.createIndex({ createdAt: -1 })

// Reviews
db.reviews.createIndex({ restaurantId: 1, createdAt: -1 })
db.reviews.createIndex({ userId: 1 })

// Favorites
db.favorites.createIndex({ userId: 1 })
db.favorites.createIndex({ restaurantId: 1 })
db.favorites.createIndex({ userId: 1, restaurantId: 1 }, { unique: true })

// Messages
db.messages.createIndex({ orderId: 1, createdAt: 1 })

// Notifications
db.notifications.createIndex({ userId: 1, read: 1 })
db.notifications.createIndex({ createdAt: -1 })
```

---

### 4. API ENDPOINTS CHI TIẾT (80+ endpoints)

#### Auth Routes (/api/auth)
```
POST   /register                 - Đăng ký tài khoản mới
POST   /login                    - Đăng nhập (return JWT token)
GET    /me                       - Lấy thông tin user hiện tại
GET    /verify                   - Verify JWT token
GET    /capabilities             - Lấy quyền user
PUT    /profile                  - Cập nhật hồ sơ
POST   /forgot-password          - Gửi OTP quên mật khẩu qua email
POST   /verify-otp               - Xác nhận OTP (6 số, hết hạn 5 phút)
POST   /reset-password           - Đặt mật khẩu mới sau quên
POST   /change-password          - Đổi mật khẩu (đã đăng nhập)
POST   /update-coins             - Cập nhật Xu
GET    /leaderboard              - Bảng xếp hạng top 10
GET    /users                    - Danh sách users (Admin)
GET    /users/:id                - Chi tiết user (Admin)
PUT    /users/:id                - Cập nhật user (Admin)
DELETE /users/:id                - Xóa user (Admin)
```

#### Restaurant Routes (/api/restaurants)
```
GET    /                         - Danh sách nhà hàng (query: search, category, sort)
GET    /:id                      - Chi tiết nhà hàng + menu
GET    /owned/:ownerId           - Nhà hàng của merchant
POST   /                         - Tạo nhà hàng (Admin)
PUT    /:id                      - Cập nhật nhà hàng
DELETE /:id                      - Xóa nhà hàng (Admin)
GET    /search/menu              - Tìm kiếm món ăn cross-restaurant
POST   /:id/menu                 - Thêm món ăn vào menu
PUT    /menu/:itemId             - Cập nhật món ăn
DELETE /menu/:itemId             - Xóa món ăn
POST   /:id/renew-subscription   - Gia hạn phí duy trì (Xu)
POST   /:id/request-payment      - Yêu cầu thanh toán phí (chuyển khoản)
GET    /payment-requests         - Danh sách yêu cầu thanh toán (Admin)
PATCH  /payment-requests/:id     - Duyệt/Từ chối thanh toán (Admin)
```

#### Order Routes (/api/orders)
```
GET    /                         - Danh sách đơn hàng (query: userId, shipperId, restaurantId)
GET    /:id                      - Chi tiết đơn hàng
POST   /                         - Tạo đơn hàng mới
PATCH  /:id/status               - Cập nhật trạng thái đơn
GET    /user/:userId             - Đơn hàng của user
GET    /restaurant/:restaurantId - Đơn hàng của nhà hàng
GET    /shipper/available        - Đơn hàng có sẵn cho shipper (chưa có người nhận)
POST   /:id/accept-shipper       - Shipper nhận đơn
PATCH  /:id/update-location      - Cập nhật GPS shipper real-time
POST   /:id/rate-shipper         - Đánh giá shipper
POST   /claim-rank-bonus         - Nhận thưởng milestone cấp bậc shipper
```

#### Review Routes (/api/reviews)
```
GET    /restaurant/:restaurantId - Danh sách review của nhà hàng
POST   /                         - Tạo review mới
PUT    /:id                      - Cập nhật review
DELETE /:id                      - Xóa review
```

#### Favorite Routes (/api/favorites)
```
GET    /user/:userId             - Danh sách yêu thích của user
POST   /                         - Thêm nhà hàng yêu thích
DELETE /:id                      - Xóa khỏi danh sách yêu thích
```

#### Message Routes (/api/messages)
```
GET    /order/:orderId           - Tin nhắn của đơn hàng
POST   /                         - Gửi tin nhắn mới
GET    /unread/:userId           - Số tin nhắn chưa đọc
PATCH  /:id/read                 - Đánh dấu đã đọc
```

#### Notification Routes (/api/notifications)
```
GET    /user/:userId             - Thông báo của user
PATCH  /:id/read                 - Đánh dấu đã đọc
DELETE /:id                      - Xóa thông báo
DELETE /user/:userId/all         - Xóa tất cả thông báo
```

#### Partner Routes (/api/partner)
```
POST   /restaurant/register      - Đăng ký làm đối tác nhà hàng
GET    /restaurant/requests      - Danh sách đơn đăng ký (Admin)
PATCH  /restaurant/requests/:id  - Phê duyệt/Từ chối (Admin)
POST   /driver/register          - Đăng ký làm tài xế
GET    /driver/requests          - Danh sách đơn đăng ký tài xế (Admin)
PATCH  /driver/requests/:id      - Phê duyệt/Từ chối (Admin)
GET    /driver/register/status   - Kiểm tra trạng thái đơn đăng ký
```

#### Payment Routes (/api/payment)
```
POST   /momo/create-payment      - Tạo link thanh toán MoMo
GET    /momo/return              - Xử lý callback MoMo (redirect user)
POST   /momo/ipn                 - IPN MoMo (webhook auto-confirm payment)
POST   /coins/pay                - Thanh toán bằng Xu
```

#### Voucher Routes (/api/vouchers)
```
GET    /                         - Danh sách voucher (query: isActive, search)
GET    /:code/validate           - Validate voucher khi checkout
POST   /                         - Tạo voucher mới (Admin)
PUT    /:id                      - Cập nhật voucher (Admin)
DELETE /:id                      - Xóa voucher (Admin)
POST   /distribute               - Phát voucher cho nhóm (Admin)
GET    /user/:userId             - Voucher của user
POST   /use                      - Sử dụng voucher
```

#### Analytics Routes (/api/analytics)
```
GET    /restaurant/:restaurantId - Thống kê nhà hàng (doanh thu, đơn hàng theo ngày/tháng)
GET    /admin/overview           - Tổng quan hệ thống (Admin)
```

#### Settings Routes (/api/settings)
```
GET    /                         - Lấy cấu hình hệ thống
PUT    /                         - Cập nhật cấu hình (Admin)
```

#### Chatbot Routes (/api/chatbot)
```
POST   /chat                     - Chat với FoodBot AI
```

#### Upload Routes (/api/upload)
```
POST   /                         - Upload ảnh (multipart/form-data)
```

---

### 5. SOCKET.IO EVENTS (Real-time)

#### Client → Server
```javascript
socket.emit('join-user', userId)         // Join room nhận thông báo cá nhân
socket.emit('join-order', orderId)       // Join room theo dõi đơn hàng
socket.emit('new-message', messageData)  // Gửi tin nhắn chat
```

#### Server → Client
```javascript
socket.on('new-order', order)                  // Đơn hàng mới (admin, shipper)
socket.on('order-status-updated', data)        // Cập nhật trạng thái đơn
socket.on('shipper-location-updated', location) // Vị trí GPS shipper
socket.on('new-notification', notification)    // Thông báo mới
socket.on('new-message', message)              // Tin nhắn chat mới
socket.on('payment-confirmed', data)           // Thanh toán online thành công
socket.on('payment-approved', data)            // Phí duy trì được duyệt
```

---

### 6. PHÂN QUYỀN HỆ THỐNG

| Role | Quyền hạn |
|------|----------|
| **user** | Đặt hàng, chat, đánh giá, game, voucher, yêu thích |
| **merchant** | Quản lý nhà hàng, menu, đơn hàng, thống kê, subscription |
| **shipper** | Nhận đơn, GPS tracking, chat, lịch sử giao, kiếm Xu |
| **admin** | Toàn quyền: quản lý user, nhà hàng, đơn hàng, tài xế, voucher, settings |


### 7. TÍNH NĂNG NỔI BẬT CẦN NHẤN MẠNH

#### 1. Thanh toán điện tử MoMo Sandbox - Tích hợp đầy đủ
- Tạo link thanh toán qua MoMo API
- IPN (Instant Payment Notification) tự động xác nhận thanh toán
- Callback xử lý kết quả (success/fail)
- Thông báo real-time cho shipper & admin khi khách thanh toán
- Hiển thị 0đ cho shipper khi đã thanh toán online

#### 2. GPS Tracking Real-time
- Sử dụng Leaflet.js + OpenStreetMap
- Cập nhật vị trí shipper mỗi 5 giây
- Hiển thị marker shipper trên bản đồ
- Khách hàng theo dõi real-time qua OrderTrackingPage
- Socket.io broadcast vị trí cho tất cả watchers

#### 3. AI Chatbot - FoodBot
- Powered by Groq AI (Llama 3.1-8b)
- Gợi ý món ăn theo:
  - Thời tiết (nắng → đồ mát, mưa → súp nóng)
  - Tâm trạng (vui, buồn, stress...)
  - Bữa ăn (sáng, trưa, tối, đêm)
  - Sở thích (cay, ngọt, thanh đạm...)
- Dữ liệu gợi ý lấy từ menu thực tế trong DB
- Nút "Đặt ngay" điều hướng tới RestaurantPage
- Trả lời câu hỏi về FoodServe
- Từ chối lịch sự khi hỏi ngoài phạm vi

#### 4. Hệ thống Gamification
- **Xu tích lũy:** 1.000đ chi tiêu = 1 Xu, 1 Xu = 1.000đ thanh toán
- **Vòng quay may mắn:** Đổi lượt quay lấy voucher giá trị cao
- **Bảng xếp hạng:** Top 10 khách hàng chi tiêu nhiều nhất
- **Kho voucher cá nhân:** Lưu voucher đã nhận
- **Shipper kiếm Xu:** 90% phí ship mỗi đơn
- **Cấp bậc Shipper:** Đồng → Bạc → Vàng → Kim Cương (dựa trên số đơn giao)
- **Thưởng milestone:** Xu thưởng khi đạt cấp bậc mới

#### 5. Hệ thống Subscription cho Nhà hàng
- Phí duy trì 500.000đ/tháng
- Thanh toán bằng Xu hoặc chuyển khoản (admin duyệt)
- Cảnh báo hết hạn 3 ngày trước
- Tự động khóa nhà hàng khi hết hạn (Node-cron chạy daily 9:00 AM)
- Lịch sử thanh toán đầy đủ

#### 6. Quản lý Voucher nâng cao (Admin)
- Tạo/sửa/xóa voucher
- Phát voucher cho nhóm: Khách hàng / Tài xế / Đối tác / Tất cả
- Tìm kiếm & lọc voucher
- Xem thống kê sử dụng
- Nhân bản voucher nhanh
- Export CSV
- Theo dõi voucher sắp hết hạn

#### 7. Chat Real-time multi-user
- Socket.io persistent connection
- Khách ↔ Shipper
- Khách ↔ Nhà hàng
- Lưu lịch sử tin nhắn vào MongoDB
- Hiển thị avatar, tên người gửi
- Trạng thái đã đọc/chưa đọc

#### 8. Thông báo Real-time
- Socket.io rooms theo userId
- Notification Bell với badge số chưa đọc
- Âm thanh thông báo
- Tự động popup khi có thông báo quan trọng
- Click notification → điều hướng tới trang liên quan

---

### 8. KIẾN TRÚC HỆ THỐNG

#### Kiến trúc tổng quan
```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React 18 SPA (Vite)                                 │   │
│  │  - Redux Toolkit (State Management)                  │   │
│  │  - React Router (Routing)                            │   │
│  │  - TailwindCSS (Styling)                             │   │
│  │  - Framer Motion (Animations)                        │   │
│  │  - Socket.io Client (Real-time)                      │   │
│  │  - Leaflet.js (Maps)                                 │   │
│  │  - Recharts (Analytics)                              │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS (REST API)
                       │ WebSocket (Socket.io)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Node.js + Express.js                                │   │
│  │  - JWT Authentication                                │   │
│  │  - REST API (80+ endpoints)                          │   │
│  │  - Socket.io Server (Real-time)                      │   │
│  │  - Middleware: Auth, Logger, Error Handler           │   │
│  │  - Multer (File Upload)                              │   │
│  │  - Node-cron (Scheduled Tasks)                       │   │
│  │  - bcryptjs (Password Hashing)                       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Mongoose ODM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MongoDB Atlas (Cloud)                               │   │
│  │  - 12 Collections                                    │   │
│  │  - Indexes for Performance                           │   │
│  │  - Geospatial Queries (GPS)                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   MoMo API   │  │   Groq AI    │  │ OpenStreetMap│     │
│  │   (Payment)  │  │  (Chatbot)   │  │   (Maps)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

#### Luồng hoạt động chính

**1. Đặt hàng & Thanh toán:**
```
User → Chọn món → Giỏ hàng → Checkout → Chọn PT thanh toán
  ↓
[COD] → Tạo order (status: confirmed) → Shipper nhận
  ↓
[MoMo] → Redirect MoMo → Thanh toán → IPN callback → Update order (paid)
         → Socket.io notify (Shipper, Admin, Merchant)
  ↓
[Xu] → Check balance → Deduct coins → Create order (paid)
```

**2. Shipper giao hàng:**
```
Order (confirmed, paid) → Socket.io emit "new-order"
  ↓
Shipper (online) → Popup 2 phút → Nhận đơn
  ↓
Status: preparing → ready → delivering (GPS tracking) → completed
  ↓
Shipper nhận 90% phí ship (Xu), Admin nhận 10%
  ↓
Customer đánh giá shipper (1-5 sao) → Update shipperRating
```

**3. Real-time Chat:**
```
User A gửi tin nhắn → API POST /api/messages
  ↓
Save to MongoDB → Socket.io emit "new-message" to room(orderId)
  ↓
User B (joined room) nhận tin nhắn real-time
```

**4. GPS Tracking:**
```
Shipper di chuyển → setInterval 5s → getCurrentPosition()
  ↓
API PATCH /api/orders/:id/update-location { lat, lng }
  ↓
Save to shipperLocation → Socket.io emit "shipper-location-updated"
  ↓
Customer (OrderTrackingPage) nhận vị trí → Update marker trên map
```

---

### 9. BẢO MẬT & TỐI ƯU HÓA

#### Bảo mật
- **JWT Authentication:** Token-based auth, expire 7 days
- **bcryptjs:** Hash password (salt rounds: 10)
- **Rate Limiting:** 1000 requests / 15 phút / IP
- **Input Validation:** Sanitize user input (XSS prevention)
- **CORS:** Whitelist origin
- **Error Handling:** Không expose stack trace ra client

#### Tối ưu hóa
- **MongoDB Indexes:** 20+ indexes cho query performance
- **Lazy Loading:** React.lazy() cho routes
- **Image Optimization:** Resize ảnh trước khi upload
- **Caching:** Redux persist state
- **Code Splitting:** Vite automatic code splitting
- **Debounce/Throttle:** Search input, scroll events
- **Socket.io Rooms:** Chỉ emit tới user liên quan

---

### 10. HƯỚNG DẪN TEST & DEMO

#### Tài khoản Demo
| Email | Mật khẩu | Role | Mô tả |
|-------|---------|------|-------|
| demo@foodserve.vn | 123456 | User + Merchant + Shipper | Multi-role testing |
| admin@foodserve.vn | admin123 | Admin | Full admin access |

#### Test Cases quan trọng

**TC01: Đăng ký & Đăng nhập**
1. Truy cập http://localhost:3000
2. Click "Đăng ký" → Nhập thông tin
3. Đăng nhập → Redirect HomePage

**TC02: Đặt hàng COD**
1. Chọn nhà hàng → Thêm món vào giỏ
2. Checkout → Nhập địa chỉ
3. Chọn "Tiền mặt" → Đặt hàng
4. OrderTrackingPage hiển thị trạng thái

**TC03: Thanh toán MoMo**
1. Giỏ hàng → Checkout → Chọn MoMo
2. Redirect tới MoMo sandbox
3. Nhập thẻ test: `9704 0000 0000 0018`
4. Tên: `NGUYEN VAN A`, Ngày: `03/07`, OTP: `otp`
5. Thanh toán thành công → Redirect về
6. Kiểm tra thông báo cho Shipper, Admin

**TC04: Shipper nhận đơn & GPS**
1. Login tài khoản Shipper
2. Bật Online
3. Popup đơn mới hiện (2 phút)
4. Nhận đơn → ActiveDelivery
5. GPS tự động cập nhật
6. Hoàn thành → Nhận Xu

**TC05: Admin duyệt đối tác**
1. User đăng ký đối tác (PartnerRegisterPage)
2. Login Admin → Quản lý đối tác
3. Duyệt/Từ chối → Thông báo cho user

**TC06: FoodBot AI**
1. Login → ProfilePage → Tab FoodBot
2. Chat: "Gợi ý món ăn cho trưa nắng nóng"
3. Bot trả lời món mát → Click "Đặt ngay"

**TC07: Chat real-time**
1. Customer đặt hàng
2. Shipper nhận đơn
3. OrderTrackingPage → Click Chat
4. Gửi tin nhắn → Shipper nhận real-time

**TC08: Vòng quay may mắn**
1. User có Xu > 0
2. GamesPage → Vòng quay
3. Quay → Nhận voucher
4. Kiểm tra kho voucher

---

### 11. HẠN CHẾ & HƯỚNG PHÁT TRIỂN

#### Hạn chế hiện tại
1. ❌ **Route navigation bản đồ:** Chưa vẽ đường đi thực tế (chỉ hiển thị vị trí marker)
2. ❌ **Geocoding API:** Chưa tích hợp, tọa độ đang là giả định
3. ⚠️ **Password Security:** Đang dùng bcrypt nhưng cần thêm 2FA
4. ⚠️ **Unit Tests:** Chưa có coverage đầy đủ
5. ⚠️ **Performance:** Cần thêm Redis cache cho API
6. ⚠️ **Logging:** Chưa có centralized logging system
7. ⚠️ **Deployment:** Chưa có CI/CD pipeline

#### Hướng phát triển
1. 📱 **Mobile App:** React Native / Flutter
2. 🗺️ **Google Maps API:** Vẽ route, ETA chính xác, traffic
3. 💳 **Thêm Payment Gateway:** VNPay, ZaloPay, Stripe
4. 🔔 **Push Notifications:** Firebase Cloud Messaging
5. 🤖 **AI nâng cao:**
   - Recommendation system (collaborative filtering)
   - Demand forecasting
   - Route optimization cho Shipper
6. 🎁 **Loyalty Program:**
   - Membership tiers (Bronze, Silver, Gold, Platinum)
   - Birthday rewards
   - Referral program
7. 📊 **Advanced Analytics:**
   - Dashboard BI cho Merchant
   - Predictive analytics
   - Heatmap đơn hàng
8. 🌐 **Multi-language:** i18n support
9. 🎨 **Theme Customization:** Cho phép user tùy chỉnh giao diện
10. 🏢 **B2B Features:** Corporate accounts, bulk orders
11. 📧 **Email Notifications:** Order confirmation, newsletters
12. 🔍 **SEO Optimization:** Meta tags, sitemap, SSR
13. ☁️ **Cloud Deployment:** AWS/GCP/Azure với auto-scaling
14. 🧪 **Testing:** Jest, React Testing Library, E2E tests
15. 📱 **PWA:** Progressive Web App support

---

### 12. KẾT QUẢ ĐẠT ĐƯỢC

#### Số liệu thống kê
- ✅ **105 chức năng** được triển khai
- ✅ **98% hoàn thành** (103/105 chức năng)
- ✅ **80+ API endpoints**
- ✅ **12 MongoDB collections**
- ✅ **50+ React components**
- ✅ **15.000+ dòng code**
- ✅ **4 vai trò** hoàn chỉnh
- ✅ **Real-time** với Socket.io
- ✅ **GPS tracking** hoạt động
- ✅ **AI Chatbot** tích hợp
- ✅ **Payment gateway** MoMo Sandbox
- ✅ **Gamification** đầy đủ
- ✅ **Responsive** PC + Mobile
- ✅ **Dark mode** support

#### So sánh với các hệ thống hiện có

| Tính năng | FoodServe | Grab Food | ShopeeFood |
|-----------|-----------|-----------|------------|
| Đặt hàng | ✅ | ✅ | ✅ |
| GPS Tracking | ✅ | ✅ | ✅ |
| Thanh toán online | ✅ (MoMo) | ✅ (Nhiều) | ✅ (Nhiều) |
| Chat real-time | ✅ | ✅ | ✅ |
| AI Chatbot | ✅ | ❌ | ❌ |
| Gamification | ✅ (Xu, Vòng quay) | ✅ (Điểm) | ✅ (Xu) |
| Đăng ký đối tác | ✅ | ✅ | ✅ |
| Đánh giá & Review | ✅ | ✅ | ✅ |
| Yêu thích | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ✅ | ✅ |
| Merchant Dashboard | ✅ | ✅ | ✅ |
| Subscription system | ✅ | ✅ | ✅ |
| Voucher management | ✅ | ✅ | ✅ |
| Dark mode | ✅ | ❌ | ❌ |
| Open Source | ✅ | ❌ | ❌ |

---

### 13. TÀI LIỆU THAM KHẢO GỢI Ý

**Công nghệ:**
1. React Documentation - https://react.dev
2. Node.js Best Practices - https://github.com/goldbergyoni/nodebestpractices
3. MongoDB Manual - https://docs.mongodb.com
4. Socket.io Documentation - https://socket.io/docs
5. Express.js Guide - https://expressjs.com
6. JWT Introduction - https://jwt.io/introduction
7. RESTful API Design - https://restfulapi.net

**Payment Integration:**
8. MoMo Developer Documentation
9. Payment Gateway Security Best Practices

**AI & Machine Learning:**
10. Groq AI Documentation - https://console.groq.com/docs
11. Building Chatbots with LLMs

**Kiến trúc hệ thống:**
12. Clean Architecture - Robert C. Martin
13. Designing Data-Intensive Applications - Martin Kleppmann
14. System Design Interview - Alex Xu

**E-commerce & Food Delivery:**
15. Grab Platform Whitepaper
16. ShopeeFood Technical Blog

---

### 14. PHỤ LỤC

#### A. Use Case Diagram (mô tả bằng text)
```
┌─────────────────────────────────────────────────────────────┐
│                      FOODSERVE SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  👤 Customer                  🏪 Merchant                   │
│    - Đăng ký/Đăng nhập          - Đăng ký đối tác          │
│    - Tìm kiếm nhà hàng          - Quản lý menu             │
│    - Đặt hàng                   - Xử lý đơn hàng           │
│    - Thanh toán                 - Xem thống kê             │
│    - Theo dõi GPS               - Thanh toán phí           │
│    - Chat                       - Chat với khách           │
│    - Đánh giá                   - Phản hồi review          │
│    - Chơi game                                             │
│    - Chat AI                                               │
│                                                              │
│  🛵 Shipper                   👑 Admin                     │
│    - Đăng ký tài xế             - Quản lý user             │
│    - Nhận đơn                   - Quản lý nhà hàng         │
│    - GPS tracking               - Quản lý đơn hàng         │
│    - Chat với khách             - Duyệt đối tác            │
│    - Nhận đánh giá              - Duyệt tài xế             │
│    - Kiếm Xu                    - Quản lý voucher          │
│    - Xem thống kê               - Cấu hình hệ thống        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### B. Sequence Diagram - Đặt hàng (mô tả text)
```
Customer → Frontend: Chọn món, thêm vào giỏ
Frontend → Customer: Hiển thị giỏ hàng
Customer → Frontend: Checkout, nhập địa chỉ
Frontend → Customer: Chọn phương thức thanh toán

[COD]
Customer → Frontend: Chọn COD
Frontend → Backend API: POST /api/orders (orderData)
Backend API → MongoDB: Create Order (status: confirmed)
MongoDB → Backend API: Return Order
Backend API → Socket.io: Emit "new-order" to admin, shipper
Backend API → Frontend: Return order ID
Frontend → Customer: Redirect OrderTrackingPage

[MoMo]
Customer → Frontend: Chọn MoMo
Frontend → Backend API: POST /api/payment/momo/create-payment
Backend API → MoMo API: Request payment URL
MoMo API → Backend API: Return paymentUrl
Backend API → Frontend: Return paymentUrl
Frontend → Customer: Redirect to MoMo
Customer → MoMo: Nhập thông tin thẻ, OTP
MoMo → Customer: Xác nhận thanh toán
MoMo → Backend API: IPN callback (POST /api/payment/momo/ipn)
Backend API → MongoDB: Update order (paymentStatus: paid)
Backend API → Socket.io: Emit "payment-confirmed" to shipper, admin
Backend API → MoMo: Return success
MoMo → Frontend: Redirect returnUrl
Frontend → Customer: Hiển thị kết quả thanh toán
```

#### C. Activity Diagram - Shipper giao hàng (mô tả text)
```
[Bắt đầu]
    ↓
Shipper bật Online
    ↓
Hệ thống emit đơn hàng mới (Socket.io)
    ↓
Popup hiện trong 2 phút
    ↓
<Decision: Nhận đơn?>
    [Có] → Gọi API accept-shipper
         → Status: preparing
         → Hiển thị thông tin đơn (món ăn, địa chỉ, SĐT)
         ↓
         <Decision: Món đã sẵn sàng?>
             [Nhà hàng click Ready] → Status: ready
                                    → Shipper đến lấy hàng
                                    ↓
                                    Click "Đã lấy hàng"
                                    → Status: delivering
                                    → Bật GPS tracking (5s/lần)
                                    ↓
                                    <Decision: Đã giao đến khách?>
                                        [Có] → Click "Hoàn thành"
                                             → Status: completed
                                             → Cộng Xu (90% phí ship)
                                             → Khách đánh giá shipper
                                             → [Kết thúc]
    [Không] → Đơn vẫn trong danh sách "Có thể nhận"
           → Shipper khác có thể nhận
           → Sau 2 phút popup tự ẩn
```

#### D. ERD - Entity Relationship Diagram (mô tả text)
```
User (1) ----< (N) Order
User (1) ----< (N) Review
User (1) ----< (N) Favorite
User (1) ----< (N) Message (as sender)
User (1) ----< (N) Notification
User (1) ----< (1) Restaurant (as owner)
User (1) ----< (N) PartnerRequest
User (1) ----< (N) DriverRequest

Restaurant (1) ----< (N) MenuItem
Restaurant (1) ----< (N) Order
Restaurant (1) ----< (N) Review
Restaurant (1) ----< (N) Favorite

Order (1) ----< (N) Message
Order (1) ----< (1) Review

Voucher (N) ----< (N) User (many-to-many via user.vouchers array)

Relationships:
- User (shipper) ----< (N) Order (as shipperId)
- User (admin) ----< (N) PartnerRequest (as reviewedBy)
- User (admin) ----< (N) DriverRequest (as reviewedBy)
- User (admin) ----< (N) Voucher (as createdBy)
```

#### E. Component Diagram (Frontend - mô tả text)
```
┌────────────────────────────────────────────────────────────┐
│                        App.jsx                             │
│  - React Router                                            │
│  - Redux Provider                                          │
│  - Socket.io Connection                                    │
└────────────────┬───────────────────────────────────────────┘
                 │
     ┌───────────┼───────────┬─────────────┬──────────────┐
     ▼           ▼           ▼             ▼              ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
│  Layout │ │  Pages  │ │ Auth    │ │ Cart     │ │ Chat     │
│         │ │         │ │ Modal   │ │ Sidebar  │ │ Button   │
│ - Header│ │ - Home  │ │         │ │          │ │          │
│ - Bottom│ │ - Rest. │ │ - Login │ │ - Items  │ │ - Socket │
│   Nav   │ │ - Chk.  │ │ - Reg.  │ │ - Total  │ │ - Msgs   │
│ - Notif │ │ - Track │ │ - Forgot│ │ - Vouch. │ │          │
│   Bell  │ │ - Profile│ │ - Reset│ │          │ │          │
│         │ │ - Admin │ │         │ │          │ │          │
│         │ │ - Shpr. │ │         │ │          │ │          │
│         │ │ - Merch.│ │         │ │          │ │          │
└─────────┘ └─────────┘ └─────────┘ └──────────┘ └──────────┘
     │           │           │             │              │
     └───────────┴───────────┴─────────────┴──────────────┘
                             │
                     ┌───────┴───────┐
                     ▼               ▼
                ┌─────────┐     ┌─────────┐
                │  Redux  │     │ Socket  │
                │  Store  │     │ Events  │
                │         │     │         │
                │ - auth  │     │ - emit  │
                │ - cart  │     │ - on    │
                │ - ui    │     │         │
                │ - rest. │     │         │
                └─────────┘     └─────────┘
```

#### F. Deployment Diagram (mô tả text)
```
┌────────────────────────────────────────────────────────────┐
│                     USER DEVICES                           │
│  - Desktop Browser (Chrome, Firefox, Safari)               │
│  - Mobile Browser (Chrome Mobile, Safari iOS)              │
└─────────────────────┬──────────────────────────────────────┘
                      │ HTTPS / WSS
                      ▼
┌────────────────────────────────────────────────────────────┐
│                   WEB SERVER (Localhost)                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Frontend Server (Vite Dev Server)                   │ │
│  │  - Port: 3000                                        │ │
│  │  - Hot Module Replacement                            │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Backend Server (Node.js + Express)                  │ │
│  │  - Port: 5000                                        │ │
│  │  - RESTful API                                       │ │
│  │  - Socket.io Server                                  │ │
│  │  - Middleware: Auth, Logger, Error Handler           │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────┬──────────────────────────────────────┘
                      │
         ┌────────────┼────────────┬──────────────┐
         ▼            ▼            ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐
│   MongoDB    │ │  MoMo    │ │  Groq    │ │OpenStreet │
│   Atlas      │ │  API     │ │  AI API  │ │  Map      │
│   (Cloud)    │ │ (Payment)│ │(Chatbot) │ │  (Maps)   │
└──────────────┘ └──────────┘ └──────────┘ └───────────┘
```

---

### 15. YÊU CẦU VỚI BÁO CÁO

#### Định dạng
- **Font:** Times New Roman, 13pt
- **Line spacing:** 1.5
- **Margins:** 2cm mỗi bên
- **Trang bìa:** Theo mẫu trường
- **Số trang:** Tối thiểu 80 trang

#### Nội dung
- **Ngôn ngữ:** Tiếng Việt, học thuật, chuyên nghiệp
- **Hình ảnh:** Chèn screenshots giao diện, diagrams
- **Bảng biểu:** Thống kê chi tiết
- **Mã nguồn:** Chỉ đưa phần quan trọng vào Phụ lục
- **Trích dẫn:** Đánh số và liệt kê đầy đủ

#### Các chương cần chi tiết
1. **PHẦN I - GIỚI THIỆU:**
   - Giải thích lý do chọn đề tài (xu hướng đặt đồ ăn online, COVID-19 impact)
   - Nêu rõ mục tiêu: Xây dựng hệ thống hoàn chỉnh 4 vai trò
   - Phạm vi: Chức năng nào có, chức năng nào chưa

2. **PHẦN II - CƠ SỞ LÝ THUYẾT:**
   - Giải thích chi tiết từng công nghệ (React, Node, MongoDB, Socket.io)
   - So sánh ưu nhược điểm
   - Tại sao chọn stack này

3. **PHẦN III - PHÂN TÍCH & THIẾT KẾ:**
   - Vẽ Use Case Diagram cho 4 vai trò
   - Sequence Diagram cho các luồng chính
   - ERD chi tiết với relationships
   - Wireframe/Mockup giao diện

4. **PHẦN IV - XÂY DỰNG:**
   - Giải thích implementation các tính năng nổi bật
   - Code snippets quan trọng
   - Giải thích logic phức tạp

5. **PHẦN V - ĐÁNH GIÁ:**
   - Thống kê kết quả test
   - So sánh với hệ thống tương tự
   - Ưu điểm của FoodServe

6. **PHẦN VI - KẾT LUẬN:**
   - Tổng kết những gì đã làm
   - Thành tựu đạt được
   - Bài học kinh nghiệm
   - Hướng phát triển cụ thể

---

## 🎯 KẾT LUẬN

Đây là tất cả thông tin chi tiết về dự án **FoodServe**. Hãy dựa trên những thông tin này để viết một **báo cáo đồ án tốt nghiệp** hoàn chỉnh, chuyên nghiệp, học thuật, với:

✅ Cấu trúc rõ ràng theo 6 phần
✅ Nội dung chi tiết, có chiều sâu
✅ Hình ảnh, diagrams minh họa
✅ Bảng biểu thống kê
✅ Trích dẫn tài liệu đầy đủ
✅ Tối thiểu 80 trang

**Lưu ý quan trọng:**
- Viết bằng tiếng Việt chuyên nghiệp
- Sử dụng thuật ngữ kỹ thuật chính xác
- Giải thích rõ ràng, dễ hiểu
- Có phân tích, đánh giá, không chỉ liệt kê
- Nhấn mạnh các tính năng nổi bật (MoMo, AI, GPS, Gamification)
- Thể hiện sự hiểu biết sâu về công nghệ

---

**BẮT ĐẦU VIẾT BÁO CÁO!** 🚀
