# 🚀 QUICK START - FOODSERVE

## Khởi động nhanh trong 3 bước

### 1️⃣ Cài đặt dependencies
```bash
# Root folder
npm install

# Server folder
cd server
npm install
cd ..
```

### 2️⃣ Khởi động ứng dụng
```bash
npm run dev:all
```

Lệnh này sẽ chạy đồng thời:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 3️⃣ Đăng nhập và test

#### Tài khoản demo:
- **Khách hàng**: demo@foodserve.vn / 123456
- **Nhà hàng**: merchant@foodserve.vn / 123456
- **Shipper**: shipper@foodserve.vn / 123456
- **Admin**: admin@foodserve.vn / admin123

---

## 📋 Checklist test nhanh

### ✅ Test cơ bản (5 phút)
1. Đăng nhập khách hàng
2. Tìm kiếm nhà hàng "pizza"
3. Thêm món vào giỏ
4. Checkout và đặt hàng
5. Xem OrderTracking

### ✅ Test đầy đủ (15 phút)
1. **Khách hàng**:
   - Tìm kiếm & lọc nhà hàng
   - Lưu yêu thích ❤️
   - Đặt hàng với VNPay/Xu
   - Theo dõi đơn hàng
   - Chat với nhà hàng/shipper

2. **Nhà hàng**:
   - Vào /restaurant-manage
   - Xem đơn hàng mới
   - Cập nhật trạng thái
   - Chat với khách

3. **Shipper**:
   - Vào /shipper
   - Nhận đơn hàng
   - Cập nhật trạng thái giao hàng
   - Xem bản đồ GPS
   - Chat với khách

---

## 📚 Tài liệu chi tiết

- `COMPLETION_SUMMARY.md` - Tổng quan dự án
- `FRONTEND_PROGRESS.md` - Tiến độ chi tiết
- `CHAT_TESTING_GUIDE.md` - Hướng dẫn test chat
- `GPS_TRACKING_GUIDE.md` - Hướng dẫn test GPS

---

## 🆘 Troubleshooting

### Lỗi "Port already in use"
```bash
# Kill process trên port 3000 hoặc 5000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Hoặc đổi port trong package.json
```

### Lỗi "Cannot connect to MongoDB"
```bash
# Kiểm tra MongoDB đang chạy
# Hoặc cập nhật connection string trong server/.env
```

### Lỗi "Google Maps not loading"
```bash
# Kiểm tra API key trong src/hooks/useGoogleMaps.js
# Hoặc dùng fallback SimpleMapView
```

---

## 🎯 Tính năng chính

✅ Tìm kiếm & Lọc nâng cao  
✅ Yêu thích nhà hàng  
✅ Thanh toán VNPay & Xu  
✅ Shipper Dashboard  
✅ Chat real-time  
✅ GPS Tracking real-time  

---

**Happy coding! 🎉**
