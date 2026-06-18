# 🔒 GHI CHÚ BẢO MẬT - FOODSERVE

**Ngày:** 18/06/2026  
**Quan trọng:** Đọc kỹ trước khi deploy production!

---

## ⚠️ CẢNH BÁO BẢO MẬT

### 🚨 HARDCODED CREDENTIALS - CẦN THAY ĐỔI

Các file sau có chứa **credentials hardcoded** và **PHẢI được thay đổi** trước khi deploy production:

#### 1. **MongoDB Connection String**
**Vị trí:**
- `server/checkUserRestaurant.js` - Line 8
- `server/updateUserToShipper.js` - Line 7
- `server/updateUserToMerchant.js` - Line 8
- `server/checkDriverRequest.js` - Line 8

**Hiện tại (KHÔNG AN TOÀN):**
```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0'
```

**Khuyến nghị:**
- ✅ Đổi password MongoDB (không dùng `foodserve123`)
- ✅ Tạo user mới với quyền hạn hẹp hơn cho production
- ✅ Sử dụng `.env` file, không hardcode

#### 2. **JWT Secret**
**Vị trí:** `server/routes/auth.js` - Line 9

**Hiện tại (KHÔNG AN TOÀN):**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'foodserve_secret_2026';
```

**Khuyến nghị:**
- ✅ Tạo JWT_SECRET ngẫu nhiên, tối thiểu 32 ký tự
- ✅ Không sử dụng fallback value trong production
- ✅ Generate bằng: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### 3. **Google Maps API Key**
**Vị trí:** `src/hooks/useGoogleMaps.js` - Line 4

**Hiện tại (Demo Key):**
```javascript
const GOOGLE_MAPS_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUX9dUzk-HnMaJWBLI';
```

**Khuyến nghị:**
- ✅ Tạo API key riêng tại [Google Cloud Console](https://console.cloud.google.com/)
- ✅ Sử dụng environment variable: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
- ✅ Giới hạn API key theo domain/IP

---

## 📝 CHECKLIST BẢO MẬT TRƯỚC KHI DEPLOY

### Backend Security

- [ ] **1. Đổi MongoDB credentials**
  ```bash
  # Tạo user mới trong MongoDB Atlas
  # Cập nhật MONGODB_URI trong server/.env
  ```

- [ ] **2. Tạo JWT Secret mạnh**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  # Copy kết quả vào JWT_SECRET trong server/.env
  ```

- [ ] **3. Xóa fallback values**
  ```javascript
  // ❌ KHÔNG AN TOÀN
  const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
  
  // ✅ AN TOÀN
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  ```

- [ ] **4. Cấu hình CORS cho production**
  ```javascript
  // server/index.js
  app.use(cors({
    origin: 'https://your-production-domain.com',
    credentials: true
  }));
  ```

- [ ] **5. Đổi MoMo credentials**
  - Đăng ký tài khoản MoMo Business thực
  - Cập nhật MOMO_PARTNER_CODE, ACCESS_KEY, SECRET_KEY

- [ ] **6. Đổi Groq API Key**
  - Tạo key mới tại https://console.groq.com/
  - Giới hạn rate limit cho production

### Frontend Security

- [ ] **7. Sử dụng Environment Variables**
  ```javascript
  // ❌ KHÔNG AN TOÀN
  const API_URL = 'http://localhost:5000';
  
  // ✅ AN TOÀN
  const API_URL = import.meta.env.VITE_API_URL;
  ```

- [ ] **8. Thay Google Maps API Key**
  ```javascript
  // src/hooks/useGoogleMaps.js
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  ```

- [ ] **9. Remove debug code**
  ```bash
  # Tìm và xóa console.log() không cần thiết
  grep -r "console.log" src/
  ```

- [ ] **10. Remove hack buttons**
  ```javascript
  // Xóa các nút "Hack vô hạn Xu" trong GamesPage.jsx
  // Line 1550 và 1562
  ```

### Git & Repository

- [ ] **11. Kiểm tra .gitignore**
  ```bash
  # Đảm bảo các file sau KHÔNG được commit:
  server/.env
  .env
  .env.local
  ```

- [ ] **12. Xóa credentials khỏi git history**
  ```bash
  # Nếu đã commit .env, phải xóa khỏi history
  git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env" \
  --prune-empty --tag-name-filter cat -- --all
  ```

- [ ] **13. Tạo .env.example files**
  - ✅ Đã có `server/.env.example`
  - ✅ Đã có `.env.example`

---

## 🛡️ RECOMMENDED SECURITY ENHANCEMENTS

### 1. **Rate Limiting** (Đã có - cần điều chỉnh)
```javascript
// server/index.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100 // Giảm từ 1000 xuống 100 cho production
});
```

### 2. **Input Validation** (Cần cải thiện)
- Thêm validation cho tất cả API endpoints
- Sử dụng thư viện như `joi` hoặc `express-validator`

### 3. **HTTPS Only** (Production)
```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 4. **Security Headers**
```bash
npm install helmet
```

```javascript
// server/index.js
import helmet from 'helmet';
app.use(helmet());
```

### 5. **Password Policy** (Cần cải thiện)
- Hiện tại: Tối thiểu 6 ký tự
- Khuyến nghị: Tối thiểu 8 ký tự + ký tự đặc biệt

---

## 📊 SECURITY AUDIT CHECKLIST

### Critical (PHẢI SỬA)
- [x] ❌ MongoDB credentials hardcoded → Sử dụng .env
- [x] ❌ JWT Secret hardcoded → Sử dụng .env
- [x] ❌ Google Maps API key hardcoded → Sử dụng .env
- [ ] ❌ Hack buttons trong production → Xóa

### High Priority
- [ ] ⚠️ Rate limiting quá cao (1000 req/15min) → Giảm xuống
- [ ] ⚠️ CORS cho phép tất cả origins → Giới hạn domain
- [ ] ⚠️ Không có HTTPS redirect → Thêm
- [ ] ⚠️ Thiếu security headers → Thêm helmet

### Medium Priority
- [ ] ⚠️ Password policy yếu (6 ký tự) → Tăng lên 8+
- [ ] ⚠️ Thiếu input validation đầy đủ → Thêm
- [ ] ⚠️ Không có XSS protection library → Thêm DOMPurify
- [ ] ⚠️ Upload file không giới hạn size → Thêm giới hạn

### Low Priority
- [ ] ℹ️ Thiếu 2FA → Tùy chọn
- [ ] ℹ️ Thiếu audit logging → Tùy chọn
- [ ] ℹ️ Thiếu rate limiting per user → Tùy chọn

---

## 🔧 QUICK FIX SCRIPT

### Tạo file `.env` cho production:

```bash
# Chạy script này để tạo .env với secure values
node -e "
const fs = require('fs');
const crypto = require('crypto');

const envContent = \`
PORT=5000
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=\${crypto.randomBytes(32).toString('hex')}
MOMO_PARTNER_CODE=your_production_partner_code
MOMO_ACCESS_KEY=your_production_access_key
MOMO_SECRET_KEY=your_production_secret_key
MOMO_REDIRECT_URL=https://your-domain.com/payment/result
MOMO_IPN_URL=https://your-domain.com/api/payment/momo/ipn
GROQ_API_KEY=your_production_groq_key
\`;

fs.writeFileSync('server/.env.production', envContent);
console.log('✅ Created server/.env.production with secure JWT_SECRET');
"
```

---

## 📚 TÀI LIỆU THAM KHẢO

### Security Best Practices:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Tools:
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Kiểm tra dependencies
- [Snyk](https://snyk.io/) - Security scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing

---

## ⚠️ DISCLAIMER

Dự án này được xây dựng cho mục đích **học tập** và **đồ án tốt nghiệp**.

**Trước khi deploy production:**
1. ✅ Đọc kỹ file này
2. ✅ Thực hiện tất cả checklist
3. ✅ Chạy security audit
4. ✅ Test kỹ trên staging environment
5. ✅ Backup database
6. ✅ Chuẩn bị rollback plan

**Liên hệ support nếu cần hỗ trợ về bảo mật.**

---

**Ngày tạo:** 18/06/2026  
**Phiên bản:** 1.0  
**Trạng thái:** 🔒 Security Review Required
