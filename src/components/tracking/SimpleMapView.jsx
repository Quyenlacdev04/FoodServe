import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';

// Fix icon Leaflet bị vỡ khi dùng với bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createIcon = (emoji, color) => L.divIcon({
  html: `<div style="
    width:40px;height:40px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
    font-size:18px;transform:rotate(-45deg);
  "><span style="transform:rotate(45deg)">${emoji}</span></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: ''
});

const restaurantIcon = createIcon('🏪', '#EF4444');
const customerIcon   = createIcon('🏠', '#3B82F6');
const shipperIcon    = createIcon('🛵', '#10B981');

export default function SimpleMapView({
  restaurantLocation,
  customerLocation,
  shipperLocation,
  orderStatus
}) {
  const mapRef   = useRef(null);
  const mapObj   = useRef(null);
  const markers  = useRef({ restaurant: null, customer: null, shipper: null });

  // Khởi tạo bản đồ
  useEffect(() => {
    if (mapObj.current || !mapRef.current) return;

    const center = customerLocation
      ? [customerLocation.lat, customerLocation.lng]
      : [10.762622, 106.660172]; // TP.HCM mặc định

    const map = L.map(mapRef.current, {
      center,
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapObj.current = map;

    return () => {
      map.remove();
      mapObj.current = null;
    };
  }, []);

  // Cập nhật markers & fit bounds
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;

    const bounds = [];

    // Marker nhà hàng
    if (restaurantLocation) {
      const pos = [restaurantLocation.lat, restaurantLocation.lng];
      if (markers.current.restaurant) {
        markers.current.restaurant.setLatLng(pos);
      } else {
        markers.current.restaurant = L.marker(pos, { icon: restaurantIcon })
          .addTo(map)
          .bindPopup('<b>🏪 Nhà hàng</b><br>Điểm lấy hàng');
      }
      bounds.push(pos);
    }

    // Marker khách hàng
    if (customerLocation) {
      const pos = [customerLocation.lat, customerLocation.lng];
      if (markers.current.customer) {
        markers.current.customer.setLatLng(pos);
      } else {
        markers.current.customer = L.marker(pos, { icon: customerIcon })
          .addTo(map)
          .bindPopup('<b>🏠 Địa chỉ giao hàng</b><br>Điểm giao hàng');
      }
      bounds.push(pos);
    }

    // Marker shipper (chỉ hiện khi đang giao)
    const isDelivering = orderStatus === 'delivering' || orderStatus === 'ready';
    if (shipperLocation && isDelivering) {
      const pos = [shipperLocation.lat, shipperLocation.lng];
      if (markers.current.shipper) {
        markers.current.shipper.setLatLng(pos);
      } else {
        markers.current.shipper = L.marker(pos, { icon: shipperIcon })
          .addTo(map)
          .bindPopup('<b>🛵 Tài xế</b><br>Đang trên đường giao');
      }
      bounds.push(pos);
    } else if (markers.current.shipper && !isDelivering) {
      markers.current.shipper.remove();
      markers.current.shipper = null;
    }

    // Fit bản đồ vừa với tất cả markers
    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [restaurantLocation, customerLocation, shipperLocation, orderStatus]);

  // Tính khoảng cách thẳng (km)
  const calcDistance = () => {
    if (!shipperLocation || !customerLocation) return null;
    const R = 6371;
    const dLat = (customerLocation.lat - shipperLocation.lat) * Math.PI / 180;
    const dLon = (customerLocation.lng - shipperLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
      Math.cos(shipperLocation.lat * Math.PI/180) *
      Math.cos(customerLocation.lat * Math.PI/180) *
      Math.sin(dLon/2)**2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return { distance: dist.toFixed(1), eta: Math.ceil(dist / 20 * 60) };
  };

  const distInfo = calcDistance();
  const isDelivering = orderStatus === 'delivering' || orderStatus === 'ready';

  return (
    <div className="relative">
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-2xl overflow-hidden shadow-lg z-0"
        style={{ position: 'relative' }}
      />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-dark-200 rounded-xl shadow-lg p-3 space-y-2 text-xs z-[1000]">
        <div className="flex items-center gap-2">
          <span>🏪</span>
          <span className="text-gray-600 dark:text-gray-300">Nhà hàng</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🏠</span>
          <span className="text-gray-600 dark:text-gray-300">Địa chỉ giao</span>
        </div>
        {isDelivering && (
          <div className="flex items-center gap-2">
            <span>🛵</span>
            <span className="text-gray-600 dark:text-gray-300">Tài xế</span>
          </div>
        )}
      </div>

      {/* Distance & ETA */}
      {distInfo && isDelivering && shipperLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-200 rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 border border-gray-200 dark:border-gray-700 z-[1000]"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <div>
              <div className="text-xs text-gray-400">Khoảng cách</div>
              <div className="font-bold text-gray-900 dark:text-white">{distInfo.distance} km</div>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <div>
              <div className="text-xs text-gray-400">Dự kiến</div>
              <div className="font-bold text-primary-500">~{distInfo.eta} phút</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cập nhật tự động */}
      {isDelivering && (
        <div className="absolute bottom-4 right-4 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow z-[1000] flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Live
        </div>
      )}
    </div>
  );
}
