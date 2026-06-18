# 🤖 Hướng Dẫn Chatbot Tự Động Đặt Hàng

## 📋 Tổng Quan

Chatbot đã được nâng cấp để có thể **tự động đặt đồ ăn** thông qua hội thoại tự nhiên. Không cần thao tác thủ công!

### ✨ Tính năng mới:
- ✅ **Hiểu ý định đặt món**: "đặt món này", "cho tôi 2 phở bò", "mua ngay"
- ✅ **Thu thập thông tin**: Địa chỉ, SĐT, thanh toán
- ✅ **Tự động tạo đơn**: Không cần vào trang checkout
- ✅ **Hội thoại tự nhiên**: Như nói chuyện với người thật

---

## 🎯 Luồng Hội Thoại

### **Bước 1: Gợi ý món ăn**
```
User: "Trời nóng nên ăn gì?"

Bot: "☀️ Trời nóng nên chọn đồ mát lạnh! Gợi ý cho bạn:
      🧋 Trà sữa trân châu - 35.000đ
      🍧 Chè đậu đỏ - 25.000đ
      🥤 Sinh tố bơ - 30.000đ"
```

### **Bước 2: Đặt món**
```
User: "Đặt món trà sữa"

Bot: "Bạn muốn đặt Trà sữa trân châu với giá 35.000đ phải không? 
      Xác nhận để mình hỏi thêm thông tin nhé! 😊"
```

### **Bước 3: Hỏi địa chỉ**
```
User: "Có, đặt đi"

Bot: "📍 Bạn giao hàng đến địa chỉ nào nhỉ? 
     (VD: 123 Nguyễn Huệ, Quận 1, TP.HCM)"
```

### **Bước 4: Hỏi số điện thoại**
```
User: "123 Lê Lợi, Quận 1"

Bot: "📞 Cho mình số điện thoại liên hệ nhé!"
```

### **Bước 5: Hỏi thanh toán**
```
User: "0901234567"

Bot: "💳 Bạn muốn thanh toán bằng gì?
     1️⃣ Tiền mặt (COD)
     2️⃣ MoMo
     3️⃣ Xu (1 Xu = 1.000đ)"
```

### **Bước 6: Xác nhận**
```
User: "Tiền mặt"

Bot: "✅ Xác nhận đơn hàng:
     📦 Trà sữa trân châu x 1
     📍 123 Lê Lợi, Quận 1
     💳 Tiền mặt (COD)
     💰 Tổng: 50.000đ (gồm ship 15.000đ)
     
     Bạn xác nhận đặt hàng nhé? (Có/Không)"
```

### **Bước 7: Hoàn thành**
```
User: "Có"

Bot: "🎉 Đặt hàng thành công! Đơn #ABC123 đã được tạo.
     Chờ shipper nhận đơn nhé! 
     Bạn có thể theo dõi đơn hàng ở mục 'Đơn hàng của tôi'"
```

---

## 🔧 Cấu Trúc Kỹ Thuật

### **1. Backend API (chatbot.js)**

#### **Tags mới để AI trả về:**

```javascript
// Ý định đặt món
%%ORDER_INTENT%%{"dishId":"ID","dishName":"Tên","quantity":1,"price":50000}%%END%%

// Hỏi địa chỉ
%%ASK_ADDRESS%%true%%END%%

// Hỏi SĐT
%%ASK_PHONE%%true%%END%%

// Hỏi thanh toán
%%ASK_PAYMENT%%true%%END%%

// Tạo đơn hàng
%%CREATE_ORDER%%{"dishId":"ID","quantity":1,"address":"...","phone":"...","paymentMethod":"cash"}%%END%%
```

#### **API Response mới:**
```json
{
  "reply": "Text trả lời cho user",
  "dishes": [...],
  "orderIntent": { "dishId": "...", "dishName": "...", "quantity": 1, "price": 50000 },
  "askAddress": true,
  "askPhone": true,
  "askPayment": true,
  "createOrder": { "dishId": "...", "address": "...", "phone": "...", "paymentMethod": "cash" }
}
```

#### **API Endpoint tạo đơn:**
```javascript
POST /api/chatbot/create-order
Body: {
  "userId": "USER_ID",
  "dishId": "DISH_ID",
  "quantity": 1,
  "address": "123 Lê Lợi, Quận 1",
  "phone": "0901234567",
  "paymentMethod": "cash",
  "note": "Gọi trước 5 phút"
}

Response: {
  "success": true,
  "message": "🎉 Đặt hàng thành công!",
  "order": {
    "orderId": "ORDER_ID",
    "dishName": "Trà sữa",
    "quantity": 1,
    "totalAmount": 50000,
    "address": "...",
    "paymentMethod": "cash"
  }
}
```

---

### **2. Frontend Updates**

#### **Conversation State Management:**
```javascript
const [conversationState, setConversationState] = useState({
  orderIntent: null,      // { dishId, dishName, quantity, price }
  address: null,
  phone: null,
  paymentMethod: null,
  step: 'idle'           // idle, order_intent, ask_address, ask_phone, ask_payment, confirm
});
```

#### **Handle Bot Response:**
```javascript
const handleBotResponse = (data) => {
  // 1. Nếu có orderIntent
  if (data.orderIntent) {
    setConversationState(prev => ({
      ...prev,
      orderIntent: data.orderIntent,
      step: 'order_intent'
    }));
  }

  // 2. Nếu bot hỏi địa chỉ
  if (data.askAddress) {
    setConversationState(prev => ({
      ...prev,
      step: 'ask_address'
    }));
  }

  // 3. Nếu user trả lời địa chỉ → lưu vào state
  if (conversationState.step === 'ask_address' && userMessage) {
    setConversationState(prev => ({
      ...prev,
      address: userMessage,
      step: 'ask_phone'
    }));
  }

  // 4. Tương tự cho phone và payment...

  // 5. Nếu bot yêu cầu tạo đơn
  if (data.createOrder) {
    handleCreateOrder(data.createOrder);
  }
};
```

#### **Create Order Function:**
```javascript
const handleCreateOrder = async (orderData) => {
  try {
    const res = await fetch('http://localhost:5000/api/chatbot/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user._id,
        dishId: orderData.dishId,
        quantity: orderData.quantity || 1,
        address: orderData.address,
        phone: orderData.phone,
        paymentMethod: orderData.paymentMethod,
        note: orderData.note || ''
      })
    });

    const data = await res.json();

    if (data.success) {
      // Thêm message thành công
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `${data.message}\n\nMã đơn: #${data.order.orderId.slice(-6).toUpperCase()}\nBạn có thể theo dõi đơn hàng trong mục "Đơn hàng của tôi" 🚀`,
        time: new Date()
      }]);

      // Reset conversation state
      setConversationState({
        orderIntent: null,
        address: null,
        phone: null,
        paymentMethod: null,
        step: 'idle'
      });

      // Hiển thị notification
      toast.success('🎉 Đặt hàng thành công qua Chatbot!', {
        duration: 5000
      });
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    toast.error('❌ Lỗi khi đặt hàng: ' + error.message);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '😔 Xin lỗi, có lỗi khi đặt hàng. Bạn có thể thử lại hoặc đặt qua trang chủ nhé!',
      time: new Date()
    }]);
  }
};
```

---

## 💬 Example Conversations

### **Conversation 1: Đặt món đơn giản**
```
👤 User: Trời nóng quá
🤖 Bot: ☀️ Trời nóng nên chọn đồ mát lạnh! 
      🧋 Trà sữa trân châu - 35.000đ
      🍧 Chè đậu đỏ - 25.000đ

👤 User: Đặt món trà sữa
🤖 Bot: Bạn muốn đặt Trà sữa trân châu với giá 35.000đ phải không?

👤 User: Đúng rồi
🤖 Bot: 📍 Bạn giao hàng đến địa chỉ nào nhỉ?

👤 User: 123 Lê Lợi, Quận 1, TP.HCM
🤖 Bot: 📞 Cho mình số điện thoại liên hệ nhé!

👤 User: 0901234567
🤖 Bot: 💳 Bạn muốn thanh toán bằng gì?
      1️⃣ Tiền mặt (COD)
      2️⃣ MoMo
      3️⃣ Xu

👤 User: Tiền mặt
🤖 Bot: ✅ Xác nhận đơn hàng:
      📦 Trà sữa trân châu x 1
      📍 123 Lê Lợi, Quận 1
      💳 Tiền mặt (COD)
      💰 Tổng: 50.000đ
      
      Bạn xác nhận đặt hàng nhé?

👤 User: Có
🤖 Bot: 🎉 Đặt hàng thành công! Mã đơn #ABC123
      Chờ shipper nhận đơn nhé!
```

### **Conversation 2: Đặt nhiều món**
```
👤 User: Cho tôi 2 phở bò
🤖 Bot: Bạn muốn đặt 2 phở bò phải không?

👤 User: Có, thêm 1 chả giò nữa
🤖 Bot: Hiện tại mình chỉ hỗ trợ đặt 1 món qua chat. 
      Bạn muốn đặt phở bò hay chả giò trước?

👤 User: Phở bò đi
🤖 Bot: 📍 Địa chỉ giao hàng?
...
```

### **Conversation 3: Hủy đơn**
```
👤 User: Đặt món trà sữa
🤖 Bot: Bạn muốn đặt Trà sữa trân châu phải không?

👤 User: Thôi, tôi đổi ý rồi
🤖 Bot: Không sao! Bạn muốn mình gợi ý món khác không? 😊

👤 User: Không, cảm ơn
🤖 Bot: OK! Hẹn gặp lại bạn nhé! 👋
```

---

## 🧪 Testing

### **Test Case 1: Luồng đặt hàng đầy đủ**

**Input sequence:**
```
1. "Trời nóng nên ăn gì?"
2. "Đặt món trà sữa"
3. "Có"
4. "123 Lê Lợi, Quận 1"
5. "0901234567"
6. "Tiền mặt"
7. "Có"
```

**Expected:**
- ✅ Bot gợi ý món mát lạnh
- ✅ Bot xác nhận món trà sữa
- ✅ Bot hỏi địa chỉ → phone → thanh toán
- ✅ Bot hiển thị tóm tắt đơn hàng
- ✅ Đơn hàng được tạo thành công
- ✅ User nhận thông báo

---

### **Test Case 2: User cung cấp thông tin một lần**

**Input:**
```
"Đặt 1 phở bò, giao đến 456 Hai Bà Trưng Quận 3, 
 SĐT 0909123456, thanh toán MoMo"
```

**Expected:**
- ✅ Bot hiểu được tất cả thông tin
- ✅ Bot chỉ cần xác nhận cuối cùng
- ✅ Không hỏi lại thông tin đã có

---

### **Test Case 3: Thông tin không hợp lệ**

**Input:**
```
Địa chỉ: "abc" (quá ngắn)
Phone: "123" (không đủ số)
```

**Expected:**
- ✅ Bot yêu cầu nhập lại
- ✅ Giải thích lý do (địa chỉ cần đầy đủ, SĐT cần 10 số)

---

## 📊 Metrics & Analytics

### **Tracking events:**
```javascript
// Log order from chatbot
{
  event: 'chatbot_order_created',
  userId: 'USER_ID',
  orderId: 'ORDER_ID',
  dishId: 'DISH_ID',
  conversationSteps: 7,  // Số lượt hội thoại
  duration: 120          // Giây từ lúc bắt đầu đến khi đặt xong
}
```

### **KPIs to monitor:**
- **Conversion rate**: % users đặt hàng thành công qua chatbot
- **Average steps**: Trung bình bao nhiêu lượt hội thoại để hoàn thành
- **Drop-off points**: User bỏ ở bước nào nhiều nhất
- **Error rate**: % lỗi khi tạo đơn

---

## 🎯 Kết Luận

### **Đã hoàn thành:**
- ✅ Backend API nhận intent và tạo đơn tự động
- ✅ AI prompt mới với luồng hỏi thông tin
- ✅ Response parsing với các tags mới

### **Cần làm tiếp (Frontend):**
- ⏳ Cập nhật `FoodBot.jsx` để xử lý conversation state
- ⏳ Handle các tags từ API response
- ⏳ UI hiển thị progress đặt hàng
- ⏳ Validation input (địa chỉ, SĐT)
- ⏳ Error handling khi đặt hàng thất bại

### **Future improvements:**
- 💡 Hỗ trợ đặt nhiều món cùng lúc
- 💡 Lưu địa chỉ thường dùng
- 💡 Gợi ý voucher khi đặt hàng
- 💡 Voice input để đặt hàng bằng giọng nói

**Chatbot giờ đã thông minh hơn rất nhiều! 🚀**
