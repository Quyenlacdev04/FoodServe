import { API_BASE_URL } from './config/api.js'
import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { AnimatePresence } from 'framer-motion'
import { setDarkMode, setLoading } from './store/slices/uiSlice'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import CartSidebar from './components/cart/CartSidebar'
import AuthModal from './components/auth/AuthModal'
import LoadingScreen from './components/ui/LoadingScreen'
import MaintenanceBanner from './components/ui/MaintenanceBanner'
import MaintenancePage from './pages/MaintenancePage'
import HomePage from './pages/HomePage'
import RestaurantPage from './pages/RestaurantPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentResultPage from './pages/PaymentResultPage'
import AdminPage from './pages/AdminPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import GamesPage from './pages/GamesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import FavoritesPage from './pages/FavoritesPage'
import PartnerRegisterPage from './pages/PartnerRegisterPage'
import RestaurantManagePage from './pages/RestaurantManagePage'
import MerchantOrdersPage from './pages/MerchantOrdersPage'
import DriverRegisterPage from './pages/DriverRegisterPage'
import ShipperDashboardPage from './pages/ShipperDashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import { fetchRestaurants } from './store/slices/restaurantSlice'

import Footer from './components/layout/Footer'

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { darkMode, loading } = useSelector((state) => state.ui)
  const [isMaintenance, setIsMaintenance] = useState(false)

  // Check maintenance mode on mount & poll
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`)
        if (res.ok) {
          const data = await res.json()
          setIsMaintenance(!!data.maintenanceMode)
        }
      } catch (err) {
        // Ignore
      }
    }
    checkMaintenance()
    const interval = setInterval(checkMaintenance, 15050)
    return () => clearInterval(interval)
  }, [])

  // Kiểm tra xem có phải trang admin, partner register hoặc quản lý nhà hàng/tài xế không
  const isAdminPage = location.pathname.startsWith('/admin')
  const isPartnerPage = location.pathname.startsWith('/partner-register')
  const isManagePage = location.pathname.startsWith('/restaurant-manage')
  const isDriverPage = location.pathname.startsWith('/driver') || location.pathname.startsWith('/driver-register')
  const isHideLayout = isAdminPage || isPartnerPage || isManagePage || isDriverPage

  useEffect(() => {
    dispatch(fetchRestaurants())
  }, [dispatch])

  useEffect(() => {
    const isDark = localStorage.getItem('foodserve_dark') === 'true'
    dispatch(setDarkMode(isDark))
    setTimeout(() => dispatch(setLoading(false)), 2000)
  }, [dispatch])

  // If maintenance mode is active and it's not the admin portal, block access entirely
  if (isMaintenance && !isAdminPage) {
    return (
      <div className={`${darkMode ? 'dark' : ''}`}>
        <MaintenancePage />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-surface-light dark:bg-dark-300 transition-colors duration-500">
        <AnimatePresence mode="wait">
          {loading && <LoadingScreen key="loading" />}
        </AnimatePresence>
        {!loading && (
          <>
            {/* Banner bảo trì - hiển thị trên mọi trang */}
            <MaintenanceBanner />
            
            {/* Chỉ hiển thị Header khi KHÔNG thuộc các trang ẩn */}
            {!isHideLayout && <Header />}
            
            <main className={isHideLayout ? '' : 'pb-20 md:pb-0'}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/restaurant/:id" element={<RestaurantPage />} />
                <Route path="/tracking" element={<OrderTrackingPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment/vnpay-return" element={<PaymentResultPage />} />
                <Route path="/payment-result" element={<PaymentResultPage />} />
                <Route path="/history" element={<OrderHistoryPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/partner-register" element={<PartnerRegisterPage />} />
                <Route path="/driver-register" element={<DriverRegisterPage />} />
                <Route path="/restaurant-manage" element={<RestaurantManagePage />} />
                <Route path="/restaurant-manage/orders" element={<MerchantOrdersPage />} />
                <Route path="/driver" element={<ShipperDashboardPage />} />
                <Route path="/shipper" element={<ShipperDashboardPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            
            {/* Chỉ hiển thị Footer khi KHÔNG thuộc các trang ẩn */}
            {!isHideLayout && <Footer />}
            
            {/* Chỉ hiển thị CartSidebar, AuthModal, BottomNav khi KHÔNG thuộc các trang ẩn */}
            {!isHideLayout && (
              <>
                <CartSidebar />
                <AuthModal />
                <BottomNav />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
