/**
 * Bộ ước lượng và tính toán Dinh dưỡng (Calories & Macros) cho các món ăn
 * Dựa trên từ khóa trong tên món ăn để cung cấp chỉ số mặc định thực tế.
 */

export function estimateNutrition(name = '', category = '') {
  const n = name.toLowerCase();
  const cat = (category || '').toLowerCase();
  
  // Chỉ số mặc định
  let calories = 350;
  let protein = 12;
  let carbs = 45;
  let fat = 10;
  let isHealthy = false;
  let healthTags = [];

  if (n.includes('phở') || n.includes('bún') || n.includes('mì') || n.includes('ramen') || n.includes('hủ tiếu')) {
    calories = n.includes('bò') ? 520 : n.includes('heo') ? 480 : 380;
    protein = n.includes('bò') ? 24 : n.includes('gà') ? 22 : 18;
    carbs = 65;
    fat = n.includes('bò') ? 14 : 10;
    isHealthy = !n.includes('chiên') && !n.includes('xào');
    if (isHealthy) healthTags = ['Đồ nước', 'Ít béo'];
  } 
  else if (n.includes('cơm')) {
    calories = n.includes('sườn') ? 680 : n.includes('gà') ? 590 : 480;
    protein = n.includes('sườn') ? 28 : n.includes('gà') ? 25 : 18;
    carbs = 80;
    fat = n.includes('sườn') ? 24 : 16;
    if (n.includes('lứt') || n.includes('sen') || n.includes('chay')) {
      isHealthy = true;
      healthTags = ['Cơm Lứt', 'Nhiều xơ'];
      calories = 380;
      protein = 10;
      carbs = 55;
      fat = 4;
    }
  } 
  else if (n.includes('salad') || n.includes('gỏi') || n.includes('nấm') || n.includes('rau') || n.includes('chay') || n.includes('đậu phụ') || n.includes('đậu hũ')) {
    calories = n.includes('cuốn') ? 180 : n.includes('lẩu') ? 240 : 130;
    protein = n.includes('cuốn') ? 8 : n.includes('đậu') ? 12 : 5;
    carbs = n.includes('cuốn') ? 24 : 15;
    fat = n.includes('cuốn') ? 3 : 4;
    isHealthy = true;
    healthTags = ['Ít calo', 'Thuần chay', 'Nhiều xơ'];
  } 
  else if (n.includes('gà rán') || n.includes('burger') || n.includes('kfc') || n.includes('chiên') || n.includes('phô mai') || n.includes('snack') || n.includes('nem chua')) {
    calories = n.includes('combo') ? 790 : 490;
    protein = 24;
    carbs = 50;
    fat = 26;
    isHealthy = false;
    healthTags = ['Fastfood'];
  } 
  else if (n.includes('sushi') || n.includes('sashimi') || n.includes('cá hồi')) {
    calories = n.includes('sashimi') ? 220 : 340;
    protein = n.includes('sashimi') ? 22 : 14;
    carbs = n.includes('sashimi') ? 1 : 48;
    fat = n.includes('sashimi') ? 12 : 6;
    isHealthy = true;
    healthTags = ['Giàu đạm', 'Omega-3', 'Chất béo tốt'];
  } 
  else if (n.includes('sữa') || n.includes('freeze') || n.includes('pepsi') || n.includes('coca') || n.includes('nước ngọt')) {
    calories = n.includes('trà sữa') || n.includes('freeze') ? 450 : 150;
    protein = 1;
    carbs = n.includes('trà sữa') || n.includes('freeze') ? 72 : 38;
    fat = n.includes('trà sữa') || n.includes('freeze') ? 16 : 0;
    isHealthy = false;
    healthTags = ['Đồ ngọt'];
  } 
  else if (n.includes('trà') || n.includes('cà phê') || n.includes('cafe') || n.includes('mót')) {
    calories = n.includes('sữa') ? 190 : 40;
    protein = 1;
    carbs = n.includes('sữa') ? 30 : 8;
    fat = n.includes('sữa') ? 6 : 0;
    isHealthy = !n.includes('sữa');
    if (isHealthy) healthTags = ['Ít calo', 'Thanh nhiệt'];
  }

  return { calories, protein, carbs, fat, isHealthy, healthTags };
}
