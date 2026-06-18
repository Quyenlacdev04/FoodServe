# 🚀 HƯỚNG DẪN DEPLOY - FOODSERVE

**Ngày:** 18/06/2026  
**Dự án:** FoodServe - Ứng dụng đặt đồ ăn trực tuyến

---

## 📋 MỤC LỤC

1. [Checklist trước khi deploy](#-checklist-trước-khi-deploy)
2. [Deploy Backend](#-deploy-backend)
3. [Deploy Frontend](#-deploy-frontend)
4. [Deploy Database](#-deploy-database)
5. [Cấu hình Domain & SSL](#-cấu-hình-domain--ssl)
6. [Testing Production](#-testing-production)
7. [Monitoring & Maintenance](#-monitoring--maintenance)

---

## ✅ CHECKLIST TRƯỚC KHI DEPLOY

### Bảo mật (QUAN TRỌNG!)
- [ ] Đọc kỹ `SECURITY_NOTES.md`
- [ ] Đổi tất cả credentials (MongoDB, JWT, API keys)
- [ ] Xóa các console.log() không cần thiết
- [ ] Xóa "Hack buttons" trong GamesPage.jsx
- [ ] Kiểm tra `.gitignore` không commit `.env`
- [ ] Tạo `.env.production` với giá trị thực

### Code Quality
- [ ] Chạy `npm run build` thành công
- [ ] Không có lỗi TypeScript/ESLint
- [ ] Test tất cả tính năng chính
- [ ] Kiểm tra responsive trên mobile
- [ ] Test dark mode

### Database
- [ ] Backup database hiện tại
- [ ] Tạo production database cluster
- [ ] Setup indexes
- [ ] Seed dữ liệu mẫu (optional)

### Documentation
- [ ] README.md cập nhật
- [ ] API documentation đầy đủ
- [ ] Environment variables documented

---

## 🖥️ DEPLOY BACKEND

### Option 1: Railway (Khuyến nghị - Miễn phí)

#### Bước 1: Tạo tài khoản
```bash
# Truy cập https://railway.app/
# Đăng ký bằng GitHub
```

#### Bước 2: Deploy
```bash
# 1. Push code lên GitHub
git add .
git commit -m "chore: prepare for deployment"
git push origin main

# 2. Trong Railway:
# - Click "New Project"
# - Chọn "Deploy from GitHub repo"
# - Chọn repository FoodServe
# - Chọn thư mục: /server
```

#### Bước 3: Cấu hình Environment Variables
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<generated_secret>
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
MOMO_REDIRECT_URL=https://your-frontend-domain.com/payment/result
MOMO_IPN_URL=https://your-backend-domain.railway.app/api/payment/momo/ipn
GROQ_API_KEY=...
```

#### Bước 4: Deploy Settings
```yaml
# railway.json (tạo trong thư mục server/)
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### Option 2: Heroku

#### Bước 1: Cài đặt Heroku CLI
```bash
npm install -g heroku
heroku login
```

#### Bước 2: Tạo app
```bash
cd server
heroku create foodserve-api
```

#### Bước 3: Cấu hình
```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=<generated_secret>
heroku config:set MOMO_PARTNER_CODE=...
# ... (tất cả biến môi trường khác)
```

#### Bước 4: Deploy
```bash
# Tạo Procfile trong server/
echo "web: node index.js" > Procfile

# Deploy
git add .
git commit -m "deploy: heroku"
git push heroku main
```

---

### Option 3: VPS (DigitalOcean, AWS, ...)

#### Bước 1: Setup server
```bash
# SSH vào server
ssh root@your-server-ip

# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt PM2
npm install -g pm2
```

#### Bước 2: Clone & cấu hình
```bash
# Clone repository
git clone https://github.com/your-username/FoodServe.git
cd FoodServe/server

# Install dependencies
npm install --production

# Tạo .env
nano .env
# Paste nội dung từ .env.production
```

#### Bước 3: Chạy với PM2
```bash
# Start server
pm2 start index.js --name foodserve-api

# Auto-restart on reboot
pm2 startup
pm2 save
```

#### Bước 4: Setup Nginx reverse proxy
```bash
sudo apt install nginx

# Tạo config
sudo nano /etc/nginx/sites-available/foodserve-api

# Paste config:
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/foodserve-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎨 DEPLOY FRONTEND

### Option 1: Vercel (Khuyến nghị - Miễn phí)

#### Bước 1: Tạo tài khoản
```bash
# Truy cập https://vercel.com/
# Đăng ký bằng GitHub
```

#### Bước 2: Deploy
```bash
# 1. Install Vercel CLI (optional)
npm i -g vercel

# 2. Deploy từ GitHub:
# - Vào Vercel dashboard
# - Click "New Project"
# - Import FoodServe repository
# - Build settings:
#   * Framework: Vite
#   * Root Directory: ./
#   * Build Command: npm run build
#   * Output Directory: dist
```

#### Bước 3: Environment Variables
```
VITE_API_URL=https://your-backend-domain.railway.app
VITE_SOCKET_URL=https://your-backend-domain.railway.app
VITE_GOOGLE_MAPS_API_KEY=<your_key>
```

#### Bước 4: Deploy
```bash
# Vercel sẽ tự động deploy khi push lên GitHub
git add .
git commit -m "deploy: production"
git push origin main
```

---

### Option 2: Netlify

#### Bước 1: Tạo tài khoản
```bash
# Truy cập https://netlify.com/
# Đăng ký bằng GitHub
```

#### Bước 2: Cấu hình
```bash
# Tạo netlify.toml trong root
cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
```

#### Bước 3: Deploy
```bash
# 1. Connect GitHub repository
# 2. Set build settings
# 3. Add environment variables
# 4. Deploy
```

---

### Option 3: VPS (Nginx)

```bash
# Build locally
npm run build

# Copy dist/ to server
scp -r dist/ root@your-server-ip:/var/www/foodserve

# Nginx config
sudo nano /etc/nginx/sites-available/foodserve

# Paste:
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/foodserve;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Enable & restart
sudo ln -s /etc/nginx/sites-available/foodserve /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 💾 DEPLOY DATABASE

### MongoDB Atlas (Khuyến nghị - Free tier)

#### Bước 1: Tạo Production Cluster
```bash
# 1. Truy cập https://cloud.mongodb.com/
# 2. Tạo cluster mới:
#    - Provider: AWS/GCP/Azure
#    - Region: Gần nhất với server
#    - Tier: M0 (Free) hoặc M10 (Paid)
```

#### Bước 2: Security
```bash
# 1. Network Access:
#    - Add IP: 0.0.0.0/0 (cho development)
#    - Hoặc thêm IP cụ thể của Railway/Heroku

# 2. Database Access:
#    - Tạo user mới (KHÔNG dùng admin)
#    - Password mạnh
#    - Role: readWrite@foodserve
```

#### Bước 3: Connection String
```bash
# Copy connection string:
mongodb+srv://newuser:newpassword@cluster0.xxxxx.mongodb.net/foodserve?retryWrites=true&w=majority

# Cập nhật trong backend environment variables
```

#### Bước 4: Backup
```bash
# Setup automated backup trong Atlas
# Settings > Backup > Configure
```

---

## 🌐 CẤU HÌNH DOMAIN & SSL

### Domain (Namecheap, GoDaddy, ...)

#### Bước 1: Mua domain
```
Ví dụ: foodserve.vn
```

#### Bước 2: DNS Settings
```
# A Records:
@ -> <Railway/Heroku IP>
www -> <Railway/Heroku IP>

# CNAME:
api -> <backend-domain>.railway.app
```

### SSL Certificate (Free - Let's Encrypt)

#### Option 1: Railway/Vercel (Tự động)
```
# Railway và Vercel tự động cấp SSL certificate
# Chỉ cần thêm custom domain
```

#### Option 2: VPS (Manual)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🧪 TESTING PRODUCTION

### Backend Health Check
```bash
# Test API
curl https://your-backend-domain.com/

# Test specific endpoint
curl https://your-backend-domain.com/api/restaurants

# Test WebSocket
# Mở browser console:
const socket = io('https://your-backend-domain.com')
socket.on('connect', () => console.log('Connected!'))
```

### Frontend Testing
```bash
# 1. Mở https://your-frontend-domain.com
# 2. Check console (F12) - không có errors
# 3. Test các tính năng chính:
#    - Đăng nhập/đăng ký
#    - Đặt hàng
#    - Thanh toán MoMo
#    - Chat real-time
#    - GPS tracking
```

### Load Testing (Optional)
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test
ab -n 1000 -c 10 https://your-backend-domain.com/api/restaurants
```

---

## 📊 MONITORING & MAINTENANCE

### Monitoring Tools

#### 1. **Railway Dashboard**
- CPU/Memory usage
- Request logs
- Error logs

#### 2. **MongoDB Atlas Dashboard**
- Database size
- Connection count
- Query performance

#### 3. **Uptime Monitoring** (Optional)
```bash
# UptimeRobot (Free)
https://uptimerobot.com/

# Setup monitors cho:
- Frontend domain
- Backend API
- Database
```

### Error Tracking (Optional)
```bash
# Sentry
npm install @sentry/node @sentry/react

# Initialize in code
Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
})
```

### Logging
```bash
# Backend logs đã có trong server/logs/
# Download định kỳ từ Railway/Heroku:

railway logs > logs.txt
# hoặc
heroku logs --tail > logs.txt
```

---

## 🔄 ROLLBACK PLAN

### Nếu có lỗi sau deploy:

```bash
# 1. Rollback code
git revert HEAD
git push

# 2. Railway auto-redeploy previous version
# Hoặc: Manual rollback trong dashboard

# 3. Restore database (nếu cần)
# Sử dụng backup từ MongoDB Atlas
```

---

## 📚 POST-DEPLOYMENT CHECKLIST

- [ ] Frontend accessible tại https://your-domain.com
- [ ] Backend API working tại https://api.your-domain.com
- [ ] SSL certificates valid (kiểm tra với https://www.ssllabs.com/)
- [ ] All environment variables set correctly
- [ ] Database connected và có data
- [ ] MoMo payment working (test sandbox)
- [ ] Socket.io real-time working
- [ ] Email OTP working (nếu có)
- [ ] GPS tracking working
- [ ] Chat working
- [ ] Notifications working
- [ ] Setup monitoring (Uptime, Logs)
- [ ] Setup backup schedule
- [ ] Document production URLs

---

## 🎉 HOÀN THÀNH!

Dự án đã được deploy thành công lên production!

### URLs:
- **Frontend:** https://your-domain.com
- **Backend API:** https://api.your-domain.com
- **Admin Panel:** https://your-domain.com/admin-login

### Tài khoản demo:
- **Admin:** admin@foodserve.vn / admin123
- **User:** demo@foodserve.vn / 123456

---

**Ngày deploy:** ___________  
**Deployed by:** ___________  
**Status:** ✅ Production Ready
