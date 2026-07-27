# 🧪 Hướng dẫn Test cuộc tấn công giả

## 📋 Mục đích

Script này tạo các cuộc tấn công giả để demo và test tính năng **AI Security Monitor**.

## 🚀 Cách chạy

### Chuẩn bị:

1. **Chạy Backend:**
```bash
cd server
npm run dev
```

2. **Chạy Frontend:**
```bash
npm run dev
```

3. **Mở Admin Dashboard:**
- Vào: http://localhost:3000/admin-login.html
- Đăng nhập: `admin@foodserve.vn` / `admin123`
- Nhấn vào **"🛡️ AI Security Monitor"**
- Để trang này mở để xem real-time

---

### Chọn 1 trong 3 cách:

## ✅ Cách 1: Batch Script (Đơn giản nhất - Windows)

Mở terminal trong thư mục gốc, chạy:

```bash
test-security.bat
```

✨ **Ưu điểm:** Chạy nhanh, không cần cài gì thêm!

---

## ✅ Cách 2: PowerShell Script (Mạnh mẽ hơn - Windows)

Mở PowerShell trong thư mục gốc, chạy:

```powershell
.\Test-Security.ps1
```

Nếu gặp lỗi "execution policy", chạy trước:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\Test-Security.ps1
```

✨ **Ưu điểm:** Output đẹp hơn, có màu sắc, chi tiết hơn!

---

## ✅ Cách 3: Node.js Script (Cross-platform)

Chạy trong thư mục `server`:

```bash
cd server
node testSecurity.js
```

⚠️ **Lưu ý:** Cần cài `node-fetch`:
```bash
npm install node-fetch
```

✨ **Ưu điểm:** Chạy được trên cả Windows, Mac, Linux!

---

## 🎯 Các cuộc tấn công được tạo

Script sẽ tạo **6 loại tấn công** theo thứ tự:

### 1. 💉 SQL Injection (4 payloads)
```
admin' OR '1'='1
'; DROP TABLE users--
' UNION SELECT * FROM users--
admin' AND 1=1--
```

### 2. ⚠️ XSS Attack (4 payloads)
```html
<script>alert('XSS')</script>
<img src=x onerror=alert(1)>
javascript:alert('XSS')
<iframe src='javascript:alert(1)'></iframe>
```

### 3. 🔨 Brute Force (8 passwords)
```
123456, password, 123456789, qwerty, abc123, 
password123, 111111, 123123
```

### 4. 🌊 DDoS Attack
```
105 requests đồng thời
(Vượt quá rate limit: 100 requests/phút)
```

### 5. 📁 Path Traversal (4 paths)
```
../../../../etc/passwd
..\..\..\windows\system32\config\sam
%2e%2e%2fetc%2fpasswd
....//....//etc/passwd
```

### 6. 👁️ Suspicious Activity (3 requests)
```
DELETE /api/users/all
POST /api/admin/delete-database
GET /api/users/passwords
```

---

## 📊 Kết quả mong đợi

Sau khi chạy script, trong **Admin Dashboard → Security Monitor** bạn sẽ thấy:

### Stats:
- **Tổng mối đe dọa**: ~23 incidents
- **Critical**: 4-8 incidents (SQL Injection, XSS nghiêm trọng)
- **High**: 5-10 incidents (Brute Force, DDoS, XSS)
- **Medium**: 5-8 incidents (Path Traversal, Suspicious)

### Danh sách incidents:
```
┌──────────────────────────────────────────────┐
│ 💉 SQL Injection     🔴 Critical             │
│ 💉 SQL Injection     🔴 Critical             │
│ ⚠️ XSS Attack        🟠 High                 │
│ ⚠️ XSS Attack        🟠 High                 │
│ 🔨 Brute Force       🟡 Medium               │
│ 🌊 DDoS Attack       🔴 Critical             │
│ 📁 Path Traversal    🟡 Medium               │
│ 👁️ Suspicious        🟡 Medium               │
└──────────────────────────────────────────────┘
```

### Badge cảnh báo:
```
🛡️ AI Security Monitor [🔴 23]
                       ↑
              Số incidents mới
```

### Real-time alerts:
- ✅ Popup thông báo góc phải màn hình
- ✅ Âm thanh cảnh báo
- ✅ Toast notification
- ✅ Badge đỏ trong sidebar

---

## 🧪 Test Auto-fix

Sau khi tạo xong các cuộc tấn công:

1. **Nhấn vào một incident** (ví dụ: SQL Injection)
2. Modal chi tiết sẽ hiện ra với:
   - 📋 Mô tả
   - 🔍 Chi tiết kỹ thuật (IP, endpoint, payload)
   - 🤖 Phân tích AI (threat level, recommendation)
   - ✅ Hành động đề xuất

3. **Nhấn nút "⚡ Tự động sửa lỗi (AI)"**
4. Progress bar sẽ chạy:
   ```
   🔧 Đang tự động sửa lỗi... 30%
   🔧 Đang tự động sửa lỗi... 60%
   🔧 Đang tự động sửa lỗi... 90%
   ✅ Đã sửa thành công! 100%
   ```

5. Incident chuyển sang trạng thái **"Đã sửa"**

6. Xem chi tiết fix:
   ```
   ✅ Đã thêm input validation
   ✅ Đã cập nhật parameterized queries
   ✅ Đã chặn IP 127.0.0.1
   ✅ Đã scan database logs
   ```

---

## 🚫 IP Blocking

Các IP sẽ bị chặn tự động:

### Critical incidents:
- **SQL Injection**: Chặn 24 giờ
- **DDoS**: Chặn 1 giờ

### Xem IP bị chặn:
Scroll xuống cuối trang Security Monitor:

```
┌────────────────────────────────────────┐
│ 🚫 IP bị chặn (2)                      │
├────────────────────────────────────────┤
│ 127.0.0.1                              │
│ SQL Injection attack                   │
│ Còn: 1439 phút                         │
│                        [Unblock] ←─────│
└────────────────────────────────────────┘
```

### Unblock IP:
Nhấn nút **"Unblock"** → IP sẽ được gỡ chặn ngay

---

## 📈 Dashboard Analytics

Xem thống kê chi tiết:

### By Status:
- Phát hiện: 23
- Đang phân tích: 0
- Đã sửa: 0
- Bỏ qua: 0

### By Severity:
- Critical: 8
- High: 10
- Medium: 5
- Low: 0

### By Type:
- SQL Injection: 4
- XSS: 4
- Brute Force: 8
- DDoS: 1
- Path Traversal: 4
- Suspicious: 3

---

## 💡 Tips

### 1. Chạy nhiều lần
Bạn có thể chạy script nhiều lần để tạo nhiều incidents hơn:
```bash
test-security.bat
# Chờ 1 phút
test-security.bat
# Chờ 1 phút
test-security.bat
```

### 2. Test từng loại tấn công
Sửa script để chỉ chạy 1 loại:
- Comment out các hàm không cần test
- Chạy lại script

### 3. Monitor real-time
- Mở 2 màn hình
- Màn hình 1: Admin Dashboard
- Màn hình 2: Chạy script
- Xem real-time alerts!

### 4. Test unblock IP
- Sau khi IP bị chặn
- Thử chạy lại script → Sẽ bị reject
- Unblock IP
- Chạy lại → OK!

---

## 🐛 Troubleshooting

### Script báo lỗi "Server không phản hồi"
**Nguyên nhân:** Server chưa chạy

**Giải pháp:**
```bash
cd server
npm run dev
```

### Không thấy incidents trong Dashboard
**Nguyên nhân:** 
- Chưa đăng nhập Admin
- Chưa vào tab Security Monitor
- Socket.io chưa kết nối

**Giải pháp:**
- Refresh trang Admin
- Kiểm tra console logs (F12)
- Kiểm tra server logs

### Badge không cập nhật
**Nguyên nhân:** State chưa reset

**Giải pháp:**
- Nhấn vào tab Security Monitor
- Badge sẽ reset về 0
- Chạy lại script

### PowerShell báo lỗi Execution Policy
**Giải pháp:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

---

## 🎓 Note

### Đây là test trong môi trường development
- IP `127.0.0.1` (localhost) sẽ bị chặn
- Không ảnh hưởng production
- Có thể unblock bất cứ lúc nào

### Tất cả là giả lập
- Không có database nào bị xóa
- Không có file nào bị mất
- Chỉ để test phát hiện và xử lý

### Security Monitor chỉ ghi nhận
- Middleware chặn các request độc hại
- Không có damage thực sự
- An toàn 100%!

---

## 🎉 Kết luận

Sau khi test xong, bạn sẽ thấy:

✅ AI phát hiện chính xác 6 loại tấn công  
✅ Real-time alerts hoạt động tốt  
✅ Auto-fix AI hoạt động mượt mà  
✅ IP blocking work perfectly  
✅ Dashboard đầy đủ và chi tiết  

**Hệ thống AI Security Monitor hoạt động hoàn hảo! 🛡️**

---

*Happy Testing! 🧪*
