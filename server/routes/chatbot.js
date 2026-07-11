import express from 'express';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import ChatbotHistory from '../models/ChatbotHistory.js';

const router = express.Router();

// Parse tag %%DISHES%%[...]%%END%%
function parseDishes(text) {
  let match = text.match(/%%DISHES%%([\s\S]*?)%%END%%/);
  
  // Fallback: nếu không có %%END%% (response bị cắt), thử lấy phần sau %%DISHES%%
  if (!match) {
    match = text.match(/%%DISHES%%([\s\S]*)/);
  }

  if (!match) return { reply: text.trim(), dishes: [] };

  try {
    let jsonStr = match[1].trim();
    // Xóa %%END%% còn sót nếu có
    jsonStr = jsonStr.replace(/%%END%%/g, '').trim();
    // Gộp nhiều [{}]\n[{}] thành [{},{}]
    jsonStr = jsonStr.replace(/\]\s*,?\s*\[/g, ',');
    // Loại bỏ dấu phẩy thừa ở cuối
    jsonStr = jsonStr.replace(/,\s*$/, '');
    if (!jsonStr.startsWith('[')) jsonStr = '[' + jsonStr;
    if (!jsonStr.endsWith(']')) jsonStr = jsonStr + ']';
    // Cố parse, nếu JSON bị cắt giữa chừng thì bỏ qua
    const dishes = JSON.parse(jsonStr);
    const reply = text.replace(/%%DISHES%%[\s\S]*?(%%END%%|$)/g, '').replace(/\n{3,}/g, '\n\n').trim();
    return { reply, dishes: Array.isArray(dishes) ? dishes : [dishes] };
  } catch {
    // JSON không hợp lệ (bị cắt giữa chừng) - xóa tag và trả reply sạch
    const reply = text.replace(/%%DISHES%%[\s\S]*?(%%END%%|$)/g, '').replace(/\n{3,}/g, '\n\n').trim();
    return { reply, dishes: [] };
  }
}

// Fallback khi không có API key
function generateFallbackResponse(message, menuItems, restaurantMap, userRole = 'user') {
  const msg = message.toLowerCase();
  
  if (userRole === 'shipper') {
    // FAQ và hỗ trợ khẩn cấp cho Tài xế (Shipper)
    if (msg.includes('bùng') || msg.includes('bom') || msg.includes('không nhận') || msg.includes('không nghe')) {
      return {
        reply: `🚫 **Hướng dẫn xử lý khi khách không nhận hàng hoặc bùng đơn:**\n\n` +
               `1️⃣ **Gọi tối thiểu 3 cuộc:** Mỗi cuộc cách nhau 2-3 phút. Nhớ chụp ảnh màn hình nhật ký cuộc gọi.\n` +
               `2️⃣ **Báo cáo sự cố:** Nhấn nút **"Báo cáo sự cố"** trên màn hình đơn hàng và chọn lý do **"Không liên lạc được khách"**.\n` +
               `3️⃣ **Liên hệ Admin:** Chat/gửi thông tin đơn hàng để tổng đài xác minh và hoàn trả 100% tiền ứng hoặc phí giao hàng cùng điểm thưởng cho bạn.\n` +
               `4️⃣ **Xử lý món ăn:** Tuyệt đối không tự ý hoàn trả cho quán nếu chưa có xác nhận từ tổng đài. Admin sẽ hướng dẫn bạn gửi lại kho hoặc tiêu hủy.`,
        dishes: [],
        source: 'local'
      };
    }
    if (msg.includes('rút tiền') || msg.includes('tiền') || msg.includes('coin') || msg.includes('rút xu') || msg.includes('ngân hàng')) {
      return {
        reply: `🪙 **Hướng dẫn rút tiền/xu về ngân hàng:**\n\n` +
               `1️⃣ Vào mục **"Hồ sơ"** -> Chọn **"Rút tiền về ngân hàng"**.\n` +
               `2️⃣ Nhập số Xu muốn rút (tối thiểu 50 Xu, 1 Xu = 1.000đ).\n` +
               `3️⃣ Chọn ngân hàng, điền đúng Số tài khoản và Tên chủ tài khoản (viết hoa không dấu).\n` +
               `4️⃣ Bấm **"Xác nhận rút tiền"**. Yêu cầu sẽ được duyệt tự động và chuyển tiền trong vòng 5-10 phút 24/7.`,
        dishes: [],
        source: 'local'
      };
    }
    if (msg.includes('hỏng xe') || msg.includes('tai nạn') || msg.includes('sự cố') || msg.includes('bể bánh') || msg.includes('thủng')) {
      return {
        reply: `🚨 **Xử lý sự cố khẩn cấp trên đường (Hỏng xe, Tai nạn):**\n\n` +
               `- **Giữ an toàn:** Hãy di chuyển xe vào lề đường an toàn trước.\n` +
               `- **Nếu đơn hàng đang giao:** Gọi điện báo ngay cho khách hàng thông cảm về sự cố giao chậm.\n` +
               `- **Báo cáo sự cố:** Vào màn hình chi tiết đơn hàng, chọn **"Báo cáo sự cố"** -> chọn **"Hỏng xe/Tai nạn"** để hệ thống điều phối tài xế khác hỗ trợ hoặc hủy đơn an toàn không bị phạt tỷ lệ chấp nhận (AR%).\n` +
               `- **Hỗ trợ y tế:** Nếu gặp chấn thương, hãy gọi ngay tổng đài khẩn cấp hoặc nhờ người dân hỗ trợ. Sức khỏe của bạn là quan trọng nhất!`,
        dishes: [],
        source: 'local'
      };
    }
    if (msg.includes('chậm') || msg.includes('quán') || msg.includes('lâu') || msg.includes('chờ')) {
      return {
        reply: `⏳ **Hướng dẫn khi nhà hàng chuẩn bị quá lâu:**\n\n` +
               `- Nếu thời gian chờ quá **15 phút** kể từ lúc bạn đến quán, bạn có quyền bấm **"Báo cáo quán giao chậm"** để hệ thống ghi nhận.\n` +
               `- Bạn có thể nhắn tin báo khách hàng qua khung chat đơn hàng để khách yên tâm chờ đợi.\n` +
               `- Trường hợp quá lâu và bạn muốn hủy để nhận đơn khác, hãy liên hệ admin để được hủy đơn không phạt chỉ số.`,
        dishes: [],
        source: 'local'
      };
    }
    return {
      reply: `🛵 **Hộp thư hỗ trợ tài xế FoodServe!**\n\nEm có thể giúp gì cho anh/chị trên các cung đường giao hàng ạ? Anh/chị có thể hỏi các sự cố như:\n- Khách bùng hàng/Không nghe máy\n- Gặp sự cố hỏng xe/Tai nạn\n- Cách rút tiền về ngân hàng\n- Nhà hàng chuẩn bị món quá lâu`,
      dishes: [],
      source: 'local'
    };
  }
  const getMatchedDishes = (keywords, count = 3) => {
    const filtered = menuItems.filter(m =>
      keywords.some(k => m.name?.toLowerCase().includes(k) || m.category?.toLowerCase().includes(k))
    );
    const pool = filtered.length > 0 ? filtered : menuItems.slice(0, count);
    return pool.slice(0, count).map(m => ({
      id: m._id.toString(),
      name: m.name,
      price: m.price,
      image: m.image || '',
      description: m.description || '',
      restaurant: restaurantMap[m.restaurantId?.toString()]?.name || 'FoodServe',
      restaurantId: m.restaurantId?.toString()
    }));
  };

  // Hỏi về FoodServe / tính năng
  if (msg.includes('foodserve') || msg.includes('ứng dụng') || msg.includes('app') || msg.includes('tính năng') || msg.includes('chức năng')) {
    return {
      reply: `🍽️ **FoodServe** là ứng dụng đặt đồ ăn online với đầy đủ tính năng:\n\n👤 **Người dùng:** Đặt hàng, theo dõi đơn real-time, chat với shipper, đánh giá, tích Xu\n💳 **Thanh toán:** COD, MoMo, Xu tích lũy\n🏪 **Nhà hàng:** Quản lý menu, thống kê doanh thu\n🛵 **Shipper:** Nhận đơn, cập nhật GPS, kiếm Xu\n👑 **Admin:** Quản lý toàn hệ thống\n\nBạn muốn biết thêm về tính năng nào? 😊`,
      dishes: [],
      source: 'local'
    };
  }
  // Hỏi về tài khoản / mật khẩu / sự cố đăng nhập
  if (msg.includes('tài khoản') || msg.includes('mật khẩu') || msg.includes('đăng nhập') || msg.includes('đăng ký') || msg.includes('profile') || msg.includes('hồ sơ') || msg.includes('sđt') || msg.includes('địa chỉ') || msg.includes('avatar')) {
    return {
      reply: `🔑 **Hướng dẫn xử lý các vấn đề về tài khoản:**\n\n` +
             `1️⃣ **Quên mật khẩu:** Bạn ra trang đăng nhập, nhấn vào nút **"Quên mật khẩu?"** để nhận mã OTP khôi phục lại qua email đăng ký nhé.\n` +
             `2️⃣ **Cập nhật thông tin (SĐT, Địa chỉ, Avatar):** Bạn vào trang **Hồ sơ cá nhân (Profile)** để chỉnh sửa bất kỳ lúc nào.\n` +
             `3️⃣ **Lỗi đăng nhập/đăng ký:** Hãy chắc chắn bạn đã nhập đúng định dạng email và mật khẩu (từ 6 ký tự trở lên).\n` +
             `4️⃣ **Xác minh OTP:** Kiểm tra cả mục thư rác (spam) trong email của bạn để không bỏ sót mã xác minh nhé!\n\n` +
             `Nếu bạn vẫn gặp sự cố, vui lòng liên hệ admin hoặc phản hồi lại với mình nhé! 😊`,
      dishes: [],
      source: 'local'
    };
  }
  if (msg.includes('nóng') || msg.includes('nong') || msg.includes('hè')) {
    return { reply: '☀️ Trời nóng nên chọn đồ mát lạnh! Gợi ý cho bạn:', dishes: getMatchedDishes(['nước', 'chè', 'sinh tố', 'kem', 'đá']), source: 'local' };
  }
  if (msg.includes('lạnh') || msg.includes('mưa') || msg.includes('rét')) {
    return { reply: '🌧️ Trời lạnh cần món ấm nóng!', dishes: getMatchedDishes(['lẩu', 'phở', 'cháo', 'súp']), source: 'local' };
  }
  if (msg.includes('mệt') || msg.includes('stress')) {
    return { reply: '😴 Mệt rồi cần bồi dưỡng!', dishes: getMatchedDishes(['cháo', 'súp', 'cơm']), source: 'local' };
  }
  if (msg.includes('sáng')) {
    return { reply: '🌅 Bữa sáng năng lượng!', dishes: getMatchedDishes(['bánh mì', 'phở', 'xôi', 'bún']), source: 'local' };
  }
  if (msg.includes('trưa')) {
    return { reply: '🍱 Bữa trưa đủ chất!', dishes: getMatchedDishes(['cơm', 'bún', 'mì']), source: 'local' };
  }
  if (msg.includes('tối')) {
    return { reply: '🌙 Bữa tối ngon miệng!', dishes: getMatchedDishes(['lẩu', 'bún', 'cháo']), source: 'local' };
  }
  const dishes = getMatchedDishes(msg.split(' ').filter(w => w.length > 2));
  return { reply: '🤖 Đây là một số món bạn có thể thích:', dishes: dishes.length ? dishes : getMatchedDishes(['cơm', 'bún', 'phở']), source: 'local' };
}

// Lấy danh sách các phiên chat của user
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'Missing user ID' });

    // Lấy tất cả tin nhắn của user, gom nhóm theo sessionId
    const sessions = await ChatbotHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$sessionId',
          createdAt: { $first: '$createdAt' },
          updatedAt: { $last: '$createdAt' },
          messages: { $push: { role: '$role', content: '$content' } }
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    const formattedSessions = sessions.map(s => {
      const firstUserMsg = s.messages.find(m => m.role === 'user');
      return {
        sessionId: s._id,
        title: firstUserMsg?.content || 'Cuộc trò chuyện mới',
        updatedAt: s.updatedAt,
        createdAt: s.createdAt
      };
    });

    res.json(formattedSessions);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phiên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy lịch sử của 1 phiên
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ message: 'Missing session ID' });

    const history = await ChatbotHistory.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json(history);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử phiên chat:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ message: 'Missing session ID' });

    await ChatbotHistory.deleteMany({ sessionId });
    res.json({ success: true, message: 'Đã xóa lịch sử' });
  } catch (error) {
    console.error('Lỗi khi xóa lịch sử chat:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], userId, sessionId, userRole = 'user', conversationState = {} } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Vui lòng nhập tin nhắn' });
    if (!sessionId) return res.status(400).json({ message: 'Thiếu sessionId' });

    const menuItems = await MenuItem.find().limit(80).lean();
    const restaurants = await Restaurant.find({ isActive: { $ne: false } }).limit(20).lean();
    const restaurantMap = {};
    restaurants.forEach(r => { restaurantMap[r._id.toString()] = r; });

    const menuContext = menuItems.slice(0, 50).map(item => {
      const rest = restaurantMap[item.restaurantId?.toString()];
      return `[ID:${item._id}] ${item.name} | ${item.category || 'Món ăn'} | ${Number(item.price).toLocaleString('vi-VN')}đ | ${rest?.name || 'Unknown'} | RestID:${item.restaurantId}`;
    }).join('\n');

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY') {
      const fallback = generateFallbackResponse(message, menuItems, restaurantMap, userRole);
      // Lưu lịch sử vào database nếu có userId
      if (userId && sessionId) {
        await ChatbotHistory.insertMany([
          { userId, sessionId, role: 'user', content: message },
          { userId, sessionId, role: 'assistant', content: fallback.reply, dishes: fallback.dishes, source: 'local' }
        ]);
      }
      return res.json(fallback);
    }

    let systemPrompt = '';
    if (userRole === 'shipper') {
      systemPrompt = `Bạn là ShipperBot 🛵 - trợ lý AI cực kỳ đắc lực, thân thiện và tận tâm dành riêng cho các bác tài xế (shipper) của FoodServe!
Xưng hô: Thân mật là "Em/Dạ/Vâng", gọi tài xế là "Bác tài/Anh/Chị".
Nhiệm vụ của bạn là giải đáp thắc mắc và hỗ trợ xử lý sự cố trong quá trình giao hàng của Shipper.

Bạn CHỈ ĐƯỢC phép hỗ trợ các chủ đề sau:
1. Khách bùng hàng/bom hàng/không liên lạc được (hướng dẫn gọi 3 cuộc, chụp nhật ký cuộc gọi, báo sự cố trên app, liên hệ tổng đài để hoàn tiền).
2. Sự cố giao thông/Hỏng xe/Tai nạn trên đường (nhắc nhở an toàn, báo khách hàng thông cảm, sử dụng tính năng "Báo cáo sự cố" trên app để đổi tài xế hoặc hủy đơn không phạt chỉ số AR%).
3. Hướng dẫn rút tiền/xu về ngân hàng (mục Hồ sơ -> Rút tiền ngân hàng, nhập số tài khoản, tên viết hoa, duyệt tự động trong 5-10p).
4. Nhà hàng chuẩn bị món quá lâu (hướng dẫn bấm "Báo cáo quán giao chậm" nếu quá 15 phút, nhắn tin báo khách).
5. Cách tính thu nhập và cấp bậc (Xu = 90% phí ship, 1 Xu = 1000đ; các cấp Đồng, Bạc, Vàng, Kim Cương tương ứng với các cột mốc đơn hoàn thành).

Nếu câu hỏi ngoài các chủ đề trên (ví dụ hỏi gợi ý món ăn cho khách hàng, hoặc lập trình, khoa học...), hãy trả lời lịch sự:
"😅 Bác tài ơi, em là trợ lý hỗ trợ vận chuyển cho tài xế nên chỉ rành các vấn đề giao hàng, rút tiền, hỏng xe hoặc sự cố bùng đơn thôi ạ! Bác tài cần em hỗ trợ gì liên quan đến chuyến xe của mình không ạ? 🛵"`;
    } else {
      systemPrompt = `Bạn là FoodBot 🤖 - siêu trợ lý AI thông minh, tận tâm và vô cùng đáng yêu của FoodServe! Tính cách của bạn: cực kỳ dẻo miệng, tinh tế, luôn biết cách nịnh và làm hài lòng khách hàng bằng những lời khen ngợi ngọt ngào nhất. Bạn xưng hô là "mình/dạ/vâng/ạ", gọi khách hàng một cách tôn trọng và vô cùng nhiệt tình. Bạn luôn thấu hiểu tâm lý khách hàng để đưa ra gợi ý xuất sắc nhất!

⚠️ QUAN TRỌNG - LUẬT BẮT BUỘC:
Bạn CHỈ ĐƯỢC phép trả lời các chủ đề sau:
1. Gợi ý món ăn, đồ uống (theo thời tiết, tâm trạng, bữa ăn, sở thích)
2. Thông tin về FoodServe app và tính năng
3. Hướng dẫn sử dụng app (đặt hàng, thanh toán, tích Xu...)
4. Tư vấn dinh dưỡng cơ bản liên quan đến món ăn
5. ĐẶT HÀNG TỰ ĐỘNG - Khi user nói "đặt món này", "mua món này", "đặt hộ tôi", bạn sẽ hỏi thông tin và tự động đặt
6. HỖ TRỢ VÀ XỬ LÝ SỰ CỐ TÀI KHOẢN - Hướng dẫn chi tiết cho khách hàng cách xử lý các vấn đề về tài khoản (như quên mật khẩu, cập nhật số điện thoại/địa chỉ/ảnh đại diện, đăng ký/đăng nhập lỗi, xác minh OTP email). Bạn hãy hướng dẫn từng bước rõ ràng, thân thiện và hướng dẫn họ vào đúng các mục chức năng trên app (như trang Profile, trang Đăng nhập...).

Nếu câu hỏi KHÔNG thuộc 6 chủ đề trên (lập trình, toán học, tin tức, dịch thuật, viết văn, v.v.), bạn PHẢI từ chối bằng câu này CHÍNH XÁC:
"😅 Xin lỗi bạn, câu hỏi này nằm ngoài phạm vi của mình! Mình chỉ hỗ trợ gợi ý món ăn, vấn đề tài khoản và hướng dẫn dùng FoodServe thôi. Bạn muốn mình gợi ý món ăn gì không? 🍽️"

KHÔNG được trả lời bất kỳ nội dung nào khác khi gặp câu hỏi ngoài phạm vi.

=== THÔNG TIN FOODSERVE ===
FoodServe là app đặt đồ ăn online (React + Node.js + MongoDB).

TÍNH NĂNG:
👤 Người dùng: đặt hàng, theo dõi real-time, chat shipper, tích Xu, vòng quay may mắn, bảng xếp hạng
💳 Thanh toán: COD, MoMo, Xu tích lũy (1 Xu = 1.000đ)
🏪 Nhà hàng: quản lý menu, upload ảnh, thống kê doanh thu, subscription phí
🛵 Shipper: nhận đơn, GPS real-time, chat, kiếm Xu
👑 Admin: quản lý đơn/user/nhà hàng, duyệt đối tác/tài xế
🔔 Real-time: Socket.io - thông báo tức thì, chat, GPS tracking
🔐 Bảo mật: JWT, rate limiting, input validation
🤖 AI Chatbot: Groq AI gợi ý món ăn thông minh + ĐẶT HÀNG TỰ ĐỘNG

=== FORMAT GỢI Ý MÓN ĂN ===
Khi gợi ý món, PHẢI làm theo thứ tự:
1. Viết câu trả lời/lời khuyên TRƯỚC (không có tag). 
   ❌ TUYỆT ĐỐI KHÔNG copy y nguyên các dòng chứa [ID:...] hay RestID:... vào câu trả lời của bạn. Câu trả lời phải tự nhiên như người thật đang chat.
2. SAU ĐÓ mới đặt tag dishes ở CUỐI (tối đa 3 món):
%%DISHES%%[{"id":"ID Món Ăn","name":"Tên","price":Giá,"restaurant":"Nhà hàng","restaurantId":"RestID"}]%%END%%

QUAN TRỌNG: 
- "id" là Mã món ăn lấy từ [ID:Mã món ăn]
- "restaurantId" lấy từ RestID:Mã nhà hàng
- Đặt TẤT CẢ món trong MỘT array duy nhất, KHÔNG tách thành nhiều dòng riêng biệt.

=== ĐẶT HÀNG TỰ ĐỘNG ===
Khi user muốn đặt món, BẠN PHẢI thu thập thông tin theo thứ tự:

BƯỚC 1: Xác nhận món ăn
- Nếu user nói "đặt món này", "mua món này", "cho tôi 2 phở bò", v.v.
- Bạn hỏi: "Bạn muốn đặt [Tên món] với giá [Giá] phải không? Xác nhận để mình hỏi thêm thông tin nhé! 😊"
- Đặt tag: %%ORDER_INTENT%%{"dishId":"ID","dishName":"Tên","quantity":1,"price":Giá}%%END%%

BƯỚC 2: Hỏi địa chỉ giao hàng
- "📍 Bạn giao hàng đến địa chỉ nào nhỉ? (VD: 123 Nguyễn Huệ, Quận 1, TP.HCM)"
- Đặt tag: %%ASK_ADDRESS%%true%%END%%

BƯỚC 3: Hỏi số điện thoại (nếu chưa có)
- "📞 Cho mình số điện thoại liên hệ nhé!"
- Đặt tag: %%ASK_PHONE%%true%%END%%

BƯỚC 4: Hỏi phương thức thanh toán
- "💳 Bạn muốn thanh toán bằng gì?\n1️⃣ Tiền mặt (COD)\n2️⃣ MoMo\n3️⃣ Xu (1 Xu = 1.000đ)"
- Đặt tag: %%ASK_PAYMENT%%true%%END%%

BƯỚC 5: Xác nhận và tạo đơn
- "✅ Xác nhận đơn hàng:\n📦 [Tên món] x [SL]\n📍 [Địa chỉ]\n💳 [Thanh toán]\n💰 Tổng: [Giá]đ\n\nBạn xác nhận đặt hàng nhé? (Có/Không)"
- Đặt tag: %%CREATE_ORDER%%{"dishId":"ID","quantity":1,"address":"Địa chỉ","phone":"SĐT","paymentMethod":"cash"}%%END%%

CHÚ Ý:
- Mỗi lần CHỈ đặt MỘT tag hành động (ORDER_INTENT, ASK_ADDRESS, ASK_PAYMENT, CREATE_ORDER)
- KHÔNG đặt nhiều tag cùng lúc
- Trả lời tiếng Việt, cực kỳ dẻo miệng, ngọt ngào, nịnh khách, luôn lễ phép (dạ/vâng/ạ), và thả nhiều emoji dễ thương! 🥰💖✨

MENU THỰC TẾ:
${menuContext}`;
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const cleanedHistory = history.slice(-6).map(m => {
      let content = m.content || '';
      // Loại bỏ các tag JSON hành động cồng kềnh để tối ưu hóa tốc độ và giảm token
      content = content
        .replace(/%%DISHES%%[\s\S]*?%%END%%/g, '')
        .replace(/%%ORDER_INTENT%%[\s\S]*?%%END%%/g, '')
        .replace(/%%ASK_ADDRESS%%[\s\S]*?%%END%%/g, '')
        .replace(/%%ASK_PHONE%%[\s\S]*?%%END%%/g, '')
        .replace(/%%ASK_PAYMENT%%[\s\S]*?%%END%%/g, '')
        .replace(/%%CREATE_ORDER%%[\s\S]*?%%END%%/g, '');
      return { role: m.role === 'user' ? 'user' : 'assistant', content: content.trim() };
    }).filter(m => m.content.length > 0);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...cleanedHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const rawReply = completion.choices[0]?.message?.content || '';
    
    // Parse dishes
    const { reply: replyWithoutDishes, dishes: parsedDishes } = parseDishes(rawReply);

    // Attach image and description from DB, and OVERWRITE price/name to avoid AI hallucinations
    const dishes = parsedDishes.map(d => {
      const cleanId = d.id?.match(/[a-fA-F0-9]{24}/)?.[0];
      const dbItem = cleanId ? menuItems.find(m => m._id.toString() === cleanId) : null;
      if (dbItem) {
        return {
          id: dbItem._id.toString(),
          name: dbItem.name,
          price: dbItem.price,
          restaurant: restaurantMap[dbItem.restaurantId?.toString()]?.name || d.restaurant,
          restaurantId: dbItem.restaurantId?.toString() || d.restaurantId,
          image: dbItem.image || '',
          description: dbItem.description || ''
        };
      }
      return {
        ...d,
        image: '',
        description: ''
      };
    });
    
    // Parse order intent
    const orderIntentMatch = replyWithoutDishes.match(/%%ORDER_INTENT%%(.*?)%%END%%/);
    const orderIntent = orderIntentMatch ? JSON.parse(orderIntentMatch[1]) : null;
    
    // Parse other actions
    const askAddress = /%%ASK_ADDRESS%%/.test(replyWithoutDishes);
    const askPhone = /%%ASK_PHONE%%/.test(replyWithoutDishes);
    const askPayment = /%%ASK_PAYMENT%%/.test(replyWithoutDishes);
    
    // Parse create order
    const createOrderMatch = replyWithoutDishes.match(/%%CREATE_ORDER%%(.*?)%%END%%/);
    const createOrder = createOrderMatch ? JSON.parse(createOrderMatch[1]) : null;
    
    // Xóa tất cả tags khỏi reply
    let finalReply = replyWithoutDishes
      .replace(/%%ORDER_INTENT%%.*?%%END%%/g, '')
      .replace(/%%ASK_ADDRESS%%.*?%%END%%/g, '')
      .replace(/%%ASK_PHONE%%.*?%%END%%/g, '')
      .replace(/%%ASK_PAYMENT%%.*?%%END%%/g, '')
      .replace(/%%CREATE_ORDER%%.*?%%END%%/g, '')
      // Xóa dữ liệu thô menu bị AI copy vào reply
      .replace(/\s*\|\s*RestID:[a-fA-F0-9]+/g, '')
      .replace(/\[ID:[a-fA-F0-9]+\]\s*/g, '')
      .replace(/RestID:[a-fA-F0-9]+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim() || (dishes.length > 0 ? '🍽️ Đây là gợi ý món ăn cho bạn:' : 'Mình đã hiểu rồi! Bạn cần gì thêm không? 😊');

    // Lưu lịch sử vào database nếu có userId
    if (userId) {
      await ChatbotHistory.insertMany([
        { userId, sessionId, role: 'user', content: message },
        { userId, sessionId, role: 'assistant', content: finalReply, dishes, source: 'groq' }
      ]);
    }

    res.json({ 
      reply: finalReply, 
      dishes, 
      orderIntent,
      askAddress,
      askPhone,
      askPayment,
      createOrder,
      source: 'groq' 
    });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    try {
      const menuItems = await MenuItem.find().limit(30).lean();
      const fallback = generateFallbackResponse(req.body.message, menuItems, {});
      
      if (req.body.userId) {
         await ChatbotHistory.insertMany([
           { userId: req.body.userId, sessionId: req.body.sessionId, role: 'user', content: req.body.message },
           { userId: req.body.userId, sessionId: req.body.sessionId, role: 'assistant', content: fallback.reply, dishes: fallback.dishes, source: 'local' }
         ]);
      }
      
      res.json(fallback);
    } catch {
      res.status(500).json({ message: 'Chatbot đang bảo trì.' });
    }
  }
});

// ===== TẠO ĐƠN HÀNG TỪ CHATBOT =====
router.post('/create-order', async (req, res) => {
  try {
    const { userId, dishId, quantity = 1, address, phone, paymentMethod = 'cash', note = '' } = req.body;

    if (!userId || !dishId || !address || !phone) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt hàng' });
    }

    // Lấy thông tin món ăn
    const menuItem = await MenuItem.findById(dishId).lean();
    if (!menuItem) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }

    // Tính toán
    const itemPrice = menuItem.price * quantity;
    const deliveryFee = 15000; // Phí ship mặc định
    const totalAmount = itemPrice;
    const finalAmount = totalAmount + deliveryFee;

    // Tạo đơn hàng
    const Order = (await import('../models/Order.js')).default;
    const newOrder = new Order({
      userId,
      restaurantId: menuItem.restaurantId,
      items: [{
        menuItemId: dishId,
        name: menuItem.name,
        price: menuItem.price,
        quantity
      }],
      totalAmount,
      discount: 0,
      deliveryFee,
      finalAmount,
      status: 'confirmed',
      deliveryAddress: address,
      contactPhone: phone,
      note: `🤖 Đặt qua Chatbot: ${note}`.trim(),
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      steps: [{ status: 'confirmed', time: new Date() }]
    });

    await newOrder.save();

    // Cộng lượt quay cho user
    const User = (await import('../models/User.js')).default;
    if (userId !== 'demo_user') {
      await User.findByIdAndUpdate(userId, {
        $inc: { spins: 1, totalSpent: finalAmount }
      });
    }

    // Gửi thông báo real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('new-order', newOrder);
      
      // Thông báo cho user
      const Notification = (await import('../models/Notification.js')).default;
      const notification = new Notification({
        userId,
        type: 'order_new',
        title: '🤖 Đặt hàng thành công qua Chatbot!',
        message: `Đơn hàng #${newOrder._id.toString().slice(-6).toUpperCase()} đã được tạo. Chờ shipper nhận đơn nhé!`,
        data: { orderId: newOrder._id.toString() },
        read: false
      });
      await notification.save();
      io.to(`user-${userId.toString()}`).emit('new-notification', notification);
    }

    res.status(201).json({
      success: true,
      message: '🎉 Đặt hàng thành công!',
      order: {
        orderId: newOrder._id,
        dishName: menuItem.name,
        quantity,
        totalAmount: finalAmount,
        address,
        paymentMethod
      }
    });

  } catch (error) {
    console.error('Create order from chatbot error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
  }
});

export default router;
