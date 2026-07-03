/**
 * Bộ phân tích cảm xúc tiếng Việt chuyên dụng cho ngành Giao đồ ăn (Food Delivery)
 * Sử dụng phương pháp đối sánh cụm từ chính xác (Exact phrase matching) và kiểm tra phủ định.
 */

const POSITIVE_KEYWORDS = {
  food: ['ngon', 'hợp khẩu vị', 'vừa miệng', 'đậm đà', 'thơm', 'sạch', 'tươi', 'ấm', 'nóng', 'giòn'],
  delivery: ['nhanh', 'tốc độ', 'loáng', 'sớm', 'thần tốc', 'đúng giờ'],
  service: ['nhiệt tình', 'dễ thương', 'thân thiện', 'chu đáo', 'lịch sự', 'ngoan', 'vui vẻ', 'cẩn thận', 'kỹ', 'đẹp', 'tốt'],
  price: ['rẻ', 'hạt dẻ', 'hợp lý', 'hời', 'giá tốt', 'bình dân']
};

const NEGATIVE_KEYWORDS = {
  food: ['dở', 'chán', 'tệ', 'kém', 'nguội', 'lạnh', 'tanh', 'nhạt', 'mặn', 'chua', 'thiu', 'hôi', 'bẩn', 'ít', 'ngấy', 'khét', 'sống', 'ôi'],
  delivery: ['chậm', 'trễ', 'lâu', 'muộn', 'bò', 'cao su'],
  service: ['cọc', 'cáu', 'thái độ', 'ẩu', 'đổ', 'nát', 'ướt', 'nhầm', 'thiếu', 'sai món'],
  price: ['đắt', 'mắc', 'chát', 'cao']
};

const NEGATIONS = ['không', 'chưa', 'chẳng', 'chả', 'đâu'];

// Kiểm tra xem một từ khóa có bị phủ định trong câu hay không
function isKeywordNegated(text, keyword) {
  // Tìm các cụm từ phủ định đứng trước từ khóa trong khoảng cách 1-2 từ
  return NEGATIONS.some(neg => {
    return text.includes(` ${neg} ${keyword} `) || 
           text.includes(` ${neg} rất ${keyword} `) || 
           text.includes(` ${neg} quá ${keyword} `) || 
           text.includes(` ${neg} cực kỳ ${keyword} `) ||
           text.includes(` ${neg} thèm ${keyword} `);
  });
}

export function analyzeSentiment(comment = '', rating = 5) {
  if (!comment || comment.trim() === '') {
    let sentiment = 'neutral';
    let score = 0;
    if (rating >= 4) {
      sentiment = 'positive';
      score = 0.5;
    } else if (rating <= 2) {
      sentiment = 'negative';
      score = -0.5;
    }
    return { sentiment, score, tags: [] };
  }

  // Làm sạch văn bản và thêm khoảng trắng hai đầu để đối sánh từ chính xác
  const cleanComment = comment.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const paddedText = ` ${cleanComment} `;
  let score = 0;
  
  // Điểm cơ sở dựa theo số sao
  if (rating === 5) score += 0.4;
  else if (rating === 4) score += 0.2;
  else if (rating === 3) score += 0.0;
  else if (rating === 2) score -= 0.2;
  else if (rating === 1) score -= 0.4;

  const matchedTags = new Set();
  let positiveMatches = 0;
  let negativeMatches = 0;

  // 1. Kiểm tra nhóm từ khóa tích cực
  for (const [group, keywords] of Object.entries(POSITIVE_KEYWORDS)) {
    keywords.forEach(keyword => {
      if (paddedText.includes(` ${keyword} `)) {
        if (isKeywordNegated(paddedText, keyword)) {
          // Bị phủ định -> trở thành tiêu cực
          negativeMatches++;
          score -= 0.2;
          if (group === 'food') matchedTags.add('Hương vị kém');
          if (group === 'delivery') matchedTags.add('Giao hàng chậm');
          if (group === 'service') matchedTags.add('Phục vụ chưa tốt');
          if (group === 'price') matchedTags.add('Giá hơi cao');
        } else {
          // Tích cực thực sự
          positiveMatches++;
          score += 0.15;
          if (group === 'food') matchedTags.add('Đồ ăn ngon');
          if (group === 'delivery') matchedTags.add('Giao hàng nhanh');
          if (group === 'service') matchedTags.add('Phục vụ tốt');
          if (group === 'price') matchedTags.add('Giá cả hợp lý');
        }
      }
    });
  }

  // 2. Kiểm tra nhóm từ khóa tiêu cực
  for (const [group, keywords] of Object.entries(NEGATIVE_KEYWORDS)) {
    keywords.forEach(keyword => {
      if (paddedText.includes(` ${keyword} `)) {
        if (isKeywordNegated(paddedText, keyword)) {
          // Bị phủ định -> trở thành tích cực
          positiveMatches++;
          score += 0.15;
          if (group === 'price') matchedTags.add('Giá cả hợp lý');
          if (group === 'food') matchedTags.add('Đồ ăn ngon');
          if (group === 'service') matchedTags.add('Phục vụ tốt');
        } else {
          // Tiêu cực thực sự
          negativeMatches++;
          score -= 0.22;
          if (group === 'food') {
            if (keyword === 'nguội' || keyword === 'lạnh') matchedTags.add('Đồ ăn nguội');
            else matchedTags.add('Hương vị kém');
          }
          if (group === 'delivery') matchedTags.add('Giao hàng chậm');
          if (group === 'service') {
            if (paddedText.includes('gói') || paddedText.includes('hộp')) matchedTags.add('Đóng gói ẩu');
            else matchedTags.add('Phục vụ chưa tốt');
          }
          if (group === 'price') matchedTags.add('Giá hơi cao');
        }
      }
    });
  }

  // 3. Quy tắc đặc biệt về đóng gói
  if (paddedText.includes(' gói kỹ ') || paddedText.includes(' gói cẩn thận ') || paddedText.includes(' hộp đẹp ') || paddedText.includes(' đóng gói cẩn thận ')) {
    matchedTags.add('Đóng gói cẩn thận');
    score += 0.1;
  }

  // Giới hạn điểm số
  score = Math.max(-1.0, Math.min(1.0, score));

  // Phân loại cảm xúc
  let sentiment = 'neutral';
  if (score > 0.15) {
    sentiment = 'positive';
  } else if (score < -0.15) {
    sentiment = 'negative';
  }

  // Điển chỉnh theo số sao để nhất quán
  if (rating <= 2 && sentiment === 'positive') {
    sentiment = 'neutral';
    score = 0;
  }
  if (rating >= 4 && sentiment === 'negative') {
    sentiment = 'neutral';
    score = 0;
  }

  return {
    sentiment,
    score: parseFloat(score.toFixed(2)),
    tags: Array.from(matchedTags)
  };
}
