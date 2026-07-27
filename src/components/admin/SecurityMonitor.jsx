import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiX, FiEye, FiZap, FiRefreshCw, FiActivity } from 'react-icons/fi';
import { API_BASE_URL, SOCKET_URL } from '../../config/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  critical: { label: 'Nguy hiểm', color: 'red', icon: '🔴', bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500' },
  high: { label: 'Cao', color: 'orange', icon: '🟠', bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500' },
  medium: { label: 'Trung bình', color: 'yellow', icon: '🟡', bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500' },
  low: { label: 'Thấp', color: 'blue', icon: '🔵', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500' }
};

const TYPE_CONFIG = {
  sql_injection: { label: 'SQL Injection', icon: '💉', color: 'red' },
  xss: { label: 'XSS Attack', icon: '⚠️', color: 'orange' },
  brute_force: { label: 'Brute Force', icon: '🔨', color: 'yellow' },
  ddos: { label: 'DDoS Attack', icon: '🌊', color: 'purple' },
  path_traversal: { label: 'Path Traversal', icon: '📁', color: 'pink' },
  suspicious_activity: { label: 'Hoạt động đáng ngờ', icon: '👁️', color: 'gray' }
};

export default function SecurityMonitor() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [autoFixing, setAutoFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [blockedIPs, setBlockedIPs] = useState([]);

  useEffect(() => {
    fetchIncidents();
    fetchDashboard();

    // Socket.io real-time updates
    const socket = io(SOCKET_URL);
    
    socket.on('security-alert', (data) => {
      toast.error(`🚨 ${data.incident.description}`, { duration: 5000 });
      playAlertSound();
      fetchIncidents();
      fetchDashboard();
    });

    socket.on('security-fixing', (data) => {
      setFixProgress(data.progress);
      if (data.progress === 100) {
        setTimeout(() => {
          setAutoFixing(false);
          setFixProgress(0);
        }, 1000);
      }
    });

    socket.on('security-fixed', (data) => {
      toast.success('✅ Đã tự động sửa lỗi bảo mật!');
      fetchIncidents();
      fetchDashboard();
    });

    return () => socket.disconnect();
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);
      
      const res = await fetch(`${API_BASE_URL}/api/security/incidents?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents);
        setStats(data.stats);
        setBlockedIPs(data.blockedIPs);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/security/dashboard`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const handleAutoFix = async (incidentId) => {
    try {
      setAutoFixing(true);
      setFixProgress(0);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/security/incidents/${incidentId}/auto-fix`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setSelectedIncident(null);
        fetchIncidents();
      } else {
        const error = await res.json();
        toast.error(error.message);
        setAutoFixing(false);
      }
    } catch (error) {
      toast.error('Lỗi khi auto-fix');
      setAutoFixing(false);
    }
  };

  const handleIgnore = async (incidentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/security/incidents/${incidentId}/ignore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Đã bỏ qua incident');
        setSelectedIncident(null);
        fetchIncidents();
      }
    } catch (error) {
      toast.error('Lỗi khi ignore incident');
    }
  };

  const handleUnblockIP = async (ip) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/security/unblock-ip/${ip}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success(`Đã unblock IP ${ip}`);
        fetchIncidents();
      }
    } catch (error) {
      toast.error('Lỗi khi unblock IP');
    }
  };

  const playAlertSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq4');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const activeIncidents = incidents.filter(i => i.status === 'detected');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status === 'detected');

  return (
    <div className="space-y-6">
      {/* Header with Alert Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl shadow-lg">
            🛡️
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white">AI Security Monitor</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Giám sát và phát hiện tấn công tự động</p>
          </div>
        </div>
        
        <button
          onClick={() => { fetchIncidents(); fetchDashboard(); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          <FiRefreshCw />
          Làm mới
        </button>
      </div>

      {/* Critical Alert Banner */}
      {criticalIncidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <FiAlertTriangle className="text-2xl text-red-500" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 dark:text-red-200">
                🚨 Cảnh báo nghiêm trọng!
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Phát hiện {criticalIncidents.length} mối đe dọa nghiêm trọng. Cần xử lý ngay!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-100 p-5 rounded-xl shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Tổng mối đe dọa</span>
              <FiActivity className="text-blue-500" />
            </div>
            <div className="text-3xl font-bold dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-400 mt-1">{activeIncidents.length} đang hoạt động</div>
          </div>

          <div className="bg-white dark:bg-dark-100 p-5 rounded-xl shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Nguy hiểm</span>
              <span className="text-2xl">🔴</span>
            </div>
            <div className="text-3xl font-bold text-red-500">{stats.critical}</div>
            <div className="text-xs text-gray-400 mt-1">Cần xử lý ngay</div>
          </div>

          <div className="bg-white dark:bg-dark-100 p-5 rounded-xl shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Đã sửa</span>
              <FiCheckCircle className="text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500">{stats.fixed}</div>
            <div className="text-xs text-gray-400 mt-1">AI auto-fix</div>
          </div>

          <div className="bg-white dark:bg-dark-100 p-5 rounded-xl shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">IP bị chặn</span>
              <span className="text-2xl">🚫</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">{blockedIPs.length}</div>
            <div className="text-xs text-gray-400 mt-1">Tạm thời</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); fetchIncidents(); }}
          className="px-4 py-2 rounded-xl bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="detected">Phát hiện</option>
          <option value="analyzing">Đang phân tích</option>
          <option value="fixed">Đã sửa</option>
          <option value="ignored">Bỏ qua</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => { setFilterSeverity(e.target.value); fetchIncidents(); }}
          className="px-4 py-2 rounded-xl bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700"
        >
          <option value="all">Tất cả mức độ</option>
          <option value="critical">🔴 Nguy hiểm</option>
          <option value="high">🟠 Cao</option>
          <option value="medium">🟡 Trung bình</option>
          <option value="low">🔵 Thấp</option>
        </select>
      </div>

      {/* Incidents List */}
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold dark:text-white">Danh sách mối đe dọa</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại tấn công
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mức độ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {incidents.map((incident) => {
                const typeConf = TYPE_CONFIG[incident.type];
                const sevConf = SEVERITY_CONFIG[incident.severity];
                
                return (
                  <tr key={incident._id} className="hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{typeConf.icon}</span>
                        <div>
                          <div className="font-medium dark:text-white">{typeConf.label}</div>
                          <div className="text-xs text-gray-400">{incident.details.endpoint}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${sevConf.bg} ${sevConf.text}`}>
                        {sevConf.icon} {sevConf.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm dark:text-white">{incident.details.ip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(incident.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {incident.status === 'detected' && <span className="text-yellow-500">⚠️ Phát hiện</span>}
                      {incident.status === 'analyzing' && <span className="text-blue-500">🔍 Đang phân tích</span>}
                      {incident.status === 'fixed' && <span className="text-green-500">✅ Đã sửa</span>}
                      {incident.status === 'ignored' && <span className="text-gray-400">Bỏ qua</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="text-primary-500 hover:text-primary-600 font-medium"
                      >
                        <FiEye className="inline mr-1" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {incidents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiShield className="text-5xl mx-auto mb-3 text-green-500" />
              <p className="font-medium">Hệ thống an toàn! ✅</p>
              <p className="text-sm mt-1">Không phát hiện mối đe dọa nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Blocked IPs */}
      {blockedIPs.length > 0 && (
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-bold dark:text-white mb-4">🚫 IP bị chặn ({blockedIPs.length})</h3>
          <div className="space-y-3">
            {blockedIPs.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div>
                  <div className="font-mono font-bold text-red-600 dark:text-red-400">{item.ip}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.reason}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Còn: {Math.ceil(item.remainingTime / 1000 / 60)} phút
                  </div>
                </div>
                <button
                  onClick={() => handleUnblockIP(item.ip)}
                  className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedIncident(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-red-500 to-orange-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{TYPE_CONFIG[selectedIncident.type].icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {TYPE_CONFIG[selectedIncident.type].label}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {SEVERITY_CONFIG[selectedIncident.severity].icon} {SEVERITY_CONFIG[selectedIncident.severity].label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">📋 Mô tả</h4>
                  <p className="text-gray-600 dark:text-gray-300">{selectedIncident.description}</p>
                </div>

                {/* Details */}
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">🔍 Chi tiết kỹ thuật</h4>
                  <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-4 space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">IP:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{selectedIncident.details.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Endpoint:</span>
                      <span className="text-gray-800 dark:text-white">{selectedIncident.details.endpoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method:</span>
                      <span className="text-gray-800 dark:text-white">{selectedIncident.details.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">User Agent:</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 break-all">
                        {selectedIncident.details.userAgent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedIncident.aiAnalysis && (
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white mb-2">🤖 Phân tích AI</h4>
                    
                    {/* Threat Level */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Mức độ đe dọa:</span>
                        <span className="font-bold text-lg">{selectedIncident.aiAnalysis.threatLevel}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedIncident.aiAnalysis.threatLevel}%` }}
                          transition={{ duration: 1 }}
                          className={`h-full ${
                            selectedIncident.aiAnalysis.threatLevel > 75 ? 'bg-red-500' :
                            selectedIncident.aiAnalysis.threatLevel > 50 ? 'bg-orange-500' :
                            selectedIncident.aiAnalysis.threatLevel > 25 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                      <p className="text-blue-800 dark:text-blue-200">
                        💡 {selectedIncident.aiAnalysis.recommendation}
                      </p>
                    </div>

                    {/* Suggested Actions */}
                    {selectedIncident.aiAnalysis.suggestedActions && (
                      <div>
                        <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Hành động đề xuất:</h5>
                        <ul className="space-y-2">
                          {selectedIncident.aiAnalysis.suggestedActions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedIncident.status === 'detected' && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {selectedIncident.aiAnalysis?.autoFixAvailable ? (
                      <div className="space-y-3">
                        {autoFixing ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                🔧 Đang tự động sửa lỗi...
                              </span>
                              <span className="text-sm font-bold text-primary-500">{fixProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <motion.div
                                animate={{ width: `${fixProgress}%` }}
                                transition={{ duration: 0.3 }}
                                className="h-full bg-gradient-to-r from-primary-500 to-green-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAutoFix(selectedIncident._id)}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-green-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                          >
                            <FiZap />
                            ⚡ Tự động sửa lỗi (AI)
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleIgnore(selectedIncident._id)}
                          disabled={autoFixing}
                          className="w-full px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors disabled:opacity-50"
                        >
                          Bỏ qua
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">
                          ⚠️ Incident này không hỗ trợ auto-fix. Cần xử lý thủ công.
                        </p>
                        <button
                          onClick={() => handleIgnore(selectedIncident._id)}
                          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
                        >
                          Đánh dấu đã xử lý
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Resolution Info */}
                {selectedIncident.resolution && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <h5 className="font-bold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                      <FiCheckCircle />
                      Đã xử lý
                    </h5>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <p>Phương pháp: {selectedIncident.resolution.fixMethod === 'auto' ? '🤖 AI Auto-fix' : '👨‍💻 Thủ công'}</p>
                      <p>Thời gian: {new Date(selectedIncident.resolution.fixedAt).toLocaleString('vi-VN')}</p>
                      {selectedIncident.resolution.fixDetails && (
                        <div className="mt-2 whitespace-pre-line text-xs bg-white dark:bg-dark-200 p-3 rounded">
                          {selectedIncident.resolution.fixDetails}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
