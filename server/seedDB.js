import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const restaurantsData = [
  {
    name: 'Phở Thìn Lò Đúc',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviews: 2150,
    deliveryTime: '15-25',
    distance: 1.2,
    orders: 15400,
    discount: 0,
    freeship: true,
    promo: 'Freeship 2km',
    categories: ['phở', 'bún', 'mì', 'ăn sáng'],
    address: '13 Lò Đúc, Hai Bà Trưng, Hà Nội',
    description: 'Phở bò tái lăn trứ danh Hà Nội từ năm 1979.'
  },
  {
    name: 'Cơm Tấm Ba Ghiền',
    image: 'https://images.unsplash.com/photo-1626804475297-4160aeeba1fa?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1626804475297-4160aeeba1fa?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviews: 3200,
    deliveryTime: '20-35',
    distance: 3.5,
    orders: 22000,
    discount: 15000,
    freeship: false,
    promo: 'Giảm 15K',
    categories: ['cơm', 'heo', 'trưa'],
    address: '84 Đặng Văn Ngữ, Phú Nhuận, TP.HCM',
    description: 'Sườn nướng khổng lồ, hương vị truyền thống Sài Gòn.'
  },
  {
    name: 'Highlands Coffee - Landmark',
    image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    reviews: 5400,
    deliveryTime: '10-20',
    distance: 0.8,
    orders: 50000,
    discount: 20000,
    freeship: true,
    promo: 'Giảm 20K đơn 100K',
    categories: ['trà sữa', 'cà phê', 'tráng miệng'],
    address: 'Tầng trệt Landmark 81, Bình Thạnh, TP.HCM',
    description: 'Cà phê rang xay nguyên chất, trà Việt Nam thượng hạng.'
  },
  {
    name: 'Gà Rán KFC - Trần Hưng Đạo',
    image: 'https://images.unsplash.com/photo-1569691899455-88464f6d3cb1?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1569691899455-88464f6d3cb1?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviews: 8900,
    deliveryTime: '20-30',
    distance: 2.1,
    orders: 34000,
    discount: 30000,
    freeship: true,
    promo: 'Mua 1 tặng 1 thứ 3',
    categories: ['gà rán', 'burger', 'ăn vặt', 'fastfood'],
    address: '123 Trần Hưng Đạo, Quận 1, TP.HCM',
    description: 'Vị ngon trên từng ngón tay. Giòn rụm khó cưỡng.'
  },
  {
    name: 'Sushi Hokkaido Sachi',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviews: 1200,
    deliveryTime: '30-45',
    distance: 4.5,
    orders: 8500,
    discount: 50000,
    freeship: false,
    promo: 'Giảm 50K đơn 300K',
    categories: ['sushi', 'nhật bản', 'hải sản'],
    address: 'Đông Du, Quận 1, TP.HCM',
    description: 'Hải sản tươi sống nhập khẩu trực tiếp từ Hokkaido, Nhật Bản.'
  },
  {
    name: 'Don Chicken - Gà Hàn Quốc',
    image: 'https://images.unsplash.com/photo-1589301773820-22fb142a00c6?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1589301773820-22fb142a00c6?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    reviews: 2300,
    deliveryTime: '25-40',
    distance: 3.0,
    orders: 11000,
    discount: 0,
    freeship: true,
    promo: 'Freeship mọi đơn',
    categories: ['gà rán', 'hàn quốc', 'ăn vặt'],
    address: 'Sư Vạn Hạnh, Quận 10, TP.HCM',
    description: 'Gà nướng phô mai cay cay ngọt ngọt, chuẩn vị Seoul.'
  },
  {
    name: 'Chay Ngộ Nhận',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviews: 800,
    deliveryTime: '15-25',
    distance: 1.5,
    orders: 5000,
    discount: 10000,
    freeship: true,
    promo: 'Ngày rằm freeship',
    categories: ['chay', 'healthy', 'salad'],
    address: 'Võ Văn Tần, Quận 3, TP.HCM',
    description: 'Món chay thanh tịnh, dinh dưỡng từ thiên nhiên.'
  }
];

const menuData = {
  'Phở Thìn Lò Đúc': [
    { name: 'Phở bò tái lăn', price: 70000, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=200', popular: true, category: 'Món chính' },
    { name: 'Phở bò chín', price: 65000, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=200', popular: false, category: 'Món chính' },
    { name: 'Quẩy giòn', price: 10000, image: 'https://images.unsplash.com/photo-1628198944589-9e8020ff635b?w=200', popular: true, category: 'Ăn kèm' },
    { name: 'Trà đá', price: 5000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', popular: false, category: 'Đồ uống' },
    { name: 'Trứng chần', price: 15000, image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cb6?w=200', popular: true, category: 'Ăn kèm' },
  ],
  'Cơm Tấm Ba Ghiền': [
    { name: 'Cơm sườn khổng lồ', price: 85000, image: 'https://images.unsplash.com/photo-1626804475297-4160aeeba1fa?w=200', popular: true, category: 'Món chính' },
    { name: 'Cơm sườn bì chả', price: 105000, image: 'https://images.unsplash.com/photo-1626804475297-4160aeeba1fa?w=200', popular: true, category: 'Món chính' },
    { name: 'Cơm gà quay', price: 75000, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=200', popular: false, category: 'Món chính' },
    { name: 'Canh khổ qua nhồi thịt', price: 25000, image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?w=200', popular: true, category: 'Món nước' },
    { name: 'Trà đá', price: 5000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', popular: false, category: 'Đồ uống' },
  ],
  'Highlands Coffee - Landmark': [
    { name: 'Trà Sen Vàng', price: 49000, image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=200', popular: true, category: 'Trà' },
    { name: 'Phin Sữa Đá', price: 29000, image: 'https://images.unsplash.com/photo-1579888944880-d98341245702?w=200', popular: true, category: 'Cà phê' },
    { name: 'Freeze Trà Xanh', price: 55000, image: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=200', popular: true, category: 'Đá xay' },
    { name: 'Bánh mì thịt nướng', price: 25000, image: 'https://images.unsplash.com/photo-1629853906233-68d18ee911fb?w=200', popular: false, category: 'Đồ ăn nhẹ' },
    { name: 'Trà Thanh Đào', price: 49000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', popular: false, category: 'Trà' },
  ],
  'Gà Rán KFC - Trần Hưng Đạo': [
    { name: 'Combo 2 Miếng Gà Giòn', price: 89000, image: 'https://images.unsplash.com/photo-1569691899455-88464f6d3cb1?w=200', popular: true, category: 'Combo' },
    { name: 'Burger Zinger', price: 55000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', popular: true, category: 'Burger' },
    { name: 'Khoai tây chiên (Vừa)', price: 22000, image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=200', popular: false, category: 'Ăn vặt' },
    { name: 'Gà quay tiêu', price: 45000, image: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=200', popular: false, category: 'Gà lẻ' },
    { name: 'Pepsi', price: 15000, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200', popular: true, category: 'Đồ uống' },
  ],
  'Sushi Hokkaido Sachi': [
    { name: 'Sashimi Cá Hồi Khổng Lồ', price: 350000, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', popular: true, category: 'Sashimi' },
    { name: 'Sushi Cuộn Tôm Sứ', price: 180000, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=200', popular: true, category: 'Sushi' },
    { name: 'Bò Wagyu Nướng Đá', price: 550000, image: 'https://images.unsplash.com/photo-1544025162-8111f48651a0?w=200', popular: false, category: 'Món nóng' },
    { name: 'Rượu Sake Nóng', price: 120000, image: 'https://images.unsplash.com/photo-1596541604085-f55a1532f3f1?w=200', popular: false, category: 'Đồ uống' },
    { name: 'Salad Rong Biển', price: 95000, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200', popular: true, category: 'Khai vị' },
  ],
  'Don Chicken - Gà Hàn Quốc': [
    { name: 'Gà Phô Mai Cay (Nửa con)', price: 195000, image: 'https://images.unsplash.com/photo-1589301773820-22fb142a00c6?w=200', popular: true, category: 'Gà nướng' },
    { name: 'Gà Rán Sốt Tương', price: 185000, image: 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=200', popular: true, category: 'Gà rán' },
    { name: 'Canh Kim Chi Cải Thảo', price: 110000, image: 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=200', popular: false, category: 'Món nước' },
    { name: 'Bánh Gạo Tteokbokki', price: 95000, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200', popular: true, category: 'Ăn vặt' },
    { name: 'Soju Truyền Thống', price: 75000, image: 'https://images.unsplash.com/photo-1616422285623-13fae759244c?w=200', popular: true, category: 'Đồ uống' },
  ],
  'Chay Ngộ Nhận': [
    { name: 'Lẩu Nấm Thập Cẩm', price: 250000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200', popular: true, category: 'Lẩu' },
    { name: 'Gỏi Cuốn Ngũ Sắc', price: 45000, image: 'https://images.unsplash.com/photo-1550461716-4067086815fa?w=200', popular: true, category: 'Khai vị' },
    { name: 'Cơm Gạo Lứt Hạt Sen', price: 55000, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200', popular: true, category: 'Món chính' },
    { name: 'Đậu Hũ Tứ Xuyên Chay', price: 65000, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200', popular: false, category: 'Món chính' },
    { name: 'Nước Mót Hội An', price: 25000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', popular: true, category: 'Đồ uống' },
  ]
};

async function seedBigData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear old data
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('🧹 Cleared old restaurants and menus');

    // Seed new restaurants
    let countRestaurants = 0;
    let countMenus = 0;

    for (const r of restaurantsData) {
      const newRest = await Restaurant.create(r);
      countRestaurants++;

      const items = menuData[r.name];
      if (items) {
        const itemsToInsert = items.map(item => ({
          restaurantId: newRest._id,
          name: item.name,
          price: item.price,
          image: item.image,
          description: `Món ngon chuẩn vị từ ${r.name}`,
          popular: item.popular,
          category: item.category
        }));
        await MenuItem.insertMany(itemsToInsert);
        countMenus += items.length;
      }
    }
    
    console.log(`🍔 Successfully seeded ${countRestaurants} Restaurants and ${countMenus} Menu Items!`);
    console.log('✅ Seeding Big Data completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedBigData();
