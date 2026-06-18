# 📋 BÁO CÁO NHANH DỰ ÁN — FoodServe
> Ứng dụng đặt đồ ăn online | Đồ án môn học
> Cập nhật: 06/06/2026

---

## 1. 📌 DANH SÁCH CHỨC NĂNG & TỈ LỆ HOÀN THÀNH

### 🔐 Module Xác thực & Tài khoản — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Đăng ký tài khoản | ✅ Hoàn thành |
| 2 | Đăng nhập (JWT) | ✅ Hoàn thành |
| 3 | Quên mật khẩu (OTP 6 số, hết hạn 5 phút) | ✅ Hoàn thành |
| 4 | Đổi mật khẩu (có thanh độ mạnh) | ✅ Hoàn thành |
| 5 | Cập nhật hồ sơ & avatar | ✅ Hoàn thành |
| 6 | Phân quyền: user / shipper / merchant / admin | ✅ Hoàn thành |

---

### 🏠 Module Trang chủ & Tìm kiếm — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Hero Banner + Floating animations | ✅ Hoàn thành |
| 2 | Danh sách nhà hàng (card đẹp) | ✅ Hoàn thành |
| 3 | Tìm kiếm nhà hàng theo tên | ✅ Hoàn thành |
| 4 | Tìm kiếm món ăn cross-restaurant | ✅ Hoàn thành |
| 5 | Lọc theo danh mục (Phở, Cơm, Gà rán, ...) | ✅ Hoàn thành |
| 6 | Lọc theo rating, khoảng cách, số đơn | ✅ Hoàn thành |
| 7 | Tất cả món ăn section | ✅ Hoàn thành |
| 8 | Dark mode | ✅ Hoàn thành |
| 9 | Responsive (PC + Mobile) | ✅ Hoàn thành |

---

### 🛒 Module Đặt hàng & Giỏ hàng — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Thêm món vào giỏ (Cart Sidebar) | ✅ Hoàn thành |
| 2 | Cập nhật số lượng, xóa món | ✅ Hoàn thành |
| 3 | Miễn phí ship đơn trên 100.000đ | ✅ Hoàn thành |
| 4 | Áp mã giảm giá (validate API) | ✅ Hoàn thành |
| 5 | Hiện voucher có sẵn (quick-apply) | ✅ Hoàn thành |
| 6 | Trang Checkout (địa chỉ, ghi chú) | ✅ Hoàn thành |
| 7 | Theo dõi đơn hàng real-time | ✅ Hoàn thành |
| 8 | Lịch sử đơn hàng | ✅ Hoàn thành |

---

### 💳 Module Thanh toán — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Thanh toán tiền mặt (COD) | ✅ Hoàn thành |
| 2 | Thanh toán MoMo Sandbox (tích hợp đầy đủ) | ✅ Hoàn thành |
| 3 | Thanh toán bằng Xu tích lũy | ✅ Hoàn thành |
| 4 | IPN Callback xử lý tự động | ✅ Hoàn thành |
| 5 | Trang kết quả thanh toán (success/fail) | ✅ Hoàn thành |
| 6 | Thông báo "đã thanh toán MoMo" → shipper & nhà hàng | ✅ Hoàn thành |
| 7 | Hiển thị 0đ khi thanh toán online thành công | ✅ Hoàn thành |

---

### 🛵 Module Shipper — 95%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Dashboard riêng (online/offline toggle) | ✅ Hoàn thành |
| 2 | Nhận đơn real-time (popup 2 phút, tự ẩn) | ✅ Hoàn thành |
| 3 | Danh sách "Đơn có thể nhận" (đơn bị bỏ lỡ) | ✅ Hoàn thành |
| 4 | Tính phí ship theo km (1km = 5.000đ) | ✅ Hoàn thành |
| 5 | Cập nhật GPS real-time | ✅ Hoàn thành |
| 6 | Địa chỉ lấy hàng → giao hàng (tự chuyển bước) | ✅ Hoàn thành |
| 7 | Chat với khách hàng | ✅ Hoàn thành |
| 8 | Nhận đánh giá từ khách | ✅ Hoàn thành |
| 9 | Thống kê tổng đơn đã giao | ✅ Hoàn thành |
| 10 | Lịch sử đơn đã giao | ✅ Hoàn thành |
| 11 | Kiếm Xu (90% phí ship mỗi đơn) | ✅ Hoàn thành |
| 12 | Thông báo khi khách thanh toán online | ✅ Hoàn thành |
| 13 | Sửa thông tin cá nhân (SĐT, tên, avatar) | ✅ Hoàn thành |
| 14 | Đăng ký làm tài xế (chờ admin duyệt) | ✅ Hoàn thành |
| 15 | Bản đồ Leaflet định vị thực tế + Route Navigation | ✅ Hoàn thành |

---

### 🏪 Module Nhà hàng (Merchant/Partner) — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Trang chi tiết nhà hàng + menu | ✅ Hoàn thành |
| 2 | Đăng ký làm đối tác (chờ admin duyệt) | ✅ Hoàn thành |
| 3 | Quản lý menu: thêm / sửa / xóa món | ✅ Hoàn thành |
| 4 | Upload ảnh món ăn & nhà hàng (Multer) | ✅ Hoàn thành |
| 5 | Thống kê doanh thu theo biểu đồ (Recharts) | ✅ Hoàn thành |
| 6 | Hệ thống phí duy trì hàng tháng (subscription) | ✅ Hoàn thành |
| 7 | Thanh toán phí bằng Xu hoặc chuyển khoản | ✅ Hoàn thành |
| 8 | Phản hồi đánh giá của khách | ✅ Hoàn thành |

---

### 👑 Module Admin — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Dashboard tổng quan | ✅ Hoàn thành |
| 2 | Quản lý đơn hàng (xem + cập nhật trạng thái) | ✅ Hoàn thành |
| 3 | Quản lý người dùng (sửa / xóa / tìm kiếm) | ✅ Hoàn thành |
| 4 | Quản lý nhà hàng & menu | ✅ Hoàn thành |
| 5 | Duyệt đăng ký đối tác | ✅ Hoàn thành |
| 6 | Quản lý tài xế (xem, duyệt, khóa, xóa) | ✅ Hoàn thành |
| 7 | Duyệt yêu cầu thanh toán phí duy trì | ✅ Hoàn thành |
| 8 | Quản lý Voucher (tạo/sửa/xóa/phát/export) | ✅ Hoàn thành |
| 9 | Phát voucher theo nhóm (user/shipper/merchant) | ✅ Hoàn thành |
| 10 | Cấu hình hệ thống | ✅ Hoàn thành |
| 11 | Thông báo real-time (đơn mới, thanh toán) | ✅ Hoàn thành |

---

### 🔔 Module Thông báo Real-time — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Thông báo đơn hàng mới (admin + shipper) | ✅ Hoàn thành |
| 2 | Thông báo cập nhật trạng thái đơn | ✅ Hoàn thành |
| 3 | Thông báo xác nhận thanh toán online | ✅ Hoàn thành |
| 4 | Cảnh báo hết hạn subscription nhà hàng | ✅ Hoàn thành |
| 5 | Âm thanh thông báo | ✅ Hoàn thành |
| 6 | Notification Bell với badge số chưa đọc | ✅ Hoàn thành |

---

### 💬 Module Chat — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Chat real-time (Socket.io) giữa khách & shipper | ✅ Hoàn thành |
| 2 | Chat Button floating | ✅ Hoàn thành |
| 3 | Danh sách tin nhắn với avatar | ✅ Hoàn thành |
| 4 | Trạng thái đã đọc / chưa đọc | ✅ Hoàn thành |

---

### 🤖 Module FoodBot AI — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Chat AI (Groq - Llama 3.1-8b) | ✅ Hoàn thành |
| 2 | Gợi ý món ăn theo ngữ cảnh (thời tiết, tâm trạng) | ✅ Hoàn thành |
| 3 | Dữ liệu gợi ý từ menu thực tế trong DB | ✅ Hoàn thành |
| 4 | Nút "Đặt ngay" từ chat → điều hướng nhà hàng | ✅ Hoàn thành |
| 5 | Trả lời câu hỏi về FoodServe | ✅ Hoàn thành |
| 6 | Từ chối lịch sự khi hỏi ngoài phạm vi | ✅ Hoàn thành |
| 7 | Fallback thông minh khi không có API key | ✅ Hoàn thành |

---

### 🎮 Module Gamification — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Hệ thống Xu tích lũy | ✅ Hoàn thành |
| 2 | Vòng quay may mắn (đổi Xu lấy voucher) | ✅ Hoàn thành |
| 3 | Bảng xếp hạng người dùng | ✅ Hoàn thành |
| 4 | Kho voucher cá nhân | ✅ Hoàn thành |
| 5 | Tích Xu khi đặt đơn | ✅ Hoàn thành |

---

### ⭐ Module Đánh giá — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Đánh giá & review nhà hàng (1-5 sao) | ✅ Hoàn thành |
| 2 | Đánh giá tài xế sau giao hàng | ✅ Hoàn thành |
| 3 | Nhà hàng phản hồi review | ✅ Hoàn thành |
| 4 | Hiển thị danh sách review | ✅ Hoàn thành |

---

### ❤️ Module Yêu thích — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Yêu thích nhà hàng (toggle ❤️) | ✅ Hoàn thành |
| 2 | Trang danh sách nhà hàng yêu thích | ✅ Hoàn thành |
| 3 | Lưu trữ trong DB (persist) | ✅ Hoàn thành |

---

### 🗺️ Module GPS Tracking — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Cập nhật vị trí GPS shipper real-time | ✅ Hoàn thành |
| 2 | Bản đồ Leaflet.js (OpenStreetMap) | ✅ Hoàn thành |
| 3 | Hiển thị vị trí shipper trên bản đồ | ✅ Hoàn thành |
| 4 | Route navigation thực tế (vẽ đường đi OSRM) | ✅ Hoàn thành |

---

### 🎫 Module Voucher — 100%
| STT | Chức năng | Trạng thái |
|-----|-----------|-----------|
| 1 | Tạo / Sửa / Xóa voucher | ✅ Hoàn thành |
| 2 | Validate voucher khi checkout | ✅ Hoàn thành |
| 3 | Phát voucher cho nhóm (user/shipper/merchant) | ✅ Hoàn thành |
| 4 | Tìm kiếm & lọc voucher (Admin) | ✅ Hoàn thành |
| 5 | Xem chi tiết & thống kê voucher | ✅ Hoàn thành |
| 6 | Nhân bản voucher | ✅ Hoàn thành |
| 7 | Export danh sách voucher (CSV) | ✅ Hoàn thành |
| 8 | Quick-apply voucher có sẵn (CartSidebar) | ✅ Hoàn thành |

---

## 📊 TỔNG KẾT TỈ LỆ HOÀN THÀNH

| Module | Chức năng | Hoàn thành | Tỉ lệ |
|--------|-----------|-----------|-------|
| Xác thực & Tài khoản | 6 | 6 | **100%** |
| Trang chủ & Tìm kiếm | 9 | 9 | **100%** |
| Đặt hàng & Giỏ hàng | 8 | 8 | **100%** |
| Thanh toán | 7 | 7 | **100%** |
| Shipper | 15 | 15 | **100%** |
| Nhà hàng (Merchant) | 8 | 8 | **100%** |
| Admin | 11 | 11 | **100%** |
| Thông báo Real-time | 6 | 6 | **100%** |
| Chat | 4 | 4 | **100%** |
| FoodBot AI | 7 | 7 | **100%** |
| Gamification | 5 | 5 | **100%** |
| Đánh giá | 4 | 4 | **100%** |
| Yêu thích | 3 | 3 | **100%** |
| GPS Tracking | 4 | 4 | **100%** |
| Voucher | 8 | 8 | **100%** |
| **TỔNG** | **105** | **105** | **🎯 100%** |

> ✅ **DỰ ÁN HOÀN THÀNH 100%!** - Tất cả tính năng đã được triển khai đầy đủ, bao gồm Route Navigation với vẽ đường đi thực tế sử dụng OSRM.

---

## 2. 🔗 LINK TÀI NGUYÊN DỰ ÁN

### 📦 Source Code
| Tài nguyên | Link |
|------------|------|
| **GitHub Repository** | https://github.com/Quyenlacdev04/FoodServe |
| **Branch chính** | `main` |
| **Commit mới nhất** | `2d229bb` — Major update: MoMo payment, FoodBot AI, Shipper, Admin |

### 📁 Tài liệu
| Tài nguyên | Ghi chú |
|------------|---------|
| Google Drive | *(Chưa thiết lập — cần upload tài liệu)* |
| ERD / Database Design | *(Có thể export từ MongoDB Compass)* |

### 🗄️ Cơ sở dữ liệu (MongoDB Atlas)
| Thông tin | Chi tiết |
|-----------|---------|
| **Loại CSDL** | MongoDB Atlas (NoSQL Cloud) |
| **Kết nối** | Xem `server/.env` → `MONGODB_URI` |
| **Collections** | 12 collections |

#### Danh sách Collections:
```
users          — Tài khoản (user / shipper / merchant / admin)
restaurants    — Nhà hàng
menuitems      — Món ăn
orders         — Đơn hàng
reviews        — Đánh giá
messages       — Tin nhắn chat
notifications  — Thông báo
favorites      — Nhà hàng yêu thích
vouchers       — Mã giảm giá
partnerrequests — Yêu cầu đăng ký đối tác
driverrequests  — Yêu cầu đăng ký tài xế
systemsettings  — Cấu hình hệ thống
```

---

## 3. 🌐 THÔNG TIN DOMAIN

| Thông tin | Chi tiết |
|-----------|---------|
| **Domain thực tế** | *(Chưa có — dự án chạy local)* |
| **Frontend (Dev)** | http://localhost:3000 |
| **Backend API** | http://localhost:5000 |
| **Admin Panel** | http://localhost:3000/admin-login |

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| React | 18.3.1 | UI Framework |
| Vite | 5.4.0 | Build Tool |
| TailwindCSS | 3.4.7 | Styling |
| Framer Motion | 11.3.0 | Animations |
| Redux Toolkit | 2.2.0 | State Management |
| React Router | 6.26.0 | Routing |
| Socket.io-client | 4.7.0 | Real-time |
| React Leaflet | 4.2.1 | Bản đồ |
| Recharts | 3.8.1 | Biểu đồ |
| Swiper | 11.1.0 | Carousel |

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| Node.js + Express | 4.19.0 | API Server |
| MongoDB + Mongoose | 8.5.0 | Database |
| Socket.io | 4.7.0 | Real-time WebSocket |
| JWT | 9.0.0 | Authentication |
| Multer | 1.4.5 | Upload ảnh |
| Nodemailer | 6.9.13 | Gửi OTP email |
| Groq SDK | 0.9.1 | AI Chatbot |
| Node-cron | 4.2.1 | Scheduled tasks |
| bcryptjs | 2.4.3 | Hash password |

### Dịch vụ ngoài
| Dịch vụ | Mục đích | Trạng thái |
|---------|---------|-----------|
| MongoDB Atlas | Cloud Database | ✅ Đang dùng |
| MoMo Sandbox | Thanh toán | ✅ Tích hợp |
| Groq AI | FoodBot Chatbot | ✅ Tích hợp |
| OpenStreetMap | Bản đồ (Leaflet) | ✅ Đang dùng |
| Gmail SMTP | Gửi OTP | ✅ Cấu hình |

---

## 👥 PHÂN QUYỀN HỆ THỐNG

| Role | Quyền hạn |
|------|----------|
| `user` | Đặt hàng, chat, đánh giá, minigame, voucher |
| `shipper` | Nhận đơn, GPS, chat, xem lịch sử giao |
| `merchant` | Quản lý nhà hàng, menu, thống kê doanh thu |
| `admin` | Toàn quyền hệ thống |

---

## 🔑 TÀI KHOẢN DEMO

| Email | Mật khẩu | Role |
|-------|---------|------|
| demo@foodserve.vn | 123456 | Khách hàng |
| admin@foodserve.vn | admin123 | Admin |

---

## 🎫 MÃ VOUCHER DEMO

| Mã | Ưu đãi | Đơn tối thiểu |
|----|--------|--------------|
| FOOD50 | Giảm 50.000đ | 150.000đ |
| FREESHIP | Giảm 25.000đ | Không giới hạn |
| NEW30 | Giảm 30.000đ | 100.000đ |
| SALE20 | Giảm 20.000đ | Không giới hạn |
| VIP100 | Giảm 100.000đ | 300.000đ |

---

## 🧪 TEST THANH TOÁN MOMO

| Số thẻ ATM | Tên | Ngày HH | OTP | Kết quả |
|-----------|-----|---------|-----|---------|
| 9704 0000 0000 0018 | NGUYEN VAN A | 03/07 | otp | ✅ Thành công |
| 9704 0000 0000 0026 | NGUYEN VAN A | 03/07 | otp | ❌ Thẻ khóa |
| 9704 0000 0000 0034 | NGUYEN VAN A | 03/07 | otp | ❌ Không đủ số dư |

---

## ▶️ HƯỚNG DẪN CHẠY DỰ ÁN

```bash
# Terminal 1 — Frontend (port 3000)
npm install
npm run dev

# Terminal 2 — Backend API (port 5000)
cd server
npm install
npm run dev
```

---

*FoodServe — Đồ án môn học | Xây dựng với ❤️ bởi nhóm SV*
