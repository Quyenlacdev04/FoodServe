import { useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiHome, FiSearch, FiShoppingBag, FiFileText, FiUser, FiHeart } from 'react-icons/fi'
import { toggleCart, selectCartCount } from '../../store/slices/cartSlice'
import { openAuthModal } from '../../store/slices/uiSlice'

const navItems = [
  { icon: FiHome, label: 'Trang chủ', path: '/' },
  { icon: FiHeart, label: 'Yêu thích', path: '/favorites' },
  { icon: FiShoppingBag, label: 'Giỏ hàng', path: '/', action: 'cart' },
  { icon: FiFileText, label: 'Đơn hàng', path: '/history' },
  { icon: FiUser, label: 'Tài khoản', path: '/', action: 'account' },
]

export default function BottomNav() {
  const location = useLocation()
  const dispatch = useDispatch()
  const cartCount = useSelector(selectCartCount)

  const { isAuthenticated } = useSelector(s => s.auth)

  const handleClick = (item) => {
    if (item.action === 'cart') dispatch(toggleCart())
    else if (item.action === 'account') dispatch(openAuthModal('login'))
  }

  return (
    <nav className="bottom-nav safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.path === location.pathname && !item.action
          const Icon = item.icon
          return (
            <div key={item.label} className="relative">
              {item.action ? (
                <button
                  onClick={() => handleClick(item)}
                  className="flex flex-col items-center gap-1 py-1 px-3 transition-colors"
                >
                  <div className="relative">
                    <Icon className={`text-xl ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                    {item.action === 'cart' && cartCount > 0 && (
                      <span className="absolute -top-2 -right-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isActive ? 'text-primary-500 font-semibold' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </button>
              ) : (
                <Link
                  to={item.path}
                  className="flex flex-col items-center gap-1 py-1 px-3 transition-colors"
                >
                  <Icon className={`text-xl ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className={`text-[10px] ${isActive ? 'text-primary-500 font-semibold' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 w-6 h-1 bg-primary-500 rounded-full"
                      layoutId="bottomNav"
                    />
                  )}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
