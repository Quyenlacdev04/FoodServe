import { API_BASE_URL, SOCKET_URL } from '../config/api.js'
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiPackage, FiTruck, FiDollarSign, FiStar, FiUser,
  FiPhone, FiCamera, FiSave, FiLock, FiEye, FiEyeOff, FiClock,
  FiCheckCircle, FiMapPin, FiNavigation, FiChevronDown, FiChevronUp,
  FiAward, FiGift, FiChevronLeft, FiChevronRight, FiX, FiZap, FiBell
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
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

const shipperIcon = L.divIcon({
  html: `<div style="background:#ff6b35;width:44px;height:44px;border-radius:50%;border:3px solid white;box-shadow:0 4px 15px rgba(255,107,53,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;">🛵</div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// ===== RANKS CONFIG =====
const RANKS = [
  { name: 'Mới vào',    icon: '🆕', min: 0,   max: 9,        multiplier: 1,   color: 'gray',   bonus: 0   },
  { name: 'Đồng',       icon: '🥉', min: 10,  max: 29,       multiplier: 1.2, color: 'orange', bonus: 50  },
  { name: 'Bạc',        icon: '🥈', min: 30,  max: 59,       multiplier: 1.5, color: 'blue',   bonus: 150 },
  { name: 'Vàng',       icon: '🥇', min: 60,  max: 99,       multiplier: 2,   color: 'yellow', bonus: 300 },
  { name: 'Kim Cương',  icon: '💎', min: 100, max: Infinity, multiplier: 3,   color: 'purple', bonus: 500 },
];

const RANK_COLOR_MAP = {
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600',   bar: 'bg-gray-400',   border: 'border-gray-300'   },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-400', border: 'border-orange-300' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-600',   bar: 'bg-blue-500',   border: 'border-blue-300'   },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', bar: 'bg-yellow-400', border: 'border-yellow-300' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500', border: 'border-purple-300' },
};

function getRank(totalDeliveries) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalDeliveries >= RANKS[i].min) return { rank: RANKS[i], index: i };
  }
  return { rank: RANKS[0], index: 0 };
}

// ===== MAP CONTROLLER =====
function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.5 });
  }, [position]);
  return null;
}

// ===== COLLAPSIBLE SECTION =====
function CollapsibleSection({ title, icon, defaultOpen = false, children, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${accent || 'border-gray-100'} overflow-hidden`}>
      <button type="button" onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">{icon} {title}</div>
        {open ? <FiChevronUp className="text-gray-400" size={16} /> : <FiChevronDown className="text-gray-400" size={16} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="content"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="border-t border-gray-100 px-4 pb-4 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== SHIPPER REWARDS =====
function ShipperRewards({ user }) {
  const dispatch = useDispatch();
  const totalDeliveries = user?.totalDeliveries || 0;
  const { rank: currentRank, index: rankIndex } = getRank(totalDeliveries);
  const nextRank = rankIndex < RANKS.length - 1 ? RANKS[rankIndex + 1] : null;
  const claimedRanks = user?.claimedRanks || [];
  const [claiming, setClaiming] = useState(null);
  const [milestonePopup, setMilestonePopup] = useState(null);
  const colors = RANK_COLOR_MAP[currentRank.color];
  const progress = nextRank
    ? Math.min(100, ((totalDeliveries - currentRank.min) / (nextRank.min - currentRank.min)) * 100)
    : 100;

  const handleClaimBonus = async (rank) => {
    if (claimedRanks.includes(rank.name)) return;
    setClaiming(rank.name);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/claim-rank-bonus`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?._id || user?.id, rank: rank.name, bonusCoins: rank.bonus }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(updateUser({ coins: data.coins, claimedRanks: data.claimedRanks }));
        setMilestonePopup({ rank, coins: data.coins });
      } else toast.error(data.message || 'Lỗi nhận thưởng');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setClaiming(null); }
  };

  const milestones = RANKS.filter(r => r.bonus > 0);

  return (
    <div className="space-y-4">
      {/* Cấp bậc hiện tại */}
      <div className={`rounded-2xl p-4 ${colors.bg} border ${colors.border}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{currentRank.icon}</span>
          <div className="flex-1">
            <div className={`font-black text-lg ${colors.text}`}>{currentRank.name}</div>
            <div className="text-xs text-gray-500">
              {currentRank.multiplier > 1 ? `Mỗi đơn nhận ${currentRank.multiplier}x xu` : 'Chưa có nhân hệ số xu'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-2xl text-gray-800">{totalDeliveries}</div>
            <div className="text-xs text-gray-500">đơn</div>
          </div>
        </div>
        {nextRank ? (
          <>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{currentRank.name}</span>
              <span>{nextRank.icon} {nextRank.name} ({nextRank.min} đơn)</span>
            </div>
            <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${colors.bar}`} />
            </div>
            <div className="text-center text-xs text-gray-500 mt-1.5">
              Còn <strong className={colors.text}>{nextRank.min - totalDeliveries}</strong> đơn → <strong>{nextRank.icon} {nextRank.name}</strong>
            </div>
          </>
        ) : <div className="text-center text-xs text-purple-600 font-bold mt-1">👑 Cấp bậc cao nhất!</div>}
      </div>

      {/* Tất cả cấp bậc */}
      <div className="space-y-1.5">
        {RANKS.map((r) => {
          const isUnlocked = totalDeliveries >= r.min;
          const isCurrent = currentRank.name === r.name;
          const c = RANK_COLOR_MAP[r.color];
          return (
            <div key={r.name} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
              isCurrent ? `${c.bg} ${c.border}` : 'bg-gray-50 border-transparent'
            }`}>
              <span className={`text-xl ${!isUnlocked ? 'grayscale opacity-40' : ''}`}>{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${isCurrent ? c.text : isUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>{r.name}</div>
                <div className="text-xs text-gray-400">
                  {r.max === Infinity ? `${r.min}+ đơn` : `${r.min}–${r.max} đơn`}
                  {r.multiplier > 1 && ` · ${r.multiplier}x xu`}
                </div>
              </div>
              {isCurrent && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>Hiện tại</span>}
              {!isCurrent && isUnlocked && <FiCheckCircle className="text-green-500 shrink-0" size={15} />}
              {!isUnlocked && <span className="text-xs text-gray-300">🔒</span>}
            </div>
          );
        })}
      </div>

      {/* Milestone bonuses */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thưởng đạt mốc</div>
        <div className="grid grid-cols-2 gap-2">
          {milestones.map((r) => {
            const unlocked = totalDeliveries >= r.min;
            const claimed = claimedRanks.includes(r.name);
            const c = RANK_COLOR_MAP[r.color];
            return (
              <div key={r.name} className={`rounded-xl p-3 border ${
                claimed ? 'bg-gray-50 border-gray-200 opacity-60'
                : unlocked ? `${c.bg} ${c.border}` : 'bg-gray-50 border-dashed border-gray-200'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-lg ${!unlocked ? 'grayscale opacity-40' : ''}`}>{r.icon}</span>
                  <span className={`text-xs font-bold ${unlocked ? c.text : 'text-gray-400'}`}>{r.name}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">🪙 +{r.bonus} Xu</div>
                {claimed ? (
                  <span className="text-xs text-green-600 font-bold flex items-center gap-1"><FiCheckCircle size={11} />Đã nhận</span>
                ) : unlocked ? (
                  <button onClick={() => handleClaimBonus(r)} disabled={claiming === r.name}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg text-white ${c.bar} hover:opacity-90 disabled:opacity-50`}>
                    {claiming === r.name ? '...' : '🎁 Nhận thưởng'}
                  </button>
                ) : (
                  <div className="text-xs text-gray-400">Cần {r.min} đơn</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup chúc mừng */}
      <AnimatePresence>
        {milestonePopup && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMilestonePopup(null)} />
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }} transition={{ type: 'spring', damping: 15 }}
              className="relative bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl">
              <div className="text-6xl mb-3">{milestonePopup.rank.icon}</div>
              <h3 className="text-xl font-black text-gray-800 mb-1">Chúc mừng! 🎉</h3>
              <p className="text-gray-600 text-sm mb-3">Đạt cấp <strong>{milestonePopup.rank.name}</strong></p>
              <div className="text-4xl font-black text-yellow-500 mb-1">🪙 +{milestonePopup.rank.bonus}</div>
              <div className="text-sm text-gray-400 mb-4">Xu đã cộng vào tài khoản</div>
              <div className="text-sm text-gray-500 mb-4">Số Xu hiện: <strong className="text-gray-800">{milestonePopup.coins}</strong> 🪙</div>
              <button onClick={() => setMilestonePopup(null)}
                className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl">Tuyệt vời! 🚀</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== LỊCH SỬ =====
function ShipperHistory({ shipperId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalEarnings: 0, totalRevenue: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders?shipperId=${shipperId}`);
        const data = await res.json();
        const completed = data.filter(o => o.status === 'completed');
        setOrders(completed);
        setStats({
          total: completed.length,
          totalEarnings: completed.reduce((s, o) => s + Math.ceil((o.deliveryFee || 15000) * 0.9 / 1000), 0),
          totalRevenue: completed.reduce((s, o) => s + (o.deliveryFee || 15000), 0),
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [shipperId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" /></div>;

  return (
    <div className="px-4 pb-24 space-y-4">
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
        <div className="text-center py-20"><FiClock className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Chưa có đơn hoàn thành</p></div>
      ) : orders.map((order, idx) => (
        <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-bold text-gray-800 text-sm">#{order._id.slice(-8).toUpperCase()}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <FiClock size={10} />{new Date(order.updatedAt || order.createdAt).toLocaleString('vi-VN')}
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
            <span className="text-xs font-bold text-green-600">🪙 +{Math.ceil((order.deliveryFee || 15000) * 0.9 / 1000)} Xu</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ===== HỒ SƠ — Kiểu TADA Shipper =====
function ShipperProfile({ user, onNavigate }) {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState(null); // null | 'edit' | 'password' | 'rank' | 'missions' | 'faq' | 'support'
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    vehicleType: user?.vehicleType || 'motorbike',
    vehicleNumber: user?.vehicleNumber || '', avatar: user?.avatar || ''
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const { rank: currentRank } = getRank(user?.totalDeliveries || 0);
  const colors = RANK_COLOR_MAP[currentRank.color];

  // Tính AR% (Acceptance Rate) dựa trên totalDeliveries / (totalDeliveries + 2)
  const ar = user?.totalDeliveries > 0 ? Math.min(100, Math.round((user.totalDeliveries / (user.totalDeliveries + 1)) * 100)) : 0;
  const coinsToVnd = (user?.coins || 0) * 1000;

  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault(); if (!form.name) return toast.error('Tên không được trống');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id || user.id, ...form })
      });
      const data = await res.json();
      if (res.ok) { dispatch(updateUser(data)); toast.success('Cập nhật thành công! 🎉'); setActiveSection(null); }
      else toast.error(data.message || 'Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return toast.error('Ít nhất 6 ký tự');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Không khớp');
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id || user.id, currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) { toast.success('Đổi thành công!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setActiveSection(null); }
      else toast.error(data.message || 'Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setPwLoading(false); }
  };

  // ===== SUB-SCREENS =====
  if (activeSection === 'edit') {
    return (
      <div className="pb-24">
        <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-xl hover:bg-gray-100">
            <FiChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="font-bold text-gray-800">Chỉnh sửa thông tin</h2>
        </div>
        <div className="px-4 pt-4">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative group w-24 h-24">
              {form.avatar
                ? <img src={form.avatar} alt="avatar" className="w-full h-full rounded-full object-cover ring-4 ring-primary-100 shadow-lg" />
                : <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-4xl text-white shadow-lg">🛵</div>}
              <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full bg-black/40">
                <FiCamera className="text-white text-xl" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { key: 'name', label: 'Họ và tên', type: 'text', placeholder: 'Nhập họ tên' },
              { key: 'phone', label: 'Số điện thoại', type: 'tel', placeholder: '0987654321' },
            ].map(f => (
              <div key={f.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full text-gray-800 text-base font-medium outline-none bg-transparent" />
              </div>
            ))}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Phương tiện</label>
              <div className="grid grid-cols-3 gap-2">
                {[['motorbike','🏍️','Xe máy'],['bike','🚲','Xe đạp'],['car','🚗','Ô tô']].map(([v,e,l]) => (
                  <button key={v} type="button" onClick={() => setForm(p => ({ ...p, vehicleType: v }))}
                    className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.vehicleType === v ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-500'}`}>
                    {e} {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Biển số xe</label>
              <input type="text" value={form.vehicleNumber} onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
                placeholder="51G-123.45"
                className="w-full text-gray-800 text-base font-mono font-medium outline-none bg-transparent uppercase tracking-widest" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-primary-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
              <FiSave size={16} /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeSection === 'password') {
    return (
      <div className="pb-24">
        <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-xl hover:bg-gray-100"><FiChevronLeft size={20} className="text-gray-600" /></button>
          <h2 className="font-bold text-gray-800">Đổi mật khẩu</h2>
        </div>
        <div className="px-4 pt-4">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Mật khẩu hiện tại', show: showPw.current, toggle: () => setShowPw(p => ({ ...p, current: !p.current })) },
              { key: 'newPassword', label: 'Mật khẩu mới', show: showPw.new, toggle: () => setShowPw(p => ({ ...p, new: !p.new })) },
              { key: 'confirmPassword', label: 'Xác nhận mật khẩu', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
            ].map(f => (
              <div key={f.key} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">{f.label}</label>
                <div className="flex items-center gap-2">
                  <FiLock size={15} className="text-gray-400 shrink-0" />
                  <input type={f.show ? 'text' : 'password'} value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="flex-1 text-gray-800 text-base outline-none bg-transparent" placeholder="••••••" />
                  <button type="button" onClick={f.toggle} className="text-gray-400">
                    {f.show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            {pwForm.newPassword && (
              <div className="flex gap-1.5 px-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${pwForm.newPassword.length >= i*3 ? i<=2?'bg-red-400':i===3?'bg-yellow-400':'bg-green-400' : 'bg-gray-200'}`} />
                ))}
              </div>
            )}
            <button type="submit" disabled={pwLoading}
              className="w-full py-3.5 bg-gray-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
              <FiLock size={16} /> {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeSection === 'rank') {
    return (
      <div className="pb-24">
        <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-xl hover:bg-gray-100"><FiChevronLeft size={20} className="text-gray-600" /></button>
          <h2 className="font-bold text-gray-800">Cấp bậc & Thưởng</h2>
        </div>
        <div className="px-4 pt-4"><ShipperRewards user={user} /></div>
      </div>
    );
  }

  if (activeSection === 'missions') {
    const missions = [
      { id: 1, title: 'Hoàn thành 3 đơn hàng', desc: 'Hôm nay', reward: 30, current: Math.min(3, user?.totalDeliveries || 0), total: 3, icon: '📦' },
      { id: 2, title: 'Duy trì rating ≥ 4.5 ⭐', desc: 'Tuần này', reward: 100, current: (user?.shipperRating || 0) >= 4.5 ? 1 : 0, total: 1, icon: '⭐' },
      { id: 3, title: 'Online ≥ 4 tiếng', desc: 'Hôm nay', reward: 50, current: 0, total: 1, icon: '🟢' },
      { id: 4, title: 'Giao 10 đơn trong tuần', desc: 'Tuần này', reward: 200, current: Math.min(10, user?.totalDeliveries || 0), total: 10, icon: '🏆' },
    ];
    return (
      <div className="pb-24">
        <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-xl hover:bg-gray-100"><FiChevronLeft size={20} className="text-gray-600" /></button>
          <h2 className="font-bold text-gray-800">Nhiệm vụ tài xế</h2>
        </div>
        <div className="px-4 pt-4 space-y-3">
          {missions.map(m => {
            const done = m.current >= m.total;
            const pct = Math.min(100, (m.current / m.total) * 100);
            return (
              <div key={m.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${done ? 'border-green-200' : 'border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${done ? 'bg-green-100' : 'bg-gray-100'}`}>{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className={`font-bold text-sm ${done ? 'text-green-700' : 'text-gray-800'}`}>{m.title}</div>
                      <div className="text-xs text-yellow-600 font-bold shrink-0 ml-2">🪙 +{m.reward}</div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{m.desc} · {m.current}/{m.total}</div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {done && <FiCheckCircle className="text-green-500 shrink-0 mt-1" size={18} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeSection === 'faq') {
    const faqs = [
      { q: 'Khi nào được cộng xu?', a: 'Xu được cộng ngay khi bạn hoàn thành giao hàng. 1.000đ phí ship = 1 Xu (tài xế nhận 90%).' },
      { q: 'Cách tăng cấp bậc?', a: 'Hoàn thành đủ số đơn theo từng mốc: Đồng 10đơn, Bạc 30đơn, Vàng 60đơn, Kim Cương 100đơn.' },
      { q: 'Xu dùng để làm gì?', a: 'Xu có thể dùng để đặt hàng trên FoodServe (1 Xu = 1.000đ) hoặc tích lũy tham gia bảng xếp hạng.' },
      { q: 'Làm sao tăng rating?', a: 'Giao hàng đúng giờ, thái độ tốt với khách, chú ý ghi chú đơn hàng để được đánh giá cao.' },
      { q: 'Đơn bị hủy có ảnh hưởng không?', a: 'Không ảnh hưởng rating nhưng ảnh hưởng tỷ lệ chấp nhận (AR%). Hãy nhận đơn khi chắc chắn.' },
    ];
    return (
      <div className="pb-24">
        <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-xl hover:bg-gray-100"><FiChevronLeft size={20} className="text-gray-600" /></button>
          <h2 className="font-bold text-gray-800">Câu hỏi thường gặp</h2>
        </div>
        <div className="px-4 pt-4 space-y-3">
          {faqs.map((f, i) => (
            <CollapsibleSection key={i} title={f.q} icon="❓">
              <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </CollapsibleSection>
          ))}
        </div>
      </div>
    );
  }

  if (activeSection === 'support') {
    return (
      <div className="pb-24">
        <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-xl hover:bg-gray-100"><FiChevronLeft size={20} className="text-gray-600" /></button>
          <h2 className="font-bold text-gray-800">Đội hỗ trợ FoodServe</h2>
        </div>
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-gradient-to-br from-primary-500 to-orange-400 rounded-3xl p-6 text-white text-center">
            <div className="text-4xl mb-3">🎧</div>
            <h3 className="font-black text-xl mb-1">Hỗ trợ 24/7</h3>
            <p className="text-white/80 text-sm">Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn</p>
          </div>
          {[
            { icon: '📞', title: 'Hotline', desc: '1900 xxxx', sub: 'Miễn phí · 24/7', color: 'bg-green-50 text-green-600', action: () => toast.success('Gọi: 1900 xxxx') },
            { icon: '💬', title: 'Chat hỗ trợ', desc: 'Phản hồi trong 5 phút', sub: 'Online ngay', color: 'bg-blue-50 text-blue-600', action: () => toast('Tính năng đang phát triển') },
            { icon: '📧', title: 'Email', desc: 'support@foodserve.vn', sub: 'Phản hồi trong 24h', color: 'bg-purple-50 text-purple-600', action: () => toast.success('Email: support@foodserve.vn') },
          ].map((s, i) => (
            <button key={i} onClick={s.action}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left">
              <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center text-2xl shrink-0`}>{s.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">{s.title}</div>
                <div className="text-sm text-gray-600">{s.desc}</div>
                <div className="text-xs text-gray-400">{s.sub}</div>
              </div>
              <FiChevronRight className="text-gray-300" size={18} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===== MAIN PROFILE SCREEN =====
  return (
    <div className="pb-24 bg-gray-50">
      {/* Header profile */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative group w-16 h-16 shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover ring-2 ring-gray-100 shadow" />
              : <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-3xl text-white shadow">🛵</div>}
            <button onClick={() => setActiveSection('edit')}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow border-2 border-white">
              <FiCamera size={11} className="text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-lg uppercase leading-tight">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-500 font-bold text-sm flex items-center gap-0.5">⭐ {user?.shipperRating || 0}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ar >= 80 ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'}`}>
                AR {ar}%
              </span>
              <span className="text-xs text-gray-400">{currentRank.icon} {currentRank.name}</span>
            </div>
          </div>
          <button onClick={() => setActiveSection('edit')}
            className="px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200">
            Sửa
          </button>
        </div>
      </div>

      {/* Số dư */}
      <button onClick={() => toast('Xu = ' + (user?.coins || 0) + ' · ' + (coinsToVnd).toLocaleString('vi-VN') + ' VND')}
        className="mx-4 mt-4 w-[calc(100%-2rem)] bg-yellow-400 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-lg shadow-yellow-200">
        <span className="font-black text-gray-900 text-base">Số dư</span>
        <div className="flex items-center gap-2">
          <span className="font-black text-gray-900 text-base">{coinsToVnd.toLocaleString('vi-VN')} VND</span>
          <FiChevronRight className="text-gray-700" size={18} />
        </div>
      </button>

      {/* Menu items */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {[
          { icon: '📋', iconBg: 'bg-blue-100', label: 'Lịch sử chuyến xe', badge: null, action: () => onNavigate?.('history') },
          { icon: '🎯', iconBg: 'bg-orange-100', label: 'Nhiệm vụ tài xế', badge: 'N', action: () => setActiveSection('missions') },
          { icon: '🏆', iconBg: 'bg-purple-100', label: 'Cấp bậc & Thưởng', badge: null, action: () => setActiveSection('rank') },
          { icon: '⚙️', iconBg: 'bg-gray-100', label: 'Cài đặt', badge: null, action: () => setActiveSection('edit') },
          { icon: '🔒', iconBg: 'bg-gray-100', label: 'Đổi mật khẩu', badge: null, action: () => setActiveSection('password') },
          { icon: '❓', iconBg: 'bg-blue-100', label: 'Câu hỏi thường gặp', badge: null, action: () => setActiveSection('faq') },
          { icon: '🎧', iconBg: 'bg-green-100', label: 'Đội hỗ trợ FoodServe', badge: null, action: () => setActiveSection('support') },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
            <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center text-lg shrink-0`}>{item.icon}</div>
            <span className="flex-1 font-medium text-gray-800 text-sm">{item.label}</span>
            {item.badge && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{item.badge}</span>
            )}
            <FiChevronRight className="text-gray-300" size={16} />
          </button>
        ))}
      </div>

      {/* Thông tin xe */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">
          {user?.vehicleType === 'car' ? '🚗' : user?.vehicleType === 'bike' ? '🚲' : '🏍️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-gray-800 text-base font-mono">{user?.vehicleNumber || 'Chưa có biển số'}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {user?.vehicleType === 'motorbike' ? 'Xe máy' : user?.vehicleType === 'car' ? 'Ô tô' : user?.vehicleType === 'bike' ? 'Xe đạp' : '—'}
          </div>
          <div className="text-xs text-gray-400">FoodServe Shipper</div>
        </div>
        <button onClick={() => setActiveSection('edit')} className="text-xs text-primary-500 font-semibold">Sửa</button>
      </div>

      {/* Version */}
      <div className="text-center mt-6 text-xs text-gray-400">FoodServe Shipper v1.0.0</div>
    </div>
  );
}

// ===== INCOMING ORDER POPUP (Hiển thị trên bản đồ) =====
const ORDER_POPUP_TIMEOUT = 120; // 2 phút

function IncomingOrderPopup({ order, onAccept, onReject, accepting }) {
  const [timeLeft, setTimeLeft] = useState(ORDER_POPUP_TIMEOUT);

  useEffect(() => {
    if (timeLeft <= 0) { onReject(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const pct = (timeLeft / ORDER_POPUP_TIMEOUT) * 100;
  const isUrgent = timeLeft <= 30;
  const isWarning = timeLeft <= 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 300, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 300, scale: 0.8 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] w-[94vw] max-w-md"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-primary-500 overflow-hidden" style={{ boxShadow: '0 -8px 60px rgba(255,107,53,0.3), 0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Thanh đếm ngược trên cùng */}
        <div className="h-1.5 bg-gray-100">
          <motion.div
            className={`h-full ${isUrgent ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-primary-500'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-orange-400 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div animate={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.5 }}>
              <FiBell className="text-white text-xl" />
            </motion.div>
            <div>
              <div className="text-white font-bold text-sm">🛒 Đơn hàng mới!</div>
              <div className="text-white/70 text-[10px]">Có người đặt hàng gần bạn</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-black px-2 py-1 rounded-lg ${isUrgent ? 'bg-red-500/30 text-red-100' : 'bg-white/20 text-white/90'}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
            <button onClick={onReject} className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Mã đơn & Giá */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Mã đơn</div>
              <div className="font-mono font-black text-gray-800 text-sm">#{String(order._id || '').slice(-8).toUpperCase()}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-primary-600">{formatPrice(order.finalAmount || 0)}</div>
              <div className="text-xs font-bold text-green-600">🪙 +{Math.ceil((order.deliveryFee || 15000) * 0.9 / 1000)} Xu</div>
            </div>
          </div>

          {/* Món ăn */}
          {order.items?.length > 0 && (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="text-xs font-bold text-gray-500 mb-1">🍽️ {order.items.length} món</div>
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="text-xs text-gray-600 py-0.5">• {item.quantity}x {item.name} — {formatPrice(item.price * item.quantity)}</div>
              ))}
              {order.items.length > 3 && <div className="text-xs text-gray-400 mt-0.5">+{order.items.length - 3} món khác</div>}
            </div>
          )}

          {/* Địa chỉ giao */}
          {order.deliveryAddress && (
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2.5">
              <FiMapPin className="text-blue-500 mt-0.5 shrink-0" size={14} />
              <div>
                <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-0.5">Giao đến</div>
                <div className="text-xs text-blue-700 font-medium leading-relaxed">{order.deliveryAddress}</div>
              </div>
            </div>
          )}

          {/* SĐT + Phương thức thanh toán */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            {order.contactPhone && <span className="flex items-center gap-1">📞 {order.contactPhone}</span>}
            <span className="flex items-center gap-1">
              {order.paymentMethod === 'cash' ? '💵 COD' : order.paymentMethod === 'momo' ? '💜 MoMo' : order.paymentMethod === 'coins' ? '🪙 Xu' : '💳 Online'}
            </span>
          </div>
        </div>

        {/* Nút Chấp nhận / Từ chối */}
        <div className="px-5 pb-4 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onReject}
            className="flex-1 py-3.5 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
          >
            <FiX size={16} />
            Từ chối
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAccept(order._id)}
            disabled={accepting}
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-orange-400 text-white font-bold text-sm hover:shadow-lg hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {accepting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Đang nhận...
              </>
            ) : (
              <>
                <FiZap size={16} />
                Chấp nhận
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
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
  const [position, setPosition] = useState([10.7769, 106.7009]);
  const [stats, setStats] = useState({ total: 0, earnings: 0, rating: 0 });
  const [todayOrders, setTodayOrders] = useState(0);
  const [showOnlineConfirm, setShowOnlineConfirm] = useState(false);
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [acceptingOrder, setAcceptingOrder] = useState(false);
  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    if (!user?.isShipper && user?.role !== 'shipper' && user?.role !== 'admin') { navigate('/driver-register'); return; }
    fetchStats();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => setPosition([pos.coords.latitude, pos.coords.longitude]), () => {}, { enableHighAccuracy: true });
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          
          // Gửi vị trí real-time lên server nếu tài xế đang online
          // Backend sẽ tự động broadcast đến các đơn hàng đang giao của tài xế này
          if (isOnline && user?._id) {
            fetch(`${API_BASE_URL}/api/shipper/update-location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shipperId: user._id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              })
            }).catch(err => console.error('Failed to update location:', err));
          }
        },
        () => {}, { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } else if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isOnline, user]);

  // ===== Socket.io: Lắng nghe đơn hàng mới real-time =====
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('new-order', (order) => {
      if (!isOnline) return;

      // Âm thanh thông báo
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
      } catch {}

      // Hiển thị popup đơn hàng mới
      setIncomingOrder(order);
    });

    return () => {
      socket.disconnect();
    };
  }, [isOnline]);

  // ===== Nhận đơn hàng =====
  const handleAcceptIncomingOrder = useCallback(async (orderId) => {
    setAcceptingOrder(true);
    try {
      const shipperId = user?._id || user?.id;
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/accept-shipper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipperId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Đã nhận đơn hàng thành công!');
        setIncomingOrder(null);
        setActiveTab('active');
        fetchStats();
      } else {
        toast.error(data.message || 'Không thể nhận đơn');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setAcceptingOrder(false);
    }
  }, [user]);

  // ===== Từ chối đơn hàng =====
  const handleRejectIncomingOrder = useCallback(() => {
    setIncomingOrder(null);
    toast('Đã bỏ qua đơn hàng', { icon: '👋', duration: 2000 });
  }, []);

  const fetchStats = async () => {
    try {
      const id = user?._id || user?.id; if (!id) return;
      const res = await fetch(`${API_BASE_URL}/api/orders?shipperId=${id}`);
      if (res.ok) {
        const data = await res.json();
        const completed = data.filter(o => o.status === 'completed');
        const today = completed.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
        setStats({
          total: completed.length,
          earnings: completed.reduce((s, o) => s + Math.ceil((o.deliveryFee || 15000) * 0.9 / 1000), 0),
          rating: user?.shipperRating || 0
        });
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
      await fetch(`${API_BASE_URL}/api/auth/users/${user?._id || user?.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus })
      });
    } catch {}
  };

  const tabs = [
    { id: 'home',      label: 'Trang chủ', icon: FiHome },
    { id: 'available', label: 'Đơn hàng',  icon: FiPackage },
    { id: 'active',    label: 'Đang giao', icon: FiTruck },
    { id: 'history',   label: 'Lịch sử',   icon: FiClock },
    { id: 'profile',   label: 'Tôi',       icon: FiUser },
  ];

  const { rank: currentRank } = getRank(user?.totalDeliveries || 0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-300 flex flex-col max-w-2xl mx-auto relative">

      {/* TAB HOME — BẢN ĐỒ */}
      {activeTab === 'home' && (
        <div className="flex flex-col h-screen">
          {/* Header nổi */}
          <div className="absolute top-0 left-0 right-0 z-[999] max-w-2xl mx-auto">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🛵</span>}
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{user?.name}</div>
                  <div className="text-white/70 text-xs flex items-center gap-1">
                    <span>{currentRank.icon} {currentRank.name}</span>
                    <span>·</span>
                    <span>🪙 {user?.coins || 0}</span>
                  </div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowOnlineConfirm(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm shadow-lg ${
                  isOnline ? 'bg-green-500 text-white shadow-green-500/40' : 'bg-white/90 backdrop-blur-sm text-gray-700'
                }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </motion.button>
            </div>
          </div>

          {/* Bản đồ full */}
          <div className="flex-1 relative">
            <MapContainer center={position} zoom={15} className="w-full h-full" zoomControl={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController position={position} />
              <Marker position={position} icon={shipperIcon}>
                <Popup><div className="text-center font-bold text-sm p-1">🛵 Vị trí của bạn<br /><span className="text-xs text-gray-500 font-normal">{isOnline ? '🟢 Online' : '🔴 Offline'}</span></div></Popup>
              </Marker>
              {isOnline && <Circle center={position} radius={500} pathOptions={{ color: '#ff6b35', fillColor: '#ff6b35', fillOpacity: 0.08, weight: 1.5 }} />}
            </MapContainer>
            <button onClick={() => navigator.geolocation?.getCurrentPosition(p => setPosition([p.coords.latitude, p.coords.longitude]))}
              className="absolute bottom-48 right-4 z-[500] w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50">
              <FiNavigation className="text-primary-500 text-xl" />
            </button>
          </div>

          {/* Popup đơn hàng mới — hiện ngay trên bản đồ */}
          <AnimatePresence>
            {incomingOrder && (
              <IncomingOrderPopup
                order={incomingOrder}
                onAccept={handleAcceptIncomingOrder}
                onReject={handleRejectIncomingOrder}
                accepting={acceptingOrder}
              />
            )}
          </AnimatePresence>

          {/* Bottom Panel */}
          <div className="absolute bottom-16 left-0 right-0 max-w-2xl mx-auto px-4 z-[500]">
            <div className="bg-white rounded-3xl shadow-2xl p-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl mb-2.5 ${isOnline ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div className={`flex-1 font-bold text-xs ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
                  {isOnline ? '🟢 Đang nhận đơn hàng' : '🔴 Bạn đang Offline'}
                </div>
                {!isOnline && (
                  <button onClick={() => setShowOnlineConfirm(true)}
                    className="px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-xl">Bật Online</button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: 'Hôm nay', value: todayOrders, icon: '📦' },
                  { label: 'Tổng đơn', value: stats.total, icon: '✅' },
                  { label: 'Xu tích', value: stats.earnings, icon: '🪙' },
                  { label: 'Cấp bậc', value: currentRank.icon, icon: '' },
                ].map((s, i) => (
                  <div key={i} className="text-center py-1">
                    <div className="text-base mb-0.5">{s.icon}</div>
                    <div className="font-black text-gray-800 text-sm leading-none">{s.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CÁC TAB KHÁC */}
      {activeTab !== 'home' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 pt-12 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center shrink-0">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🛵</span>}
                </div>
                <div>
                  <div className="font-bold text-sm">{user?.name}</div>
                  <div className="text-white/70 text-xs">{currentRank.icon} {currentRank.name}</div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowOnlineConfirm(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold text-xs ${
                  isOnline ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white/20'
                }`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </motion.button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tổng đơn', value: stats.total, icon: FiPackage },
                { label: 'Xu kiếm', value: `🪙 ${stats.earnings}`, icon: FiDollarSign },
                { label: 'Đánh giá', value: stats.rating > 0 ? `⭐ ${stats.rating}` : '—', icon: FiStar },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-2.5 flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0"><s.icon size={13} /></div>
                  <div>
                    <div className="text-white/70 text-[10px]">{s.label}</div>
                    <div className="font-bold text-xs">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-300">
            {activeTab === 'available' && <div className="p-4"><AvailableOrders shipperId={user?._id || user?.id} onOrderAccepted={() => setActiveTab('active')} isOnline={isOnline} shipperLocation={position ? { lat: position[0], lng: position[1] } : null} /></div>}
            {activeTab === 'active' && <div className="p-4"><ActiveDelivery shipperId={user?._id || user?.id} onDeliveryCompleted={() => { setActiveTab('available'); fetchStats(); }} onOrderChange={id => setActiveOrderId(id)} /></div>}
            {activeTab === 'history' && <ShipperHistory shipperId={user?._id || user?.id} />}
            {activeTab === 'profile' && <ShipperProfile user={user} onNavigate={setActiveTab} />}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[600] bg-white border-t border-gray-200 shadow-2xl">
        <div className="grid grid-cols-5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2.5 px-1 relative ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />}
                <Icon size={21} className={`mb-0.5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONFIRM ONLINE */}
      <AnimatePresence>
        {showOnlineConfirm && (
          <div className="fixed inset-0 z-[999] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOnlineConfirm(false)} />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-center mb-5">
                <div className="text-5xl mb-3">{isOnline ? '🔴' : '🟢'}</div>
                <h3 className="text-xl font-black text-gray-800 mb-1">{isOnline ? 'Chuyển sang Offline?' : 'Bắt đầu nhận đơn?'}</h3>
                <p className="text-gray-500 text-sm">{isOnline ? 'Bạn sẽ không nhận được đơn khi offline.' : 'Bạn sẽ nhận thông báo khi có đơn mới gần bạn.'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowOnlineConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm">Huỷ</button>
                <button onClick={handleToggleOnline}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm text-white ${isOnline ? 'bg-red-500' : 'bg-green-500'}`}>
                  {isOnline ? 'Offline ngay' : 'Online ngay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeTab === 'active' && activeOrderId && <ChatButton orderId={activeOrderId} />}
    </div>
  );
}
