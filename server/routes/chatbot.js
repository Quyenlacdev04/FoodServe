import express from 'express';
import Groq from 'groq-sdk';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// Parse tag %%DISHES%%[...]%%END%%
function parseDishes(text) {
  const match = text.match(/%%DISHES%%([\s\S]*?)%%END%%/);
  if (!match) return { reply: text.trim(), dishes: [] };
  try {
    let jsonStr = match[1].trim();
    // Gộp nhiều [{}]\n[{}] thành [{},{}]
    jsonStr = jsonStr.replace(/\]\s*\[/g, ',');
    if (!jsonStr.startsWith('[')) jsonStr = '[' + jsonStr + ']';
    const dishes = JSON.parse(jsonStr);
    // Xóa toàn bộ tag khỏi reply, kể cả dòng trống thừa
    const reply = text.replace(/%%DISHES%%[\s\S]*?%%END%%/g, '').replace(/\n{3,}/g, '\n\n').trim();
    return { reply, dishes: Array.isArray(dishes) ? dishes : [dishes] };
  } catch {
    const reply = text.replace(/%%DISHES%%[\s\S]*?%%END%%/g, '').trim();
    return { reply, dishes: [] };
  }
}

// Fallback khi không có API key
function generateFallbackResponse(message, menuItems, restaurantMap) {
  const msg = message.toLowerCase();
  const getMatchedDishes = (keywords, count = 3) => {
    const filtered = menuItems.filter(m =>
      keywords.some(k => m.name?.toLowerCase().includes(k) || m.category?.toLowerCase().includes(k))
    );
    const pool = filtered.length > 0 ? filtered : menuItems.slice(0, count);
    return pool.slice(0, count).map(m => ({
      id: m._id.toString(),
      name: m.name,
      price: m.price,
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

// ===== CHATBOT API =====
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], userId } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Vui lòng nhập tin nhắn' });

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
      return res.json(generateFallbackResponse(message, menuItems, restaurantMap));
    }

    const systemPrompt = `Bạn là FoodBot 🤖 - trợ lý AI của FoodServe chuyên về ẩm thực và hướng dẫn sử dụng app.

⚠️ QUAN TRỌNG - LUẬT BẮT BUỘC:
Bạn CHỈ ĐƯỢC phép trả lời các chủ đề sau:
1. Gợi ý món ăn, đồ uống (theo thời tiết, tâm trạng, bữa ăn, sở thích)
2. Thông tin về FoodServe app và tính năng
3. Hướng dẫn sử dụng app (đặt hàng, thanh toán, tích Xu...)
4. Tư vấn dinh dưỡng cơ bản liên quan đến món ăn

Nếu câu hỏi KHÔNG thuộc 4 chủ đề trên (lập trình, toán học, tin tức, dịch thuật, viết văn, v.v.), bạn PHẢI từ chối bằng câu này CHÍNH XÁC:
"😅 Xin lỗi bạn, câu hỏi này nằm ngoài phạm vi của mình! Mình chỉ hỗ trợ gợi ý món ăn và hướng dẫn dùng FoodServe thôi. Bạn muốn mình gợi ý món ăn gì không? 🍽️"

KHÔNG được trả lời bất kỳ nội dung nào khác khi gặp câu hỏi ngoài phạm vi.

=== THÔNG TIN FOODSERVE ===
FoodServe là app đặt đồ ăn online (React + Node.js + MongoDB).

TÍNH NĂNG:
👤 Người dùng: đặt hàng, theo dõi real-time, chat shipper, tích Xu, vòng quay may mắn, bảng xếp hạng
💳 Thanh toán: COD, MoMo, Xu tích lũy
🏪 Nhà hàng: quản lý menu, upload ảnh, thống kê doanh thu, subscription phí
🛵 Shipper: nhận đơn, GPS real-time, chat, kiếm Xu
👑 Admin: quản lý đơn/user/nhà hàng, duyệt đối tác/tài xế
🔔 Real-time: Socket.io - thông báo tức thì, chat, GPS tracking
🔐 Bảo mật: JWT, rate limiting, input validation
🤖 AI Chatbot: Groq AI gợi ý món ăn thông minh

=== FORMAT GỢI Ý MÓN ĂN ===
Khi gợi ý món, PHẢI làm theo thứ tự:
1. Viết câu trả lời/lời khuyên TRƯỚC (không có tag)
2. SAU ĐÓ mới đặt tag dishes ở CUỐI (tối đa 3 món):
%%DISHES%%[{"id":"ID","name":"Tên","price":Giá,"restaurant":"Nhà hàng","restaurantId":"RestID"},{"id":"ID2","name":"Tên2","price":Giá2,"restaurant":"Nhà hàng2","restaurantId":"RestID2"}]%%END%%

QUAN TRỌNG: Đặt TẤT CẢ món trong MỘT array duy nhất, KHÔNG tách thành nhiều dòng riêng biệt.
Trả lời tiếng Việt, ngắn gọn, dùng emoji.

MENU THỰC TẾ:
${menuContext}`;

    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: message }
      ],
      temperature: 0.75,
      max_tokens: 700,
    });

    const rawReply = completion.choices[0]?.message?.content || '';
    const { reply, dishes } = parseDishes(rawReply);

    // Nếu AI chỉ trả về dishes mà không có text, tạo reply mặc định
    const finalReply = reply || (dishes.length > 0 ? '🍽️ Đây là gợi ý món ăn cho bạn:' : 'Mình đã hiểu rồi! Bạn cần gì thêm không? 😊');

    res.json({ reply: finalReply, dishes, source: 'groq' });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    try {
      const menuItems = await MenuItem.find().limit(30).lean();
      res.json(generateFallbackResponse(req.body.message, menuItems, {}));
    } catch {
      res.status(500).json({ message: 'Chatbot đang bảo trì.' });
    }
  }
});

export default router;
