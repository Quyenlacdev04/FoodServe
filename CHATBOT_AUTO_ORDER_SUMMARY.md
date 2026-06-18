# 🤖 Tóm Tắt: Chatbot Tự Động Đặt Hàng

## 📅 Ngày: June 18, 2026

---

## ✨ **Tính Năng Mới**

Chatbot giờ có thể **tự động đặt đồ ăn** cho khách hàng thông qua hội thoại tự nhiên!

### **Cách dùng:**
```
👤: "Trời nóng nên ăn gì?"
🤖: [Gợi ý món mát lạnh...]

👤: "Đặt món trà sữa"
🤖: "Bạn muốn đặt Trà sữa không?"

👤: "Có"
🤖: "📍 Địa chỉ giao hàng?"

👤: "123 Lê Lợi, Quận 1"
🤖: "📞 Số điện thoại?"

👤: "0901234567"
🤖: "💳 Thanh toán bằng?"

👤: "Tiền mặt"
🤖: "✅ Xác nhận đặt hàng? [Tóm tắt đơn]"

👤: "Có"
🤖: "🎉 Đặt hàng thành công! Mã #ABC123"
```

---

## 🔧 **Đã Thực Hiện**

### **Backend (100% Hoàn Thành):**
- ✅ Cập nhật AI prompt với luồng đặt hàng
- ✅ Parse 5 tags mới: `ORDER_INTENT`, `ASK_ADDRESS`, `ASK_PHONE`, `ASK_PAYMENT`, `CREATE_ORDER`
- ✅ API endpoint mới: `POST /api/chatbot/create-order`
- ✅ Tự động tạo đơn hàng từ chatbot
- ✅ Gửi thông báo real-time khi đặt hàng thành công
- ✅ Cộng lượt quay cho user

### **File đã sửa:**
- ✅ `server/routes/chatbot.js` - Thêm logic đặt hàng tự động

### **File tài liệu:**
- ✅ `CHATBOT_AUTO_ORDER_GUIDE.md` - Hướng dẫn chi tiết
- ✅ `CHATBOT_AUTO_ORDER_SUMMARY.md` - File này

---

## ⏳ **Cần Làm Tiếp (Frontend)**

### **Update `FoodBot.jsx` component:**

```javascript
// 1. Thêm conversation state
const [conversationState, setConversationState] = useState({
  orderIntent: null,
  address: null,
  phone: null,
  paymentMethod: null,
  step: 'idle'
});

// 2. Handle bot response
const handleBotResponse = (data) => {
  if (data.orderIntent) {
    setConversationState(prev => ({
      ...prev,
      orderIntent: data.orderIntent,
      step: 'order_intent'
    }));
  }
  
  if (data.askAddress) {
    setConversationState(prev => ({ ...prev, step: 'ask_address' }));
  }
  
  // ... tương tự cho askPhone, askPayment
  
  if (data.createOrder) {
    handleCreateOrder(data.createOrder);
  }
};

// 3. Create order function
const handleCreateOrder = async (orderData) => {
  const res = await fetch('http://localhost:5000/api/chatbot/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user._id,
      dishId: orderData.dishId,
      quantity: orderData.quantity || 1,
      address: orderData.address,
      phone: orderData.phone,
      paymentMethod: orderData.paymentMethod
    })
  });
  
  const data = await res.json();
  
  if (data.success) {
    toast.success('🎉 Đặt hàng thành công qua Chatbot!');
    // Add success message to chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `${data.message}\n\nMã đơn: #${data.order.orderId.slice(-6).toUpperCase()}`,
      time: new Date()
    }]);
    
    // Reset state
    setConversationState({ orderIntent: null, address: null, phone: null, paymentMethod: null, step: 'idle' });
  }
};

// 4. Update sendMessage to pass state
const sendMessage = async (text) => {
  // ... existing code
  
  const res = await fetch('http://localhost:5000/api/chatbot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: msg, 
      history, 
      userId: user?._id,
      conversationState  // Thêm dòng này
    })
  });
  
  const data = await res.json();
  
  // Handle response
  handleBotResponse(data);
  
  // ... rest of code
};
```

---

## 📝 **API Reference**

### **POST /api/chatbot/chat** (Đã update)

**Request:**
```json
{
  "message": "Đặt món trà sữa",
  "history": [...],
  "userId": "USER_ID",
  "conversationState": {
    "step": "ask_address",
    "orderIntent": { "dishId": "...", "dishName": "Trà sữa", "price": 35000 }
  }
}
```

**Response:**
```json
{
  "reply": "📍 Bạn giao hàng đến địa chỉ nào nhỉ?",
  "dishes": [],
  "orderIntent": { "dishId": "...", "dishName": "...", "quantity": 1, "price": 35000 },
  "askAddress": true,
  "askPhone": false,
  "askPayment": false,
  "createOrder": null,
  "source": "groq"
}
```

---

### **POST /api/chatbot/create-order** (Mới)

**Request:**
```json
{
  "userId": "USER_ID",
  "dishId": "DISH_ID",
  "quantity": 1,
  "address": "123 Lê Lợi, Quận 1, TP.HCM",
  "phone": "0901234567",
  "paymentMethod": "cash",
  "note": "Gọi trước 5 phút"
}
```

**Response:**
```json
{
  "success": true,
  "message": "🎉 Đặt hàng thành công!",
  "order": {
    "orderId": "ORDER_ID",
    "dishName": "Trà sữa trân châu",
    "quantity": 1,
    "totalAmount": 50000,
    "address": "123 Lê Lợi, Quận 1, TP.HCM",
    "paymentMethod": "cash"
  }
}
```

---

## 🧪 **Test Ngay (Backend)**

```bash
# 1. Start server
cd server && npm start

# 2. Test chat với ý định đặt món
curl -X POST http://localhost:5000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Đặt món phở bò",
    "history": [],
    "userId": "USER_ID"
  }'

# 3. Test tạo đơn hàng
curl -X POST http://localhost:5000/api/chatbot/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "dishId": "DISH_ID",
    "quantity": 1,
    "address": "123 Lê Lợi, Quận 1",
    "phone": "0901234567",
    "paymentMethod": "cash"
  }'
```

---

## 📊 **Kết Quả**

### **Trước:**
- ❌ User phải tìm món → Thêm giỏ → Vào checkout → Điền form
- ❌ Nhiều bước, tốn thời gian
- ❌ Chatbot chỉ gợi ý, không đặt được

### **Sau:**
- ✅ User nói chuyện tự nhiên với chatbot
- ✅ Chatbot tự động thu thập thông tin
- ✅ Đặt hàng xong trong vài lượt chat
- ✅ Không cần rời khỏi cửa sổ chatbot

---

## 🎯 **Next Steps**

### **Ưu tiên cao:**
1. ⏳ Cập nhật `FoodBot.jsx` với conversation state
2. ⏳ UI hiển thị progress đặt hàng
3. ⏳ Test end-to-end với frontend

### **Improvements sau:**
4. 💡 Hỗ trợ đặt nhiều món
5. 💡 Lưu địa chỉ thường dùng
6. 💡 Gợi ý voucher
7. 💡 Voice input

---

## 🎉 **Kết Luận**

Backend đã sẵn sàng 100%! Chatbot giờ có thể:
- ✅ Hiểu ý định đặt món
- ✅ Hỏi thông tin cần thiết
- ✅ Tự động tạo đơn hàng
- ✅ Thông báo thành công

Chỉ cần cập nhật frontend là có thể sử dụng ngay!

**Chatbot thông minh đã sẵn sàng phục vụ! 🚀**
