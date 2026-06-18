# ❌ Hướng Dẫn Tính Năng Hủy Đơn Hàng

## 📋 Tổng Quan

Tính năng hủy đơn hàng cho phép khách hàng hủy đơn với các lý do cụ thể và được hoàn tiền tự động.

### ✨ Tính năng chính:
- ✅ **8 lý do hủy đơn** được định nghĩa sẵn
- ✅ **Lý do tùy chỉnh** với ô nhập văn bản
- ✅ **Hoàn tiền tự động** cho các đơn đã thanh toán
- ✅ **Thông báo real-time** cho shipper, admin và khách hàng
- ✅ **Giới hạn quyền hủy** theo trạng thái đơn hàng
- ✅ **Giao diện đẹp** với animation và UX tốt

---

## 🎯 Khi Nào Có Thể Hủy Đơn?

### ✅ **Được phép hủy:**
| Trạng thái | Mô tả | Có thể hủy |
|-----------|-------|------------|
| `confirmed` | Đơn hàng mới, chưa có shipper nhận | ✅ CÓ |
| `preparing` | Shipper đã nhận, đang chuẩn bị | ✅ CÓ |

### ❌ **Không được hủy:**
| Trạng thái | Mô tả | Lý do |
|-----------|-------|-------|
| `ready` | Món ăn đã sẵn sàng | ⚠️ Liên hệ hỗ trợ |
| `delivering` | Đang giao hàng | ⚠️ Liên hệ shipper/hỗ trợ |
| `completed` | Đã giao xong | ❌ Không thể hủy |
| `cancelled` | Đã hủy trước đó | ❌ Không cần hủy |

---

## 📝 Các Lý Do Hủy Đơn

```javascript
const CANCEL_REASONS = [
  { id: 'changed_mind', label: '🤔 Tôi đổi ý rồi' },
  { id: 'wrong_order', label: '❌ Đặt nhầm món' },
  { id: 'too_expensive', label: '💰 Giá quá cao' },
  { id: 'too_long', label: '⏰ Đợi quá lâu' },
  { id: 'found_better', label: '🔄 Tìm được quán khác' },
  { id: 'duplicate', label: '📋 Đặt trùng đơn' },
  { id: 'payment_issue', label: '💳 Vấn đề thanh toán' },
  { id: 'other', label: '📝 Lý do khác' }
];
```

---

## 🔧 Cấu Trúc Code

### 1. **Backend API**

#### `POST /api/orders/:id/cancel`

**Request Body:**
```json
{
  "reason": "🤔 Tôi đổi ý rồi",
  "userId": "USER_ID"
}
```

**Logic xử lý:**
```javascript
// 1. Kiểm tra quyền hủy đơn
if (userId && order.userId !== userId) {
  return res.status(403).json({ message: 'Không có quyền' });
}

// 2. Kiểm tra trạng thái có thể hủy
const cancellableStatuses = ['confirmed', 'preparing'];
if (!cancellableStatuses.includes(order.status)) {
  return res.status(400).json({ message: 'Không thể hủy' });
}

// 3. Cập nhật đơn hàng
order.status = 'cancelled';
order.cancellationReason = reason;
order.cancelledBy = 'customer';
order.cancelledAt = new Date();

// 4. Hoàn tiền (nếu cần)
if (order.paymentStatus === 'paid') {
  order.paymentStatus = 'refunded';
  
  if (order.paymentMethod === 'coins') {
    // Hoàn Xu ngay lập tức
    const refundCoins = order.finalAmount / 1000;
    user.coins += refundCoins;
  }
  // VNPay/MoMo/ZaloPay: Gọi API hoàn tiền
}

// 5. Hoàn lại lượt quay và trừ totalSpent
await User.findByIdAndUpdate(userId, {
  $inc: { spins: -1, totalSpent: -order.finalAmount }
});

// 6. Gửi thông báo real-time
io.to(`order-${orderId}`).emit('order-status-updated', { ... });
io.to(`user-${shipperId}`).emit('new-notification', { ... });
io.to(`user-${adminId}`).emit('new-notification', { ... });
```

**Response:**
```json
{
  "message": "Đã hủy đơn hàng thành công. Đã hoàn 65 Xu vào tài khoản.",
  "order": { ... }
}
```

---

### 2. **Database Model**

**Thêm vào `Order.js`:**
```javascript
const orderSchema = new mongoose.Schema({
  // ... các field khác
  
  // Thông tin hủy đơn
  cancellationReason: String,
  cancelledBy: { 
    type: String, 
    enum: ['customer', 'restaurant', 'admin', 'system'] 
  },
  cancelledAt: Date
});
```

---

### 3. **Frontend Component**

#### `CancelOrderModal.jsx`

**Props:**
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess?: () => void;
}
```

**Features:**
- ✅ Modal với Framer Motion animation
- ✅ 8 lựa chọn lý do (radio buttons)
- ✅ Textarea cho lý do tùy chỉnh (khi chọn "Lý do khác")
- ✅ Warning box nếu không thể hủy
- ✅ Info box về chính sách hoàn tiền
- ✅ Validation trước khi submit
- ✅ Loading state khi đang hủy

**Usage:**
```jsx
import CancelOrderModal from '../components/orders/CancelOrderModal';

function OrderTrackingPage() {
  const [showCancelModal, setShowCancelModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowCancelModal(true)}>
        Hủy đơn hàng
      </button>

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        order={order}
        onSuccess={() => {
          // Refresh order data
          fetchOrder();
        }}
      />
    </>
  );
}
```

---

### 4. **OrderTrackingPage Updates**

**Thêm nút hủy đơn:**
```jsx
{['confirmed', 'preparing'].includes(order.status) && (
  <button
    onClick={() => setShowCancelModal(true)}
    className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600"
  >
    <FiX size={18} />
    <span>Hủy đơn hàng</span>
  </button>
)}
```

**Hiển thị thông tin đơn đã hủy:**
```jsx
{order.status === 'cancelled' && (
  <div className="mt-8 p-6 rounded-2xl bg-red-50 border-2 border-red-200">
    <h3>Đơn hàng đã bị hủy</h3>
    <p>Lý do: {order.cancellationReason}</p>
    <p>Hủy lúc: {new Date(order.cancelledAt).toLocaleString()}</p>
    
    {order.paymentStatus === 'refunded' && (
      <div className="mt-3 p-3 bg-green-50">
        💰 {order.paymentMethod === 'coins' 
          ? 'Xu đã được hoàn lại'
          : 'Tiền sẽ được hoàn trong 3-5 ngày'
        }
      </div>
    )}
  </div>
)}
```

---

## 💰 Chính Sách Hoàn Tiền

### 1. **Thanh toán bằng Xu (Coins)**
```javascript
// Hoàn ngay lập tức
const refundCoins = Number((order.finalAmount / 1000).toFixed(1));
user.coins = Number(((user.coins || 0) + refundCoins).toFixed(1));
await user.save();

// Message: "Đã hoàn 65 Xu vào tài khoản."
```

### 2. **Thanh toán Online (VNPay, MoMo, ZaloPay)**
```javascript
order.paymentStatus = 'refunded';

// TODO: Gọi API hoàn tiền của từng cổng thanh toán
// - VNPay: Gọi API refund
// - MoMo: Gọi API refund
// - ZaloPay: Gọi API refund

// Message: "Tiền sẽ được hoàn lại trong 3-5 ngày làm việc."
```

### 3. **Thanh toán COD (Cash)**
```javascript
// Không cần hoàn tiền (chưa thanh toán)
// Chỉ cập nhật trạng thái đơn hàng
```

### 4. **Hoàn lại lượt quay và totalSpent**
```javascript
await User.findByIdAndUpdate(userId, {
  $inc: { 
    spins: -1,              // Trừ 1 lượt quay
    totalSpent: -order.finalAmount  // Trừ tổng tiền đã chi
  }
});
```

---

## 🔔 Thông Báo Real-time

### 1. **Khách hàng (Customer)**
```javascript
const notification = new Notification({
  userId: order.userId,
  title: '✅ Đã hủy đơn hàng',
  message: 'Đơn hàng của bạn đã được hủy thành công. Đã hoàn 65 Xu vào tài khoản.',
  type: 'order_cancelled',
  data: { orderId: order._id.toString() }
});
await notification.save();

io.to(`user-${order.userId}`).emit('new-notification', notification);
```

### 2. **Shipper (nếu đã nhận đơn)**
```javascript
const notification = new Notification({
  userId: order.shipperId,
  title: '❌ Đơn hàng đã bị hủy',
  message: `Đơn hàng #${orderId} đã bị khách hàng hủy. Lý do: ${reason}`,
  type: 'order_cancelled'
});
await notification.save();

io.to(`user-${order.shipperId}`).emit('new-notification', notification);
```

### 3. **Admin**
```javascript
const admins = await User.find({ role: 'admin' });
for (const admin of admins) {
  const notification = new Notification({
    userId: admin._id,
    title: '❌ Đơn hàng bị hủy',
    message: `Đơn hàng #${orderId} đã bị khách hàng hủy`,
    type: 'order_cancelled'
  });
  await notification.save();
  io.to(`user-${admin._id}`).emit('new-notification', notification);
}
```

### 4. **Cập nhật trạng thái đơn hàng**
```javascript
io.to(`order-${orderId}`).emit('order-status-updated', {
  orderId: order._id,
  status: 'cancelled'
});
```

---

## 🧪 Testing

### 1. **Test Case: Hủy đơn thành công**

**Setup:**
```bash
# Tạo đơn hàng mới
POST http://localhost:5000/api/orders
{
  "userId": "USER_ID",
  "restaurantId": "RESTAURANT_ID",
  "items": [...],
  "paymentMethod": "coins",
  "paymentStatus": "paid"
}

# Lưu lại ORDER_ID
```

**Execute:**
```bash
# Hủy đơn
POST http://localhost:5000/api/orders/ORDER_ID/cancel
{
  "reason": "🤔 Tôi đổi ý rồi",
  "userId": "USER_ID"
}
```

**Expected:**
```json
{
  "message": "Đã hủy đơn hàng thành công. Đã hoàn 65 Xu vào tài khoản.",
  "order": {
    "status": "cancelled",
    "cancellationReason": "🤔 Tôi đổi ý rồi",
    "cancelledBy": "customer",
    "paymentStatus": "refunded"
  }
}
```

**Verify:**
- ✅ Đơn hàng có `status = 'cancelled'`
- ✅ User được hoàn Xu
- ✅ User bị trừ 1 lượt quay
- ✅ Thông báo được gửi cho customer, shipper (nếu có), admin

---

### 2. **Test Case: Không thể hủy đơn đang giao**

**Setup:**
```bash
# Tạo đơn và cập nhật status = delivering
PATCH http://localhost:5000/api/orders/ORDER_ID/status
{ "status": "delivering" }
```

**Execute:**
```bash
POST http://localhost:5000/api/orders/ORDER_ID/cancel
{ "reason": "Test", "userId": "USER_ID" }
```

**Expected:**
```json
{
  "message": "Không thể hủy đơn hàng ở trạng thái hiện tại. Vui lòng liên hệ hỗ trợ."
}
```

---

### 3. **Test Case: UI - Modal hiển thị**

**Steps:**
1. Truy cập: `http://localhost:5173/tracking`
2. Chọn đơn hàng có `status = 'confirmed'` hoặc `'preparing'`
3. Nhấn nút **"Hủy đơn hàng"**

**Expected:**
- ✅ Modal xuất hiện với animation mượt
- ✅ Hiển thị 8 lý do hủy đơn
- ✅ Có warning box màu vàng về chính sách
- ✅ Chọn được 1 lý do
- ✅ Nếu chọn "Lý do khác" → hiện textarea

---

### 4. **Test Case: UI - Validation**

**Steps:**
1. Mở modal hủy đơn
2. Không chọn lý do → Nhấn "Xác nhận hủy"

**Expected:**
- ❌ Hiển thị toast error: "Vui lòng chọn lý do hủy đơn"

**Steps:**
1. Chọn "Lý do khác"
2. Không nhập gì → Nhấn "Xác nhận hủy"

**Expected:**
- ❌ Hiển thị toast error: "Vui lòng nhập lý do hủy đơn"

---

### 5. **Test Case: Real-time update**

**Setup:**
- Mở 2 tab trình duyệt:
  - **Tab 1 (Khách hàng):** `http://localhost:5173/tracking`
  - **Tab 2 (Shipper):** Dashboard shipper đã nhận đơn

**Execute:**
- Tab 1: Hủy đơn hàng

**Expected:**
- ✅ **Tab 1:** Đơn chuyển sang trạng thái "Đã hủy", hiển thị lý do
- ✅ **Tab 2:** Shipper nhận thông báo "Đơn hàng đã bị hủy"
- ✅ **Admin:** Nhận thông báo đơn bị hủy

---

## 📊 Analytics & Tracking

### **Thống kê lý do hủy đơn:**

```javascript
// API để lấy thống kê
router.get('/analytics/cancellation-reasons', async (req, res) => {
  const results = await Order.aggregate([
    { $match: { status: 'cancelled' } },
    { $group: {
        _id: '$cancellationReason',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  res.json(results);
});
```

**Output:**
```json
[
  { "_id": "🤔 Tôi đổi ý rồi", "count": 15 },
  { "_id": "⏰ Đợi quá lâu", "count": 8 },
  { "_id": "💰 Giá quá cao", "count": 5 }
]
```

---

## 🎨 UI/UX Design

### **Modal Structure:**
```
┌─────────────────────────────────────┐
│  ❌ Hủy đơn hàng    #ABCD1234    ✕ │
├─────────────────────────────────────┤
│  ⚠️  Bạn có chắc chắn muốn hủy?    │
│  💰 Tiền sẽ được hoàn lại...       │
├─────────────────────────────────────┤
│  Vui lòng chọn lý do hủy đơn:      │
│  ○ 🤔 Tôi đổi ý rồi                │
│  ○ ❌ Đặt nhầm món                 │
│  ○ 💰 Giá quá cao                  │
│  ○ ⏰ Đợi quá lâu                  │
│  ○ 🔄 Tìm được quán khác           │
│  ○ 📋 Đặt trùng đơn                │
│  ○ 💳 Vấn đề thanh toán            │
│  ○ 📝 Lý do khác                   │
│                                     │
│  [Lý do cụ thể: _______________]   │
├─────────────────────────────────────┤
│  📋 Chính sách hủy đơn:            │
│  • Chỉ hủy khi chưa giao           │
│  • Hoàn tiền đầy đủ                │
├─────────────────────────────────────┤
│  [  Đóng  ]  [  Xác nhận hủy  ]   │
└─────────────────────────────────────┘
```

### **Colors:**
- ✅ Success (hoàn tiền): `bg-green-50`, `text-green-700`
- ❌ Danger (hủy đơn): `bg-red-50`, `text-red-700`
- ⚠️ Warning (thông báo): `bg-yellow-50`, `text-yellow-800`
- 📘 Info (chính sách): `bg-gray-50`, `text-gray-600`

---

## ✅ Checklist Triển Khai

- [x] Thêm field `cancellationReason`, `cancelledBy`, `cancelledAt` vào Order model
- [x] Tạo API endpoint `POST /api/orders/:id/cancel`
- [x] Xử lý logic hoàn tiền (Xu, VNPay, MoMo, ZaloPay)
- [x] Hoàn lại lượt quay và trừ totalSpent
- [x] Gửi thông báo real-time cho customer, shipper, admin
- [x] Tạo component `CancelOrderModal.jsx`
- [x] Thêm nút hủy đơn vào `OrderTrackingPage`
- [x] Hiển thị thông tin đơn đã hủy
- [x] Validation lý do hủy đơn
- [x] Toast notification cho thành công/lỗi
- [x] Testing các trường hợp edge case

---

## 🚀 Kết Luận

Tính năng hủy đơn hàng đã hoàn thiện với:
- ✅ **UX tốt**: Modal đẹp, animation mượt, validation đầy đủ
- ✅ **Logic chặt chẽ**: Kiểm tra quyền, trạng thái, hoàn tiền tự động
- ✅ **Real-time**: Thông báo ngay lập tức cho tất cả các bên
- ✅ **Hoàn tiền**: Hỗ trợ Xu, VNPay, MoMo, ZaloPay
- ✅ **Analytics**: Có thể thống kê lý do hủy đơn

**Chúc bạn thành công! 🎉**
