import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiPackage, FiTruck, FiDollarSign, FiStar, FiUser, FiPhone, FiCamera, FiSave, FiLock, FiEye, FiEyeOff, FiClock, FiCheckCircle } from 'react-icons/fi';
import AvailableOrders from '../components/shipper/AvailableOrders';
import ActiveDelivery from '../components/shipper/ActiveDelivery';
import ChatButton from '../components/chat/ChatButton';
import { updateUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { formatPrice } from '../data/mockData';

// ===== Tab Lịch sử đơn đã giao =====
function ShipperHistory({ shipperId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalEarnings: 0 });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders?shipperId=${shipperId}`);
        const data = await res.json();
        const completed = data.filter(o => o.status === 'completed');
        setOrders(completed);
        const totalEarnings = completed.reduce((sum, o) => sum + Math.ceil((o.deliveryFee || 15000) * 0.9 / 1000), 0);
        setStats({ total: completed.length, totalEarnings });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [shipperId]);

  if (loading) return (
    <div className="text-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto mb-3" />
      <p className="text-gray-500">Đang tải lịch sử...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tổng kết */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-500 font-medium mt-1">Tổng đơn đã giao</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-green-600">🪙 {stats.totalEarnings}</div>
          <div className="text-sm text-green-500 font-medium mt-1">Tổng Xu kiếm được</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow">
          <FiClock className="text-5xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có đơn hàng nào hoàn thành</p>
        </div>
      ) : (
        orders.map((order, idx) => (
          <motion.div key={order._id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow border border-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-gray-800">#{order._id.slice(-8).toUpperCase()}</div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <FiClock size={11} />
                  {new Date(order.updatedAt || order.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <FiCheckCircle size={11} /> Hoàn thành
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-2 flex items-start gap-1.5">
              <span className="text-gray-400 mt-0.5">📍</span>
              <span className="line-clamp-1">{order.deliveryAddress}</span>
            </div>

            <div className="flex items-center gap-2 text-sm mb-3 text-gray-500">
              <span>🛒 {order.items?.length || 0} món</span>
              <span>•</span>
              <span className={order.paymentMethod === 'cash' ? 'text-gray-500' : 'text-green-600 font-medium'}>
                {order.paymentMethod === 'cash' ? '💵 COD'
                  : order.paymentMethod === 'momo' ? '💜 MoMo'
                  : order.paymentMethod === 'coins' ? '🪙 Xu'
                  : order.paymentMethod}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm text-gray-500">Tổng đơn:</span>
              <span className="font-bold text-gray-800">{formatPrice(order.finalAmount)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-500">Bạn nhận được:</span>
              <span className="font-bold text-green-600">
                🪙 +{Math.ceil((order.deliveryFee || 15000) * 0.9 / 1000)} Xu
              </span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

// ===== Tab Tôi =====
function ShipperProfile({ user }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicleType: user?.vehicleType || 'motorbike',
    vehicleNumber: user?.vehicleNumber || '',
    avatar: user?.avatar || ''
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Tên không được để trống');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id || user.id,
          name: form.name,
          phone: form.phone,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber,
          avatar: form.avatar
        })
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(updateUser(data));
        toast.success('Cập nhật thông tin thành công! 🎉');
      } else {
        toast.error(data.message || 'Lỗi cập nhật');
      }
    } catch { toast.error('Lỗi kết nối server'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword) return toast.error('Nhập mật khẩu hiện tại');
    if (pwForm.newPassword.length < 6) return toast.error('Mật khẩu mới ít nhất 6 ký tự');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    setPwLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id || user.id, currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đổi mật khẩu thành công! 🎉');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else { toast.error(data.message || 'Đổi mật khẩu thất bại'); }
    } catch { toast.error('Lỗi kết nối server'); }
    finally { setPwLoading(false); }
  };

  const vehicleOptions = [
    { value: 'motorbike', label: '🏍️ Xe máy' },
    { value: 'bike', label: '🚲 Xe đạp' },
    { value: 'car', label: '🚗 Ô tô' },
  ];

  return (
    <div className="space-y-6">
      {/* Thông tin cơ bản */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <FiUser className="text-primary-500" /> Thông tin cá nhân
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group w-20 h-20">
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="w-full h-full rounded-2xl object-cover ring-4 ring-white shadow-md group-hover:opacity-75 transition-opacity" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl text-white shadow-md">
                  🛵
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl bg-black/40">
                <FiCamera className="text-white text-xl" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <div>
              <p className="font-bold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-400">🛵 Tài xế FoodServe</p>
              <p className="text-xs text-gray-400 mt-1">Click vào ảnh để thay đổi</p>
            </div>
          </div>

          {/* Họ tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-400 outline-none text-gray-800"
                placeholder="Nhập họ tên" required />
            </div>
          </div>

          {/* SĐT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <div className="relative">
              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-400 outline-none text-gray-800"
                placeholder="VD: 0987654321" />
            </div>
          </div>

          {/* Loại xe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phương tiện</label>
            <div className="grid grid-cols-3 gap-2">
              {vehicleOptions.map(v => (
                <button key={v.value} type="button"
                  onClick={() => setForm(p => ({ ...p, vehicleType: v.value }))}
                  className={`py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                    form.vehicleType === v.value
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Biển số xe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
            <input type="text" value={form.vehicleNumber} onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-400 outline-none text-gray-800 font-mono tracking-widest uppercase"
              placeholder="VD: 51G-123.45" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-lg shadow-primary-500/25">
            <FiSave /> {loading ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>

      {/* Đổi mật khẩu */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <FiLock className="text-primary-500" /> Đổi mật khẩu
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Mật khẩu hiện tại', show: showPw.current, toggle: () => setShowPw(p => ({ ...p, current: !p.current })) },
            { key: 'newPassword', label: 'Mật khẩu mới', show: showPw.new, toggle: () => setShowPw(p => ({ ...p, new: !p.new })) },
            { key: 'confirmPassword', label: 'Xác nhận mật khẩu mới', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={field.show ? 'text' : 'password'}
                  value={pwForm[field.key]}
                  onChange={e => setPwForm(p => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-400 outline-none text-gray-800"
                  placeholder="••••••"
                />
                <button type="button" onClick={field.toggle}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {field.show ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          ))}

          {/* Thanh độ mạnh */}
          {pwForm.newPassword && (
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${
                  pwForm.newPassword.length >= i * 3
                    ? i <= 2 ? 'bg-red-400' : i === 3 ? 'bg-yellow-400' : 'bg-green-400'
                    : 'bg-gray-200'
                }`} />
              ))}
            </div>
          )}

          <button type="submit" disabled={pwLoading}
            className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            <FiLock /> {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      {/* Thống kê cá nhân */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          📊 Thống kê của tôi
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="text-2xl font-black text-blue-600">{user?.totalDeliveries || 0}</div>
            <div className="text-xs text-blue-500 font-medium mt-1">Đơn đã giao</div>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-4">
            <div className="text-2xl font-black text-yellow-600">🪙 {user?.coins || 0}</div>
            <div className="text-xs text-yellow-500 font-medium mt-1">Tổng Xu</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4">
            <div className="text-2xl font-black text-green-600">⭐ {user?.shipperRating || '—'}</div>
            <div className="text-xs text-green-500 font-medium mt-1">Đánh giá TB</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main Component =====
export default function ShipperDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('available');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [stats, setStats] = useState({ totalDeliveries: 0, totalEarnings: 0, rating: 0 });
  const [isOnline, setIsOnline] = useState(false); // Trạng thái online/offline

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    if (!user?.isShipper && user?.role !== 'shipper' && user?.role !== 'admin') {
      navigate('/driver-register'); return;
    }
    fetchStatsFromDB();
  }, [user, isAuthenticated]);

  const fetchStatsFromDB = async () => {
    try {
      const shipperId = user?._id || user?.id;
      if (!shipperId) return;
      const res = await fetch(`http://localhost:5000/api/orders?shipperId=${shipperId}`);
      if (res.ok) {
        const data = await res.json();
        const completed = data.filter(o => o.status === 'completed');
        const totalEarnings = completed.reduce((sum, o) => sum + Math.ceil((o.deliveryFee || 15000) * 0.9 / 1000), 0);
        setStats({
          totalDeliveries: completed.length,
          totalEarnings,
          rating: user?.shipperRating || 0
        });
      }
    } catch (err) {
      // fallback to user data
      setStats({
        totalDeliveries: user?.totalDeliveries || 0,
        totalEarnings: user?.coins || 0,
        rating: user?.shipperRating || 0
      });
    }
  };

  const handleOrderAccepted = () => { setActiveTab('active'); };
  const handleDeliveryCompleted = () => {
    setActiveTab('available');
    fetchStatsFromDB(); // Refresh stats sau khi giao xong
  };

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    toast.success(newStatus ? '🟢 Bạn đang Online — Sẵn sàng nhận đơn!' : '🔴 Bạn đã Offline', { duration: 2500 });
    try {
      await fetch(`http://localhost:5000/api/auth/users/${user?._id || user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus })
      });
    } catch { }
  };

  const tabs = [
    { id: 'available', label: 'Đơn có sẵn', icon: FiPackage },
    { id: 'active',    label: 'Đang giao',  icon: FiTruck },
    { id: 'history',   label: 'Lịch sử',    icon: FiClock },
    { id: 'profile',   label: 'Tôi',        icon: FiUser },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-amber-50 to-emerald-50 dark:from-dark-300 dark:via-dark-200 dark:to-dark-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <FiHome />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Shipper Dashboard</h1>
                <p className="text-white/80 text-sm">Xin chào, {user?.name}!</p>
              </div>
            </div>
            {/* Avatar nhỏ + nút Online */}
            <div className="flex items-center gap-3">
              {/* Nút Online/Offline */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleOnline}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all ${
                  isOnline
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </motion.button>

              <div className="w-12 h-12 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center text-xl cursor-pointer"
                onClick={() => setActiveTab('profile')}>
                {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : '🛵'}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: FiPackage,   label: 'Tổng đơn giao', value: stats.totalDeliveries },
              { icon: FiDollarSign,label: 'Xu kiếm được',  value: `🪙 ${stats.totalEarnings}` },
              { icon: FiStar,      label: 'Đánh giá TB',   value: stats.rating > 0 ? `⭐ ${stats.rating}` : '—' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => i === 0 && setActiveTab('history')}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <s.icon className="text-lg" />
                  </div>
                  <div>
                    <div className="text-white/70 text-[11px]">{s.label}</div>
                    <div className="text-lg font-bold leading-tight">{s.value}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/80'
                }`}>
                <Icon className="text-sm" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className={activeTab === 'profile' || activeTab === 'history' ? '' : 'bg-white rounded-2xl p-6 shadow-xl'}>
          {activeTab === 'available' && (
            <AvailableOrders shipperId={user?._id || user?.id} onOrderAccepted={handleOrderAccepted} isOnline={isOnline} />
          )}
          {activeTab === 'active' && (
            <ActiveDelivery shipperId={user?._id || user?.id} onDeliveryCompleted={handleDeliveryCompleted}
              onOrderChange={(orderId) => setActiveOrderId(orderId)} />
          )}
          {activeTab === 'history' && (
            <ShipperHistory shipperId={user?._id || user?.id} />
          )}
          {activeTab === 'profile' && <ShipperProfile user={user} />}
        </div>
      </div>

      {activeTab === 'active' && activeOrderId && <ChatButton orderId={activeOrderId} />}
    </div>
  );
}
