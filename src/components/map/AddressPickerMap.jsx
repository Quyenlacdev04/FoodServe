import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiSearch, FiX, FiCheck, FiNavigation } from 'react-icons/fi';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom pin đỏ
const pinIcon = L.divIcon({
  html: `<div style="position:relative;width:32px;height:42px;">
    <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26S32 28 32 16C32 7.163 24.837 0 16 0z" fill="#ff6b35"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Component click map để ghim pin
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    }
  });
  return null;
}

// Component fly to position
function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1 });
  }, [position]);
  return null;
}

// Reverse geocode: tọa độ → tên địa chỉ
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
      { headers: { 'User-Agent': 'FoodServe/1.0' } }
    );
    const data = await res.json();
    if (data.display_name) return data.display_name;
  } catch {}
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Forward geocode: text → danh sách địa điểm
async function searchAddress(query) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Việt Nam')}&limit=5&accept-language=vi`,
      { headers: { 'User-Agent': 'FoodServe/1.0' } }
    );
    const data = await res.json();
    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: item.display_name,
    }));
  } catch {}
  return [];
}

export default function AddressPickerMap({ value, onChange, onClose }) {
  const [mapPosition, setMapPosition] = useState([10.7769, 106.7009]); // HCM default
  const [pinPosition, setPinPosition] = useState(null);
  const [addressText, setAddressText] = useState(value || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mode, setMode] = useState('search'); // 'search' | 'map'
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);

  // Nếu đã có địa chỉ thì geocode nó để hiện pin
  useEffect(() => {
    if (value && value.length > 5) {
      setSearchQuery(value);
      setAddressText(value);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddress(searchQuery);
      setSuggestions(results);
      setSearching(false);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Chọn từ gợi ý
  const handleSelectSuggestion = async (item) => {
    setSuggestions([]);
    setSearchQuery(item.label);
    setAddressText(item.label);
    setPinPosition([item.lat, item.lng]);
    setMapPosition([item.lat, item.lng]);
    setMode('map');
  };

  // Click trên bản đồ → reverse geocode
  const handleMapClick = async (lat, lng) => {
    setPinPosition([lat, lng]);
    setLoadingAddress(true);
    const addr = await reverseGeocode(lat, lng);
    setAddressText(addr);
    setSearchQuery(addr);
    setLoadingAddress(false);
  };

  // Lấy vị trí GPS hiện tại
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setPinPosition([lat, lng]);
      setMapPosition([lat, lng]);
      setLoadingAddress(true);
      const addr = await reverseGeocode(lat, lng);
      setAddressText(addr);
      setSearchQuery(addr);
      setLoadingAddress(false);
    });
  };

  const handleConfirm = () => {
    if (!addressText.trim()) return;
    // Pass address string and coordinates array separately
    onChange(
      addressText.trim(),
      pinPosition // [lat, lng] array or null
    );
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-dark-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 pt-12 pb-4 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
          <FiX className="text-white" size={18} />
        </button>
        <div>
          <h2 className="text-white font-bold text-lg">Chọn địa chỉ giao hàng</h2>
          <p className="text-white/70 text-xs">Tìm kiếm hoặc ghim trực tiếp trên bản đồ</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 bg-white dark:bg-dark-200 border-b border-gray-100 dark:border-gray-800 shrink-0 space-y-2">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSuggestions([]); }}
            placeholder="Nhập tên đường, địa chỉ, địa điểm..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none"
            autoFocus
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {searchQuery && !searching && (
            <button onClick={() => { setSearchQuery(''); setSuggestions([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Gợi ý tìm kiếm */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl max-h-52 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <FiMapPin className="text-primary-500 mt-0.5 shrink-0" size={15} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 text-left">{s.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nút lấy vị trí hiện tại */}
        <button onClick={handleGetCurrentLocation}
          className="flex items-center gap-2 text-primary-500 text-sm font-semibold hover:text-primary-600 transition-colors">
          <FiNavigation size={14} />
          Dùng vị trí hiện tại của tôi
        </button>
      </div>

      {/* Bản đồ */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapPosition}
          zoom={14}
          className="w-full h-full"
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo position={pinPosition || mapPosition} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {pinPosition && (
            <Marker position={pinPosition} icon={pinIcon} />
          )}
        </MapContainer>

        {/* Overlay hướng dẫn khi chưa ghim */}
        {!pinPosition && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-black/70 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
            👆 Nhấn vào bản đồ để ghim địa chỉ
          </div>
        )}

        {/* Loading indicator */}
        {loadingAddress && (
          <div className="absolute top-4 right-4 z-[500] bg-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 text-xs text-gray-600">
            <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            Đang xác định địa chỉ...
          </div>
        )}
      </div>

      {/* Bottom panel: địa chỉ đã chọn + xác nhận */}
      <div className="bg-white dark:bg-dark-200 border-t border-gray-100 dark:border-gray-800 px-4 pt-4 pb-6 shrink-0 space-y-3">
        {/* Địa chỉ đã chọn */}
        {addressText ? (
          <div className="flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-3 border border-primary-200 dark:border-primary-700">
            <FiMapPin className="text-primary-500 mt-0.5 shrink-0" size={16} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-0.5">Địa chỉ đã chọn</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{addressText}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-dark-100 rounded-2xl p-3">
            <FiMapPin className="text-gray-300 shrink-0" size={16} />
            <p className="text-sm text-gray-400">Chưa chọn địa chỉ</p>
          </div>
        )}

        {/* Cho phép chỉnh sửa thủ công */}
        <input
          type="text"
          value={addressText}
          onChange={e => setAddressText(e.target.value)}
          placeholder="Hoặc nhập địa chỉ chi tiết thủ công..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 dark:text-white text-sm focus:ring-2 focus:ring-primary-400 outline-none"
        />

        {/* Nút xác nhận */}
        <button
          onClick={handleConfirm}
          disabled={!addressText.trim()}
          className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
        >
          <FiCheck size={18} />
          Xác nhận địa chỉ này
        </button>
      </div>
    </div>
  );
}
