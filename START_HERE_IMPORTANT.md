# ⚠️ QUAN TRỌNG - ĐỌC TRƯỚC KHI TEST

## ❌ Tại sao không thấy gì?

**Vì server backend CHƯA được restart sau khi thêm code mới!**

Routes API `/api/security/*` chưa tồn tại trong server đang chạy.

---

## ✅ GIẢI PHÁP DUY NHẤT

### BẮT BUỘC phải làm theo từng bước:

## 📍 Bước 1: Tìm terminal đang chạy server

Tìm terminal có dòng text:
```
🚀 FoodServe API running on http://localhost:5000
```

## 📍 Bước 2: Stop server

Trong terminal đó, nhấn: **`Ctrl + C`**

## 📍 Bước 3: Chạy lại server

Trong terminal vừa stop, gõ:
```bash
cd server
npm run dev
```

Đợi đến khi thấy:
```
🚀 FoodServe API running on http://localhost:5000
📡 Socket.io ready
⏰ Subscription checker scheduled
```

## 📍 Bước 4: Test API có hoạt động chưa

Mở browser vào: **http://localhost:5000/api/health**

Nếu thấy:
```json
{"status":"ok","message":"FoodServe API is running 🚀"}
```
→ ✅ Server đã sẵn sàng!

## 📍 Bước 5: Tạo test incidents

Mở terminal MỚI (không phải terminal đang chạy server), gõ:
```bash
cd "d:\ỨNG DỤNG\FoodServe"
node server/createTestIncidents.js
```

Sẽ thấy:
```
✅ Created: sql_injection (critical)
✅ Created: xss (high)
✅ Created: brute_force (medium)
✅ Created: ddos (critical)
✅ Created: path_traversal (high)
```

## 📍 Bước 6: Vào Admin Dashboard

1. Mở browser: **http://localhost:3000/admin-login.html**
2. Login: `admin@foodserve.vn` / `admin123`
3. Nhấn **"🛡️ AI Security Monitor"**
4. **Nhấn F5** để load data

→ Bạn sẽ thấy 5 incidents!

---

## 🔍 Kiểm tra server đã restart chưa?

Chạy lệnh này:
```powershell
Invoke-WebRequest http://localhost:5000/api/security/dashboard -UseBasicParsing
```

- **Nếu lỗi 404**: Server chưa restart → Quay lại Bước 1
- **Nếu lỗi 401 (Unauthorized)**: ✅ Server đã OK! → Tiếp tục Bước 5

---

## 💡 TÓM TẮT

```
1. Ctrl+C (Stop server cũ)
2. npm run dev (Start server mới)  ← QUAN TRỌNG NHẤT
3. node server/createTestIncidents.js
4. Vào Admin → Security Monitor
5. F5
6. Xem kết quả! ✅
```

---

## ❓ Vẫn không thấy gì?

Chụp màn hình:
1. Terminal đang chạy server (phải thấy "FoodServe API running")
2. Browser console (F12 → Console tab)
3. Trang Security Monitor

Để tôi debug cho bạn!

---

**Không restart server = Không có routes mới = Không thấy gì!** 🚫
