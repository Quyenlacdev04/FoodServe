# 🧪 Hướng Dẫn Test Nhanh

## ⚡ Quick Start

### **1. Khởi động servers:**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
npm run dev
```

### **2. Mở browser:**
```
http://localhost:5173
```

---

## ✅ Test 1: Address Picker (CheckoutPage)

### **Mục đích:** Kiểm tra lỗi "Objects are not valid" đã được fix

### **Steps:**
1. Đăng nhập vào app
2. Thêm món vào giỏ hàng
3. Vào trang **Checkout** (Thanh toán)
4. Click nút **"Chọn địa chỉ giao hàng"**
5. **Tìm kiếm:** Gõ "Lê Lợi, Quận 1"
6. Click vào địa chỉ trong gợi ý
7. **Hoặc click trên bản đồ** để ghim pin
8. Click **"Xác nhận địa chỉ này"**

### **Expected:**
- ✅ Địa chỉ hiển thị bình thường (không lỗi)
- ✅ Không có error "Objects are not valid as a React child"
- ✅ Phí ship được tính tự động
- ✅ Có thể tiếp tục đặt hàng

### **Screenshot:**
```
┌─────────────────────────────────────────┐
│ 📍 Địa chỉ giao hàng                    │
│ 123 Lê Lợi, Quận 1, TP.HCM             │
│ 📍 2.5 km — Phí ship: 12.500đ          │
│                              [✏️ Đổi]   │
└─────────────────────────────────────────┘
```

---

## ✅ Test 2: Chatbot Auto-Order (Luồng đầy đủ)

### **Mục đích:** Test tính năng đặt hàng tự động qua chatbot

### **Steps:**

#### **Bước 1: Mở Chatbot**
- Click icon 🤖 ở góc dưới phải
- Hoặc vào menu → Chatbot

#### **Bước 2: Gợi ý món**
**Gõ:** "Trời nóng quá"

**Expected bot reply:**
```
☀️ Trời nóng nên chọn đồ mát lạnh! Gợi ý cho bạn:

🧋 Trà sữa trân châu - 35.000đ
🍧 Chè đậu đỏ - 25.000đ  
🥤 Sinh tố bơ - 30.000đ

[Nút: Đặt ngay]
```

#### **Bước 3: Đặt món**
**Gõ:** "Đặt món trà sữa"

**Expected:**
- ✅ Bot reply: "Bạn muốn đặt Trà sữa trân châu với giá 35.000đ phải không?"
- ✅ **Progress bar xuất hiện:**
  ```
  🛒 Đang đặt: Trà sữa trân châu    [Hủy]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```

#### **Bước 4: Xác nhận**
**Gõ:** "Có" hoặc "OK"

**Expected bot reply:**
```
📍 Bạn giao hàng đến địa chỉ nào nhỉ?
(VD: 123 Nguyễn Huệ, Quận 1, TP.HCM)

[Nút: 📍 Dùng địa chỉ đã lưu]  ← Nếu đã có
```

#### **Bước 5: Nhập địa chỉ**
**Option A:** Click nút "📍 Dùng địa chỉ đã lưu" (nếu có)  
**Option B:** Gõ: "123 Lê Lợi, Quận 1, TP.HCM"

**Expected bot reply:**
```
📞 Cho mình số điện thoại liên hệ nhé!

[Nút: 📞 Dùng SĐT đã lưu: 0901234567]  ← Nếu đã có
```

**Progress bar update:**
```
✓ Địa chỉ    ○ SĐT    ○ Thanh toán
```

#### **Bước 6: Nhập SĐT**
**Option A:** Click nút "📞 Dùng SĐT đã lưu"  
**Option B:** Gõ: "0901234567"

**Expected bot reply:**
```
💳 Bạn muốn thanh toán bằng gì?

┌──────────┬──────────┬──────────┐
│ 💵 Tiền  │ 🟣 MoMo  │ 🪙 Xu    │
│   mặt    │          │          │
└──────────┴──────────┴──────────┘
```

**Progress bar update:**
```
✓ Địa chỉ    ✓ SĐT    ○ Thanh toán
```

#### **Bước 7: Chọn thanh toán**
**Click:** Nút "💵 Tiền mặt"

**Expected bot reply:**
```
🎉 Đặt hàng thành công!

📦 Mã đơn: #A1B2C3
💰 Tổng tiền: 50.000đ

Bạn có thể theo dõi đơn hàng trong mục 
"Đơn hàng của tôi" 🚀
```

**Expected UI:**
- ✅ **Toast notification:** "🎉 Đặt hàng thành công qua Chatbot!"
- ✅ **Progress bar biến mất**
- ✅ **Conversation state reset**

#### **Bước 8: Verify đơn hàng**
1. Vào menu → **"Đơn hàng của tôi"**
2. Kiểm tra đơn vừa tạo có xuất hiện
3. Verify thông tin: món, địa chỉ, SĐT, thanh toán

---

## ✅ Test 3: Chatbot Auto-Order (Quick Actions)

### **Mục đích:** Test các nút quick action

### **Steps:**
1. Mở chatbot
2. Gõ: "Đặt phở bò"
3. Bot hỏi địa chỉ → **Click "📍 Dùng địa chỉ đã lưu"**
4. Bot hỏi SĐT → **Click "📞 Dùng SĐT đã lưu"**
5. Bot hỏi thanh toán → **Click "💵 Tiền mặt"**

### **Expected:**
- ✅ Chỉ cần 3 clicks để hoàn thành
- ✅ Không cần gõ gì cả
- ✅ Nhanh hơn flow thủ công
- ✅ Đơn hàng được tạo thành công

**Time:** Chỉ mất **15-20 giây**!

---

## ✅ Test 4: Hủy đơn giữa chừng

### **Mục đích:** Test nút Cancel

### **Steps:**
1. Bắt đầu đặt món: "Đặt trà sữa"
2. Bot hỏi địa chỉ
3. **Click nút "Hủy"** trên progress bar

### **Expected:**
- ✅ Toast: "Đã hủy đơn hàng"
- ✅ Progress bar biến mất
- ✅ Conversation state reset về idle
- ✅ Bot sẵn sàng cho câu hỏi mới

---

## ✅ Test 5: Error Handling

### **Mục đích:** Test xử lý lỗi

### **Test 5A: Server lỗi**
1. Tắt backend server
2. Thử đặt món qua chatbot
3. Đến bước cuối

**Expected:**
- ✅ Toast error: "❌ Lỗi khi đặt hàng..."
- ✅ Bot: "😔 Xin lỗi, có lỗi xảy ra..."
- ✅ State reset
- ✅ Có thể thử lại

### **Test 5B: Món không tồn tại**
1. Gõ: "Đặt món pizza hải sản" (giả sử không có)
2. Follow flow đến hết

**Expected:**
- ✅ Bot thông báo lỗi rõ ràng
- ✅ Gợi ý thử món khác

---

## ✅ Test 6: Reset Chat

### **Mục đích:** Test nút Reset

### **Steps:**
1. Đang ở giữa luồng đặt hàng (bất kỳ bước nào)
2. Click nút **🔄 Reset** (refresh icon) ở header

### **Expected:**
- ✅ Tất cả messages bị xóa
- ✅ Conversation state reset
- ✅ Progress bar biến mất (nếu có)
- ✅ Welcome message mới xuất hiện

---

## 📊 Checklist Tổng Hợp

### **Address Picker:**
- [ ] Không có lỗi console
- [ ] Địa chỉ hiển thị đúng
- [ ] Phí ship tính tự động
- [ ] Map hoạt động mượt
- [ ] Search gợi ý chính xác

### **Chatbot Auto-Order:**
- [ ] Progress bar hiển thị/ẩn đúng
- [ ] Quick action buttons hoạt động
- [ ] Auto-fill từ user profile
- [ ] Đơn hàng được tạo thành công
- [ ] Toast notifications hiện đúng
- [ ] Cancel button hoạt động
- [ ] Reset chat hoạt động
- [ ] Error handling ổn
- [ ] State management chính xác

### **Performance:**
- [ ] Chatbot response < 2 giây
- [ ] Không lag khi typing
- [ ] Animation mượt
- [ ] No memory leaks

---

## 🐛 Common Issues & Solutions

### **Issue 1: Bot không phản hồi**
**Cause:** Backend server chưa chạy hoặc GROQ API key invalid  
**Solution:**
```bash
cd server
npm start
# Check console for API key errors
```

### **Issue 2: Progress bar không hiện**
**Cause:** `conversationState.step` không update  
**Solution:** Check browser console, xem `handleBotResponse()` có chạy không

### **Issue 3: Quick action không hoạt động**
**Cause:** User profile chưa có địa chỉ/SĐT  
**Solution:** Vào Profile → Cập nhật thông tin

### **Issue 4: "Objects are not valid" vẫn xuất hiện**
**Cause:** Browser cache cũ  
**Solution:**
```bash
# Clear cache và rebuild
npm run dev
# Hard refresh: Ctrl+Shift+R
```

### **Issue 5: Đơn hàng không được tạo**
**Cause:** MongoDB chưa kết nối hoặc User chưa đăng nhập  
**Solution:**
1. Check backend console: `MongoDB Connected`
2. Đảm bảo đã login
3. Check network tab: API call có 200 OK không

---

## 📈 Success Metrics

### **Test thành công nếu:**
1. ✅ **Không có lỗi console**
2. ✅ **Tất cả UI render đúng**
3. ✅ **Đơn hàng được tạo trong DB**
4. ✅ **Toast notifications hiện**
5. ✅ **User experience mượt mà**

### **Thời gian benchmark:**
- Address picker: **< 10 giây** để chọn địa chỉ
- Chatbot auto-order: **30-45 giây** để hoàn thành đơn
- Quick actions: **15-20 giây** (nhanh nhất)

---

## 🎓 Tips for Testing

### **1. Test với các scenario khác nhau:**
- User mới (chưa có địa chỉ/SĐT lưu)
- User cũ (đã có profile đầy đủ)
- Đặt món đắt (test payment validation)
- Đặt nhiều lần liên tiếp

### **2. Test trên nhiều device:**
- Desktop (Chrome, Firefox)
- Mobile (responsive)
- Dark mode / Light mode

### **3. Monitor console:**
Mở Dev Tools (F12) để theo dõi:
- Network requests
- Console errors
- State updates

### **4. Check database:**
```javascript
// MongoDB shell
use foodserve
db.orders.find().sort({createdAt: -1}).limit(5)
// Xem 5 đơn hàng mới nhất
```

---

## ✅ Done!

Sau khi test xong tất cả checklist, bạn có thể tự tin:

🎉 **Address rendering bug đã được fix hoàn toàn**  
🎉 **Chatbot auto-order hoạt động tốt**  
🎉 **App ready for production!**

---

**Next:** Deploy lên server production và monitor metrics! 🚀
