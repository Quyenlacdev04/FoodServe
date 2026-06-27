import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiNavigation } from 'react-icons/fi';

export default function MapView({ 
  restaurantLocation, 
  customerLocation, 
  shipperLocation,
  orderStatus 
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({
    restaurant: null,
    customer: null,
    shipper: null
  });

  // Initialize Google Map
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const defaultCenter = customerLocation || { lat: 20.8907549, lng: 105.8587752 }; // Thường Tín, Hà Nội
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(mapInstance);
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();

    // Restaurant marker (red)
    if (restaurantLocation) {
      if (markers.restaurant) {
        markers.restaurant.setPosition(restaurantLocation);
      } else {
        const marker = new window.google.maps.Marker({
          position: restaurantLocation,
          map: map,
          title: 'Nhà hàng',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          label: {
            text: '🏪',
            fontSize: '16px',
          }
        });
        setMarkers(prev => ({ ...prev, restaurant: marker }));
      }
      bounds.extend(restaurantLocation);
    }

    // Customer marker (blue)
    if (customerLocation) {
      if (markers.customer) {
        markers.customer.setPosition(customerLocation);
      } else {
        const marker = new window.google.maps.Marker({
          position: customerLocation,
          map: map,
          title: 'Địa chỉ giao hàng',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          label: {
            text: '🏠',
            fontSize: '16px',
          }
        });
        setMarkers(prev => ({ ...prev, customer: marker }));
      }
      bounds.extend(customerLocation);
    }

    // Shipper marker (green) - only show when delivering
    if (shipperLocation && (orderStatus === 'delivering' || orderStatus === 'ready')) {
      if (markers.shipper) {
        markers.shipper.setPosition(shipperLocation);
      } else {
        const marker = new window.google.maps.Marker({
          position: shipperLocation,
          map: map,
          title: 'Shipper',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          label: {
            text: '🛵',
            fontSize: '18px',
          },
          animation: window.google.maps.Animation.BOUNCE,
        });
        setMarkers(prev => ({ ...prev, shipper: marker }));
        
        // Stop bouncing after 2 seconds
        setTimeout(() => {
          marker.setAnimation(null);
        }, 2000);
      }
      bounds.extend(shipperLocation);
    } else if (markers.shipper) {
      // Remove shipper marker if not delivering
      markers.shipper.setMap(null);
      setMarkers(prev => ({ ...prev, shipper: null }));
    }

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
      
      // Add padding
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
    }
  }, [map, restaurantLocation, customerLocation, shipperLocation, orderStatus]);

  // Calculate distance and ETA
  const calculateDistance = () => {
    if (!shipperLocation || !customerLocation || !window.google) return null;

    const shipper = new window.google.maps.LatLng(shipperLocation.lat, shipperLocation.lng);
    const customer = new window.google.maps.LatLng(customerLocation.lat, customerLocation.lng);
    
    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(shipper, customer);
    const distanceKm = (distance / 1000).toFixed(1);
    
    // Estimate time: assume 20km/h average speed
    const timeMinutes = Math.ceil((distance / 1000) / 20 * 60);
    
    return { distance: distanceKm, eta: timeMinutes };
  };

  const distanceInfo = calculateDistance();

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-[400px] rounded-2xl overflow-hidden shadow-lg"
      />

      {/* Distance & ETA Info */}
      {distanceInfo && (orderStatus === 'delivering' || orderStatus === 'ready') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-200 rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2">
            <FiNavigation className="text-green-500 text-xl" />
            <div>
              <div className="text-xs text-gray-400">Khoảng cách</div>
              <div className="font-bold text-gray-900 dark:text-white">{distanceInfo.distance} km</div>
            </div>
          </div>
          
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <div>
              <div className="text-xs text-gray-400">Dự kiến</div>
              <div className="font-bold text-primary-500">~{distanceInfo.eta} phút</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-dark-200 rounded-xl shadow-lg p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🏪</span>
          <span className="text-gray-600 dark:text-gray-300">Nhà hàng</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">🏠</span>
          <span className="text-gray-600 dark:text-gray-300">Địa chỉ giao</span>
        </div>
        {(orderStatus === 'delivering' || orderStatus === 'ready') && (
          <div className="flex items-center gap-2">
            <span className="text-base">🛵</span>
            <span className="text-gray-600 dark:text-gray-300">Shipper</span>
          </div>
        )}
      </div>

      {/* Loading Google Maps Script */}
      {!window.google && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-dark-300 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Đang tải bản đồ...</p>
          </div>
        </div>
      )}
    </div>
  );
}
