import { FiFacebook, FiInstagram } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'

export default function Footer() {
  const { darkMode } = useSelector((s) => s.ui)

  return (
    <footer className="w-full bg-[#f5f5f5] dark:bg-dark-200 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* SECTION 1: DANH MỤC */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-6 tracking-wider">Danh mục</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs leading-relaxed">
          {/* Cột 1 */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Thuốc</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Hoá mỹ phẩm <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                BCS <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Thiết bị <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Thuốc tây <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Khẩu trang <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Khẩn cấp
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Thú cưng</h4>
              <p className="text-gray-500 dark:text-gray-400">Thú cưng</p>
            </div>
          </div>

          {/* Cột 2 */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Đồ ăn HN</h4>
              <p className="text-gray-500 dark:text-gray-400">Đồ ăn HN</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Đặt bàn HN</h4>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Thực phẩm HN</h4>
            </div>
          </div>

          {/* Cột 3 */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Sản phẩm HN</h4>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Sản phẩm</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Mỹ phẩm <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Đồ chơi <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Sữa <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Tã bỉm <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Dụng cụ <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Quần áo <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Giày dép <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Điện tử <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Trang sức
              </p>
            </div>
          </div>

          {/* Cột 4 */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase mb-1">Hoa</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Chia buồn <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Cây cảnh <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Chúc mừng <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Sinh nhật <span className="mx-1 text-gray-300 dark:text-gray-600">|</span> 
                Tình yêu
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CÔNG TY & ĐỊA CHỈ */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Cột Công ty (4/12 width) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Công ty</h4>
            <ul className="text-xs space-y-2 text-blue-600 dark:text-blue-400 font-medium">
              <li><a href="#" className="hover:underline">Giới thiệu</a></li>
              <li><a href="#" className="hover:underline">Trung tâm Trợ giúp</a></li>
              <li><a href="#" className="hover:underline">Quy chế</a></li>
              <li><a href="#" className="hover:underline">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:underline">Bảo mật thông tin</a></li>
              <li><a href="#" className="hover:underline">Giải quyết khiếu nại</a></li>
              <li><a href="#" className="hover:underline">Liên hệ</a></li>
              <li><a href="#" className="hover:underline">Hợp tác nhân viên giao nhận</a></li>
              <li><a href="#" className="hover:underline">Đăng ký quán</a></li>
              <li><a href="#" className="hover:underline">FoodServe Uni</a></li>
              <li><a href="#" className="hover:underline">FoodServe Blog</a></li>
            </ul>
          </div>

          {/* Cột Tải ứng dụng (3/12 width) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-sm font-bold text-gray-800 dark:text-white">Ứng dụng FoodServe</h4>
            <div className="flex flex-col gap-2 max-w-[150px]">
              <a href="#" className="transition-transform hover:scale-105">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="w-full" />
              </a>
              <a href="#" className="transition-transform hover:scale-105">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="w-full" />
              </a>
              <div className="w-full bg-black rounded-lg py-1 px-3 flex items-center justify-center gap-1.5 transition-transform hover:scale-105 cursor-pointer">
                <span className="text-[10px] text-white/50 leading-none">Tải về trên</span>
                <span className="text-xs font-bold text-white font-sans leading-none">AppGallery</span>
              </div>
            </div>
          </div>

          {/* Cột Logo & Copyright (3/12 width) */}
          <div className="md:col-span-3 flex flex-col items-center justify-center text-center space-y-4 md:mt-6">
            <div className="flex items-center gap-2">
              <span className="text-4xl">🍽️</span>
              <span className="text-2xl font-bold font-display text-[#ff6b35]">FoodServe</span>
            </div>
            <p className="text-[11px] text-gray-400">© 2026 FoodServe</p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-dark-100 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-dark-50 transition-colors text-gray-700 dark:text-gray-300">
                <FiFacebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-dark-100 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-dark-50 transition-colors text-gray-700 dark:text-gray-300">
                <FiInstagram size={18} />
              </a>
            </div>
          </div>

          {/* Cột Địa chỉ công ty (3/12 width) */}
          <div className="md:col-span-3 text-right text-[11px] text-gray-500 dark:text-gray-400 space-y-1.5 self-end">
            <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase mb-2">Địa chỉ công ty</h4>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Công ty Cổ phần FoodServe</p>
            <p>Tòa nhà Lữ Gia, Tầng G</p>
            <p>số 70 Lữ Gia, Phường 15, Quận 11, TP.HCM</p>
            <p>Giấy CN ĐKDN số: 0311828036</p>
            <p>do Sở Kế hoạch và Đầu tư TP.HCM cấp ngày 11/6/2012,</p>
            <p>sửa đổi lần thứ 23, ngày 10/12/2025</p>
            <p className="pt-2">Chịu trách nhiệm quản lý nội dung và vấn đề bảo vệ quyền lợi người dùng: Vũ Văn Quyên</p>
            <p>Điện thoại liên hệ: 028 71096879</p>
          </div>

        </div>
      </div>
    </footer>
  )
}
