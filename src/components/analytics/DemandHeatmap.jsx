import { API_BASE_URL } from '../../config/api.js'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMapPin, FiClock, FiTrendingUp, FiDollarSign,
  FiZap, FiLayers, FiSun, FiMoon, FiRefreshCw, FiInfo
} from 'react-icons/fi'
import { formatPrice } from '../../data/mockData'

// ===== Custom Icons =====
const restaurantPinIcon = L.divIcon({
  html: `<div style="background:#6366f1;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(99,102,241,0.5);display:flex;align-items:center;justify-content:center;font-size:16px;">🏪</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const shipperPinIcon = L.divIcon({
  html: `<div style="background:#ff6b35;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(255,107,53,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;">🛵</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

// ===== Heatmap Layer Controller =====
function HeatmapLayer({ points, options = {} }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!map || !window.L || !window.L.heatLayer) return

    // Remove existing layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
    }

    if (points.length === 0) return

    // Create heat data: [lat, lng, intensity]
    const heatData = points.map(p => [p.lat, p.lng, p.intensity || 0.5])

    heatLayerRef.current = window.L.heatLayer(heatData, {
      radius: options.radius || 25,
      blur: options.blur || 15,
      maxZoom: options.maxZoom || 17,
      max: 1.0,
      minOpacity: 0.3,
      gradient: {
        0.0: '#00ff87',
        0.25: '#60efff',
        0.5: '#f9e52c',
        0.75: '#ff8c00',
        1.0: '#ff0844'
      },
      ...options
    })

    heatLayerRef.current.addTo(map)

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
      }
    }
  }, [map, points, options.radius, options.blur])

  return null
}

// ===== Map Center Controller =====
function MapCenterController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.2 })
    }
  }, [center?.[0], center?.[1]])
  return null
}

// ===== MAIN COMPONENT =====
export default function DemandHeatmap({
  role = 'merchant',        // 'merchant' | 'shipper'
  restaurantId,
  restaurantLocation,       // { lat, lng }
  shipperLocation,          // [lat, lng]
}) {
  // State
  const [demandData, setDemandData] = useState({ points: [], stats: {} })
  const [forecastData, setForecastData] = useState({ hotspots: [], peakHours: [], currentSlot: {} })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [viewType, setViewType] = useState('delivery') // 'delivery' | 'restaurant'
  const [hourFilter, setHourFilter] = useState('') // '' = tất cả
  const [showForecast, setShowForecast] = useState(false)
  const [isDarkMap, setIsDarkMap] = useState(false)

  // Map center
  const defaultCenter = shipperLocation || 
    (restaurantLocation ? [restaurantLocation.lat, restaurantLocation.lng] : [20.8907, 105.8588])
  
  // Fetch demand data
  const fetchDemandData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ timeRange, type: viewType })
      if (hourFilter !== '') params.append('hour', hourFilter)

      const res = await fetch(`${API_BASE_URL}/api/analytics/heatmap/demand?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDemandData(data)
      }
    } catch (error) {
      console.error('Fetch heatmap demand error:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange, viewType, hourFilter])

  // Fetch forecast data
  const fetchForecastData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/heatmap/forecast`)
      if (res.ok) {
        const data = await res.json()
        setForecastData(data)
      }
    } catch (error) {
      console.error('Fetch heatmap forecast error:', error)
    }
  }, [])

  useEffect(() => {
    fetchDemandData()
  }, [fetchDemandData])

  useEffect(() => {
    fetchForecastData()
  }, [])

  // Map tile URLs
  const lightTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const darkTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  const { points, stats } = demandData
  const displayPoints = showForecast ? forecastData.hotspots : points

  // Top 3 hotspots
  const topHotspots = [...(showForecast ? forecastData.hotspots : points)]
    .sort((a, b) => (showForecast ? b.predictedOrders - a.predictedOrders : b.count - a.count))
    .slice(0, 3)

  const timeRangeOptions = [
    { value: 'today', label: 'Hôm nay', icon: '📅' },
    { value: '7d', label: '7 ngày', icon: '📊' },
    { value: '30d', label: '30 ngày', icon: '📈' },
  ]

  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`)

  return (
    <div className="relative bg-gray-50 dark:bg-dark-300 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-card">
      
      {/* ===== CONTROL PANEL ===== */}
      <div className="bg-white dark:bg-dark-200 px-4 py-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-lg shadow-lg shadow-orange-500/20">
              🗺️
            </div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white text-base">Bản đồ nhiệt nhu cầu</h3>
              <p className="text-xs text-gray-400">
                {role === 'shipper' ? 'Tìm vùng có nhiều đơn hàng để nhận đơn nhanh hơn' : 'Phân tích nhu cầu ăn uống theo khu vực'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDemandData}
              className="p-2 rounded-xl bg-gray-100 dark:bg-dark-100 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
              title="Làm mới dữ liệu"
            >
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsDarkMap(!isDarkMap)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-dark-100 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
              title={isDarkMap ? 'Bản đồ sáng' : 'Bản đồ tối'}
            >
              {isDarkMap ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
          </div>
        </div>

        {/* Time Range + View Type */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="flex gap-1.5 bg-gray-100 dark:bg-dark-100 rounded-xl p-1">
            {timeRangeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === opt.value
                    ? 'bg-white dark:bg-dark-300 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* View Type Toggle */}
          <div className="flex gap-1.5 bg-gray-100 dark:bg-dark-100 rounded-xl p-1">
            <button
              onClick={() => setViewType('delivery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewType === 'delivery'
                  ? 'bg-white dark:bg-dark-300 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiMapPin size={12} /> Giao hàng
            </button>
            <button
              onClick={() => setViewType('restaurant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewType === 'restaurant'
                  ? 'bg-white dark:bg-dark-300 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiLayers size={12} /> Nhà hàng
            </button>
          </div>

          {/* Forecast Toggle */}
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
              showForecast
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700'
                : 'bg-gray-50 dark:bg-dark-100 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiZap size={12} /> Dự báo
          </button>
        </div>

        {/* Hour Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiClock size={12} /> Lọc theo giờ
            </span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {hourFilter === '' ? 'Tất cả giờ' : `${hourFilter}:00 – ${parseInt(hourFilter) + 1}:00`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHourFilter('')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                hourFilter === '' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 dark:bg-dark-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <input
              type="range"
              min="0"
              max="23"
              value={hourFilter === '' ? 12 : parseInt(hourFilter)}
              onChange={e => setHourFilter(e.target.value)}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-500/30
                [&::-webkit-slider-thumb]:cursor-pointer
                bg-gradient-to-r from-blue-200 via-yellow-200 via-orange-300 to-indigo-300 dark:from-blue-800 dark:via-yellow-700 dark:via-orange-700 dark:to-indigo-800"
            />
          </div>
          {/* Hour labels */}
          <div className="flex justify-between px-8">
            {[0, 6, 12, 18, 23].map(h => (
              <span key={h} className="text-[9px] text-gray-400">{h}h</span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAP ===== */}
      <div className="relative" style={{ height: role === 'shipper' ? 'calc(100vh - 340px)' : '480px' }}>
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-dark-300/60 backdrop-blur-sm z-[500] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-gray-500">Đang tải dữ liệu heatmap...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={isDarkMap ? darkTile : lightTile}
          />
          <MapCenterController center={defaultCenter} zoom={13} />

          {/* Heatmap Layer */}
          <HeatmapLayer
            points={displayPoints}
            options={{
              radius: showForecast ? 30 : 25,
              blur: showForecast ? 20 : 15,
            }}
          />

          {/* Restaurant Marker */}
          {restaurantLocation && (
            <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantPinIcon}>
              <Popup>
                <div className="text-center font-bold text-sm p-1">🏪 Nhà hàng của bạn</div>
              </Popup>
            </Marker>
          )}

          {/* Shipper Marker */}
          {shipperLocation && (
            <Marker position={shipperLocation} icon={shipperPinIcon}>
              <Popup>
                <div className="text-center font-bold text-sm p-1">🛵 Vị trí của bạn</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[500] bg-white/90 dark:bg-dark-200/90 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Mật độ nhu cầu
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-400">Thấp</span>
            <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-[#00ff87] via-[#f9e52c] via-[#ff8c00] to-[#ff0844]" />
            <span className="text-[9px] text-gray-400">Cao</span>
          </div>
        </div>

        {/* Empty State */}
        {!loading && displayPoints.length === 0 && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-dark-200/90 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl max-w-xs pointer-events-auto">
              <div className="text-5xl mb-3">📊</div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-1">Chưa có dữ liệu</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {showForecast 
                  ? 'Chưa có đủ dữ liệu lịch sử để dự báo. Cần ít nhất vài tuần dữ liệu đơn hàng.'
                  : 'Chưa có đơn hàng nào trong khoảng thời gian này. Hãy thử chọn khoảng thời gian khác.'}
              </p>
            </div>
          </div>
        )}

        {/* Forecast Badge */}
        {showForecast && (
          <div className="absolute top-4 left-4 z-[500] bg-purple-600/90 backdrop-blur-sm text-white rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2">
            <FiZap size={14} />
            <div>
              <div className="text-xs font-bold">Chế độ Dự báo</div>
              <div className="text-[10px] text-white/70">
                {forecastData.currentSlot?.day} · {forecastData.currentSlot?.hour}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== INFO CARDS ===== */}
      <div className="bg-white dark:bg-dark-200 border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-4">
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-2xl p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FiMapPin className="text-blue-500" size={14} />
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Điểm nóng</span>
            </div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300">
              {showForecast ? forecastData.totalHotspots : stats.hotspotCount || 0}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-2xl p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FiTrendingUp className="text-green-500" size={14} />
              </div>
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Tổng đơn</span>
            </div>
            <div className="text-xl font-black text-green-700 dark:text-green-300">
              {stats.totalOrders || 0}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-2xl p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <FiDollarSign className="text-orange-500" size={14} />
              </div>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Doanh thu</span>
            </div>
            <div className="text-lg font-black text-orange-700 dark:text-orange-300">
              {formatPrice(stats.totalRevenue || 0)}
            </div>
          </div>
        </div>

        {/* Top Hotspots */}
        {topHotspots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                🔥 Top khu vực nóng nhất
              </span>
            </div>
            <div className="space-y-2">
              {topHotspots.map((spot, idx) => (
                <motion.div
                  key={`${spot.lat}-${spot.lng}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-dark-100 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 ${
                    idx === 0 ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                    idx === 1 ? 'bg-gradient-to-br from-orange-400 to-yellow-400' :
                    'bg-gradient-to-br from-yellow-400 to-green-400'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      📍 {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {showForecast
                        ? `Dự báo: ~${spot.predictedOrders} đơn/tuần · TB ${formatPrice(spot.avgRevenue)}`
                        : `${spot.count} đơn · ${formatPrice(spot.revenue)} · Giờ TB: ${spot.avgHour}h`
                      }
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    idx === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    idx === 1 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    🔥 HOT
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Peak Hours Forecast */}
        {forecastData.peakHours?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ⏰ Giờ cao điểm dự báo ({forecastData.currentSlot?.day})
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {forecastData.peakHours.map((ph, idx) => (
                <div
                  key={ph.hour}
                  className={`px-3 py-2 rounded-xl border text-center ${
                    idx === 0
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-dark-100 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`text-sm font-black ${idx === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {ph.hour}
                  </div>
                  <div className="text-[10px] text-gray-400">~{ph.orders} đơn</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip for shipper */}
        {role === 'shipper' && displayPoints.length > 0 && (
          <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 border border-blue-200 dark:border-blue-700">
            <FiInfo className="text-blue-500 mt-0.5 shrink-0" size={14} />
            <div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">💡 Gợi ý cho tài xế</div>
              <div className="text-[11px] text-blue-500/80 dark:text-blue-300/70 leading-relaxed">
                Di chuyển tới các vùng màu đỏ/cam trên bản đồ để có cơ hội nhận đơn hàng cao hơn. 
                Bật chế độ "Dự báo" để xem dự đoán nhu cầu theo khung giờ hiện tại.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
