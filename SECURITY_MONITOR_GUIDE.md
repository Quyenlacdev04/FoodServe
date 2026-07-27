# 🛡️ AI Security Monitor - Hướng dẫn sử dụng

## 📋 Tổng quan

**AI Security Monitor** là hệ thống giám sát bảo mật thông minh được tích hợp vào trang Admin của FoodServe. Nó tự động phát hiện và xử lý các mối đe dọa bảo mật như:

- 💉 SQL Injection
- ⚠️ XSS (Cross-Site Scripting)
- 🔨 Brute Force Attack
- 🌊 DDoS Attack
- 📁 Path Traversal
- 👁️ Suspicious Activity

---

## ✨ Tính năng chính

### 1. **Phát hiện tự động**
- Giám sát tất cả các request đến server
- Phát hiện mã độc trong payload
- Phân tích pattern tấn công
- Rate limiting thông minh

### 2. **AI Analysis**
- Tính toán mức độ đe dọa (0-100%)
- Đề xuất hành động cụ thể
- Tự động phân loại theo mức độ (Low, Medium, High, Critical)
- Xác định file bị ảnh hưởng

### 3. **Auto-fix thông minh**
- AI tự động sửa lỗi khi Admin nhấn nút
- Cập nhật validation rules
- Thêm security headers
- Chặn IP độc hại

### 4. **Real-time alerts**
- Socket.io push notification
- Badge cảnh báo đỏ trong Admin UI
- Âm thanh cảnh báo
- Chi tiết kỹ thuật đầy đủ

### 5. **IP Blocking**
- Tự động chặn IP khi phát hiện tấn công nghiêm trọng
- Chặn tạm thời với thời gian tùy chỉnh
- Admin có thể unblock thủ công
- Hiển thị thời gian còn lại

---

## 🚀 Cách sử dụng

### 1. Truy cập Security Monitor

1. Đăng nhập vào Admin Dashboard
2. Nhấn vào nút **"🛡️ AI Security Monitor"** ở sidebar
3. Dashboard sẽ hiển thị tất cả các mối đe dọa

### 2. Xem dashboard tổng quan

Dashboard hiển thị:
- **Tổng mối đe dọa**: Tổng số incidents đã phát hiện
- **Nguy hiểm**: Số incidents mức Critical
- **Đã sửa**: Số incidents đã được AI fix
- **IP bị chặn**: Số IP đang bị chặn

### 3. Phát hiện mối đe dọa

Khi có tấn công:
1. **Badge đỏ** sẽ xuất hiện trên nút Security Monitor
2. **Popup alert** hiển thị ở góc màn hình
3. **Âm thanh cảnh báo** phát ra
4. **Thông báo toast** xuất hiện

### 4. Xem chi tiết incident

1. Nhấn vào nút **"Chi tiết"** của incident
2. Modal sẽ hiển thị:
   - Mô tả tấn công
   - Chi tiết kỹ thuật (IP, endpoint, method, user agent)
   - Phân tích AI (threat level, recommendation)
   - Hành động đề xuất

### 5. Tự động sửa lỗi

Nếu incident hỗ trợ auto-fix:

1. Nhấn nút **"⚡ Tự động sửa lỗi (AI)"**
2. AI sẽ:
   - Phân tích mối đe dọa
   - Áp dụng các biện pháp bảo vệ
   - Cập nhật middleware
   - Chặn IP nếu cần
   - Scan hệ thống
3. Progress bar hiển thị tiến trình (0-100%)
4. Khi hoàn tất, incident chuyển sang trạng thái **"Đã sửa"**

### 6. Quản lý IP bị chặn

Xem danh sách IP bị chặn:
- IP address
- Lý do chặn
- Thời gian còn lại

Unblock IP:
- Nhấn nút **"Unblock"** bên cạnh IP
- IP sẽ được gỡ chặn ngay lập tức

### 7. Lọc incidents

Sử dụng dropdown filter:
- **Trạng thái**: All, Phát hiện, Đang phân tích, Đã sửa, Bỏ qua
- **Mức độ**: All, Critical, High, Medium, Low

---

## 🔧 Cấu hình kỹ thuật

### Backend Files Created

1. **Model**: `server/models/SecurityIncident.js`
   - Schema lưu trữ incidents
   - Indexes để tối ưu query

2. **Middleware**: `server/middleware/securityMonitor.js`
   - Phát hiện attack patterns
   - Rate limiting
   - IP blocking
   - AI analysis engine

3. **Routes**: `server/routes/security.js`
   - GET `/api/security/incidents` - Lấy danh sách incidents
   - GET `/api/security/incidents/:id` - Chi tiết incident
   - POST `/api/security/incidents/:id/auto-fix` - Tự động sửa
   - POST `/api/security/incidents/:id/ignore` - Bỏ qua
   - POST `/api/security/unblock-ip/:ip` - Unblock IP
   - GET `/api/security/dashboard` - Dashboard data

### Frontend Files Created

1. **Component**: `src/components/admin/SecurityMonitor.jsx`
   - Dashboard UI
   - Incidents table
   - Detail modal
   - Auto-fix interface
   - Real-time updates via Socket.io

2. **Integration**: `src/pages/AdminPage.jsx`
   - Thêm Security Monitor tab
   - Badge cảnh báo
   - Socket.io listeners

### Socket.io Events

1. **`security-alert`**: Phát khi phát hiện tấn công mới
2. **`security-fixing`**: Progress của auto-fix process
3. **`security-fixed`**: Thông báo khi fix thành công

---

## 📊 Attack Patterns được phát hiện

### 1. SQL Injection
**Patterns:**
- SELECT, UNION, INSERT, DELETE, DROP, UPDATE statements
- SQL comments: `--, #, /*, */`
- OR/AND conditions: `OR 1=1`, `AND 1=1`
- Special characters: `', ", ;, <, >`

**Auto-fix actions:**
- Thêm input validation
- Sử dụng parameterized queries
- Chặn IP ngay lập tức (24 giờ)
- Scan database logs

### 2. XSS (Cross-Site Scripting)
**Patterns:**
- `<script>` tags
- `<iframe>` tags
- `javascript:` protocol
- Event handlers: `onerror=`, `onload=`
- `alert()`, `document.cookie`, `eval()`

**Auto-fix actions:**
- Cập nhật sanitization rules
- HTML escaping
- Thêm Content Security Policy headers
- Chặn request độc hại

### 3. Brute Force
**Detection:**
- Quá nhiều lần đăng nhập thất bại từ một IP
- Vượt quá rate limit threshold

**Auto-fix actions:**
- Rate limiting mạnh hơn
- Thêm CAPTCHA sau 3 lần thất bại
- Chặn IP tạm thời (1 giờ)
- Bật 2FA cho admin

### 4. DDoS Attack
**Detection:**
- Vượt quá 100 requests/phút từ một IP
- Lưu lượng bất thường

**Auto-fix actions:**
- Chặn IP ngay (1 giờ)
- Tăng rate limiting
- Kích hoạt DDoS protection
- Scale server resources

### 5. Path Traversal
**Patterns:**
- `../` sequences
- URL encoded: `%2e%2e%2f`, `%2e%2e%5c`
- `/etc/passwd`, `/windows/system32`

**Auto-fix actions:**
- Sanitize file paths
- Restrict file access
- Chặn directory traversal
- Scan file system permissions

---

## ⚙️ Rate Limiting

### Default Settings
- **Window**: 60 seconds (1 phút)
- **Max requests**: 100 requests/phút
- **Action**: Chặn IP tạm thời khi vượt quá

### IP Blocking Duration
- **Critical**: 24 giờ (SQL Injection, XSS nghiêm trọng)
- **High**: 1 giờ (DDoS, Brute Force)
- **Medium**: 30 phút (Path Traversal)

---

## 🎯 Severity Levels

### Critical (🔴)
- Mối đe dọa nghiêm trọng
- Cần xử lý ngay lập tức
- Tự động chặn IP
- Threat level: 75-100%

### High (🟠)
- Mối đe dọa cao
- Cần xử lý sớm
- Có thể chặn IP
- Threat level: 50-74%

### Medium (🟡)
- Mối đe dọa trung bình
- Cần theo dõi
- Threat level: 25-49%

### Low (🔵)
- Mối đe dọa thấp
- Ghi nhận và monitor
- Threat level: 0-24%

---

## 📈 Dashboard Statistics

### Stats Overview
- **Total**: Tổng số incidents
- **Last 24h**: Incidents trong 24 giờ qua
- **Last 7 days**: Incidents trong 7 ngày qua
- **Last 30 days**: Incidents trong 30 ngày qua

### Charts & Analytics
- **By Status**: Phân loại theo trạng thái
- **By Severity**: Phân loại theo mức độ
- **By Type**: Phân loại theo loại tấn công
- **Timeline**: Biểu đồ timeline 7 ngày
- **Top Endpoints**: Top 5 endpoints bị tấn công nhiều nhất

---

## 🔒 Best Practices

### 1. Monitor thường xuyên
- Kiểm tra dashboard hàng ngày
- Xử lý Critical incidents ngay
- Review các pattern tấn công

### 2. Auto-fix thận trọng
- Đọc kỹ AI recommendation trước khi fix
- Backup database trước khi fix
- Monitor sau khi fix

### 3. IP Management
- Không unblock IP ngay khi còn đang tấn công
- Kiểm tra logs trước khi unblock
- Whitelist các IP tin cậy nếu cần

### 4. Security Updates
- Cập nhật validation rules định kỳ
- Review attack patterns mới
- Scan hệ thống thường xuyên

---

## 🐛 Troubleshooting

### Không nhận được alert
**Nguyên nhân:**
- Socket.io chưa kết nối
- Browser block notifications
- Server chưa khởi động middleware

**Giải pháp:**
- Kiểm tra console logs
- Enable browser notifications
- Restart server

### Auto-fix không hoạt động
**Nguyên nhân:**
- Incident không hỗ trợ auto-fix
- Lỗi permission
- Database connection issue

**Giải pháp:**
- Kiểm tra `autoFixAvailable` flag
- Kiểm tra quyền admin
- Kiểm tra MongoDB connection

### Badge không cập nhật
**Nguyên nhân:**
- Socket.io event không được lắng nghe
- State không được reset

**Giải pháp:**
- Refresh trang
- Kiểm tra Socket.io connection
- Nhấn vào tab Security để reset badge

---

## 📝 Cleanup & Maintenance

### Tự động cleanup
Xóa incidents cũ hơn 90 ngày (đã fix hoặc đã bỏ qua):

```bash
DELETE /api/security/incidents/cleanup?days=90
```

### Manual cleanup
Truy cập MongoDB:
```bash
db.securityincidents.deleteMany({
  createdAt: { $lt: new Date('2024-01-01') },
  status: { $in: ['fixed', 'ignored'] }
})
```

---

## 🎓 Training Data

AI được training để:
1. Nhận diện attack patterns
2. Phân tích threat level
3. Đề xuất fix actions
4. Tự động áp dụng patches

**Note**: AI không thay thế con người. Admin vẫn cần review và quyết định cuối cùng.

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console logs (F12)
2. Kiểm tra server logs
3. Review `SECURITY_MONITOR_GUIDE.md` này
4. Liên hệ dev team

---

## 🚀 Future Improvements

- [ ] Machine Learning để cải thiện detection
- [ ] Whitelist management
- [ ] Email alerts
- [ ] Slack/Discord integration
- [ ] Geo-blocking
- [ ] Advanced analytics dashboard
- [ ] Export reports (PDF, CSV)
- [ ] Integration với WAF (Web Application Firewall)

---

*Tài liệu được tạo bởi Kiro AI Assistant*  
*Version: 1.0.0*  
*Last updated: 2026-07-26*
