# ⚠️ CẦN RESTART SERVER

## Vấn đề hiện tại:

Route `/api/security/incidents` không tồn tại vì server chưa load code mới.

## ✅ Giải pháp:

### 1. STOP server hiện tại
Vào terminal đang chạy server, nhấn **Ctrl + C**

### 2. START lại server
```bash
cd server
npm run dev
```

### 3. Kiểm tra server đã load routes
Sau khi server restart, bạn sẽ thấy log:
```
🚀 FoodServe API running on http://localhost:5000
📡 Socket.io ready
⏰ Subscription checker scheduled (daily at 9:00 AM)
```

### 4. Test API endpoint
Mở browser vào: http://localhost:5000/api/health

Nếu thấy response:
```json
{"status":"ok","message":"FoodServe API is running 🚀"}
```
→ Server đã sẵn sàng!

### 5. Refresh Admin Dashboard
- F5 để refresh
- Nhấn lại vào "🛡️ AI Security Monitor"
- Bạn sẽ thấy 5 incidents!

---

## 🎯 Quick Commands

```bash
# Terminal 1 - Stop và Restart Server
cd d:\ỨNG DỤNG\FoodServe\server
# Nhấn Ctrl+C để stop
npm run dev

# Terminal 2 - Frontend vẫn chạy, không cần động gì
```

---

## ✅ Sau khi restart, chạy lại:

```bash
node server/createTestIncidents.js
```

Rồi refresh trang Admin → Security Monitor!

---

**Lý do:** Khi thêm routes mới, server cần restart để load code mới vào memory.
