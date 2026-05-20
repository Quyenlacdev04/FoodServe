export const categories = [
  { id: 'burger', name: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop' },
  { id: 'chicken', name: 'Gà rán', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=200&h=200&fit=crop' },
  { id: 'pizza', name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop' },
  { id: 'milk-tea', name: 'Trà sữa', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=200&h=200&fit=crop' },
  { id: 'seafood', name: 'Hải sản', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=200&h=200&fit=crop' },
  { id: 'rice', name: 'Cơm', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop' },
  { id: 'noodle', name: 'Mì', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop' },
  { id: 'snack', name: 'Ăn vặt', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop' },
]

export const restaurants = [
  {
    id: 'r1', name: 'Phở Hà Nội 36', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=500&fit=crop',
    rating: 4.8, reviews: 1250, deliveryTime: '20-30', distance: 1.2, orders: 5600,
    discount: 30, freeship: true, promo: 'Giảm 30% đơn từ 100K',
    categories: ['noodle', 'rice'], address: '36 Phố Cổ, Hoàn Kiếm, Hà Nội',
    description: 'Phở truyền thống Hà Nội chính gốc, nước dùng ninh xương 12 tiếng.'
  },
  {
    id: 'r2', name: 'Bún Chả Hương Liên', image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=500&fit=crop',
    rating: 4.9, reviews: 2100, deliveryTime: '15-25', distance: 0.8, orders: 8900,
    discount: 20, freeship: true, promo: 'Giảm 20% toàn menu',
    categories: ['rice', 'noodle'], address: '24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội',
    description: 'Bún chả nổi tiếng được Obama ghé thăm. Hương vị đậm đà khó quên.'
  },
  {
    id: 'r3', name: 'Pizza 4P\'s', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1200&h=500&fit=crop',
    rating: 4.7, reviews: 3200, deliveryTime: '25-35', distance: 2.5, orders: 12000,
    discount: 15, freeship: false, promo: 'Combo 2 pizza giảm 15%',
    categories: ['pizza'], address: '5 Hàng Tre, Hoàn Kiếm, Hà Nội',
    description: 'Pizza phong cách Nhật Bản với phô mai tự làm tại chỗ.'
  },
  {
    id: 'r4', name: 'KFC Vietnam', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&h=500&fit=crop',
    rating: 4.3, reviews: 890, deliveryTime: '15-20', distance: 0.5, orders: 15000,
    discount: 40, freeship: true, promo: 'Flash Sale giảm 40%',
    categories: ['chicken', 'burger'], address: '18 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
    description: 'Gà rán giòn rụm huyền thoại, combo tiết kiệm siêu hời.'
  },
  {
    id: 'r5', name: 'Tocotoco Bubble Tea', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&h=500&fit=crop',
    rating: 4.5, reviews: 2800, deliveryTime: '10-15', distance: 0.3, orders: 20000,
    discount: 25, freeship: true, promo: 'Mua 2 giảm 25%',
    categories: ['milk-tea', 'snack'], address: '99 Bà Triệu, Hai Bà Trưng, Hà Nội',
    description: 'Trà sữa số 1 Việt Nam, topping phong phú, vị chuẩn.'
  },
  {
    id: 'r6', name: 'Cơm Tấm Sài Gòn', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=500&fit=crop',
    rating: 4.6, reviews: 1560, deliveryTime: '20-30', distance: 1.8, orders: 7500,
    discount: 10, freeship: false, promo: 'Giảm 10% đơn đầu tiên',
    categories: ['rice'], address: '45 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    description: 'Cơm tấm sườn bì chả chuẩn vị Sài Gòn giữa lòng Hà Nội.'
  },
  {
    id: 'r7', name: 'Burger King', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=500&fit=crop',
    rating: 4.4, reviews: 670, deliveryTime: '15-25', distance: 1.0, orders: 9200,
    discount: 35, freeship: true, promo: 'Combo King giảm 35%',
    categories: ['burger', 'chicken'], address: '12 Láng Hạ, Ba Đình, Hà Nội',
    description: 'Burger nướng lửa hoàn hảo, thịt bò 100% nguyên chất.'
  },
  {
    id: 'r8', name: 'Hải Sản Biển Đông', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=500&fit=crop',
    rating: 4.7, reviews: 980, deliveryTime: '30-45', distance: 3.2, orders: 4200,
    discount: 0, freeship: false, promo: '',
    categories: ['seafood'], address: '88 Tây Hồ, Tây Hồ, Hà Nội',
    description: 'Hải sản tươi sống nhập hàng ngày, chế biến đa dạng.'
  },
  {
    id: 'r9', name: 'Mì Cay Seoul', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=1200&h=500&fit=crop',
    rating: 4.2, reviews: 1340, deliveryTime: '15-20', distance: 0.7, orders: 11000,
    discount: 20, freeship: true, promo: 'Đồng giá 39K mì cay',
    categories: ['noodle', 'snack'], address: '67 Cầu Giấy, Cầu Giấy, Hà Nội',
    description: 'Mì cay 7 cấp độ chuẩn Hàn Quốc, ăn là ghiền.'
  },
  {
    id: 'r10', name: 'Ăn Vặt Hà Thành', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    cover: 'https://images.unsplash.com/photo-1542528180-1c2803fa048c?w=1200&h=500&fit=crop',
    rating: 4.6, reviews: 2200, deliveryTime: '10-20', distance: 0.4, orders: 18000,
    discount: 50, freeship: true, promo: 'Flash Sale 50% hôm nay',
    categories: ['snack', 'milk-tea'], address: '33 Tạ Hiện, Hoàn Kiếm, Hà Nội',
    description: 'Thiên đường ăn vặt: xiên que, tokbokki, trứng cút lộn.'
  },
]

export const menuItems = {
  r1: [
    { id: 'm1', restaurantId: 'r1', name: 'Phở Bò Tái', price: 55000, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop', description: 'Phở bò tái chín, nước dùng ninh xương 12 tiếng', popular: true, category: 'Phở' },
    { id: 'm2', restaurantId: 'r1', name: 'Phở Bò Chín', price: 50000, image: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400&h=300&fit=crop', description: 'Phở bò chín mềm, thơm ngon đậm đà', popular: false, category: 'Phở' },
    { id: 'm3', restaurantId: 'r1', name: 'Phở Gà', price: 50000, image: 'https://images.unsplash.com/photo-1583224964978-2257b960c3d3?w=400&h=300&fit=crop', description: 'Phở gà ta thả vườn, da giòn thịt ngọt', popular: true, category: 'Phở' },
    { id: 'm4', restaurantId: 'r1', name: 'Bún Bò Huế', price: 60000, image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop', description: 'Bún bò Huế cay nồng, đầy đủ topping', popular: false, category: 'Bún' },
    { id: 'm5', restaurantId: 'r1', name: 'Cơm Rang Dưa Bò', price: 55000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', description: 'Cơm rang với dưa chua và thịt bò xào', popular: false, category: 'Cơm' },
    { id: 'm6', restaurantId: 'r1', name: 'Nước Chanh Đá', price: 15000, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop', description: 'Nước chanh tươi mát lạnh', popular: false, category: 'Đồ uống' },
  ],
  r2: [
    { id: 'm7', restaurantId: 'r2', name: 'Bún Chả Đặc Biệt', price: 65000, image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=400&h=300&fit=crop', description: 'Bún chả với chả viên và chả miếng thượng hạng', popular: true, category: 'Bún chả' },
    { id: 'm8', restaurantId: 'r2', name: 'Bún Chả Thường', price: 45000, image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=400&h=300&fit=crop', description: 'Bún chả truyền thống Hà Nội', popular: false, category: 'Bún chả' },
    { id: 'm9', restaurantId: 'r2', name: 'Nem Rán', price: 30000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', description: '5 chiếc nem rán giòn rụm', popular: true, category: 'Khai vị' },
    { id: 'm10', restaurantId: 'r2', name: 'Trà Đá', price: 5000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', description: 'Trà đá Việt Nam', popular: false, category: 'Đồ uống' },
  ],
  r3: [
    { id: 'm11', restaurantId: 'r3', name: 'Pizza Margherita', price: 189000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', description: 'Pizza cổ điển với phô mai mozzarella tươi', popular: true, category: 'Pizza' },
    { id: 'm12', restaurantId: 'r3', name: 'Pizza Hải Sản', price: 249000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', description: 'Pizza topping tôm, mực, nghêu', popular: true, category: 'Pizza' },
    { id: 'm13', restaurantId: 'r3', name: 'Pasta Carbonara', price: 169000, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop', description: 'Mì Ý sốt kem trứng béo ngậy', popular: false, category: 'Pasta' },
    { id: 'm14', restaurantId: 'r3', name: 'Salad Caesar', price: 129000, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', description: 'Salad tươi sốt Caesar đặc biệt', popular: false, category: 'Salad' },
  ],
  r4: [
    { id: 'm15', restaurantId: 'r4', name: 'Gà Rán Giòn 2 Miếng', price: 59000, image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop', description: '2 miếng gà rán giòn rụm', popular: true, category: 'Gà rán' },
    { id: 'm16', restaurantId: 'r4', name: 'Combo Gà 3 Miếng', price: 99000, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop', description: '3 miếng gà + khoai tây + nước', popular: true, category: 'Combo' },
    { id: 'm17', restaurantId: 'r4', name: 'Burger Gà Spicy', price: 49000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', description: 'Burger gà cay phô mai', popular: false, category: 'Burger' },
    { id: 'm18', restaurantId: 'r4', name: 'Khoai Tây Chiên', price: 29000, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop', description: 'Khoai tây chiên giòn vàng', popular: false, category: 'Phụ' },
  ],
  r5: [
    { id: 'm19', restaurantId: 'r5', name: 'Trà Sữa Trân Châu', price: 35000, image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=300&fit=crop', description: 'Trà sữa truyền thống trân châu đen', popular: true, category: 'Trà sữa' },
    { id: 'm20', restaurantId: 'r5', name: 'Trà Đào Cam Sả', price: 39000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', description: 'Trà đào cam sả thanh mát', popular: true, category: 'Trà trái cây' },
    { id: 'm21', restaurantId: 'r5', name: 'Matcha Latte', price: 45000, image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=300&fit=crop', description: 'Matcha Nhật Bản nguyên chất', popular: false, category: 'Đặc biệt' },
  ],
  r6: [
    { id: 'm22', restaurantId: 'r6', name: 'Cơm Tấm Sườn Bì Chả', price: 55000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', description: 'Combo đầy đủ chuẩn Sài Gòn', popular: true, category: 'Cơm tấm' },
    { id: 'm23', restaurantId: 'r6', name: 'Cơm Tấm Sườn', price: 45000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', description: 'Sườn nướng than hoa thơm lừng', popular: false, category: 'Cơm tấm' },
    { id: 'm24', restaurantId: 'r6', name: 'Chả Giò', price: 25000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', description: '4 cuốn chả giò giòn tan', popular: false, category: 'Khai vị' },
  ],
  r7: [
    { id: 'm25', restaurantId: 'r7', name: 'Whopper Bò', price: 79000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', description: 'Burger bò nướng lửa size lớn', popular: true, category: 'Burger' },
    { id: 'm26', restaurantId: 'r7', name: 'Chicken Royale', price: 65000, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop', description: 'Burger gà giòn sốt đặc biệt', popular: true, category: 'Burger' },
    { id: 'm27', restaurantId: 'r7', name: 'Onion Rings', price: 35000, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop', description: 'Hành tây chiên giòn vàng', popular: false, category: 'Phụ' },
  ],
  r8: [
    { id: 'm28', restaurantId: 'r8', name: 'Tôm Hùm Nướng', price: 890000, image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=300&fit=crop', description: 'Tôm hùm Alaska nướng bơ tỏi', popular: true, category: 'Tôm' },
    { id: 'm29', restaurantId: 'r8', name: 'Cua Rang Muối', price: 450000, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop', description: 'Cua biển rang muối ớt Campot', popular: true, category: 'Cua' },
    { id: 'm30', restaurantId: 'r8', name: 'Mực Nướng Sa Tế', price: 250000, image: 'https://images.unsplash.com/photo-1565680018093-ebb6e41db76e?w=400&h=300&fit=crop', description: 'Mực tươi nướng sa tế cay nồng', popular: false, category: 'Mực' },
  ],
  r9: [
    { id: 'm31', restaurantId: 'r9', name: 'Mì Cay Cấp 3', price: 39000, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', description: 'Mì cay cấp 3 - vừa ăn', popular: true, category: 'Mì cay' },
    { id: 'm32', restaurantId: 'r9', name: 'Mì Cay Cấp 7', price: 45000, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', description: 'Mì cay cấp 7 - thử thách', popular: true, category: 'Mì cay' },
    { id: 'm33', restaurantId: 'r9', name: 'Tokbokki Phô Mai', price: 49000, image: 'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400&h=300&fit=crop', description: 'Bánh gạo Hàn Quốc sốt phô mai', popular: false, category: 'Món Hàn' },
  ],
  r10: [
    { id: 'm34', restaurantId: 'r10', name: 'Xiên Que Tổng Hợp', price: 35000, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', description: '5 xiên gồm bò, gà, tôm, nấm, rau', popular: true, category: 'Xiên que' },
    { id: 'm35', restaurantId: 'r10', name: 'Trứng Cút Lộn', price: 25000, image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop', description: '5 trứng cút lộn nướng mỡ hành', popular: true, category: 'Ăn vặt' },
    { id: 'm36', restaurantId: 'r10', name: 'Bánh Tráng Trộn', price: 20000, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', description: 'Bánh tráng trộn đủ vị', popular: false, category: 'Ăn vặt' },
  ],
}

export const vouchers = [
  { code: 'FOOD50', discount: 50000, minOrder: 150000, label: 'Giảm 50K', desc: 'Đơn tối thiểu 150K' },
  { code: 'FREESHIP', discount: 25000, minOrder: 0, label: 'Freeship', desc: 'Miễn phí giao hàng' },
  { code: 'NEW30', discount: 30000, minOrder: 100000, label: 'Giảm 30K', desc: 'Dành cho khách mới' },
  { code: 'SALE20', discount: 20000, minOrder: 80000, label: 'Giảm 20K', desc: 'Áp dụng mọi đơn từ 80K' },
]

export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
