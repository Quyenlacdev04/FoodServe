import { motion } from 'framer-motion';
import { FiMapPin, FiNavigation } from 'react-icons/fi';

/**
 * Simple fallback map view using static image
 * Used when Google Maps API is not available
 */
export default function SimpleMapView({ 
  restaurantLocation, 
  customerLocation, 
  shipperLocation,
  orderStatus 
}) {
  // Generate static map URL
  const generateStaticMapUrl = () => {
    const markers = [];
    
    if (restaurantLocation) {
      markers.push(`color:red|label:R|${restaurantLocation.lat},${restaurantLocation.lng}`);
    }
    
    if (customerLocation) {
      markers.push(`color:blue|label:C|${customerLocation.lat},${customerLocation.lng}`);
    }
    
    if (shipperLocation && (orderStatus === 'delivering' || orderStatus === 'ready')) {
      markers.push(`color:green|label:S|${shipperLocation.lat},${shipperLocation.lng}`);
    }
    
    const center = customerLocation 
      ? `${customerLocation.lat},${customerLocation.lng}`
      : '10.762622,106.660172';
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=14&size=600x400&markers=${markers.join('&markers=')}&key=AIzaSyBFw0Qbyq9zTFTd-tUX9dUzk-HnMaJWBLI`;
  };

  return (
    <div className="relative">
      {/* Static Map Image */}
      <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-lg bg-gray-100 dark:bg-dark-300">
        <img 
          src={generateStaticMapUrl()} 
          alt="Bản đồ giao hàng"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.target.src = 'https://via.placeholder.com/600x400/e5e7eb/6b7280?text=Bản+đồ+không+khả+dụng';
          }}
        />
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-dark-200 rounded-xl shadow-lg p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600 dark:text-gray-300">Nhà hàng (R)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-300">Địa chỉ giao (C)</span>
        </div>
        {(orderStatus === 'delivering' || orderStatus === 'ready') && shipperLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Shipper (S)</span>
          </div>
        )}
      </div>

      {/* Refresh Notice */}
      {(orderStatus === 'delivering' || orderStatus === 'ready') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-200 rounded-2xl shadow-2xl px-4 py-2 text-xs text-gray-600 dark:text-gray-300"
        >
          📍 Vị trí cập nhật mỗi 10 giây
        </motion.div>
      )}
    </div>
  );
}
