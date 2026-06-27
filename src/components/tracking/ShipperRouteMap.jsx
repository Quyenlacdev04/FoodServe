import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { motion } from 'framer-motion';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const restaurantIcon = L.divIcon({
  html: `<div style="background:#ff6b35;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,107,53,0.4);border:3px solid white;font-size:18px;">🏪</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const customerIcon = L.divIcon({
  html: `<div style="background:#10b981;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-center;box-shadow:0 4px 12px rgba(16,185,129,0.4);border:3px solid white;font-size:18px;">🏠</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const shipperIcon = L.divIcon({
  html: `<div style="background:#3b82f6;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-center;box-shadow:0 6px 16px rgba(59,130,246,0.5);border:4px solid white;font-size:20px;animation:pulse 2s infinite;">🛵</div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

// Routing machine component
function RoutingMachine({ restaurantLocation, customerLocation, shipperLocation, orderStatus }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !restaurantLocation || !customerLocation) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Determine waypoints based on order status
    let waypoints = [];
    
    if (orderStatus === 'preparing' || orderStatus === 'confirmed' || orderStatus === 'pending') {
      // Shipper → Restaurant (chưa lấy hàng)
      if (shipperLocation) {
        waypoints = [
          L.latLng(shipperLocation.lat, shipperLocation.lng),
          L.latLng(restaurantLocation.lat, restaurantLocation.lng),
        ];
      } else {
        // Không có vị trí shipper, chỉ hiện nhà hàng → khách
        waypoints = [
          L.latLng(restaurantLocation.lat, restaurantLocation.lng),
          L.latLng(customerLocation.lat, customerLocation.lng),
        ];
      }
    } else if (orderStatus === 'ready' || orderStatus === 'delivering') {
      // Đã lấy hàng, đang giao: Shipper → Customer
      if (shipperLocation) {
        waypoints = [
          L.latLng(shipperLocation.lat, shipperLocation.lng),
          L.latLng(customerLocation.lat, customerLocation.lng),
        ];
      } else {
        // Fallback: Restaurant → Customer
        waypoints = [
          L.latLng(restaurantLocation.lat, restaurantLocation.lng),
          L.latLng(customerLocation.lat, customerLocation.lng),
        ];
      }
    } else {
      // Completed or other status
      return;
    }

    // Create routing control using OSRM
    const routingControl = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ 
          color: '#3b82f6', 
          opacity: 0.8, 
          weight: 6 
        }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'
      }),
      createMarker: () => null, // Don't create default markers
      show: false, // Hide the instructions panel
      collapsible: false
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    // Hide the routing instructions panel
    const routingContainer = document.querySelector('.leaflet-routing-container');
    if (routingContainer) {
      routingContainer.style.display = 'none';
    }

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, restaurantLocation, customerLocation, shipperLocation, orderStatus]);

  return null;
}

export default function ShipperRouteMap({ 
  restaurantLocation, 
  customerLocation, 
  shipperLocation,
  orderStatus,
  restaurantName = 'Nhà hàng',
  className = ''
}) {
  const [routeDistance, setRouteDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  // Calculate center and zoom level
  const getMapCenter = () => {
    if (shipperLocation) {
      return [shipperLocation.lat, shipperLocation.lng];
    }
    if (restaurantLocation) {
      return [restaurantLocation.lat, restaurantLocation.lng];
    }
    return [20.8907549, 105.8587752]; // Default: CTECH Thường Tín, Hà Nội
  };

  const getMapBounds = () => {
    const points = [];
    if (restaurantLocation) points.push([restaurantLocation.lat, restaurantLocation.lng]);
    if (customerLocation) points.push([customerLocation.lat, customerLocation.lng]);
    if (shipperLocation) points.push([shipperLocation.lat, shipperLocation.lng]);
    return points.length > 0 ? points : null;
  };

  // Component to fit bounds
  function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
      if (bounds && bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }, [bounds]);
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={getMapCenter()}
        zoom={14}
        className="w-full h-full rounded-2xl overflow-hidden shadow-lg"
        style={{ height: '400px', width: '100%', minHeight: '300px' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds bounds={getMapBounds()} />
        
        {/* Routing machine */}
        <RoutingMachine
          restaurantLocation={restaurantLocation}
          customerLocation={customerLocation}
          shipperLocation={shipperLocation}
          orderStatus={orderStatus}
        />

        {/* Restaurant marker */}
        {restaurantLocation && (
          <Marker 
            position={[restaurantLocation.lat, restaurantLocation.lng]} 
            icon={restaurantIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">🏪 {restaurantName}</div>
                <div className="text-xs text-gray-500">Điểm lấy hàng</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer marker */}
        {customerLocation && (
          <Marker 
            position={[customerLocation.lat, customerLocation.lng]} 
            icon={customerIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">🏠 Khách hàng</div>
                <div className="text-xs text-gray-500">Điểm giao hàng</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Shipper marker */}
        {shipperLocation && (
          <Marker 
            position={[shipperLocation.lat, shipperLocation.lng]} 
            icon={shipperIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">🛵 Tài xế</div>
                <div className="text-xs text-gray-500">Đang di chuyển</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Status indicator */}
      {shipperLocation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-white dark:bg-dark-100 rounded-xl px-4 py-2.5 shadow-lg z-[1000] flex items-center gap-3"
        >
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <div>
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
              Tài xế đang di chuyển
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              Cập nhật real-time
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-dark-100 rounded-xl px-3 py-2 shadow-lg z-[1000] space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span>🏪</span>
          <span className="text-gray-600 dark:text-gray-300">Nhà hàng</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🏠</span>
          <span className="text-gray-600 dark:text-gray-300">Khách hàng</span>
        </div>
        {shipperLocation && (
          <div className="flex items-center gap-2">
            <span>🛵</span>
            <span className="text-gray-600 dark:text-gray-300">Tài xế</span>
          </div>
        )}
      </div>
    </div>
  );
}
