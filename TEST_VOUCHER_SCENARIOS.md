# 🧪 KỊCH BẢN TEST VOUCHER

Dùng file này để test các tình huống voucher sau khi fix!

---

## 📝 CHUẨN BỊ

1. ✅ Chạy backend: `cd server && npm start`
2. ✅ Chạy frontend: `npm run dev`
3. ✅ Đăng nhập vào tài khoản user
4. ✅ Thêm vài món ăn vào giỏ hàng

---

## ✅ TEST CASE 1: THÀNH CÔNG - MÃ HỢP LỆ

### Bước test:
1. Thêm món ăn vào giỏ hàng (tổng > 0đ)
2. Nhập mã: `SALE10`
3. Click "Áp dụng"

### Kết quả mong đợi:
```
🎉 Áp dụng "SALE10" thành công! Giảm XX.XXXđ
```
- ✅ Thông báo màu xanh lá
- ✅ Icon 🎉
- ✅ Hiển thị 3 giây
- ✅ Tổng tiền giảm 10%
- ✅ Không bị NaN

---

## 💰 TEST CASE 2: THIẾU TIỀN - ĐƠN CHƯA ĐỦ ĐIỀU KIỆN

### Scenario A: Thiếu 50.000đ

**Bước test:**
1. Thêm món ăn tổng: 100.000đ
2. Nhập mã: `FOOD50` (yêu cầu tối thiểu 150.000đ)
3. Click "Áp dụng"

**Kết quả mong đợi:**
```
💰 Bạn còn thiếu 50.000đ để sử dụng mã này (đơn tối thiểu 150.000đ)
```
- ✅ Thông báo màu đỏ
- ✅ Icon 💰 (không phải ❌)
- ✅ Hiển thị 5 giây
- ✅ Hiển thị số tiền thiếu: 50.000đ
- ✅ Hiển thị đơn tối thiểu: 150.000đ
- ✅ Tổng tiền không đổi

### Scenario B: Thiếu nhiều hơn

**Bước test:**
1. Thêm món ăn tổng: 100.000đ
2. Nhập mã: `VIP100` (yêu cầu tối thiểu 300.000đ)
3. Click "Áp dụng"

**Kết quả mong đợi:**
```
💰 Bạn còn thiếu 200.000đ để sử dụng mã này (đơn tối thiểu 300.000đ)
```

### Scenario C: Thêm món và thử lại

**Bước test:**
1. Giỏ hàng: 100.000đ
2. Thử FOOD50 → ❌ Thiếu 50.000đ
3. Thêm món: 100.000đ (tổng = 200.000đ)
4. Thử lại FOOD50

**Kết quả mong đợi:**
```
🎉 Áp dụng "FOOD50" thành công! Giảm 50.000đ
```

---

## ❌ TEST CASE 3: MÃ KHÔNG HỢP LỆ

### Bước test:
1. Nhập mã: `INVALID123` (không tồn tại)
2. Click "Áp dụng"

### Kết quả mong đợi:
```
❌ Mã voucher không hợp lệ hoặc đã hết hạn
```
- ✅ Thông báo màu đỏ
- ✅ Icon ❌
- ✅ Hiển thị 5 giây

---

## ⚠️ TEST CASE 4: CHƯA NHẬP MÃ

### Bước test:
1. Để trống ô input
2. Click "Áp dụng"

### Kết quả mong đợi:
```
⚠️ Vui lòng nhập mã voucher
```
- ✅ Icon ⚠️
- ✅ Hiển thị 3 giây

---

## 🔄 TEST CASE 5: LOADING STATE

### Bước test:
1. Nhập mã bất kỳ
2. Click "Áp dụng"
3. Quan sát trong khi đang validate

### Kết quả mong đợi:
- ✅ Nút hiển thị: "Đang kiểm tra..."
- ✅ Nút bị disable
- ✅ Không click được nhiều lần
- ✅ Sau khi validate xong → Nút về "Áp dụng"

---

## 🎁 TEST CASE 6: DANH SÁCH VOUCHER USER

### Bước test:
1. Đảm bảo user có voucher trong tài khoản (từ minigame hoặc admin phát)
2. Mở giỏ hàng
3. Xem phần "Kho Voucher của bạn"
4. Click vào một voucher

### Kết quả mong đợi:
- ✅ Auto validate qua API (không nhập tay)
- ✅ Hiển thị loading state
- ✅ Nếu hợp lệ → 🎉 Success
- ✅ Nếu thiếu tiền → 💰 Hiển thị số tiền thiếu

---

## 🔗 TEST CASE 7: SERVER DOWN (Lỗi kết nối)

### Bước test:
1. Tắt server backend
2. Nhập mã voucher
3. Click "Áp dụng"

### Kết quả mong đợi:
```
⚠️ Không thể kết nối đến server. Vui lòng thử lại!
```
- ✅ Icon ⚠️
- ✅ Hiển thị 4 giây
- ✅ Console log error

---

## 📊 DANH SÁCH MÃ VOUCHER ĐỂ TEST

### **Mã không yêu cầu tối thiểu:**
```
SALE10   → Giảm 10%
FREESHIP → Giảm 25.000đ phí ship
SALE20   → Giảm 20.000đ
```
✅ Dùng được với đơn hàng bất kỳ

### **Mã có yêu cầu tối thiểu:**
```
NEW30  → Giảm 30.000đ, đơn tối thiểu 100.000đ
FOOD50 → Giảm 50.000đ, đơn tối thiểu 150.000đ
VIP100 → Giảm 100.000đ, đơn tối thiểu 300.000đ
```
✅ Test thông báo thiếu tiền với các mã này

---

## ✅ CHECKLIST TỔNG HỢP

Đánh dấu ✅ sau khi test:

- [ ] **TC1**: Thành công với SALE10
- [ ] **TC2A**: Thiếu 50k với FOOD50 (đơn 100k)
- [ ] **TC2B**: Thiếu 200k với VIP100 (đơn 100k)
- [ ] **TC2C**: Thêm món và apply thành công
- [ ] **TC3**: Mã không hợp lệ INVALID123
- [ ] **TC4**: Input trống
- [ ] **TC5**: Loading state khi validate
- [ ] **TC6**: Click voucher từ danh sách user
- [ ] **TC7**: Server down

---

## 🎯 KẾT QUẢ MONG ĐỢI TỔNG QUÁT

### ✅ Hoạt động đúng nếu:
1. Không bao giờ hiển thị `NaN đ`
2. Thông báo lỗi rõ ràng, chi tiết
3. Hiển thị số tiền thiếu khi đơn chưa đủ
4. Loading state hoạt động
5. Toast notifications có màu và icon đúng
6. Tổng tiền tính đúng sau khi apply

### ❌ Cần fix nếu:
1. Hiển thị `NaN đ`
2. Thông báo chung chung "Mã không hợp lệ"
3. Không hiển thị số tiền thiếu
4. Không có loading state
5. Toast không có màu/icon
6. Tổng tiền sai

---

## 🐛 GHI CHÚ LỖI

Nếu phát hiện lỗi, ghi lại đây:

```
Lỗi #1:
- Mô tả: ...
- Cách tái hiện: ...
- Screenshot: ...

Lỗi #2:
- Mô tả: ...
- Cách tái hiện: ...
- Screenshot: ...
```

---

**Chúc test vui vẻ!** 🎉 Nếu có bất kỳ test case nào fail, báo lại để fix nhé!
