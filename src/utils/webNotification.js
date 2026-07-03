/**
 * Web Notification API Utility
 * Quản lý thông báo đẩy trên trình duyệt (Browser Push Notifications)
 * Cho phép hiển thị thông báo native kể cả khi tab đang chạy ở nền.
 */

const NOTIFICATION_STORAGE_KEY = 'foodserve_notification_pref';

// Emoji icon map cho từng loại thông báo
const ICON_MAP = {
  payment_request: '💳',
  payment_approved: '✅',
  payment_rejected: '❌',
  order_new: '🛒',
  order_status: '📦',
  subscription_expiring: '⏰',
  partner_approved: '🎉',
  driver_approved: '🚗',
};

/**
 * Kiểm tra trình duyệt có hỗ trợ Notification API hay không
 */
export function isNotificationSupported() {
  return 'Notification' in window;
}

/**
 * Lấy trạng thái quyền hiện tại
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getPermissionStatus() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Yêu cầu quyền hiển thị thông báo từ người dùng
 * @returns {Promise<'granted' | 'denied' | 'default'>}
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      saveNotificationPreference(true);
    }
    return permission;
  } catch (err) {
    console.error('Lỗi khi yêu cầu quyền thông báo:', err);
    return 'default';
  }
}

/**
 * Hiển thị thông báo native trên trình duyệt
 * @param {Object} options
 * @param {string} options.title - Tiêu đề thông báo
 * @param {string} options.body - Nội dung thông báo
 * @param {string} [options.type] - Loại thông báo (để chọn icon)
 * @param {string} [options.tag] - Tag để gộp thông báo cùng loại
 * @param {Object} [options.data] - Dữ liệu kèm theo (orderId, restaurantId, etc.)
 * @param {Function} [options.onClick] - Callback khi click vào thông báo
 */
export function showBrowserNotification({ title, body, type, tag, data, onClick }) {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;
  if (!getUserNotificationPreference()) return null;

  // Không hiển thị nếu tab đang active (vì đã có toast rồi)
  if (document.visibilityState === 'visible') return null;

  const icon = ICON_MAP[type] || '🔔';

  try {
    const notification = new Notification(`${icon} ${title}`, {
      body: body || '',
      tag: tag || `foodserve-${type || 'general'}-${Date.now()}`,
      icon: '/vite.svg', // Fallback icon, trình duyệt sẽ dùng favicon
      badge: '/vite.svg',
      renotify: true,
      requireInteraction: false,
      silent: false,
      data: data || {},
    });

    // Tự đóng sau 8 giây
    const autoClose = setTimeout(() => notification.close(), 8000);

    notification.onclick = () => {
      clearTimeout(autoClose);
      window.focus();
      notification.close();
      if (onClick) onClick(data);
    };

    notification.onerror = (err) => {
      console.error('Notification error:', err);
    };

    return notification;
  } catch (err) {
    console.error('Không thể hiển thị thông báo:', err);
    return null;
  }
}

/**
 * Lưu tùy chọn thông báo của người dùng vào localStorage
 */
export function saveNotificationPreference(enabled) {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(enabled));
  } catch {}
}

/**
 * Đọc tùy chọn thông báo của người dùng
 * @returns {boolean}
 */
export function getUserNotificationPreference() {
  try {
    const pref = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (pref === null) return true; // Mặc định bật
    return JSON.parse(pref);
  } catch {
    return true;
  }
}
