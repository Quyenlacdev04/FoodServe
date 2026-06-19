# 📧 HƯỚNG DẪN SỬA LỖI EMAIL & TRACKING PREVENTION

**Ngày**: 18/06/2026  
**Vấn đề**: Lỗi 500, tracking prevention, không gửi được OTP

---

## 🐛 CÁC LỖI PHÁT HIỆN

### **1. Tracking Prevention Blocked (Browser)**
```
Failed to load resource: Tracking Prevention blocked access to storage for https://...
```
**Nguyên nhân**: Brave/Safari block third-party cookies và tracking

**Giải pháp**: 
- Tắt Shields trong Brave (icon khiên bên trái URL bar)
- Hoặc dùng Chrome/Edge để test
- Production: Dùng same-origin hoặc configure CORS đúng

### **2. Internal Server Error 500**
```
POST /api/auth/register/send-otp 500 (Internal Server Error)
```
**Nguyên nhân**: Server có thể:
- Chưa chạy
- Lỗi kết nối MongoDB
- Lỗi gửi email

---

## ✅ KIỂM TRA & SỬA LỖI

### **Bước 1: Kiểm tra server đang chạy**
```bash
cd server
npm start

# Hoặc check process
netstat -ano | findstr :5000
```

**Kết quả mong đợi:**
```
Server đang chạy trên port 5000
✅ MongoDB connected
✅ Socket.io đã khởi tạo
```

### **Bước 2: Kiểm tra MongoDB connection**
Mở `server/.env` và check:
```env
MONGODB_URI=mongodb+srv://admin:password@cluster0...
```

Test connection:
```bash
cd server
node checkDB.js
```

### **Bước 3: Kiểm tra Email config**
Trong `server/.env`:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Tạo App Password Gmail:**
1. Bật xác minh 2 bước: https://myaccount.google.com/security
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Chọn "Mail" và "Other device"
4. Copy mã 16 ký tự (bỏ khoảng trắng)
5. Paste vào `EMAIL_PASS`

### **Bước 4: Test gửi OTP**
Restart server sau khi config email:
```bash
cd server
npm start
```

Đăng ký tài khoản mới:
- Nếu có email config → OTP gửi qua email
- Nếu không có email config → OTP hiển thị trong console:
  ```
  📧 OTP đăng ký cho test@example.com: 123456 (hết hạn 5 phút)
  ```

---

## 🔧 CODE FIXES ĐÃ ÁP DỤNG

### **1. Auth Route - Better Error Response**
File: `server/routes/auth.js`

```javascript
router.post('/register/send-otp', async (req, res) => {
  try {
    // ... code ...
    
    res.json({
      success: true,  // ✅ Thêm flag success
      message: emailSent ? 'Mã OTP đã gửi đến email!' : 'Mã OTP đã được tạo (chế độ demo)',
      demo: !emailSent ? otp : undefined
    });
  } catch (error) {
    console.error('Register send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi gửi OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

### **2. Email Service - Graceful Fallback**
File: `server/utils/emailService.js`

Code đã có sẵn fallback tốt:
```javascript
export async function sendEmail({ to, subject, html }) {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    // ... send via Resend
  }

  // Fallback to Gmail
  const transporter = createGmailTransporter();
  if (transporter) {
    // ... send via Gmail
  }

  // No provider → throw error
  throw new Error('Chưa cấu hình email provider');
}
```

Auth route đã catch error này và fallback sang demo mode!

---

## 🧪 TEST SCENARIOS

### **Scenario 1: Có Email Config**
```env
EMAIL_USER=your@gmail.com
EMAIL_PASS=abcd1234efgh5678
```

**Kết quả:**
- ✅ OTP gửi qua email
- ✅ User nhận email sau vài giây
- ✅ Response: `{ message: "Mã OTP đã gửi đến email!" }`

### **Scenario 2: Không có Email Config**
```env
# EMAIL_USER=
# EMAIL_PASS=
```

**Kết quả:**
- ✅ OTP log ra console server
- ✅ Response: `{ message: "Mã OTP đã được tạo (chế độ demo)", demo: "123456" }`
- ✅ Frontend có thể hiển thị OTP demo

### **Scenario 3: Email Config sai**
```env
EMAIL_USER=wrong@gmail.com
EMAIL_PASS=wrong_password
```

**Kết quả:**
- ⚠️ Gmail auth failed
- ✅ Fallback sang demo mode
- ✅ OTP log ra console
- ✅ Response: `{ message: "Mã OTP đã được tạo (chế độ demo)", demo: "123456" }`

---

## 🌐 CORS FIX (Nếu cần)

Nếu gặp CORS error, check `server/index.js`:

```javascript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://foodserve-app.onrender.com'  // Production URL
  ],
  credentials: true
}));
```

---

## 🔒 TRACKING PREVENTION FIX

### **Chrome/Edge (Không block):**
✅ Hoạt động bình thường

### **Brave Browser:**
1. Click icon **khiên** bên trái URL bar
2. Tắt "Shields" cho localhost
3. Reload trang

### **Safari:**
1. Preferences → Privacy
2. Tắt "Prevent cross-site tracking"
3. Reload trang

### **Firefox:**
1. about:config
2. Tìm `privacy.trackingprotection.enabled`
3. Set = `false` cho localhost

---

## 📝 CHECKLIST SỬA LỖI

- [ ] Server đang chạy (port 5000)
- [ ] MongoDB connected
- [ ] Email config đúng (hoặc chấp nhận demo mode)
- [ ] Tracking prevention tắt (hoặc dùng Chrome)
- [ ] Frontend đang chạy (port 3000/5173)
- [ ] CORS configured đúng
- [ ] Test đăng ký → Nhận OTP (email hoặc console)
- [ ] Test verify OTP → Tạo tài khoản thành công

---

## 🚀 QUICK FIX

Nếu muốn test nhanh mà không cần config email:

1. **Để trống email config** trong `.env`
2. **Restart server**
3. **Đăng ký tài khoản** mới
4. **Check console server** để lấy OTP:
   ```
   📧 OTP đăng ký cho test@example.com: 456789
   ```
5. **Nhập OTP vào form** và hoàn tất đăng ký

---

**Kết luận**: Hệ thống đã có sẵn fallback mechanism tốt. Lỗi chính là do tracking prevention của browser hoặc server chưa chạy!
