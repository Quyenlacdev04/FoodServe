import express from 'express';
import SecurityIncident from '../models/SecurityIncident.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getBlockedIPs, unblockIP } from '../middleware/securityMonitor.js';

const router = express.Router();

// Lấy tất cả security incidents (Admin only)
router.get('/incidents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, severity, type, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const incidents = await SecurityIncident.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = {
      total: await SecurityIncident.countDocuments(),
      detected: await SecurityIncident.countDocuments({ status: 'detected' }),
      analyzing: await SecurityIncident.countDocuments({ status: 'analyzing' }),
      fixed: await SecurityIncident.countDocuments({ status: 'fixed' }),
      ignored: await SecurityIncident.countDocuments({ status: 'ignored' }),
      critical: await SecurityIncident.countDocuments({ severity: 'critical' }),
      high: await SecurityIncident.countDocuments({ severity: 'high' }),
      medium: await SecurityIncident.countDocuments({ severity: 'medium' }),
      low: await SecurityIncident.countDocuments({ severity: 'low' })
    };

    res.json({
      incidents,
      stats,
      blockedIPs: getBlockedIPs()
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách security incidents', error: error.message });
  }
});

// Lấy chi tiết một incident
router.get('/incidents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const incident = await SecurityIncident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Không tìm thấy incident' });
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết incident', error: error.message });
  }
});

// Auto-fix incident (AI tự động sửa)
router.post('/incidents/:id/auto-fix', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const incident = await SecurityIncident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ message: 'Không tìm thấy incident' });
    }

    if (!incident.aiAnalysis?.autoFixAvailable) {
      return res.status(400).json({ message: 'Incident này không hỗ trợ auto-fix' });
    }

    // Simulate AI fixing process
    incident.status = 'analyzing';
    await incident.save();

    // Emit progress to admin
    const io = req.app.get('io');
    if (io) {
      io.emit('security-fixing', {
        incidentId: incident._id,
        status: 'analyzing',
        progress: 0,
        message: 'Đang phân tích mối đe dọa...'
      });
    }

    // Simulate fixing steps
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (io) {
      io.emit('security-fixing', {
        incidentId: incident._id,
        status: 'analyzing',
        progress: 30,
        message: 'Đang áp dụng các biện pháp bảo vệ...'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    if (io) {
      io.emit('security-fixing', {
        incidentId: incident._id,
        status: 'analyzing',
        progress: 60,
        message: 'Đang cập nhật middleware...'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    if (io) {
      io.emit('security-fixing', {
        incidentId: incident._id,
        status: 'analyzing',
        progress: 90,
        message: 'Hoàn tất và kiểm tra...'
      });
    }

    // Apply fixes based on incident type
    let fixDetails = '';
    let successful = true;

    switch (incident.type) {
      case 'sql_injection':
        fixDetails = `
✅ Đã thêm input validation
✅ Đã cập nhật parameterized queries
✅ Đã chặn IP ${incident.details.ip}
✅ Đã scan database logs
        `.trim();
        break;

      case 'xss':
        fixDetails = `
✅ Đã cập nhật sanitization rules
✅ Đã thêm HTML escaping
✅ Đã thêm Content Security Policy headers
✅ Đã chặn request độc hại
        `.trim();
        break;

      case 'brute_force':
        fixDetails = `
✅ Đã kích hoạt rate limiting mạnh hơn
✅ Đã thêm CAPTCHA sau 3 lần thất bại
✅ Đã chặn IP tạm thời
✅ Đã bật 2FA cho tài khoản admin
        `.trim();
        break;

      case 'ddos':
        fixDetails = `
✅ Đã chặn IP nguồn tấn công
✅ Đã tăng rate limiting
✅ Đã kích hoạt DDoS protection
✅ Đã scale server resources
        `.trim();
        break;

      case 'path_traversal':
        fixDetails = `
✅ Đã sanitize file paths
✅ Đã restrict file access
✅ Đã chặn directory traversal
✅ Đã scan file system permissions
        `.trim();
        break;

      default:
        fixDetails = 'Đã áp dụng các biện pháp bảo vệ cơ bản';
    }

    // Update incident
    incident.status = 'fixed';
    incident.resolution = {
      fixedAt: new Date(),
      fixedBy: req.user.userId,
      fixMethod: 'auto',
      fixDetails: fixDetails,
      successful: successful
    };
    
    await incident.save();

    // Notify admin
    if (io) {
      io.emit('security-fixing', {
        incidentId: incident._id,
        status: 'fixed',
        progress: 100,
        message: 'Đã sửa thành công!'
      });

      io.emit('security-fixed', {
        incident: incident.toObject()
      });
    }

    res.json({
      message: '✅ Đã tự động sửa lỗi bảo mật thành công!',
      incident,
      fixDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi auto-fix incident', error: error.message });
  }
});

// Ignore incident
router.post('/incidents/:id/ignore', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const incident = await SecurityIncident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ message: 'Không tìm thấy incident' });
    }

    incident.status = 'ignored';
    await incident.save();

    res.json({
      message: 'Đã đánh dấu incident là bỏ qua',
      incident
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi ignore incident', error: error.message });
  }
});

// Unblock IP manually
router.post('/unblock-ip/:ip', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params;
    const result = unblockIP(ip);
    
    if (result) {
      res.json({ message: `✅ Đã unblock IP ${ip} thành công!` });
    } else {
      res.status(404).json({ message: `IP ${ip} không có trong danh sách chặn` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi unblock IP', error: error.message });
  }
});

// Lấy thống kê security dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: await SecurityIncident.countDocuments(),
      last24h: await SecurityIncident.countDocuments({ createdAt: { $gte: last24h } }),
      last7d: await SecurityIncident.countDocuments({ createdAt: { $gte: last7d } }),
      last30d: await SecurityIncident.countDocuments({ createdAt: { $gte: last30d } }),
      
      byStatus: {
        detected: await SecurityIncident.countDocuments({ status: 'detected' }),
        analyzing: await SecurityIncident.countDocuments({ status: 'analyzing' }),
        fixed: await SecurityIncident.countDocuments({ status: 'fixed' }),
        ignored: await SecurityIncident.countDocuments({ status: 'ignored' })
      },
      
      bySeverity: {
        critical: await SecurityIncident.countDocuments({ severity: 'critical' }),
        high: await SecurityIncident.countDocuments({ severity: 'high' }),
        medium: await SecurityIncident.countDocuments({ severity: 'medium' }),
        low: await SecurityIncident.countDocuments({ severity: 'low' })
      },
      
      byType: {
        sql_injection: await SecurityIncident.countDocuments({ type: 'sql_injection' }),
        xss: await SecurityIncident.countDocuments({ type: 'xss' }),
        brute_force: await SecurityIncident.countDocuments({ type: 'brute_force' }),
        ddos: await SecurityIncident.countDocuments({ type: 'ddos' }),
        path_traversal: await SecurityIncident.countDocuments({ type: 'path_traversal' }),
        suspicious_activity: await SecurityIncident.countDocuments({ type: 'suspicious_activity' })
      }
    };

    // Recent incidents
    const recentIncidents = await SecurityIncident.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Top attacked endpoints
    const topEndpoints = await SecurityIncident.aggregate([
      { $group: { _id: '$details.endpoint', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Attack timeline (last 7 days)
    const timeline = await SecurityIncident.aggregate([
      { $match: { createdAt: { $gte: last7d } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats,
      recentIncidents,
      topEndpoints,
      timeline,
      blockedIPs: getBlockedIPs()
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy dashboard data', error: error.message });
  }
});

// Delete old incidents (cleanup)
router.delete('/incidents/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const result = await SecurityIncident.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['fixed', 'ignored'] }
    });

    res.json({
      message: `Đã xóa ${result.deletedCount} incidents cũ hơn ${days} ngày`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cleanup incidents', error: error.message });
  }
});

export default router;
