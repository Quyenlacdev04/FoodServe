import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiShoppingCart, FiUser, FiSun, FiMoon, FiMenu, FiX, FiChevronDown } from 'react-icons/fi'
import { toggleDarkMode, openAuthModal, toggleMobileMenu, closeMobileMenu } from '../../store/slices/uiSlice'
import { toggleCart, selectCartCount } from '../../store/slices/cartSlice'
import { logout } from '../../store/slices/authSlice'
import { getUserRank } from '../../utils/rankUtils'
import { setSearchQuery } from '../../store/slices/restaurantSlice'
import useUserCapabilities from '../../hooks/useUserCapabilities'
import NotificationBell from '../ui/NotificationBell'

const menuLinkClass =
  'block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors'

export default function Header() {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode, mobileMenuOpen } = useSelector((s) => s.ui)
  const { isAuthenticated, user } = useSelector((s) => s.auth)
  const cartCount = useSelector(selectCartCount)
  const [scrolled, setScrolled] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { caps, showPartnerDropdown } = useUserCapabilities()

  const handleRestaurantsClick = (e) => {
    setMenuOpen(false)
    if (caps.showRestaurantManage || user?.role === 'merchant') {
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

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    dispatch(closeMobileMenu())
    setMenuOpen(false)
  }, [location, dispatch])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleSearch = (e) => {
    setSearchText(e.target.value)
    dispatch(setSearchQuery(e.target.value))
  }

  const renderUserMenu = () => (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-200 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 z-50"
        >
          {isAuthenticated && user && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-dark-100/50">
              <p className="font-bold text-sm dark:text-white truncate">{user.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="flex items-center justify-between mt-2 gap-2">
                {(() => {
                  const rank = getUserRank(user?.totalSpent)
                  return (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rank.bg} ${rank.color}`}>
                      {rank.icon} {rank.name}
                    </span>
                  )
                })()}
                <span className="text-xs font-bold text-yellow-500">🪙 {user?.coins || 0} Xu</span>
              </div>
            </div>
          )}

          <div className="py-1">
            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Khám phá</p>
            {!caps.showRestaurantManage && !caps.showDriverPanel && (
              <a href="#restaurants" onClick={handleRestaurantsClick} className={menuLinkClass}>
                🍔 Nhà hàng
              </a>
            )}
            <Link to="/games" onClick={closeMenu} className={`${menuLinkClass} font-semibold text-yellow-600 dark:text-yellow-500`}>
              🎁 Săn Xu
            </Link>
          </div>

          {(caps.showRestaurantManage || caps.showDriverPanel || showPartnerDropdown) && (
            <div className="py-1 border-t border-gray-100 dark:border-gray-800">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Đối tác</p>
              {caps.showRestaurantManage && (
                <Link to="/restaurant-manage" onClick={closeMenu} className={`${menuLinkClass} font-semibold text-primary-500`}>
                  🍳 Quán của tôi
                </Link>
              )}
              {caps.showDriverPanel && (
                <Link to="/driver" onClick={closeMenu} className={`${menuLinkClass} font-semibold text-primary-500`}>
                  🛵 Tài xế
                </Link>
              )}
              {caps.showPartnerRegister && (
                <Link to="/partner-register" onClick={closeMenu} className={menuLinkClass}>
                  🍳 Đăng ký mở quán
                </Link>
              )}
              {caps.showDriverRegister && (
                <Link to="/driver-register" onClick={closeMenu} className={menuLinkClass}>
                  🛵 Đăng ký tài xế
                </Link>
              )}
            </div>
          )}

          {isAuthenticated && (
            <div className="py-1 border-t border-gray-100 dark:border-gray-800">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tài khoản</p>
              <Link to="/profile" onClick={closeMenu} className={menuLinkClass}>
                👤 Hồ sơ của tôi
              </Link>
              <Link to="/history" onClick={closeMenu} className={menuLinkClass}>
                📜 Lịch sử đơn hàng
              </Link>
              <Link to="/leaderboard" onClick={closeMenu} className={menuLinkClass}>
                🏆 Bảng xếp hạng
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={closeMenu} className={`${menuLinkClass} font-semibold text-primary-500`}>
                  👑 Trang quản trị
                </Link>
              )}
              <button
                type="button"
                onClick={() => { closeMenu(); dispatch(logout()) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                🚪 Đăng xuất
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <button
                type="button"
                onClick={() => { closeMenu(); dispatch(openAuthModal('login')) }}
                className="btn-primary w-full text-sm py-2.5"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => { closeMenu(); dispatch(openAuthModal('register')) }}
                className="btn-outline w-full text-sm py-2.5"
              >
                Đăng ký
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 dark:bg-dark-300/90 backdrop-blur-md shadow-sm py-2'
            : 'bg-transparent py-3 md:py-4'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow shadow-primary-500/30">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 md:w-6 md:h-6 text-white transform -rotate-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-display font-black text-gradient hidden sm:block tracking-tight drop-shadow-sm">
                FoodServe
              </span>
            </Link>

            {/* Search — căn giữa, chiếm phần còn lại */}
            <div className="flex-1 min-w-0 flex justify-center px-1 md:px-4">
              <div className="relative w-full max-w-xl lg:max-w-2xl hidden md:block">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm món ăn, nhà hàng..."
                  value={searchText}
                  onChange={handleSearch}
                  className="input-search w-full"
                />
              </div>
            </div>

            {/* Actions: theme, notifications, cart, avatar menu */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => dispatch(toggleDarkMode())}
                className={`p-2.5 rounded-xl transition-all duration-300 ${scrolled ? 'hover:bg-gray-100 dark:hover:bg-dark-200' : 'hover:bg-white/10'}`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <FiSun className={`text-xl ${scrolled ? 'text-yellow-400' : 'text-yellow-400 drop-shadow-sm'}`} />
                ) : (
                  <FiMoon className={`text-xl ${scrolled ? 'text-gray-800' : 'text-white'}`} />
                )}
              </button>
              
              {/* Notification Bell */}
              {isAuthenticated && <NotificationBell />}
              
              <button
                type="button"
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

              {/* Menu Tôi — bấm ảnh đại diện */}
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-1 p-1 rounded-full transition-all ${
                    scrolled ? 'hover:bg-gray-100 dark:hover:bg-dark-200' : 'hover:bg-white/10'
                  } ${menuOpen ? 'ring-2 ring-primary-500/50' : ''}`}
                  aria-label="Menu tài khoản"
                  aria-expanded={menuOpen}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden ring-2 ring-white/40 shadow-md">
                    {isAuthenticated && user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {isAuthenticated ? user?.name?.charAt(0) || 'U' : <FiUser className="text-lg" />}
                      </span>
                    )}
                  </div>
                  <FiChevronDown
                    className={`text-sm transition-transform ${menuOpen ? 'rotate-180' : ''} ${
                      scrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white/80'
                    }`}
                  />
                </button>
                {renderUserMenu()}
              </div>

              <button
                type="button"
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
          <div className="md:hidden mt-2">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm món ăn, nhà hàng..."
                value={searchText}
                onChange={handleSearch}
                className="input-search w-full text-sm py-2.5"
              />
            </div>
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
              className="absolute top-0 right-0 w-72 h-full bg-white dark:bg-dark-200 shadow-2xl p-6 pt-24 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <nav className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">Khám phá</p>
                {caps.showRestaurantManage ? (
                  <Link to="/restaurant-manage" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base font-bold text-primary-500">
                    🍳 Quán của tôi
                  </Link>
                ) : (
                  <a
                    href="#restaurants"
                    onClick={(e) => { dispatch(closeMobileMenu()); handleRestaurantsClick(e) }}
                    className="px-2 py-2.5 text-base font-medium text-gray-800 dark:text-white"
                  >
                    🍔 Nhà hàng
                  </a>
                )}
                {caps.showDriverPanel && (
                  <Link to="/driver" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base font-bold text-primary-500">
                    🛵 Tài xế
                  </Link>
                )}
                <Link to="/games" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base font-bold text-yellow-500">
                  🎁 Săn Xu
                </Link>

                {(showPartnerDropdown || caps.showRestaurantManage || caps.showDriverPanel) && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mt-3 mb-1">Đối tác</p>
                    {caps.showPartnerRegister && (
                      <Link to="/partner-register" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base text-primary-500 font-semibold">
                        🍳 Đăng ký mở quán
                      </Link>
                    )}
                    {caps.showDriverRegister && (
                      <Link to="/driver-register" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base text-primary-500 font-semibold">
                        🛵 Đăng ký tài xế
                      </Link>
                    )}
                  </>
                )}

                {isAuthenticated && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mt-3 mb-1">Tài khoản</p>
                    <Link to="/profile" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base text-gray-800 dark:text-white">
                      👤 Hồ sơ của tôi
                    </Link>
                    <Link to="/history" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base text-gray-800 dark:text-white">
                      📜 Lịch sử đơn hàng
                    </Link>
                    <Link to="/leaderboard" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base text-orange-500 font-bold">
                      🏆 Bảng xếp hạng
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => dispatch(closeMobileMenu())} className="px-2 py-2.5 text-base text-primary-500 font-semibold">
                        👑 Trang quản trị
                      </Link>
                    )}
                  </>
                )}

                <hr className="border-gray-200 dark:border-gray-700 my-3" />
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => { dispatch(closeMobileMenu()); dispatch(openAuthModal('login')) }}
                      className="btn-primary w-full text-center"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => { dispatch(closeMobileMenu()); dispatch(openAuthModal('register')) }}
                      className="btn-outline w-full text-center"
                    >
                      Đăng ký
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-2 px-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-white font-bold">{user?.name?.charAt(0) || 'U'}</span>
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-yellow-500 font-bold">🪙 {user?.coins || 0} Xu</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { dispatch(closeMobileMenu()); dispatch(logout()) }}
                      className="btn-outline text-red-500 border-red-500 w-full text-center mt-2"
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
