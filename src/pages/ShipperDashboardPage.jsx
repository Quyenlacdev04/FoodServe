import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiPackage, FiTruck, FiDollarSign, FiStar, FiUser,
  FiPhone, FiCamera, FiSave, FiLock, FiEye, FiEyeOff, FiClock,
  FiCheckCircle, FiMapPin, FiNavigation, FiWifi, FiWifiOff,
  FiChevronRight, FiArrowLeft, FiBell, FiSettings
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AvailableOrders from '../components/shipper/AvailableOrders';
import ActiveDelivery from '../components/shipper/ActiveDelivery';
import ChatButton from '../components/chat/ChatButton';
import { updateUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { formatPrice } from '../data/mockData';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom shipper marker icon
const shipperIcon = L.divIcon({
  html: `<div style="background:#ff6b35;width:44px;height:44px;border-radius:50%;border:3px solid white;box-shadow:0 4px 15px rgba(255,107,53,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;">🛵</div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Component tự động pan bản đồ theo vị trí
function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.5 });
  }, [position]);
  return null;
}

// ===== LỊCH SỬ =====
function ShipperHistory({ shipperId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalEarnings: 0, totalRevenue: 0 });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders?shipperId=${shipperId}`);
        const data = await res.json();
        const completed = data.filter(o => o.status === 'completed');
        const totalEarnings = completed.reduce((sum, o) => sum + Math.ceil((o.deliveryFee || 15000) * 0.9 / 1000), 0);
        const totalRevenue = completed.reduce((sum, o) => sum + (o.deliveryFee || 15000), 0);
        setOrders(completed);
        setStats({ total: completed.length, totalEarnings, totalRevenue });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, [shipperId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="px-4 pb-24 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { label: 'Đơn đã giao', value: stats.total, icon: '📦', color: 'from-blue-500 to-blue-600' },
          { label: 'Tổng Xu', value: `🪙 ${stats.totalEarnings}`, icon: '💰', color: 'from-yellow-500 to-orange-500' },
          { label: 'Doanh thu', value: formatPrice(stats.totalRevenue), icon: '📈', color: 'from-green-500 to-emerald-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-3 text-white text-center`}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="font-black text-sm">{s.value}</div>
            <div className="text-xs opacity-80 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FiClock className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Chưa có đơn hàng hoàn thành</p>
        </div>
      ) : orders.map((order, idx) => (
        <motion.div key={order._id}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-bold text-gray-800 text-sm">#{order._id.slice(-8).toUpperCase()}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <FiClock size={10} />
                {new Date(order.updatedAt || order.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
              <FiCheckCircle size={10} /> Hoàn thành
            </span>
          </div>
          <div className="text-xs text-gray-600 mb-2 flex items-start gap-1.5">
            <FiMapPin size={11} className="text-primary-400 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{order.deliveryAddress}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-50 pt-2">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>🛒 {order.items?.length || 0} món</span>
              <span>{order.paymentMethod === 'cash' ? '💵 COD' : order.paymentMethod === 'momo' ? '💜 MoMo' : '🪙 Xu'}</span>
            </div>
            <span className="text-xs font-bold text-green-600">
              🪙 +{Math.ceil((order.deliveryFee || 15000) * 0.9 / 1000)} Xu
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ===== HỒ SƠ =====
function ShipperProfile({ user }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    vehicleType: user?.vehicleType || 'motorbike',
    vehicleNumber: user?.vehicleNumber || '', avatar: user?.avatar || ''
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Tên không được trống');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id || user.id, ...form })
      });
      const data = await res.json();
      if (res.ok) { dispatch(updateUser(data)); toast.success('Cập nhật thành công! 🎉'); }
      else toast.error(data.message || 'Lỗi cập nhật');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return toast.error('Mật khẩu mới ít nhất 6 ký tự');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Mật khẩu không khớp');
    setPwLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id || user.id, currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) { toast.success('Đổi mật khẩu thành công!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else toast.error(data.message || 'Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="px-4 pb-24 space-y-4 pt-2">
      {/* Avatar + info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative group w-20 h-20 shrink-0">
            {form.avatar
              ? <img src={form.avatar} alt="avatar" className="w-full h-full rounded-2xl object-cover ring-4 ring-primary-100 shadow-md" />
              : <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-3xl text-white shadow-md">🛵</div>}
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl bg-black/40">
              <FiCamera className="text-white text-xl" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <div className="font-black text-gray-800 text-lg">{user?.name}</div>
            <div className="text-sm text-gray-400">🛵 Tài xế FoodServe</div>
            <div className="flex gap-2 mt-1.5">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">⭐ {user?.shipperRating || 0}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">📦 {user?.totalDeliveries || 0} đơn</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">🪙 {user?.coins || 0}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Họ và tên</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Số điện thoại</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-primary-400 outline-none text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Phương tiện</label>
            <div className="grid grid-cols-3 gap-2">
              {[['motorbike','🏍️','Xe máy'],['bike','🚲','Xe đạp'],['car','🚗','Ô tô']].map(([v,e,l]) => (
                <button key={v} type="button" onClick={() => setForm(p => ({ ...p, vehicleType: v }))}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.vehicleType === v ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-500'}`}>
                  {e} {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Biển số xe</label>
            <input type="text" value={form.vehicleNumber} onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-primary-400 outline-none text-sm font-mono uppercase tracking-widest" placeholder="51G-123.45" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            <FiSave size={16} /> {loading ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>

      {/* Đổi mật khẩu */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FiLock className="text-primary-500" /> Đổi mật khẩu</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { key: 'currentPassword', label: 'Mật khẩu hiện tại', show: showPw.current, toggle: () => setShowPw(p => ({ ...p, current: !p.current })) },
            { key: 'newPassword', label: 'Mật khẩu mới', show: showPw.new, toggle: () => setShowPw(p => ({ ...p, new: !p.new })) },
            { key: 'confirmPassword', label: 'Xác nhận mật khẩu', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type={f.show ? 'text' : 'password'} value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-primary-400 outline-none text-sm" placeholder="••••••" />
                <button type="button" onClick={f.toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {f.show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>
          ))}
          {pwForm.newPassword && (
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${pwForm.newPassword.length >= i*3 ? i<=2?'bg-red-400':i===3?'bg-yellow-400':'bg-green-400' : 'bg-gray-200'}`} />
              ))}
            </div>
          )}
          <button type="submit" disabled={pwLoading}
            className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            <FiLock size={16} /> {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN =====
export default function ShipperDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const [activeTab, setActiveTab] = useState('home');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [position, setPosition] = useState([10.7769, 106.7009]); // Default HCM
  const [stats, setStats] = useState({ total: 0, earnings: 0, rating: 0 });
  const [todayOrders, setTodayOrders] = useState(0);
  const [showOnlineConfirm, setShowOnlineConfirm] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    if (!user?.isShipper && user?.role !== 'shipper' && user?.role !== 'admin') {
      navigate('/driver-register'); return;
    }
    fetchStats();
    // Lấy vị trí GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      }, () => {}, { enableHighAccuracy: true });
    }
  }, [user, isAuthenticated]);

  // Watch GPS khi online
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(pos => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      }, () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
    } else if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isOnline]);

  const fetchStats = async () => {
    try {
      const id = user?._id || user?.id;
      if (!id) return;
      const res = await fetch(`http://localhost:5000/api/orders?shipperId=${id}`);
      if (res.ok) {
        const data = await res.json();
        const completed = data.filter(o => o.status === 'completed');
        const today = completed.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
        const totalEarnings = completed.reduce((s, o) => s + Math.ceil((o.deliveryFee || 15000) * 0.9 / 1000), 0);
        setStats({ total: completed.length, earnings: totalEarnings, rating: user?.shipperRating || 0 });
        setTodayOrders(today.length);
      }
    } catch {}
  };

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    setShowOnlineConfirm(false);
    toast.success(newStatus ? '🟢 Bạn đang Online!' : '🔴 Bạn đã Offline', { duration: 2000 });
    try {
      await fetch(`http://localhost:5000/api/auth/users/${user?._id || user?.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus })
      });
    } catch {}
  };

  const tabs = [
    { id: 'home', label: 'Trang chủ', icon: FiHome },
    { id: 'available', label: 'Đơn hàng', icon: FiPackage },
    { id: 'active', label: 'Đang giao', icon: FiTruck },
    { id: 'history', label: 'Lịch sử', icon: FiClock },
    { id: 'profile', label: 'Tôi', icon: FiUser },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-300 flex flex-col max-w-2xl mx-auto relative">

      {/* ===== TAB: HOME — BẢN ĐỒ ===== */}
      {activeTab === 'home' && (
        <div className="flex flex-col h-screen">
          {/* Header nổi trên bản đồ */}
          <div className="absolute top-0 left-0 right-0 z-[999] max-w-2xl mx-auto">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🛵</span>}
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{user?.name}</div>
                  <div className="text-white/70 text-xs flex items-center gap-1">
                    <span>⭐ {user?.shipperRating || 0}</span>
                    <span>•</span>
                    <span>🪙 {user?.coins || 0} Xu</span>
                  </div>
                </div>
              </div>
              {/* Nút Online/Offline */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowOnlineConfirm(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm shadow-lg transition-all ${
                  isOnline
                    ? 'bg-green-500 text-white shadow-green-500/40'
                    : 'bg-white/90 backdrop-blur-sm text-gray-700'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </motion.button>
            </div>
          </div>

          {/* BẢN ĐỒ LEAFLET - Full screen */}
          <div className="flex-1 relative">
            <MapContainer
              center={position}
              zoom={15}
              className="w-full h-full"
              zoomControl={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController position={position} />

              {/* Vị trí shipper */}
              <Marker position={position} icon={shipperIcon}>
                <Popup>
                  <div className="text-center font-bold text-sm p-1">
                    🛵 Vị trí của bạn
                    <br /><span className="text-xs text-gray-500 font-normal">
                      {isOnline ? '🟢 Đang online' : '🔴 Offline'}
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* Vùng phủ sóng khi online */}
              {isOnline && (
                <Circle
                  center={position}
                  radius={500}
                  pathOptions={{ color: '#ff6b35', fillColor: '#ff6b35', fillOpacity: 0.08, weight: 1.5 }}
                />
              )}
            </MapContainer>

            {/* Nút định vị lại */}
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(pos => setPosition([pos.coords.latitude, pos.coords.longitude]));
                }
              }}
              className="absolute bottom-48 right-4 z-[500] w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <FiNavigation className="text-primary-500 text-xl" />
            </button>
          </div>

          {/* Bottom Panel — Stats & Quick actions */}
          <div className="absolute bottom-16 left-0 right-0 max-w-2xl mx-auto px-4 z-[500]">
            <div className="bg-white rounded-3xl shadow-2xl p-4">
              {/* Status bar */}
              <div className={`flex items-center gap-3 p-3 rounded-2xl mb-3 ${isOnline ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div className="flex-1">
                  <div className={`font-bold text-sm ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
                    {isOnline ? '🟢 Đang nhận đơn hàng' : '🔴 Bạn đang Offline'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {isOnline ? 'Đơn mới sẽ xuất hiện ngay lập tức' : 'Bật Online để bắt đầu nhận đơn'}
                  </div>
                </div>
                {!isOnline && (
                  <button onClick={() => setShowOnlineConfirm(true)}
                    className="px-3 py-1.5 bg-primary-500 text-white text-xs font-bold rounded-xl">
                    Bật Online
                  </button>
                )}
              </div>

              {/* Stats hôm nay */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Hôm nay', value: todayOrders, icon: '📦', sub: 'đơn' },
                  { label: 'Tổng đơn', value: stats.total, icon: '✅', sub: 'đơn' },
                  { label: 'Xu tích', value: stats.earnings, icon: '🪙', sub: 'xu' },
                  { label: 'Rating', value: stats.rating > 0 ? `${stats.rating}⭐` : '—', icon: '⭐', sub: '' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-lg mb-0.5">{s.icon}</div>
                    <div className="font-black text-gray-800 text-sm">{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CÁC TAB KHÁC ===== */}
      {activeTab !== 'home' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 pt-12 pb-5 safe-top">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🛵</span>}
                </div>
                <div>
                  <div className="font-bold">{user?.name}</div>
                  <div className="text-white/70 text-xs">{user?.email}</div>
                </div>
              </div>
              {/* Toggle online */}
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowOnlineConfirm(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl font-bold text-sm ${
                  isOnline ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white/20'
                }`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </motion.button>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tổng đơn', value: stats.total, icon: FiPackage },
                { label: 'Xu kiếm', value: `🪙 ${stats.earnings}`, icon: FiDollarSign },
                { label: 'Đánh giá', value: stats.rating > 0 ? `⭐ ${stats.rating}` : '—', icon: FiStar },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <s.icon size={15} />
                  </div>
                  <div>
                    <div className="text-white/70 text-[10px]">{s.label}</div>
                    <div className="font-bold text-sm leading-tight">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-300">
            {activeTab === 'available' && (
              <div className="p-4">
                <AvailableOrders
                  shipperId={user?._id || user?.id}
                  onOrderAccepted={() => setActiveTab('active')}
                  isOnline={isOnline}
                />
              </div>
            )}
            {activeTab === 'active' && (
              <div className="p-4">
                <ActiveDelivery
                  shipperId={user?._id || user?.id}
                  onDeliveryCompleted={() => { setActiveTab('available'); fetchStats(); }}
                  onOrderChange={id => setActiveOrderId(id)}
                />
              </div>
            )}
            {activeTab === 'history' && <ShipperHistory shipperId={user?._id || user?.id} />}
            {activeTab === 'profile' && <ShipperProfile user={user} />}
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAV ===== */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[600] bg-white border-t border-gray-200 safe-bottom shadow-2xl">
        <div className="grid grid-cols-5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2.5 px-1 transition-all relative ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />}
                <Icon size={22} className={`mb-0.5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== CONFIRM TOGGLE ONLINE ===== */}
      <AnimatePresence>
        {showOnlineConfirm && (
          <div className="fixed inset-0 z-[999] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOnlineConfirm(false)} />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-center mb-5">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 ${isOnline ? 'bg-red-100' : 'bg-green-100'}`}>
                  {isOnline ? '🔴' : '🟢'}
                </div>
                <h3 className="text-xl font-black text-gray-800">
                  {isOnline ? 'Chuyển sang Offline?' : 'Bắt đầu nhận đơn?'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {isOnline
                    ? 'Bạn sẽ không nhận được đơn hàng mới khi offline.'
                    : 'Bật Online để bắt đầu nhận đơn hàng ngay lập tức.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowOnlineConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                  Huỷ
                </button>
                <button onClick={handleToggleOnline}
                  className={`flex-1 py-3 rounded-2xl font-bold text-white ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} transition-colors`}>
                  {isOnline ? '🔴 Offline' : '🟢 Online'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat button khi đang giao */}
      {activeTab === 'active' && activeOrderId && <ChatButton orderId={activeOrderId} />}
    </div>
  );
}
