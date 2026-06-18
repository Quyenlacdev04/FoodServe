# 🚀 Hướng dẫn Deploy FoodServe lên Render.com (MIỄN PHÍ)

## Bước 1: Push code lên GitHub

Đảm bảo code mới nhất đã được push lên GitHub:

```bash
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

## Bước 2: Tạo tài khoản Render.com

1. Truy cập [https://render.com](https://render.com)
2. Nhấn **Sign Up** → Đăng nhập bằng **GitHub**
3. Cho phép Render truy cập GitHub repositories

## Bước 3: Tạo Web Service

1. Từ Dashboard, nhấn **New** → **Web Service**
2. Chọn repository **FoodServe** từ GitHub
3. Cấu hình như sau:

| Cài đặt | Giá trị |
|---------|---------|
| **Name** | `foodserve` |
| **Region** | Singapore (gần VN nhất) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build && cd server && npm install` |
| **Start Command** | `cd server && node index.js` |
| **Plan** | **Free** |

## Bước 4: Thêm Environment Variables

Trong phần **Environment**, thêm các biến sau:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://admin:foodserve123@cluster0.tvrwj2v.mongodb.net/foodserve?appName=Cluster0` |
| `JWT_SECRET` | `foodserve_secret_2026` |
| `GROQ_API_KEY` | *Lấy từ file .env hiện tại của bạn* |
| `EMAIL_USER` | `vuvanquyeny@gmail.com` |
| `EMAIL_PASS` | `wxqawkxeigwjdcyu` |
| `FRONTEND_URL` | *(để trống trước, sau khi deploy xong sẽ điền URL)* |

> **Lưu ý**: Sau khi deploy xong, Render sẽ cung cấp URL dạng `https://foodserve-xxxx.onrender.com`. 
> Quay lại Settings → Environment → thêm `FRONTEND_URL` = URL đó.

## Bước 5: Deploy

1. Nhấn **Create Web Service**
2. Render sẽ tự động build và deploy
3. Quá trình build mất khoảng **3-5 phút**
4. Khi thấy **"Live"** → Web đã online!

## Bước 6: Truy cập web

Render sẽ cung cấp URL miễn phí dạng:
```
https://foodserve-xxxx.onrender.com
```

Chia sẻ link này cho mọi người truy cập! 🎉

---

## ⚠️ Lưu ý về Free Tier của Render

- **Spin down**: Service sẽ tự "ngủ" sau 15 phút không có traffic. Lần truy cập đầu tiên sau đó sẽ mất ~30-60 giây để khởi động lại.
- **Bandwidth**: 100GB/tháng (đủ dùng)
- **Build minutes**: 500 phút/tháng
- **Upload files**: File upload trên Render free tier sẽ bị mất khi service restart (vì dùng filesystem tạm). Nên dùng Cloudinary nếu cần lưu ảnh lâu dài.

## 🔧 Troubleshooting

### Web trắng / 404
- Kiểm tra Build Command có đúng không
- Xem logs trong tab **Logs** trên Render

### API không hoạt động
- Kiểm tra Environment Variables
- Đảm bảo `MONGODB_URI` chính xác
- Xem logs để tìm lỗi

### Socket.io không kết nối
- Render free tier hỗ trợ WebSocket
- Đảm bảo frontend kết nối đúng URL
