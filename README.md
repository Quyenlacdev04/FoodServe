# 🍽️ FoodServe - Ứng dụng đặt đồ ăn online

Nền tảng đặt đồ ăn online hiện đại, giao diện đẹp như ShopeeFood.

## 🚀 Công nghệ

- **Frontend:** React 18 + Vite + TailwindCSS + Framer Motion + Redux Toolkit
- **Backend:** Node.js + Express.js + Socket.io
- **Auth:** JWT Authentication

## 📦 Cài đặt

```bash
# Cài dependencies frontend
npm install

# Cài dependencies backend
cd server && npm install && cd ..
```

## ▶️ Chạy dự án

```bash
# Chạy frontend (port 3000)
npm run dev

# Chạy backend (port 5000) - terminal khác
npm run server
```

## 🔑 Tài khoản demo

| Email | Password | Role |
|-------|----------|------|
| demo@foodserve.vn | 123456 | User |
| admin@foodserve.vn | admin123 | Admin |

## 🎫 Mã giảm giá demo

| Mã | Giảm |
|----|------|
| FOOD50 | 50.000₫ |
| FREESHIP | 25.000₫ |
| NEW30 | 30.000₫ |
| SALE20 | 20.000₫ |

## 📂 Cấu trúc

```
FoodServe/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── cart/
│   │   ├── home/
│   │   ├── layout/
│   │   └── ui/
│   ├── data/
│   ├── pages/
│   ├── store/slices/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── routes/
│   └── index.js
└── README.md
```

## ✨ Tính năng

- 🎨 UI glassmorphism + dark mode
- 🔍 Tìm kiếm realtime
- 🛒 Giỏ hàng slide animation
- 📱 Responsive PC + Mobile
- 🔐 Đăng nhập / Đăng ký
- 📦 Theo dõi đơn hàng
- 🎫 Mã giảm giá
- ⚡ Loading animation đẹp
