import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiShoppingCart, FiUser, FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi'
import { toggleDarkMode, openAuthModal, toggleMobileMenu, closeMobileMenu } from '../../store/slices/uiSlice'
import { toggleCart, selectCartCount } from '../../store/slices/cartSlice'
import { logout } from '../../store/slices/authSlice'
import { getUserRank } from '../../utils/rankUtils'
import { setSearchQuery } from '../../store/slices/restaurantSlice'

export default function Header() {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode, mobileMenuOpen } = useSelector((s) => s.ui)
  const { isAuthenticated, user } = useSelector((s) => s.auth)
  const cartCount = useSelector(selectCartCount)
  const [scrolled, setScrolled] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false)

  const handleRestaurantsClick = (e) => {
    if (user?.role === 'merchant') {
      e.preventDefault()
      navigate('/restaurant-manage')
    } else if (user?.role === 'admin') {
      e.preventDefault()
      navigate('/admin')
    } else {
      if (location.pathname === '/') {
        e.preventDefault()
        const el = document.getElementById('restaurants')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      } else {
        navigate('/')
      }
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    dispatch(closeMobileMenu())
  }, [location, dispatch])

  const handleSearch = (e) => {
    setSearchText(e.target.value)
    dispatch(setSearchQuery(e.target.value))
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 dark:bg-dark-300/90 backdrop-blur-md shadow-sm py-2'
            : 'bg-transparent py-4'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow shadow-primary-500/30">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white transform -rotate-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
            </div>
            <span className="text-2xl font-display font-black text-gradient hidden sm:block tracking-tight drop-shadow-sm">
              FoodServe
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Tìm món ăn, nhà hàng..."
                value={searchText}
                onChange={handleSearch}
                className="input-search"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user?.role === 'merchant' ? (
              <Link to="/restaurant-manage" className={`hidden lg:block font-bold transition-colors text-primary-500 hover:text-primary-600`}>
                💼 Quản lý nhà hàng
              </Link>
            ) : user?.role === 'shipper' ? (
              <Link to="/driver" className={`hidden lg:block font-bold transition-colors text-primary-500 hover:text-primary-600`}>
                🛵 Trang tài xế
              </Link>
            ) : user?.role === 'admin' ? (
              <Link to="/admin" className={`hidden lg:block font-medium transition-colors ${scrolled ? 'text-gray-800 dark:text-white hover:text-primary-500' : 'text-white/90 hover:text-white'}`}>
                👑 Trang quản trị
              </Link>
            ) : (
              <a 
                href="#restaurants" 
                onClick={handleRestaurantsClick} 
                className={`hidden lg:block font-medium transition-colors ${scrolled ? 'text-gray-800 dark:text-white hover:text-primary-500' : 'text-white/90 hover:text-white'}`}
              >
                Nhà hàng
              </a>
            )}
            <Link to="/games" className={`hidden lg:block font-medium transition-colors ${scrolled ? 'text-gray-800 dark:text-white hover:text-primary-500' : 'text-white/90 hover:text-white'}`}>
              Săn Xu
            </Link>
            {/* Đăng ký đối tác Dropdown */}
            <div 
              className="relative hidden lg:block"
              onMouseEnter={() => setPartnerDropdownOpen(true)}
              onMouseLeave={() => setPartnerDropdownOpen(false)}
            >
              <button className={`font-medium transition-colors flex items-center gap-1 py-2 ${scrolled ? 'text-gray-800 dark:text-white hover:text-primary-500' : 'text-white/90 hover:text-white'}`}>
                Đăng ký đối tác <span className="text-[10px] opacity-75">▼</span>
              </button>
              
              <AnimatePresence>
                {partnerDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-1 w-52 bg-white dark:bg-dark-200 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 py-1"
                  >
                    <Link 
                      to="/partner-register" 
                      onClick={() => setPartnerDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-100 font-semibold"
                    >
                      <span className="text-lg">🍳</span> Đối tác Nhà hàng
                    </Link>
                    <Link 
                      to="/driver-register" 
                      onClick={() => setPartnerDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-100 font-semibold"
                    >
                      <span className="text-lg">🛵</span> Đối tác Tài xế
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className={`relative p-2.5 rounded-xl transition-all duration-300 ${scrolled ? 'hover:bg-gray-100 dark:hover:bg-dark-200' : 'hover:bg-white/10'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <FiSun className={`text-xl ${scrolled ? 'text-yellow-400' : 'text-yellow-400 drop-shadow-sm'}`} />
              ) : (
                <FiMoon className={`text-xl ${scrolled ? 'text-gray-800' : 'text-white'}`} />
              )}
            </button>
            <button
              onClick={() => dispatch(toggleCart())}
              className={`relative p-2.5 rounded-xl transition-all duration-300 ${scrolled ? 'hover:bg-gray-100 dark:hover:bg-dark-200' : 'hover:bg-white/10'}`}
              aria-label="Open cart"
            >
              <FiShoppingCart className={`text-xl ${scrolled ? 'text-gray-800 dark:text-white' : 'text-white'}`} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <div 
                  className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                    scrolled ? 'bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-dark-100 hover:bg-gray-100 dark:hover:bg-dark-100' : 'glass hover:bg-white/10 border border-white/20'
                  }`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden ring-2 ring-white/50">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold leading-none ${scrolled ? 'text-gray-800 dark:text-white' : 'text-white'}`}>
                        {user?.name || 'User'}
                      </span>
                      {/* Rank Badge */}
                      {(() => {
                        const rank = getUserRank(user?.totalSpent);
                        return (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${rank.bg} ${rank.color}`}>
                            {rank.icon} {rank.name}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-xs font-bold text-yellow-500 mt-1 flex items-center gap-1">
                      🪙 {user?.coins || 0} Xu
                    </span>
                  </div>
                </div>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-200 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800"
                    >

                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-100 border-b border-gray-100 dark:border-gray-800">
                        👤 Hồ sơ của tôi
                      </Link>
                      <Link to="/history" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-100 border-b border-gray-100 dark:border-gray-800">
                        📜 Lịch sử đơn hàng
                      </Link>
                      <Link to="/games" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 border-b border-gray-100 dark:border-gray-800">
                        🎁 Săn Xu & Đổi Quà
                      </Link>
                      <Link to="/leaderboard" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm font-bold text-orange-600 dark:text-orange-500 hover:bg-gray-50 dark:hover:bg-dark-100 border-b border-gray-100 dark:border-gray-800">
                        🏆 Bảng Xếp Hạng
                      </Link>
                      {user?.role === 'shipper' && (
                        <Link to="/driver" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm text-primary-500 font-semibold hover:bg-gray-50 dark:hover:bg-dark-100">
                          🛵 Trang tài xế
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm text-primary-500 font-semibold hover:bg-gray-50 dark:hover:bg-dark-100">
                          👑 Trang quản trị
                        </Link>
                      )}
                      <button 
                        onClick={() => { setDropdownOpen(false); dispatch(logout()) }}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        🚪 Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => dispatch(openAuthModal('login'))}
                className="hidden md:flex btn-primary text-sm px-4 py-2.5"
              >
                <FiUser className="mr-2" /> Đăng nhập
              </button>
            )}

            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="md:hidden p-2.5 rounded-xl hover:bg-white/10 transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <FiX className={`text-xl ${scrolled || darkMode ? 'text-white' : 'text-gray-700'}`} />
              ) : (
                <FiMenu className={`text-xl ${scrolled || darkMode ? 'text-white' : 'text-gray-700'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 mt-2">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm món ăn, nhà hàng..."
              value={searchText}
              onChange={handleSearch}
              className="input-search text-sm py-2.5"
            />
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => dispatch(closeMobileMenu())} />
            <motion.div
              className="absolute top-0 right-0 w-72 h-full bg-white dark:bg-dark-200 shadow-2xl p-6 pt-24"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <nav className="flex flex-col gap-4">
                <Link to="/" className="text-lg font-medium text-gray-800 dark:text-white hover:text-primary-500 transition-colors">
                  🏠 Trang chủ
                </Link>
                {user?.role === 'merchant' ? (
                  <Link to="/restaurant-manage" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-bold text-primary-500 hover:text-primary-600 transition-colors">
                    🍳 Quản lý nhà hàng
                  </Link>
                ) : user?.role === 'shipper' ? (
                  <Link to="/driver" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-bold text-primary-500 hover:text-primary-600 transition-colors">
                    🛵 Trang tài xế
                  </Link>
                ) : (
                  <a 
                    href="#restaurants" 
                    onClick={(e) => { dispatch(closeMobileMenu()); handleRestaurantsClick(e); }} 
                    className="text-lg font-medium text-gray-800 dark:text-white hover:text-primary-500 transition-colors"
                  >
                    🍔 Danh sách nhà hàng
                  </a>
                )}
                <Link to="/history" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-medium text-gray-800 dark:text-white hover:text-primary-500 transition-colors">
                  📜 Lịch sử đơn hàng
                </Link>
                <Link to="/profile" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-primary-500 transition-colors">
                  👤 Hồ sơ của tôi
                </Link>
                <Link to="/games" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-bold text-yellow-500 hover:text-yellow-600 transition-colors">
                  🎁 Săn Xu & Đổi Quà
                </Link>
                <Link to="/leaderboard" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  🏆 Bảng Xếp Hạng
                </Link>
                <Link to="/partner-register" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-bold text-primary-500 hover:text-primary-600 transition-colors">
                  🍳 Đăng ký đối tác quán
                </Link>
                <Link to="/driver-register" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-bold text-primary-500 hover:text-primary-600 transition-colors">
                  🛵 Đăng ký đối tác tài xế
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => dispatch(closeMobileMenu())} className="text-lg font-medium text-primary-500 transition-colors">
                    👑 Trang quản trị (Admin)
                  </Link>
                )}
                <hr className="border-gray-200 dark:border-gray-700" />
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => { dispatch(closeMobileMenu()); dispatch(openAuthModal('login')) }}
                      className="btn-primary text-center"
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => { dispatch(closeMobileMenu()); dispatch(openAuthModal('register')) }}
                      className="btn-outline text-center"
                    >
                      Đăng ký
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-white font-bold">{user?.name?.charAt(0) || 'U'}</span>
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { dispatch(closeMobileMenu()); dispatch(logout()) }}
                      className="btn-outline text-red-500 border-red-500 hover:bg-red-50 text-center mt-2"
                    >
                      🚪 Đăng xuất
                    </button>
                  </>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
