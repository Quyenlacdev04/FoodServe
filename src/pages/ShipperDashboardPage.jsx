import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiPackage, FiTruck, FiDollarSign, FiStar } from 'react-icons/fi';
import AvailableOrders from '../components/shipper/AvailableOrders';
import ActiveDelivery from '../components/shipper/ActiveDelivery';
import ChatButton from '../components/chat/ChatButton';

export default function ShipperDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('available');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    rating: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (!user?.isShipper && user?.role !== 'shipper' && user?.role !== 'admin') {
      navigate('/driver-register');
      return;
    }

    fetchStats();
  }, [user, isAuthenticated]);

  const fetchStats = async () => {
    try {
      // Lấy thống kê từ user
      setStats({
        totalDeliveries: user?.totalDeliveries || 0,
        totalEarnings: user?.coins || 0,
        rating: user?.shipperRating || 0
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleOrderAccepted = () => {
    setActiveTab('active');
    fetchStats();
  };

  const handleDeliveryCompleted = () => {
    setActiveTab('available');
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
              >
                <FiHome />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Shipper Dashboard</h1>
                <p className="text-white/80 text-sm">Xin chào, {user?.name}!</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiPackage className="text-2xl" />
                </div>
                <div>
                  <div className="text-white/70 text-sm">Tổng đơn giao</div>
                  <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiDollarSign className="text-2xl" />
                </div>
                <div>
                  <div className="text-white/70 text-sm">Tổng thu nhập</div>
                  <div className="text-2xl font-bold">🪙 {stats.totalEarnings}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiStar className="text-2xl" />
                </div>
                <div>
                  <div className="text-white/70 text-sm">Đánh giá</div>
                  <div className="text-2xl font-bold">
                    {stats.rating > 0 ? `⭐ ${stats.rating}` : 'Chưa có'}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'available'
                ? 'bg-white text-orange-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <FiPackage className="inline mr-2" />
            Đơn hàng có sẵn
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-white text-orange-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <FiTruck className="inline mr-2" />
            Đang giao
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {activeTab === 'available' && (
            <AvailableOrders
              shipperId={user?._id || user?.id}
              onOrderAccepted={handleOrderAccepted}
            />
          )}

          {activeTab === 'active' && (
            <ActiveDelivery
              shipperId={user?._id || user?.id}
              onDeliveryCompleted={handleDeliveryCompleted}
              onOrderChange={(orderId) => setActiveOrderId(orderId)}
            />
          )}
        </div>
      </div>

      {/* Chat Button - chỉ hiển thị khi có đơn đang giao */}
      {activeTab === 'active' && activeOrderId && (
        <ChatButton orderId={activeOrderId} />
      )}
    </div>
  );
}
