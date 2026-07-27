# 📄 NỘI DUNG SLIDE THUYẾT TRÌNH — DỰ ÁN FOODSERVE
## Báo cáo Khóa luận Tốt nghiệp • 11 Trang (100% Tiếng Việt)

> **Ghi chú cho người thiết kế slide:**
> - Tài liệu này chứa **toàn bộ nội dung chữ tiếng Việt chi tiết** cho 11 slide thuyết trình.
> - Các mục đánh dấu `[ĐIỀN]` cần được sinh viên cung cấp thông tin thực tế.
> - Tông màu chủ đạo: Chế độ tối (Xanh đen #0F172A), kết hợp Cam tươi (#F97316), Tím Indigo (#818CF8), Xanh Ngọc (#34D399).
> - Trình bày dạng Khối thông tin (Card Layout), Các điểm chính (Bullet Points) ngắn gọn, súc tích, truyền tải rõ ràng.

---

## TỔNG QUAN CẤU TRÚC 11 TRANG SLIDE

| # | Tên Slide | Nội dung trọng tâm |
|---|-----------|--------------------|
| 1 | Trang bìa | Tên đề tài, Sinh viên thực hiện, Giảng viên hướng dẫn, Đơn vị đào tạo |
| 2 | Giới thiệu đề tài | Tổng quan dự án, định vị sản phẩm & 4 nhóm người dùng chính |
| 3 | Mục lục | Khung sườn 11 nội dung báo cáo khóa luận |
| 4 | Mở đầu | Lý do chọn đề tài • Mục tiêu nghiên cứu • Phạm vi & Giới hạn |
| 5 | Công nghệ sử dụng | Giao diện, Máy chủ, Tương tác thời gian thực, Trí tuệ nhân tạo (AI) & Công cụ |
| 6 | Kiến trúc tổng quan | Mô hình 3 tầng (Giao diện - Xử lý nghiệp vụ - Lưu trữ dữ liệu) |
| 7 | Thiết kế hệ thống | 11 Trường hợp sử dụng (Use Case) • Sơ đồ Dữ liệu (16 Bảng) • Luồng xử lý đơn |
| 8 | Kết quả đạt được | 4 Chỉ số nổi bật & 6 Nhóm chức năng cốt lõi + Giao diện người dùng |
| 9 | Trình chiếu sản phẩm | Kịch bản 4 bước trải nghiệm thực tế (Khách ➔ Nhà hàng ➔ Tài xế ➔ Quản trị) |
| 10 | Kết luận & Phát triển | Đóng góp đề tài • Hạn chế tồn tại • Hướng nâng cấp mở rộng |
| 11 | Lời cảm ơn – Hỏi đáp | Lời cảm ơn Hội đồng, Thông tin liên hệ & Mở phần thảo luận Q&A |

---

# 📌 SLIDE 1 — TRANG BÌA

**Bố cục:** Căn giữa, trang trọng, nổi bật tên dự án FOODSERVE.

```
[TÊN TRƯỜNG ĐẠI HỌC]                     ← [ĐIỀN]
[KHOA / VIỆN CÔNG NGHỆ THÔNG TIN]          ← [ĐIỀN]

──────────────────────────────────────────

BÁO CÁO KHÓA LUẬN TỐT NGHIỆP

FOODSERVE
Xây dựng hệ sinh thái ứng dụng
Đặt đồ ăn & Giao hàng trực tuyến Tương tác Thời gian thực

──────────────────────────────────────────

Sinh viên thực hiện:    [Họ và Tên Sinh viên]   ← [ĐIỀN]
Giảng viên hướng dẫn:   [Họ và Tên GVHD]        ← [ĐIỀN]
Lớp / Mã sinh viên:     [Mã lớp - MSSV]         ← [ĐIỀN]
Niên khóa:              [202X – 202X]            ← [ĐIỀN]
```

---

# 📌 SLIDE 2 — GIỚI THIỆU ĐỀ TÀI

**Tiêu đề:** Xây dựng ứng dụng Web đặt đồ ăn & Giao hàng trực tuyến — FoodServe

**Tóm tắt đề tài:**
> FoodServe là hệ sinh thái ứng dụng web đa bên (Khách hàng – Tài xế – Nhà hàng – Quản trị viên) giải quyết bài toán kết nối giao đồ ăn trực tuyến. Hệ thống tích hợp các công nghệ hiện đại như **Trò chuyện & Định vị GPS thời gian thực**, **Trí tuệ nhân tạo (AI Chatbot) tư vấn món ăn**, **Thanh toán Ví MoMo & Ví Xu FoodServe**, cùng **Trò chơi tích điểm thưởng tương tác**.

**4 Vai trò người dùng chính trong hệ thống:**
- 👤 **Khách hàng:** Tìm kiếm & lọc món ăn, Trò chuyện với Trợ lý AI FoodBot, Đặt hàng, Thanh toán MoMo/Xu, Trò chuyện & Theo dõi vị trí Tài xế thời gian thực.
- 🛵 **Tài xế giao hàng:** Nhận đơn trên Bảng điều khiển, Cập nhật tọa độ định vị GPS tự động, Theo dõi tuyến đường giao hàng, Quản lý ví thu nhập.
- 🏪 **Đối tác nhà hàng:** Quản lý thực đơn & giá cả món ăn, Tiếp nhận và chuyển trạng thái đơn hàng, Thống kê báo cáo doanh thu theo ngày/tháng.
- 👑 **Quản trị viên hệ thống:** Phê duyệt hồ sơ đối tác Nhà hàng & Tài xế, Quản lý tài khoản người dùng, Cấu hình mã giảm giá & Thông số hệ thống.

---

# 📌 SLIDE 3 — MỤC LỤC BÁO CÁO

**Tiêu đề:** Nội dung trình bày (11 Phần)

1. **Trang bìa & Giới thiệu đề tài** (Slide 1–2): Định vị sản phẩm & 4 vai trò người dùng.
2. **Mở đầu** (Slide 4): Lý do chọn đề tài, Mục tiêu đồ án & Phạm vi nghiên cứu.
3. **Cơ sở công nghệ** (Slide 5): Công nghệ Giao diện, Máy chủ, Bản đồ GPS & Trí tuệ nhân tạo.
4. **Kiến trúc hệ thống** (Slide 6): Mô hình 3 tầng (Tầng Giao diện - Xử lý - Dữ liệu).
5. **Thiết kế hệ thống** (Slide 7): Các trường hợp sử dụng (Use Case), Sơ đồ dữ liệu 16 Bảng & Luồng đơn hàng.
6. **Kết quả đạt được** (Slide 8): Số liệu thực tế, 6 Nhóm tính năng & Giao diện ứng dụng.
7. **Trình chiếu sản phẩm** (Slide 9): Kịch bản trải nghiệm tương tác trực tiếp 4 luồng.
8. **Kết luận & Hướng phát triển** (Slide 10): Ý nghĩa đóng góp, Hạn chế & Hướng nâng cấp.
9. **Lời cảm ơn & Hỏi đáp** (Slide 11): Trao đổi & Giải đáp thắc mắc với Hội đồng.

---

# 📌 SLIDE 4 — MỞ ĐẦU (LÝ DO – MỤC TIÊU – PHẠM VI)

### 🎯 1. Lý do chọn đề tài
- **Nhu cầu thị trường lớn:** Theo thống kê Statista (2024), hơn **45% người dùng internet Việt Nam** sử dụng dịch vụ đặt đồ ăn trực tuyến hàng tuần.
- **Bài toán kết nối đa bên:** Cần một nền tảng đồng bộ dữ liệu tức thì giữa Khách hàng – Nhà hàng – Tài xế giao hàng – Quản trị viên.
- **Ứng dụng công nghệ mới:** Áp dụng kết nối mạng thời gian thực (WebSocket), định vị vị trí GPS và Trợ lý AI vào trải nghiệm mua sắm thực tế.

### 🏆 2. Mục tiêu đồ án
- **Hệ thống toàn diện hoàn chỉnh:** Xây dựng ứng dụng web sẵn sàng triển khai thực tế (Production-ready) với kiến trúc MERN Stack.
- **Giao tiếp thời gian thực tức thì:** Trò chuyện trực tiếp, cập nhật vị trí Tài xế và thông báo trạng thái đơn hàng (độ trễ dưới 0.1 giây).
- **Trải nghiệm thông minh với AI:** Triển khai **Trợ lý AI (Groq AI / Llama 3.1)** gợi ý món ăn phù hợp nhu cầu và hỗ trợ đặt hàng qua trò chuyện.

### 📐 3. Phạm vi & Giới hạn
- **Đối tượng phục vụ:** 4 nhóm người dùng (Khách hàng, Tài xế giao hàng, Đối tác nhà hàng, Quản trị viên).
- **Công nghệ chính:** React 18, Express.js, MongoDB Atlas, Socket.io, Google Maps API, Cổng thanh toán MoMo.
- **Giới hạn ứng dụng:** Giao diện Web tương thích đa thiết bị (Máy tính / Máy tính bảng / Điện thoại), Thanh toán MoMo chế độ thử nghiệm (Sandbox), Triển khai trên máy chủ đám mây Vercel & Render.

---

# 📌 SLIDE 5 — CÔNG NGHỆ SỬ DỤNG

### ⚛️ Giao diện người dùng (Frontend)
- **React 18.3 & Vite 5.4:** Xây dựng ứng dụng web trang đơn (SPA) tốc độ cao, hiển thị tức thì.
- **Redux Toolkit 2.2:** Quản lý trạng thái dữ liệu toàn cục (Người dùng, Giỏ hàng, Nhà hàng, Đơn hàng).
- **Tailwind CSS 3.4 & Framer Motion:** Thiết kế giao diện hiệu ứng kính mờ (Glassmorphism), Chế độ tối (Dark mode) & Chuyển động mượt mà.
- **Leaflet Maps & Recharts:** Hiển thị bản đồ vị trí địa lý tương tác và vẽ biểu đồ thống kê doanh thu trực quan.

### 🟢 Máy chủ & Dữ liệu (Backend & Database)
- **Node.js & Express.js:** Xây dựng hệ thống Cổng giao tiếp API RESTful chuẩn hóa với hơn 20 điểm kết nối.
- **MongoDB Atlas & Mongoose ODM:** Cơ sở dữ liệu phi quan hệ (NoSQL) đám mây với 16 bảng dữ liệu (Collections) được tối ưu chỉ mục.
- **JWT (JSON Web Token) & Multer:** Xác thực phân quyền người dùng bảo mật và xử lý tải lên hình ảnh sản phẩm.

### 🔌 Tương tác Thời gian thực, AI & Tích hợp
- **Socket.io (WebSocket):** Xử lý trò chuyện trực tiếp, phát thông báo tức thì và định vị vị trí tài xế thời gian thực.
- **Google Maps API:** Tính toán khoảng cách thực tế, ước tính thời gian giao hàng dự kiến (ETA) & chỉ đường GPS.
- **Groq AI (Llama 3.1-8B):** Trợ lý Trí tuệ nhân tạo xử lý ngôn ngữ tự nhiên tiếng Việt để tư vấn món ăn.
- **Cổng thanh toán MoMo:** Tích hợp thanh toán trực tuyến qua mã QR và ứng dụng MoMo thử nghiệm.

---

# 📌 SLIDE 6 — KIẾN TRÚC TỔNG QUAN HỆ THỐNG

### Mô hình 3 tầng (Three-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│  🖥️  TẦNG GIAO DIỆN NGƯỜI DÙNG (Presentation Layer)          │
│  React 18 SPA + Redux Toolkit + Tailwind CSS + Leaflet Maps │
└──────────────────────────────┬──────────────────────────────┘
                               │ Kết nối REST API (HTTPS) + Socket.io (WSS)
┌──────────────────────────────┴──────────────────────────────┐
│  ⚙️  TẦNG XỬ LÝ NGHIỆP VỤ MÁY CHỦ (Business Logic Layer)    │
│  Node.js + Express.js REST API + Socket.io Server           │
│  + Xác thực JWT + Trợ lý Groq AI + Dịch vụ MoMo             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Truy vấn dữ liệu Mongoose ODM
┌──────────────────────────────┴──────────────────────────────┐
│  🗃️  TẦNG LƯU TRỮ DỮ LIỆU (Data Access Layer)               │
│  MongoDB Atlas (Cơ sở dữ liệu Đám mây - 16 Bảng dữ liệu)    │
└─────────────────────────────────────────────────────────────┘
```

**Cơ chế hoạt động:**
- Tầng giao diện gửi yêu cầu tới Máy chủ qua **chuẩn RESTful API** cho các thao tác dữ liệu cơ bản và qua **WebSocket (Socket.io)** cho các luồng tương tác tức thì (Trò chuyện, Định vị GPS, Thông báo).
- Máy chủ xác thực quyền hạn người dùng qua **Mã xác thực JWT** trước khi thực hiện truy vấn Cơ sở dữ liệu **MongoDB Atlas**.

---

# 📌 SLIDE 7 — THIẾT KẾ HỆ THỐNG (USE CASE / ERD / LUỒNG XỬ LÝ)

### 📋 11 Trường hợp sử dụng (Use Case) chính
- **UC1–UC2:** Quản lý tài khoản (Đăng ký, Đăng nhập, Quên mật khẩu, OTP) & Đăng ký đối tác (Nhà hàng / Tài xế).
- **UC3–UC5:** Đặt hàng & Thanh toán (Tiền mặt/MoMo/Ví Xu), Nhà hàng xử lý đơn, Tài xế nhận đơn & Định vị GPS.
- **UC6–UC8:** Theo dõi đơn & Đánh giá Tài xế, Trò chuyện thời gian thực 3 bên, Trò chơi vòng quay & Áp mã giảm giá.
- **UC9–UC11:** Quản trị viên duyệt đối tác, Quản trị hệ thống & Báo cáo thống kê doanh thu.

### 📊 Cơ sở dữ liệu (ERD) — 16 Bảng dữ liệu (Collections)
`User` (Người dùng), `Order` (Đơn hàng), `Restaurant` (Nhà hàng), `MenuItem` (Món ăn), `Review` (Đánh giá), `Message` (Tin nhắn), `Notification` (Thông báo), `Voucher` (Mã giảm giá), `Favorite` (Yêu thích), `CoinTransaction` (Giao dịch xu), `DriverRequest` (Yêu cầu tài xế), `PartnerRequest` (Yêu cầu đối tác)...

### 🔄 Luồng xử lý đơn hàng Thời gian thực (5 Bước)
1. **Khách đặt hàng:** Chọn món ➔ Áp mã giảm giá ➔ Chọn phương thức thanh toán ➔ Phát thông báo đơn mới `new-order`.
2. **Nhà hàng tiếp nhận:** Nhận tín hiệu chuông thông báo tức thì qua Socket.io ➔ Duyệt đơn ➔ Chuẩn bị món ăn.
3. **Tài xế nhận đơn:** Đơn hàng hiển thị trên Bảng điều khiển Tài xế ➔ Bấm "Nhận đơn" ➔ Di chuyển tới nhà hàng.
4. **Giao hàng & Định vị GPS:** Tài xế di chuyển phát tọa độ GPS mỗi 10 giây ➔ Khách xem bản đồ trực tiếp & Trò chuyện.
5. **Hoàn thành & Tích xu:** Tài xế xác nhận giao thành công ➔ Hệ thống tự động cộng Xu thưởng cho Khách & Tài xế.

---

# 📌 SLIDE 8 — KẾT QUẢ ĐẠT ĐƯỢC (CHỨC NĂNG + GIAO DIỆN)

### 📊 4 Chỉ số kết quả nổi bật
- **6 / 6** Nhóm tính năng chính hoàn thành (Đạt 100% tiến độ phát triển).
- **31** Tệp mã nguồn mới & nâng cấp (Thành phần UI, Trang ứng dụng, Trạng thái Redux, Xử lý kết nối).
- **20+** Điểm kết nối API RESTful & 7 Sự kiện mạng Socket.io hoạt động ổn định.
- **0** Lỗi khi biên dịch ứng dụng thực tế (`npm run build` thành công hoàn toàn).

### ✨ 6 Nhóm tính năng cốt lõi
1. 🔍 **Tìm kiếm & Lọc thông minh:** Tìm món ăn tối ưu thời gian gõ 0.3 giây, lọc theo 8 danh mục, điểm đánh giá, miễn phí giao hàng.
2. ❤️ **Quản lý Yêu thích:** Nút thả tim với chuyển động sinh động, trang riêng lưu trữ danh sách nhà hàng yêu thích.
3. 💳 **Thanh toán linh hoạt:** 3 phương thức (Tiền mặt COD, Mã QR MoMo trực tuyến, Ví Xu FoodServe tích thưởng 2%).
4. 🛵 **Bảng điều khiển Tài xế:** Thống kê thu nhập, nhận đơn 1 chạm, quy trình giao hàng 3 bước, tự động làm mới danh sách.
5. 💬 **Trò chuyện Thời gian thực:** Tương tác tức thì độ trễ dưới 0.1 giây, hiển thị tin nhắn chưa đọc, phân biệt 3 vai trò.
6. 📍 **Định vị GPS Google Maps:** Bản đồ 3 biểu tượng (Nhà hàng, Tài xế di chuyển, Khách hàng), tự động tính thời gian giao hàng dự kiến.

---

# 📌 SLIDE 9 — TRÌNH CHIẾU SẢN PHẨM

**Kịch bản Trải nghiệm thực tế 4 luồng người dùng (Trình chiếu Trực tiếp):**

- 👤 **Bước 1 — Luồng Khách hàng:**
  - Tìm kiếm món ăn bằng thanh tìm kiếm thông minh.
  - Mở **Trợ lý AI FoodBot**, nhập câu hỏi *"Tư vấn cho mình món cơm trưa ngon dưới 50.000 đồng"*.
  - Thêm món vào giỏ ➔ Áp mã giảm giá ➔ Thanh toán bằng **Ví Xu FoodServe**.

- 🏪 **Bước 2 — Luồng Nhà hàng:**
  - Nhận âm thanh thông báo đơn hàng mới tức thì.
  - Chuyển trạng thái đơn sang *"Đang chuẩn bị món ăn"*.

- 🛵 **Bước 3 — Luồng Tài xế giao hàng:**
  - Mở **Bảng điều khiển Tài xế** ➔ Bấm nhận đơn hàng.
  - Bật định vị GPS di chuyển ➔ Nhắn tin trò chuyện với khách: *"Tài xế đang giao đến ạ"*.
  - Hoàn thành đơn hàng ➔ Thu nhập tự động cộng vào Ví Tài xế.

- 👑 **Bước 4 — Luồng Quản trị viên:**
  - Quan sát biểu đồ thống kê doanh thu hệ thống trực quan.
  - Phê duyệt yêu cầu đăng ký mở nhà hàng đối tác mới.

> 💡 *▶ Kính mời Hội đồng cùng theo dõi màn TRÌNH CHIẾU TRỰC TIẾP trên sản phẩm thật*

---

# 📌 SLIDE 10 — KẾT LUẬN & HƯỚNG PHÁT TRIỂN

### 💡 1. Ý nghĩa & Đóng góp của đề tài
- Xây dựng thành công ứng dụng web đặt đồ ăn **toàn diện hoàn chỉnh**, sẵn sàng triển khai thực tế.
- Tích hợp mượt mà các công nghệ hiện đại: **MERN Stack + Socket.io + Google Maps + Trợ lý AI Chatbot**.
- Giao diện đạt tính thẩm mỹ cao (Chế độ tối Kính mờ), tối ưu trải nghiệm người dùng trên mọi thiết bị.

### ⚠️ 2. Hạn chế còn tồn tại
- Chưa tích hợp bộ Kiểm thử tự động hóa (Unit Test & End-to-End Test).
- Cổng thanh toán MoMo đang hoạt động ở môi trường thử nghiệm (Sandbox).
- Chưa có hệ thống giám sát log lỗi tự động và bộ lọc chống tấn công mạng nâng cao.

### 🚀 3. Hướng phát triển tiếp theo
- **Ứng dụng Di động (Mobile App):** Phát triển ứng dụng di động cho iOS & Android bằng React Native.
- **Tích hợp Thanh toán chính thức:** Đăng ký đối tác doanh nghiệp với MoMo, VNPay và ZaloPay.
- **Nâng cấp AI thông minh hơn (RAG):** Lấy dữ liệu thực đơn trực tiếp từ Cơ sở dữ liệu theo thời gian thực cho AI Chatbot.
- **Thông báo Đẩy (Push Notification):** Tích hợp dịch vụ Firebase Cloud Messaging gửi thông báo trực tiếp đến điện thoại.

---

# 📌 SLIDE 11 — LỜI CẢM ƠN – HỎI ĐÁP

```
🙏

Xin chân thành cảm ơn!

Cảm ơn Hội đồng, Giảng viên hướng dẫn
và các Thầy Cô đã lắng nghe bài báo cáo khóa luận.
Em rất mong nhận được những ý kiến đóng góp quý báu
từ Thầy Cô để hoàn thiện đề tài hơn nữa.

──────────────────────────────────────────

💬 Phần Hỏi & Đáp (Q&A)
Em sẵn sàng giải đáp mọi thắc mắc từ Hội đồng.

──────────────────────────────────────────

🍽️ FoodServe v1.0 — Nền tảng Đặt đồ ăn & Giao hàng Trực tuyến
📧 [Email liên hệ của sinh viên]         ← [ĐIỀN]
🌐 [Link Website Trình chiếu / GitHub]   ← [ĐIỀN]
```
