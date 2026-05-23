import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiClock } from 'react-icons/fi'
import { formatPrice } from '../../data/mockData'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export default function RestaurantAnalytics({ restaurantId }) {
  const [overview, setOverview] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [topItems, setTopItems] = useState([])
  const [peakHours, setPeakHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7) // 7 days default

  useEffect(() => {
    if (!restaurantId) return
    fetchAnalytics()
  }, [restaurantId, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch overview
      const overviewRes = await fetch(`http://localhost:5000/api/analytics/restaurant/${restaurantId}/overview`)
      if (overviewRes.ok) {
        const data = await overviewRes.json()
        setOverview(data)
      }

      // Fetch revenue by day
      const revenueRes = await fetch(`http://localhost:5000/api/analytics/restaurant/${restaurantId}/revenue-by-day?days=${timeRange}`)
      if (revenueRes.ok) {
        const data = await revenueRes.json()
        setRevenueData(data.map(d => ({
          date: new Date(d._id).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          revenue: d.revenue,
          orders: d.orders
        })))
      }

      // Fetch top items
      const topItemsRes = await fetch(`http://localhost:5000/api/analytics/restaurant/${restaurantId}/top-items?limit=5`)
      if (topItemsRes.ok) {
        const data = await topItemsRes.json()
        setTopItems(data.map(d => ({
          name: d._id,
          sold: d.totalSold,
          revenue: d.revenue
        })))
      }

      // Fetch peak hours
      const peakHoursRes = await fetch(`http://localhost:5000/api/analytics/restaurant/${restaurantId}/peak-hours`)
      if (peakHoursRes.ok) {
        const data = await peakHoursRes.json()
        setPeakHours(data.map(d => ({
          hour: `${d._id}:00`,
          orders: d.orders,
          revenue: d.revenue
        })))
      }

    } catch (error) {
      console.error('Fetch analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FiShoppingBag className="text-xl" />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Tổng đơn</p>
          </div>
          <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{overview?.totalOrders || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
              <FiDollarSign className="text-xl" />
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">Doanh thu</p>
          </div>
          <p className="text-2xl font-black text-green-700 dark:text-green-300">{formatPrice(overview?.totalRevenue || 0)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FiTrendingUp className="text-xl" />
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Hoàn thành</p>
          </div>
          <p className="text-3xl font-black text-purple-700 dark:text-purple-300">{overview?.completedOrders || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <FiDollarSign className="text-xl" />
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase">Đơn TB</p>
          </div>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-300">{formatPrice(overview?.avgOrderValue || 0)}</p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map(days => (
          <button
            key={days}
            onClick={() => setTimeRange(days)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              timeRange === days
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
            }`}
          >
            {days} ngày
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-dark-200 p-6 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg dark:text-white mb-4">📈 Doanh thu theo ngày</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value, name) => [name === 'revenue' ? formatPrice(value) : value, name === 'revenue' ? 'Doanh thu' : 'Đơn hàng']}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Doanh thu" />
            <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} name="Đơn hàng" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-white dark:bg-dark-200 p-6 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg dark:text-white mb-4">🔥 Món bán chạy nhất</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topItems}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sold"
              >
                {topItems.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} món`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-white dark:bg-dark-200 p-6 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg dark:text-white mb-4">⏰ Giờ cao điểm</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value, name) => [value, name === 'orders' ? 'Đơn hàng' : 'Doanh thu']}
              />
              <Legend />
              <Bar dataKey="orders" fill="#8B5CF6" name="Đơn hàng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
