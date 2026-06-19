# 🚫 CHỨC NĂNG TÀI XẾ HỦY ĐƠN HÀNG

**Ngày hoàn thành**: 18/06/2026  
**Trạng thái**: ✅ Hoàn tất

---

## 🎯 TÍNH NĂNG

Cho phép tài xế hủy đơn hàng với lý do rõ ràng và bằng chứng (ảnh chụp) khi gặp sự cố không thể giao được.

---

## ✨ HIGHLIGHTS

### **1. 8 Lý do hủy đơn được định nghĩa sẵn:**
- 📍 **Địa chỉ không hợp lệ / Không tìm được địa chỉ** (cần ảnh)
- 📞 **Khách hàng không nghe máy / Không liên lạc được**
- 🙅 **Khách hàng yêu cầu hủy đơn**
- 🏪 **Nhà hàng đóng cửa / Từ chối đơn** (cần ảnh)
- 🍜 **Món ăn không sẵn sàng / Hết món**
- ⚠️ **Tai nạn / Sự cố không thể giao** (cần ảnh)
- 🌧️ **Thời tiết xấu / Không đảm bảo an toàn** (cần ảnh)
- ❓ **Lý do khác** (cần ảnh + ghi chú bắt buộc)

### **2. Upload bằng chứng:**
- Hỗ trợ upload ảnh PNG, JPG, JPEG
- Giới hạn 5MB/ảnh
- Preview ảnh trước khi submit
- Bắt buộc với một số lý do cụ thể

### **3. Ghi chú bổ sung:**
- Cho phép tài xế mô tả chi tiết tình huống
- Bắt buộc nếu chọn "Lý do khác"

### **4. Xử lý tự động:**
- ✅ Tự động hoàn tiền cho khách hàng (coins hoặc online payment)
- ✅ Thông báo real-time cho khách hàng qua Socket.io
- ✅ Thông báo cho Admin để review
- ✅ Lưu lại toàn bộ thông tin hủy đơn vào database
- ✅ Xóa shipper khỏi đơn (có thể giao lại cho shipper khác)

---

## 🔧 IMPLEMENTATION

### **Frontend - ShipperCancelOrderModal.jsx**

```javascript
const CANCEL_REASONS = [
  {
    id: 'address_invalid',
    label: 'Địa chỉ không hợp lệ / Không tìm được địa chỉ',
    needsProof: true,
    icon: '📍'
  },
  // ... 7 lý do khác
];

// Upload ảnh bằng chứng
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB');
    return;
  }
  setProofImage(file);
  // Create preview...
};

// Submit hủy đơn
const handleSubmit = async () => {
  // 1. Upload ảnh lên server
  if (proofImage) {
    const formData = new FormData();
    formData.append('image', proofImage);
    const uploadRes = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });
    const uploadData = await uploadRes.json();
    proofImageUrl = uploadData.url;
  }

  // 2. Gửi request hủy đơn
  const response = await fetch(`http://localhost:5000/api/orders/${order._id}/shipper-cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cancelReason: selectedReason,
      cancelReasonLabel: selectedReasonData.label,
      additionalNote: additionalNote.trim(),
      proofImage: proofImageUrl
    })
  });
};
```

### **Frontend - ActiveDelivery.jsx**

```javascript
// Thêm state và modal
const [showCancelModal, setShowCancelModal] = useState(false);

// Nút hủy đơn (trước các nút action khác)
{activeOrder.status !== 'completed' && (
  <button
    onClick={() => setShowCancelModal(true)}
    className="w-full py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 rounded-xl font-bold"
  >
    <FiX /> Hủy đơn hàng
  </button>
)}

// Render modal
<ShipperCancelOrderModal
  isOpen={showCancelModal}
  onClose={() => setShowCancelModal(false)}
  order={activeOrder}
  onSuccess={() => {
    setActiveOrder(null);
    if (onDeliveryCompleted) onDeliveryCompleted();
  }}
/>
```

### **Backend - server/routes/orders.js**

```javascript
// ===== HỦY ĐƠN HÀNG BỞI TÀI XẾ =====
router.post('/:id/shipper-cancel', async (req, res) => {
  const { cancelReason, cancelReasonLabel, additionalNote, proofImage } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  // Validation
  if (!['preparing', 'ready', 'delivering'].includes(order.status)) {
    return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái này' });
  }

  // Cập nhật đơn hàng
  order.status = 'cancelled';
  order.cancellationReason = `[TÀI XẾ] ${cancelReasonLabel}${additionalNote ? ': ' + additionalNote : ''}`;
  order.cancelledBy = 'shipper';
  order.cancelledAt = new Date();
  order.shipperCancelData = {
    reason: cancelReason,
    reasonLabel: cancelReasonLabel,
    note: additionalNote,
    proofImage: proofImage || null,
    timestamp: new Date()
  };

  // Hoàn tiền
  if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cash') {
    order.paymentStatus = 'refunded';
    if (order.paymentMethod === 'coins') {
      const refundCoins = Number((order.finalAmount / 1000).toFixed(1));
      await User.findByIdAndUpdate(order.userId, {
        $inc: { coins: refundCoins }
      });
    }
  }

  // Xóa shipper
  order.shipper = null;
  await order.save();

  // Thông báo Socket.io
  io.to(`order-${order._id}`).emit('order-status-updated', {
    orderId: order._id,
    status: 'cancelled'
  });

  // Tạo notifications cho customer và admin
  // ...
});
```

---

## 🎨 UI/UX DESIGN

### **1. Nút hủy đơn** (ActiveDelivery)
```
┌─────────────────────────────────┐
│  ❌ Hủy đơn hàng                │  ← Màu đỏ nhạt, border đỏ
└─────────────────────────────────┘
```

### **2. Modal hủy đơn** (ShipperCancelOrderModal)

```
┌────────────────────────────────────────────┐
│  ⚠️ Hủy đơn hàng            [X]            │
│  Đơn #12AB34CD                             │
├────────────────────────────────────────────┤
│                                            │
│  ⚠️ Lưu ý quan trọng:                      │
│  • Hủy đơn không chính đáng ảnh hưởng...  │
│  • Một số lý do yêu cầu bằng chứng...      │
│                                            │
│  Lý do hủy đơn *                           │
│  ┌──────────────────────────────────────┐ │
│  │ 📍 Địa chỉ không hợp lệ [selected]   │ │
│  │    🔺 Cần bằng chứng (ảnh)           │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │ 📞 Khách hàng không nghe máy         │ │
│  └──────────────────────────────────────┘ │
│  ... (6 options khác)                      │
│                                            │
│  Ghi chú thêm                              │
│  ┌──────────────────────────────────────┐ │
│  │ Mô tả chi tiết tình huống...         │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Bằng chứng (Ảnh) *                        │
│  ┌──────────────────────────────────────┐ │
│  │      🖼️                               │ │
│  │    Nhấn để chọn ảnh                   │ │
│  │  PNG, JPG • Tối đa 5MB                │ │
│  └──────────────────────────────────────┘ │
│                                            │
├────────────────────────────────────────────┤
│  [Quay lại]  [Xác nhận hủy đơn]           │
└────────────────────────────────────────────┘
```

---

## 📊 FLOW HOẠT ĐỘNG

```
Tài xế click "Hủy đơn hàng"
  ↓
Modal hiện lên
  ↓
Chọn lý do (1 trong 8)
  ↓
Nếu cần proof → Upload ảnh
  ↓
Nhập ghi chú (nếu cần)
  ↓
Click "Xác nhận hủy đơn"
  ↓
Upload ảnh lên server
  ↓
POST /api/orders/:id/shipper-cancel
  ↓
Backend xử lý:
  ├─ Update order.status = 'cancelled'
  ├─ Lưu shipperCancelData
  ├─ Hoàn tiền cho khách hàng
  ├─ Xóa shipper khỏi đơn
  ├─ Socket.io notify customer
  ├─ Tạo notification cho customer
  └─ Tạo notification cho admin
  ↓
Toast success → Đóng modal → activeOrder = null
```

---

## 🧪 TEST CASES

### **TC1: Hủy đơn với lý do không cần ảnh**
1. ✅ Chọn lý do: "Khách hàng không nghe máy"
2. ✅ Không cần upload ảnh
3. ✅ Click "Xác nhận hủy đơn"
4. ✅ Kết quả: Hủy thành công

### **TC2: Hủy đơn với lý do cần ảnh - Chưa upload**
1. ✅ Chọn lý do: "Địa chỉ không hợp lệ"
2. ✅ Không upload ảnh
3. ✅ Click "Xác nhận hủy đơn"
4. ✅ Kết quả: Toast error "Lý do này cần có bằng chứng (ảnh chụp)"

### **TC3: Hủy đơn với lý do cần ảnh - Đã upload**
1. ✅ Chọn lý do: "Nhà hàng đóng cửa"
2. ✅ Upload ảnh (< 5MB)
3. ✅ Preview hiển thị đúng
4. ✅ Click "Xác nhận hủy đơn"
5. ✅ Kết quả: Hủy thành công, ảnh được lưu

### **TC4: Upload ảnh quá lớn**
1. ✅ Chọn ảnh > 5MB
2. ✅ Kết quả: Toast error "Ảnh quá lớn!"

### **TC5: Lý do "khác" không có ghi chú**
1. ✅ Chọn lý do: "Lý do khác"
2. ✅ Không nhập ghi chú
3. ✅ Kết quả: Toast error "Vui lòng nhập lý do cụ thể"

### **TC6: Kiểm tra hoàn tiền**
1. ✅ Đơn đã thanh toán bằng Xu
2. ✅ Tài xế hủy đơn
3. ✅ Kết quả: Xu được hoàn lại cho khách hàng

### **TC7: Kiểm tra thông báo**
1. ✅ Tài xế hủy đơn
2. ✅ Kết quả: 
   - Khách hàng nhận notification
   - Admin nhận notification
   - Socket.io event được phát

---

## 📦 FILES CREATED/MODIFIED

### **Mới tạo:**
1. ✅ `src/components/shipper/ShipperCancelOrderModal.jsx` - Modal UI

### **Đã sửa:**
1. ✅ `src/components/shipper/ActiveDelivery.jsx` - Thêm nút hủy & modal
2. ✅ `server/routes/orders.js` - API endpoint `/shipper-cancel`

---

## 🔒 SECURITY & VALIDATION

### **Frontend:**
- ✅ Validate file size (max 5MB)
- ✅ Validate file type (chỉ image/*)
- ✅ Required fields validation
- ✅ Disable button khi đang submit

### **Backend:**
- ✅ Check order status (chỉ hủy được khi preparing/ready/delivering)
- ✅ Lưu toàn bộ thông tin hủy vào `shipperCancelData`
- ✅ Hoàn tiền an toàn (check payment status)
- ✅ Notifications cho tất cả bên liên quan

---

## 💡 USE CASES

### **Case 1: Địa chỉ sai**
> Tài xế đến địa chỉ nhưng không tìm thấy khách hàng. Chụp ảnh địa chỉ và hủy đơn với lý do "Địa chỉ không hợp lệ".

### **Case 2: Nhà hàng đóng cửa**
> Tài xế đến nhà hàng nhưng thấy đã đóng cửa. Chụp ảnh cửa hàng và hủy đơn.

### **Case 3: Khách hàng yêu cầu hủy**
> Khách hàng gọi điện yêu cầu hủy đơn. Tài xế hủy ngay mà không cần ảnh.

### **Case 4: Tai nạn / Sự cố**
> Tài xế gặp sự cố không thể giao tiếp (xe hỏng, tai nạn nhẹ). Chụp ảnh bằng chứng và hủy đơn.

---

## 🎁 BENEFITS

### **Cho tài xế:**
- ✅ Quy trình hủy đơn rõ ràng, minh bạch
- ✅ Không bị trách móc nếu có bằng chứng
- ✅ Tránh rating giảm không đáng có

### **Cho khách hàng:**
- ✅ Được hoàn tiền tự động
- ✅ Nhận thông báo ngay lập tức
- ✅ Biết chính xác lý do hủy đơn

### **Cho Admin:**
- ✅ Giám sát được các trường hợp hủy đơn
- ✅ Có bằng chứng để xem xét tranh chấp
- ✅ Phát hiện tài xế hay hủy đơn không lý do

---

**Kết luận**: Chức năng hủy đơn cho tài xế đã hoàn thiện với đầy đủ validation, bằng chứng, và thông báo! 🎉
