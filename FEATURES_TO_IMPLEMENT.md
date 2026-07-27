# 🎯 CÁC TÍNH NĂNG CỤ THỂ CÓ THỂ LÀM NGAY

## 📱 Danh sách tính năng theo độ ưu tiên

---

## 🟢 DỄ - CÓ THỂ LÀM TRONG 1-2 NGÀY

### 1. 📧 Email Confirmation sau khi đặt hàng

**Mô tả**: Gửi email xác nhận chi tiết đơn hàng cho khách

**Implementation**:
```javascript
// server/utils/emailService.js
import nodemailer from 'nodemailer';

export const sendOrderConfirmation = async (order, user) => {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const html = `
    <h1>Đơn hàng #${order._id} đã được xác nhận</h1>
    <p>Xin chào ${user.name},</p>
    <p>Đơn hàng của bạn đang được xử lý.</p>
    <h3>Chi tiết:</h3>
    <ul>
      ${order.items.map(item => `<li>${item.name} x${item.quantity}</li>`).join('')}
    </ul>
    <p><strong>Tổng: ${order.total.toLocaleString('vi-VN')}đ</strong></p>
  `;

  await transporter.sendMail({
    from: 'FoodServe <noreply@foodserve.vn>',
    to: user.email,
    subject: `Đơn hàng #${order._id} đã được xác nhận`,
    html
  });
};
```

**Files cần sửa**:
- `server/routes/orders.js` - Thêm gửi email sau khi tạo order

**Thời gian**: 1-2 giờ  
**Impact**: Medium  
**Priority**: ⭐⭐⭐⭐

---

### 2. 🔔 Push Notifications (Web)

**Mô tả**: Thông báo trên trình duyệt khi có đơn hàng mới

**Implementation**:
```javascript
// src/utils/notifications.js
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showNotification = (title, options) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/badge.png',
      ...options
    });
  }
};

// Sử dụng
showNotification('Đơn hàng mới! 🎉', {
  body: 'Bạn có 1 đơn hàng mới từ Nhà hàng ABC',
  tag: 'new-order',
});
```

**Files cần tạo/sửa**:
- `src/utils/notifications.js` (mới)
- `src/App.jsx` - Request permission khi load
- `src/components/admin/AdminOrders.jsx` - Show notification

**Thời gian**: 2-3 giờ  
**Impact**: High  
**Priority**: ⭐⭐⭐⭐⭐

---

### 3. ⭐ Đánh giá món ăn (ngoài đánh giá nhà hàng)

**Mô tả**: Cho phép đánh giá từng món ăn riêng

**Database Schema**:
```javascript
// server/models/MenuItemReview.js
const menuItemReviewSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  photos: [String],
  helpful: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
```

**API Endpoints**:
```
POST   /api/menu-items/:id/reviews     - Tạo review món ăn
GET    /api/menu-items/:id/reviews     - Lấy reviews món ăn
PATCH  /api/menu-item-reviews/:id/helpful  - Vote helpful
```

**Thời gian**: 3-4 giờ  
**Impact**: Medium  
**Priority**: ⭐⭐⭐⭐

---

### 4. 📊 Dashboard số liệu cho Shipper

**Mô tả**: Thêm biểu đồ thu nhập cho shipper

**Implementation**:
```javascript
// src/components/shipper/EarningsChart.jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function EarningsChart({ data }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4">Thu nhập 7 ngày qua</h3>
      <AreaChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area 
          type="monotone" 
          dataKey="earnings" 
          stroke="#10B981" 
          fill="#10B981" 
          fillOpacity={0.3}
        />
      </AreaChart>
    </div>
  );
}
```

**Thời gian**: 2 giờ  
**Impact**: Low  
**Priority**: ⭐⭐⭐

---

### 5. 🎨 Theme Customization

**Mô tả**: Cho phép người dùng chọn theme màu

**Implementation**:
```javascript
// src/contexts/ThemeContext.jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const themes = {
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500'
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('amber');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

**Thời gian**: 2-3 giờ  
**Impact**: Low  
**Priority**: ⭐⭐

---

## 🟡 TRUNG BÌNH - 3-5 NGÀY

### 6. 🗺️ Tính khoảng cách thực tế với Google Directions API

**Mô tả**: Tính khoảng cách và thời gian giao hàng chính xác

**Implementation**:
```javascript
// server/utils/distanceCalculator.js
import axios from 'axios';

export async function calculateRealDistance(origin, destination) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: 'driving'
      }
    });

    const route = response.data.routes[0];
    return {
      distance: route.legs[0].distance.value, // meters
      duration: route.legs[0].duration.value, // seconds
      distanceText: route.legs[0].distance.text,
      durationText: route.legs[0].duration.text
    };
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
}
```

**Use case**:
- Tính phí ship chính xác hơn
- Estimate thời gian giao hàng
- Hiển thị khoảng cách thực tế

**Thời gian**: 4-5 giờ  
**Impact**: High  
**Priority**: ⭐⭐⭐⭐⭐

---

### 7. 🎁 Chương trình Giới thiệu bạn bè

**Mô tả**: Nhận voucher khi mời bạn bè đăng ký

**Database Schema**:
```javascript
// Thêm vào User model
referralCode: { type: String, unique: true },
referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
referralCount: { type: Number, default: 0 },
referralEarnings: { type: Number, default: 0 }
```

**Workflow**:
1. User A được mã referral code duy nhất (VD: "FOOD-ABC123")
2. User A share link: `foodserve.vn/register?ref=FOOD-ABC123`
3. User B đăng ký qua link → Cả A và B nhận voucher
4. Tracking trong dashboard

**Rewards**:
- Người giới thiệu: 50.000đ voucher
- Người được giới thiệu: 30.000đ voucher

**Thời gian**: 1 ngày  
**Impact**: High (viral growth)  
**Priority**: ⭐⭐⭐⭐⭐

---

### 8. 📸 Upload ảnh khi Review

**Mô tả**: Cho phép upload nhiều ảnh trong review

**Implementation**:
```javascript
// Frontend
<input 
  type="file" 
  multiple 
  accept="image/*" 
  onChange={handleImageUpload}
/>

// Backend - cập nhật Review model
photos: [{ type: String }],  // Array of image URLs
```

**Features**:
- Upload tối đa 5 ảnh
- Preview trước khi submit
- Compress ảnh trước khi upload
- Gallery view trong review

**Thời gian**: 4-5 giờ  
**Impact**: Medium  
**Priority**: ⭐⭐⭐⭐

---

### 9. 🔍 Tìm kiếm nâng cao với filters

**Mô tả**: Lọc theo giá, khoảng cách, thời gian mở cửa

**UI Design**:
```
┌─────────────────────────────────┐
│ 🔍 Tìm kiếm                      │
├─────────────────────────────────┤
│ 💰 Giá                          │
│ ○ Dưới 50k                      │
│ ○ 50k - 100k                    │
│ ○ 100k - 200k                   │
│ ○ Trên 200k                     │
├─────────────────────────────────┤
│ 📍 Khoảng cách                  │
│ ▓▓▓▓░░░░░░ 2.5 km              │
├─────────────────────────────────┤
│ ⏰ Thời gian giao               │
│ ○ Dưới 30 phút                  │
│ ○ 30-60 phút                    │
│ ○ Trên 60 phút                  │
├─────────────────────────────────┤
│ 🏷️ Ưu đãi                       │
│ ☑ Có voucher                    │
│ ☑ Freeship                      │
│ ☑ Giảm giá                      │
└─────────────────────────────────┘
```

**Thời gian**: 1 ngày  
**Impact**: High  
**Priority**: ⭐⭐⭐⭐⭐

---

### 10. 📅 Đặt hàng trước (Schedule Order)

**Mô tả**: Đặt hàng cho ngày/giờ cụ thể trong tương lai

**Database Schema**:
```javascript
// Thêm vào Order model
scheduledFor: { type: Date },
isScheduled: { type: Boolean, default: false }
```

**Workflow**:
1. User chọn "Đặt hàng trước"
2. Chọn ngày giờ giao hàng
3. Order được tạo với status "scheduled"
4. Cronjob check mỗi 5 phút → chuyển sang "pending" khi đến giờ
5. Shipper nhận đơn như bình thường

**Use cases**:
- Đặt cơm trưa từ sáng
- Đặt tiệc sinh nhật trước 1 tuần
- Đặt đồ ăn sáng từ tối hôm trước

**Thời gian**: 1 ngày  
**Impact**: High  
**Priority**: ⭐⭐⭐⭐

---

## 🔴 KHÓ - 1-2 TUẦN

### 11. 🎤 Voice Ordering với FoodBot

**Mô tả**: Đặt hàng bằng giọng nói

**Technology**:
- Web Speech API (frontend)
- OpenAI Whisper API (backend)
- Text-to-Speech

**Workflow**:
```
User: "Đặt cho tôi 1 phần phở bò và 1 trà đá"
     ↓
  [Speech Recognition]
     ↓
  [AI xử lý text → tìm món → tạo đơn]
     ↓
Bot: "Bạn muốn đặt Phở Bò tại Nhà hàng ABC đúng không?"
     ↓
User: "Đúng rồi"
     ↓
  [Tạo order tự động]
```

**Thời gian**: 1 tuần  
**Impact**: High (innovation)  
**Priority**: ⭐⭐⭐⭐

---

### 12. 🚴 Fleet Management cho Shipper

**Mô tả**: Hệ thống quản lý đội ngũ shipper

**Features**:
- **Heat map**: Hiển thị khu vực có nhiều đơn
- **Shipper allocation**: Tự động phân đơn cho shipper gần nhất
- **Performance tracking**: Rating, số đơn, thu nhập
- **Shift management**: Lịch làm việc ca
- **Bonus system**: Thưởng khi đạt target

**Admin Dashboard**:
```
┌──────────────────────────────────┐
│ 🚴 Shipper Online: 45/120        │
├──────────────────────────────────┤
│ 🗺️ [MAP - Shipper locations]    │
├──────────────────────────────────┤
│ Top Performers Today:            │
│ 1. Nguyễn Văn A - 28 đơn - ⭐4.9│
│ 2. Trần Văn B   - 25 đơn - ⭐4.8│
│ 3. Lê Văn C     - 23 đơn - ⭐4.9│
└──────────────────────────────────┘
```

**Thời gian**: 1.5 tuần  
**Impact**: High  
**Priority**: ⭐⭐⭐⭐

---

### 13. 💬 Video Call với Shipper

**Mô tả**: Gọi video khi không tìm thấy địa chỉ

**Technology**: WebRTC (PeerJS/Simple Peer)

**Use case**:
- Shipper không tìm thấy địa chỉ → nhấn "Video call"
- Customer nhận cuộc gọi → chỉ đường qua video
- Tăng delivery success rate

**Thời gian**: 1 tuần  
**Impact**: Medium  
**Priority**: ⭐⭐⭐

---

### 14. 🤝 Group Order nâng cao

**Mô tả**: Đặt hàng nhóm với bạn bè

**Features**:
- Tạo room order với code
- Mời bạn bè qua link
- Mỗi người thêm món riêng
- Chọn người thanh toán HOẶC chia bill
- Voting cho nhà hàng
- Chat group trong order

**UI Flow**:
```
1. User A: "Tạo đơn nhóm"
2. Share link: foodserve.vn/group/ABC123
3. User B, C, D join → add món
4. Khi ready → Tính tổng → Checkout
5. Options: 
   - A thanh toán toàn bộ
   - Chia đều 4 người
   - Mỗi người trả phần của mình
```

**Thời gian**: 1.5 tuần  
**Impact**: High  
**Priority**: ⭐⭐⭐⭐⭐

---

### 15. 🎯 Dynamic Pricing & Surge Pricing

**Mô tả**: Điều chỉnh giá theo nhu cầu

**Algorithm**:
```javascript
function calculateSurgeMultiplier(hour, orderCount, shipperCount) {
  // Peak hours (11am-1pm, 6pm-8pm)
  const isPeakHour = (hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 20);
  
  // Demand / Supply ratio
  const demandSupplyRatio = orderCount / shipperCount;
  
  let multiplier = 1.0;
  
  if (isPeakHour) multiplier += 0.3;
  if (demandSupplyRatio > 3) multiplier += 0.5;
  if (demandSupplyRatio > 5) multiplier += 0.8;
  
  return Math.min(multiplier, 2.5); // Max 2.5x
}

// Phí ship = baseShippingFee * surgeMultiplier
```

**Thời gian**: 1 tuần  
**Impact**: High (revenue)  
**Priority**: ⭐⭐⭐⭐

---

## ✅ RECOMMENDED PRIORITY LIST

### Phase 1 (Tuần 1-2): Quick Wins
1. ✅ Push Notifications
2. ✅ Email Confirmation  
3. ✅ Tính khoảng cách với Google API
4. ✅ Referral Program
5. ✅ Advanced Search Filters

### Phase 2 (Tuần 3-4): User Experience
6. ✅ Schedule Orders
7. ✅ Upload ảnh trong Review
8. ✅ Đánh giá món ăn
9. ✅ Dashboard cho Shipper
10. ✅ Theme Customization

### Phase 3 (Tuần 5-8): Advanced
11. ✅ Group Order nâng cao
12. ✅ Fleet Management
13. ✅ Dynamic Pricing
14. ✅ Voice Ordering
15. ✅ Video Call

---

*Tạo bởi: Kiro AI Assistant*  
*Ngày: 2026-07-26*
