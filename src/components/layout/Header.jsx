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
  'flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-primary-50/60 dark:hover:bg-white/5 rounded-xl mx-2 transition-all duration-200'

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
  const { caps } = useUserCapabilities()

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
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleSearch = (e) => {
    setSearchText(e.target.value)
    dispatch(setSearchQuery(e.target.value))
  }

  const iconBtnClass = `p-2.5 rounded-2xl transition-all duration-300 ${
    scrolled
      ? 'hover:bg-gray-100/80 dark:hover:bg-white/5'
      : 'hover:bg-white/10'
  }`

  const iconColor = scrolled ? 'text-gray-700 dark:text-gray-200' : 'text-white'

  const renderUserMenu = () => (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 mt-3 w-64 bg-white dark:bg-dark-200 rounded-3xl shadow-xl overflow-hidden border border-gray-100/80 dark:border-white/6 z-50"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}
        >
          {isAuthenticated && user && (
            <div className="p-4 border-b border-gray-100 dark:border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm dark:text-white truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {(() => {
                  const rank = getUserRank(user?.totalSpent)
                  return (
                    <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold ${rank.bg} ${rank.color}`}>
                      {rank.icon} {rank.name}
                    </span>
                  )
                })()}
                <span className="text-xs font-bold text-amber-500 ml-auto">🪙 {user?.coins || 0} Xu</span>
              </div>
            </div>
          )}

          <div className="py-2">
            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Khám phá</p>
            {!caps.showRestaurantManage && !caps.showDriverPanel && (
              <a href="#restaurants" onClick={handleRestaurantsClick} className={menuLinkClass}>🍔 Nhà hàng</a>
            )}
            <Link to="/games" onClick={closeMenu} className={`${menuLinkClass} !text-amber-500 font-semibold`}>🎁 Săn Xu</Link>
          </div>

          {isAuthenticated && (
            <div className="py-2 border-t border-gray-100 dark:border-white/6">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Đối tác</p>
              {caps.showRestaurantManage ? (
                <Link to="/restaurant-manage" onClick={closeMenu} className={`${menuLinkClass} !text-primary-500 font-semibold`}>🍳 Quán của tôi</Link>
              ) : (
                <Link to="/partner-register" onClick={closeMenu} className={`${menuLinkClass} !text-primary-500 font-semibold`}>🍳 Đăng ký đối tác</Link>
              )}
              {caps.showDriverPanel ? (
                <Link to="/driver" onClick={closeMenu} className={`${menuLinkClass} !text-primary-500 font-semibold`}>🛵 Tài xế</Link>
              ) : (
                <Link to="/driver-register" onClick={closeMenu} className={menuLinkClass}>🛵 Đăng ký tài xế</Link>
              )}
            </div>
          )}

          {isAuthenticated && (
            <div className="py-2 border-t border-gray-100 dark:border-white/6">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tài khoản</p>
              <Link to="/profile" onClick={closeMenu} className={menuLinkClass}>👤 Hồ sơ của tôi</Link>
              <Link to="/profile#foodbot" onClick={closeMenu} className={`${menuLinkClass} !text-primary-500 font-semibold`}>🤖 FoodBot AI</Link>
              <Link to="/favorites" onClick={closeMenu} className={menuLinkClass}>❤️ Yêu thích</Link>
              <Link to="/history" onClick={closeMenu} className={menuLinkClass}>📜 Lịch sử đơn hàng</Link>
              <Link to="/leaderboard" onClick={closeMenu} className={menuLinkClass}>🏆 Bảng xếp hạng</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={closeMenu} className={`${menuLinkClass} !text-primary-500 font-semibold`}>👑 Trang quản trị</Link>
              )}
              <button
                type="button"
                onClick={() => { closeMenu(); dispatch(logout()) }}
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl mx-2 transition-all"
              >
                🚪 Đăng xuất
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-3 border-t border-gray-100 dark:border-white/6 space-y-2">
              <button type="button" onClick={() => { closeMenu(); dispatch(openAuthModal('login')) }} className="btn-primary w-full text-sm py-2.5 text-center">Đăng nhập</button>
              <button type="button" onClick={() => { closeMenu(); dispatch(openAuthModal('register')) }} className="btn-outline w-full text-sm py-2.5 text-center">Đăng ký</button>
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
            ? 'py-2'
            : 'py-3 md:py-4'
        }`}
        style={scrolled ? {
          background: darkMode ? 'rgba(10,10,20,0.85)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.03)',
        } : {
          background: 'transparent',
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-primary flex items-center justify-center relative overflow-hidden"
                style={{ boxShadow: '0 4px 16px rgba(255,107,0,0.25)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 md:w-6 md:h-6 text-white transform -rotate-12 relative z-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-display font-black text-gradient hidden sm:block tracking-tight">
                FoodServe
              </span>
            </Link>

            {/* Search */}
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

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
              <button type="button" onClick={() => dispatch(toggleDarkMode())} className={iconBtnClass} aria-label="Toggle dark mode">
                {darkMode
                  ? <FiSun className="text-xl text-amber-400" />
                  : <FiMoon className={`text-xl ${iconColor}`} />
                }
              </button>

              {isAuthenticated && <NotificationBell />}

              <button type="button" onClick={() => dispatch(toggleCart())} className={`relative ${iconBtnClass}`} aria-label="Open cart">
                <FiShoppingCart className={`text-xl ${iconColor}`} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* Desktop user menu */}
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-1.5 p-1 rounded-full transition-all ${
                    scrolled ? 'hover:bg-gray-100/80 dark:hover:bg-white/5' : 'hover:bg-white/10'
                  } ${menuOpen ? 'ring-2 ring-primary-500/30' : ''}`}
                  aria-label="Menu tài khoản"
                  aria-expanded={menuOpen}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden ring-2 ring-white/20 shadow-md">
                    {isAuthenticated && user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {isAuthenticated ? user?.name?.charAt(0) || 'U' : <FiUser className="text-lg" />}
                      </span>
                    )}
                  </div>
                  <FiChevronDown className={`text-sm transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''} ${
                    scrolled ? 'text-gray-500 dark:text-gray-400' : 'text-white/70'
                  }`} />
                </button>
                {renderUserMenu()}
              </div>

              <button
                type="button"
                onClick={() => dispatch(toggleMobileMenu())}
                className={`md:hidden ${iconBtnClass}`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen
                  ? <FiX className={`text-xl ${iconColor}`} />
                  : <FiMenu className={`text-xl ${iconColor}`} />
                }
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => dispatch(closeMobileMenu())} />
            <motion.div
              className="absolute top-0 right-0 w-[300px] h-full bg-white dark:bg-dark-300 shadow-2xl p-6 pt-24 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <nav className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">Khám phá</p>
                {!caps.showRestaurantManage && !caps.showDriverPanel && (
                  <a href="#restaurants" onClick={(e) => { dispatch(closeMobileMenu()); handleRestaurantsClick(e) }}
                    className="px-3 py-2.5 text-base font-medium text-gray-800 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    🍔 Nhà hàng
                  </a>
                )}
                <Link to="/games" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base font-bold text-amber-500 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                  🎁 Săn Xu
                </Link>

                {isAuthenticated && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mt-4 mb-1">Đối tác</p>
                    {caps.showRestaurantManage ? (
                      <Link to="/restaurant-manage" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base font-bold text-primary-500 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">🍳 Quán của tôi</Link>
                    ) : (
                      <Link to="/partner-register" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base text-primary-500 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">🍳 Đăng ký đối tác</Link>
                    )}
                    {caps.showDriverPanel ? (
                      <Link to="/driver" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base font-bold text-primary-500 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">🛵 Tài xế</Link>
                    ) : (
                      <Link to="/driver-register" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base text-primary-500 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">🛵 Đăng ký tài xế</Link>
                    )}
                  </>
                )}

                {isAuthenticated && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mt-4 mb-1">Tài khoản</p>
                    <Link to="/profile" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base text-gray-800 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">👤 Hồ sơ</Link>
                    <Link to="/profile#foodbot" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base font-semibold text-primary-500 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">🤖 FoodBot AI</Link>
                    <Link to="/history" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base text-gray-800 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">📜 Lịch sử đơn hàng</Link>
                    <Link to="/leaderboard" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base text-amber-500 font-bold rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">🏆 Bảng xếp hạng</Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => dispatch(closeMobileMenu())} className="px-3 py-2.5 text-base text-primary-500 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">👑 Quản trị</Link>
                    )}
                  </>
                )}

                <hr className="border-gray-100 dark:border-white/6 my-4" />
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <button type="button" onClick={() => { dispatch(closeMobileMenu()); dispatch(openAuthModal('login')) }} className="btn-primary w-full text-center">Đăng nhập</button>
                    <button type="button" onClick={() => { dispatch(closeMobileMenu()); dispatch(openAuthModal('register')) }} className="btn-outline w-full text-center">Đăng ký</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-2 px-1">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">{user?.name?.charAt(0) || 'U'}</span>
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-amber-500 font-bold">🪙 {user?.coins || 0} Xu</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { dispatch(closeMobileMenu()); dispatch(logout()) }}
                      className="w-full text-center py-3 rounded-2xl border-2 border-red-200 dark:border-red-500/20 text-red-500 font-semibold mt-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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
