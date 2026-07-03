import { API_BASE_URL } from '../config/api.js';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, 
  FiPlay, FiPause, FiTrash2, FiPlus, FiMinus, FiCreditCard, FiArrowLeft, FiShoppingBag 
} from 'react-icons/fi';
import { updateUser } from '../store/slices/authSlice';
import { formatPrice } from '../data/mockData';
import toast from 'react-hot-toast';

export default function MealSubscriptionPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetRestId = searchParams.get('restaurantId');

  const { user, isAuthenticated } = useSelector((s) => s.auth);

  // Lists & data loading states
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Selection state for creating new subscription
  const [activeTab, setActiveTab] = useState('list'); // 'list' (manage) | 'create' (subscribe)
  const [selectedMealItems, setSelectedMealItems] = useState({}); // { itemId: quantity }
  const [planType, setPlanType] = useState('weekly'); // 'weekly' | 'monthly'
  const [deliveryTime, setDeliveryTime] = useState('11:30');

  // Load user subscriptions and active restaurants
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng Đăng ký Gói Ăn!');
      navigate('/');
      return;
    }
    fetchMySubscriptions();
    fetchRestaurants();
  }, [user?._id, isAuthenticated]);

  // Load specific restaurant menu if query param exists
  useEffect(() => {
    if (targetRestId && restaurants.length > 0) {
      const found = restaurants.find(r => r._id === targetRestId || r.id === targetRestId);
      if (found) {
        handleSelectRestaurant(found);
        setActiveTab('create');
      }
    }
  }, [targetRestId, restaurants]);

  const fetchMySubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-subscriptions/user/${user?._id || user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setMySubscriptions(data);
      }
    } catch (err) {
      console.error('Fetch my subscriptions error:', err);
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/restaurants`);
      if (res.ok) {
        const data = await res.json();
        // data could be directly array or inside { restaurants }
        const list = data.restaurants || data;
        setRestaurants(list);
      }
    } catch (err) {
      toast.error('Lỗi tải danh sách nhà hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = async (rest) => {
    setSelectedRest(rest);
    setSelectedMealItems({});
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${rest._id || rest.id}`);
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data.menuItems || []);
      }
    } catch (err) {
      toast.error('Lỗi tải thực đơn cửa hàng');
    }
  };

  // Add/remove item inside custom meal package builder
  const updateMealItemQty = (itemId, delta) => {
    setSelectedMealItems(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return { ...prev, [itemId]: next };
    });
  };

  // Calculations for custom package
  const customMealItemsList = Object.keys(selectedMealItems).map(id => {
    const item = menuItems.find(i => i._id === id || i.id === id);
    return {
      menuItemId: id,
      name: item?.name || 'Món ăn',
      price: item?.price || 0,
      quantity: selectedMealItems[id]
    };
  });

  const mealPrice = customMealItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const days = planType === 'weekly' ? 5 : 20;
  const discountRate = planType === 'weekly' ? 0.10 : 0.20;
  const originalTotalPrice = mealPrice * days;
  const discountAmount = Math.round(originalTotalPrice * discountRate);
  const finalPrice = originalTotalPrice - discountAmount;
  const finalCoins = finalPrice / 1000;

  // Subscribe submit action
  const handleSubscribe = async () => {
    if (customMealItemsList.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 món ăn vào gói!');
      return;
    }

    if (!user.address) {
      toast.error('Vui lòng cập nhật Địa chỉ giao hàng trong Hồ sơ trước khi đăng ký gói ăn!');
      navigate('/profile');
      return;
    }

    setActionLoading('subscribe');
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id || user.id,
          restaurantId: selectedRest._id || selectedRest.id,
          items: customMealItemsList,
          planType,
          deliveryTime
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Đăng ký gói ăn thành công! 🎉 Bữa ăn của bạn đã được lên lịch.', { duration: 5000 });
        
        // Cập nhật lại số dư ví coins cục bộ
        dispatch(updateUser({ coins: data.updatedCoins }));

        // Reset state
        setSelectedMealItems({});
        fetchMySubscriptions();
        setActiveTab('list');
      } else {
        toast.error(data.message || 'Đăng ký thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setActionLoading(null);
    }
  };

  // Pause subscription
  const handlePauseSub = async (subId) => {
    if (!window.confirm('Tạm dừng gói ăn? Hệ thống sẽ ngừng giao đơn tự động cho đến khi bạn bật lại.')) return;
    setActionLoading(subId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-subscriptions/${subId}/pause`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Đã tạm dừng gói ăn!');
        fetchMySubscriptions();
      } else {
        toast.error('Không thể tạm dừng gói ăn');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setActionLoading(null);
    }
  };

  // Resume subscription
  const handleResumeSub = async (subId) => {
    setActionLoading(subId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-subscriptions/${subId}/resume`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Đã kích hoạt lại gói ăn! Món ngon sẽ được giao theo lịch.');
        fetchMySubscriptions();
      } else {
        toast.error('Không thể kích hoạt lại');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel & Refund subscription
  const handleCancelSub = async (sub) => {
    const maxDays = sub.planType === 'weekly' ? 5 : 20;
    const remaining = maxDays - sub.ordersDispatched.length;
    const refundPrice = Math.round((sub.totalPrice / maxDays) * remaining);
    const refundCoins = refundPrice / 1000;

    if (!window.confirm(`Bạn có chắc chắn muốn HỦY gói ăn này không?\nHệ thống sẽ hoàn lại ${refundCoins} Xu (${formatPrice(refundPrice)}) cho ${remaining} bữa chưa giao vào ví của bạn.`)) return;

    setActionLoading(sub._id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/meal-subscriptions/${sub._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { icon: '💸', duration: 4000 });
        dispatch(updateUser({ coins: data.updatedCoins }));
        fetchMySubscriptions();
      } else {
        toast.error(data.message || 'Lỗi khi hủy gói ăn');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-gray-500 dark:text-gray-400">Đang tải cấu hình gói ăn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4 transition-colors duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link to="/profile" className="text-primary-500 hover:underline text-sm flex items-center gap-1 mb-2">
              <FiArrowLeft /> Về trang hồ sơ
            </Link>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              📅 Meal Subscription Planner
            </h1>
            <p className="text-xs text-gray-400">Đăng ký cơm tuần/tháng tự động giao đúng giờ, siêu tiết kiệm</p>
          </div>
          
          {/* Tabs switch */}
          <div className="flex bg-white dark:bg-dark-200 border border-gray-150 dark:border-gray-800 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'list' 
                  ? 'bg-gradient-primary text-white shadow-glow' 
                  : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
              }`}
            >
              💼 Gói ăn của tôi ({mySubscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'create' 
                  ? 'bg-gradient-primary text-white shadow-glow' 
                  : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
              }`}
            >
              ✨ Đăng ký gói mới
            </button>
          </div>
        </div>

        {/* ==================== TAB 1: LISTING & MANAGE ==================== */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {mySubscriptions.length === 0 ? (
              <div className="bg-white dark:bg-dark-200 rounded-3xl p-12 text-center border border-gray-150 dark:border-gray-800 shadow-card">
                <FiCalendar className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bạn chưa đăng ký gói ăn nào</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Lên kế hoạch ăn uống healthy, tiết kiệm thời gian và tiền bạc với các gói cơm tuần/tháng. Đăng ký ngay gói đầu tiên!
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-5 btn-primary text-xs px-5 py-3 rounded-2xl"
                >
                  Khám phá các gói ăn ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mySubscriptions.map((sub) => {
                  const maxDays = sub.planType === 'weekly' ? 5 : 20;
                  const deliveredCount = sub.ordersDispatched?.length || 0;
                  const progressPct = (deliveredCount / maxDays) * 100;
                  
                  // Status text & colors
                  const statusMap = {
                    active: { label: '🟢 Đang giao', bg: 'bg-green-500/10 text-green-600' },
                    paused: { label: '🟡 Đang tạm dừng', bg: 'bg-amber-500/10 text-amber-600' },
                    completed: { label: '🔵 Hoàn thành', bg: 'bg-blue-500/10 text-blue-600' },
                    cancelled: { label: '🔴 Đã hủy', bg: 'bg-gray-500/10 text-gray-500' }
                  };
                  const currentStatus = statusMap[sub.status] || { label: sub.status, bg: 'bg-gray-100' };

                  return (
                    <div 
                      key={sub._id}
                      className="bg-white dark:bg-dark-200 rounded-3xl border border-gray-150 dark:border-gray-800 p-6 shadow-card hover:shadow-glow/5 transition-all space-y-4"
                    >
                      {/* Header with Restaurant details */}
                      <div className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <img 
                          src={sub.restaurantId?.image || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200'} 
                          alt="Restaurant" 
                          className="w-16 h-16 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${currentStatus.bg}`}>
                            {currentStatus.label}
                          </span>
                          <h4 className="font-bold text-gray-900 dark:text-white text-base truncate mt-1">
                            {sub.restaurantId?.name || 'Nhà hàng đối tác'}
                          </h4>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <FiClock /> Hẹn giao hàng: <b>{sub.deliveryTime}</b> (T2 - T6)
                          </p>
                        </div>
                      </div>

                      {/* Items lists */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Thực đơn hàng ngày:</span>
                        <div className="space-y-1">
                          {sub.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-semibold text-gray-650 dark:text-gray-300">
                              <span>• {it.name}</span>
                              <span>x{it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Progress bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                          <span>Tiến độ giao hàng:</span>
                          <span>Đã giao <b>{deliveredCount} / {maxDays} ngày</b></span>
                        </div>
                        <div className="w-full h-2 bg-gray-150 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-primary rounded-full transition-all duration-500" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Dispatches Dates tags */}
                      {sub.ordersDispatched?.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Nhật ký giao đơn:</span>
                          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto no-scrollbar">
                            {sub.ordersDispatched.map((d, i) => (
                              <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-100 text-gray-500 font-mono font-bold">
                                {d.date} (OK)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary details */}
                      <div className="bg-gray-50 dark:bg-dark-100/50 p-3 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-gray-400 font-medium block">Tổng gói ăn</span>
                          <span className="font-bold text-gray-800 dark:text-white font-sans">{formatPrice(sub.totalPrice)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 font-medium block">Loại gói</span>
                          <span className="font-bold text-primary-500 uppercase">{sub.planType === 'weekly' ? 'Tuần (5 bữa)' : 'Tháng (20 bữa)'}</span>
                        </div>
                      </div>

                      {/* Management control actions */}
                      {sub.status !== 'completed' && sub.status !== 'cancelled' && (
                        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          {sub.status === 'active' ? (
                            <button
                              onClick={() => handlePauseSub(sub._id)}
                              disabled={actionLoading !== null}
                              className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                            >
                              <FiPause size={13} /> Tạm dừng giao
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResumeSub(sub._id)}
                              disabled={actionLoading !== null}
                              className="flex-1 py-2.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                            >
                              <FiPlay size={13} /> Kích hoạt lại
                            </button>
                          )}

                          <button
                            onClick={() => handleCancelSub(sub)}
                            disabled={actionLoading !== null}
                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                            title="Hủy gói ăn & Hoàn tiền còn lại"
                          >
                            <FiTrash2 size={13} /> Hủy & Hoàn Xu
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: CREATE NEW SUBSCRIPTION ==================== */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left/Middle block: Selection of Restaurant & Custom Package Builder */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Step 1: Select Restaurant */}
              <div className="bg-white dark:bg-dark-200 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-xs">1</span>
                  Chọn nhà hàng đối tác
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto no-scrollbar pt-1">
                  {restaurants.map((rest) => {
                    const isSelected = selectedRest?._id === rest._id || selectedRest?.id === rest.id;
                    return (
                      <div
                        key={rest._id || rest.id}
                        onClick={() => handleSelectRestaurant(rest)}
                        className={`p-3 rounded-2xl border flex gap-3 items-center cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/5 shadow-sm'
                            : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-100'
                        }`}
                      >
                        <img 
                          src={rest.image} 
                          alt={rest.name} 
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-gray-900 dark:text-white truncate">{rest.name}</h5>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{rest.address}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Build Custom Meal Package */}
              {selectedRest && (
                <div className="bg-white dark:bg-dark-200 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-xs">2</span>
                    Thiết kế thực đơn hàng ngày của bạn
                  </h3>
                  <p className="text-xs text-gray-400">Những món ăn bạn chọn dưới đây sẽ được đóng gói và giao tự động đến bạn mỗi ngày.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {menuItems.map((item) => {
                      const qty = selectedMealItems[item._id || item.id] || 0;
                      return (
                        <div 
                          key={item._id || item.id}
                          className="p-3 rounded-2xl bg-gray-50 dark:bg-dark-100/50 border border-gray-100 dark:border-white/5 flex gap-3 justify-between items-center"
                        >
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-gray-950 dark:text-white line-clamp-1">{item.name}</h5>
                            <span className="text-primary-500 font-sans font-bold text-xs mt-0.5 block">{formatPrice(item.price)}</span>
                          </div>
                          
                          {/* Controller qty */}
                          <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-dark-200 border border-gray-200 dark:border-gray-800 p-0.5 rounded-lg shadow-sm">
                            {qty > 0 && (
                              <>
                                <button
                                  onClick={() => updateMealItemQty(item._id || item.id, -1)}
                                  className="w-6 h-6 rounded bg-gray-100 dark:bg-dark-100 hover:bg-gray-200 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors"
                                >
                                  <FiMinus size={11} />
                                </button>
                                <span className="text-xs font-black w-4 text-center dark:text-white">{qty}</span>
                              </>
                            )}
                            <button
                              onClick={() => updateMealItemQty(item._id || item.id, 1)}
                              className="w-6 h-6 rounded bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors"
                            >
                              <FiPlus size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right block: Checkout Config, Discount Showcase, Payment Summary */}
            <div className="space-y-6">
              
              <div className="bg-white dark:bg-dark-200 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-bold text-gray-905 dark:text-white text-base flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <FiShoppingBag className="text-primary-500" /> Chi tiết Gói Đăng Ký
                </h3>

                {/* Restaurant name display */}
                {selectedRest ? (
                  <div className="p-3 bg-primary-500/5 border border-primary-500/10 rounded-2xl flex gap-3 items-center">
                    <img src={selectedRest.image} alt="Rest" className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase">Đăng ký tại:</span>
                      <span className="text-xs font-bold text-gray-850 dark:text-white block mt-0.5">{selectedRest.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                    Vui lòng chọn nhà hàng và món ăn
                  </div>
                )}

                {/* Plan Type Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Chọn Gói Đăng Ký:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPlanType('weekly')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        planType === 'weekly'
                          ? 'border-primary-500 bg-primary-500/5 text-primary-600 dark:text-primary-400 font-black shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm">Gói Tuần</div>
                      <div className="text-[9px] opacity-70 mt-0.5">5 Bữa (Giảm 10%)</div>
                    </button>
                    <button
                      onClick={() => setPlanType('monthly')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        planType === 'monthly'
                          ? 'border-primary-500 bg-primary-500/5 text-primary-600 dark:text-primary-400 font-black shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm">Gói Tháng</div>
                      <div className="text-[9px] opacity-70 mt-0.5">20 Bữa (Giảm 20%)</div>
                    </button>
                  </div>
                </div>

                {/* Delivery Time Picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <FiClock /> Giờ giao cơm mỗi ngày:
                  </label>
                  <select
                    value={deliveryTime}
                    onChange={e => setDeliveryTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  >
                    <option value="11:00">11:00 (Cơm trưa sớm)</option>
                    <option value="11:30">11:30 (Cơm trưa chuẩn)</option>
                    <option value="12:00">12:00 (Cơm trưa muộn)</option>
                    <option value="18:00">18:00 (Cơm tối sớm)</option>
                    <option value="18:30">18:30 (Cơm tối chuẩn)</option>
                    <option value="19:00">19:00 (Cơm tối muộn)</option>
                  </select>
                </div>

                {/* Delivery Address Reminder */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                  <FiAlertCircle className="shrink-0 mt-0.5" size={13} />
                  <div>
                    Địa chỉ giao gói ăn: <b className="text-gray-700 dark:text-gray-300 font-sans font-medium block mt-1">{user?.address || 'Chưa thiết lập'}</b>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between text-gray-400">
                    <span>Giá trị một bữa ăn</span>
                    <span className="font-bold text-gray-800 dark:text-white font-sans">{formatPrice(mealPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Số lượng ngày giao</span>
                    <span className="font-bold text-gray-850 dark:text-white font-sans">x{days} ngày</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Mức giảm giá gói ({planType === 'weekly' ? '10%' : '20%'})</span>
                    <span className="font-bold text-green-600 font-sans">-{formatPrice(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Phí vận chuyển định kỳ</span>
                    <span className="font-bold text-green-600">Miễn phí 100% 🚚</span>
                  </div>

                  <div className="flex justify-between text-sm font-black text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span>Tổng thanh toán</span>
                    <span className="text-primary-500 font-sans text-base">{formatPrice(finalPrice)}</span>
                  </div>
                </div>

                {/* Balance display */}
                <div className="p-3 bg-gray-50 dark:bg-dark-100 rounded-2xl flex justify-between items-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  <span>Ví Xu hiện tại của bạn:</span>
                  <span className="text-amber-500 font-mono text-sm">{user?.coins || 0} Xu</span>
                </div>

                {/* Checkout submit button */}
                <button
                  onClick={handleSubscribe}
                  disabled={actionLoading !== null || mealPrice === 0}
                  className="w-full py-4 bg-gradient-primary hover:shadow-glow text-white font-black rounded-2xl text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <FiCreditCard size={15} /> Thanh toán bằng Ví Xu ({finalCoins} Xu)
                </button>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
