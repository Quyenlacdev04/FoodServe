import { Link } from 'react-router-dom'
import HeroSection from '../components/home/HeroSection'
import CategorySection from '../components/home/CategorySection'
import RestaurantList from '../components/home/RestaurantList'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <RestaurantList />
      {/* Footer */}
      <footer className="bg-gray-50 text-gray-900 py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
                <span className="text-xl font-display font-bold text-gradient">FoodServe</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Nền tảng đặt đồ ăn online hàng đầu Việt Nam. Giao nhanh, chất lượng, giá tốt.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">Khám phá</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Nhà hàng gần bạn</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Món ăn phổ biến</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Ưu đãi hôm nay</a></li>
                <li><Link to="/partner-register" className="hover:text-primary-500 transition-colors font-semibold text-primary-600">🤝 Đăng ký làm đối tác</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Liên hệ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">Tải ứng dụng</h4>
              <p className="text-sm text-gray-600 mb-3">Trải nghiệm tốt hơn trên điện thoại</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary-500 cursor-pointer transition-colors shadow-sm">
                  <span className="text-2xl">🍎</span>
                  <div><p className="text-xs text-gray-500">Tải về từ</p><p className="text-sm font-semibold text-gray-900">App Store</p></div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary-500 cursor-pointer transition-colors shadow-sm">
                  <span className="text-2xl">🤖</span>
                  <div><p className="text-xs text-gray-500">Tải về từ</p><p className="text-sm font-semibold text-gray-900">Google Play</p></div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 FoodServe. Thiết kế với ❤️ tại Việt Nam.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
