import SecurityIncident from '../models/SecurityIncident.js';

// Danh sách IP bị chặn tạm thời (in-memory)
const blockedIPs = new Map(); // { ip: { until: timestamp, reason: string } }
const rateLimitMap = new Map(); // { ip: { count: number, windowStart: timestamp } }

// Patterns phát hiện tấn công
const ATTACK_PATTERNS = {
  sql_injection: [
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /('|"|;|<|>)/
  ],
  xss: [
    /<script[^>]*>.*<\/script>/gi,
    /<iframe[^>]*>/gi,
    /javascript:/gi,
    /onerror=/gi,
    /onload=/gi,
    /<img[^>]*onerror/gi,
    /alert\(/gi,
    /document\.cookie/gi,
    /eval\(/gi
  ],
  path_traversal: [
    /\.\.\//g,
    /\.\.%2[fF]/g,
    /\.\.%5[cC]/g,
    /%2e%2e%2f/gi,
    /etc\/passwd/i,
    /\/windows\/system32/i
  ]
};

// AI Security Analyzer - phân tích mối đe dọa
export async function analyzeSecurityThreat(incident) {
  const analysis = {
    threatLevel: 0,
    recommendation: '',
    autoFixAvailable: false,
    fixScript: '',
    affectedFiles: [],
    suggestedActions: []
  };

  // Tính threat level dựa trên type và severity
  const severityScore = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 100
  };
  
  analysis.threatLevel = severityScore[incident.severity] || 50;

  // Phân tích chi tiết theo từng loại tấn công
  switch (incident.type) {
    case 'sql_injection':
      analysis.recommendation = 'Phát hiện SQL Injection! Cần kiểm tra input validation và sử dụng parameterized queries.';
      analysis.autoFixAvailable = true;
      analysis.fixScript = `
// Auto-fix: Thêm validation cho endpoint ${incident.details.endpoint}
// 1. Sanitize input data
// 2. Use parameterized queries
// 3. Block suspicious IP
      `.trim();
      analysis.affectedFiles = ['server/routes/*.js', 'server/middleware/validation.js'];
      analysis.suggestedActions = [
        'Chặn IP ngay lập tức',
        'Kiểm tra database logs',
        'Cập nhật validation middleware',
        'Scan toàn bộ hệ thống',
        'Backup database'
      ];
      break;

    case 'xss':
      analysis.recommendation = 'Phát hiện XSS Attack! Input chứa mã độc JavaScript.';
      analysis.autoFixAvailable = true;
      analysis.fixScript = `
// Auto-fix: Cập nhật sanitization
// 1. Escape HTML entities
// 2. Filter dangerous tags
// 3. Implement CSP headers
      `.trim();
      analysis.affectedFiles = ['server/middleware/validation.js', 'server/middleware/sanitization.js'];
      analysis.suggestedActions = [
        'Chặn request ngay',
        'Kiểm tra user input forms',
        'Cập nhật sanitization rules',
        'Thêm Content Security Policy'
      ];
      break;

    case 'brute_force':
      analysis.recommendation = 'Phát hiện Brute Force Attack! Quá nhiều lần đăng nhập thất bại.';
      analysis.autoFixAvailable = true;
      analysis.fixScript = `
// Auto-fix: Rate limiting
// 1. Implement exponential backoff
// 2. Add CAPTCHA after 3 failed attempts
// 3. Temporary IP ban
      `.trim();
      analysis.affectedFiles = ['server/routes/auth.js', 'server/middleware/rateLimiter.js'];
      analysis.suggestedActions = [
        'Chặn IP tạm thời (1 giờ)',
        'Thêm CAPTCHA',
        'Bật 2FA cho admin',
        'Kiểm tra user accounts'
      ];
      break;

    case 'ddos':
      analysis.recommendation = 'Phát hiện DDoS Attack! Lưu lượng bất thường từ một nguồn.';
      analysis.autoFixAvailable = true;
      analysis.fixScript = `
// Auto-fix: DDoS mitigation
// 1. Enable rate limiting
// 2. Block suspicious IPs
// 3. Scale infrastructure
      `.trim();
      analysis.affectedFiles = ['server/index.js', 'server/middleware/rateLimiter.js'];
      analysis.suggestedActions = [
        'Chặn IP ngay lập tức',
        'Kích hoạt CloudFlare protection',
        'Scale up server resources',
        'Monitor system resources'
      ];
      break;

    case 'path_traversal':
      analysis.recommendation = 'Phát hiện Path Traversal! Cố gắng truy cập file hệ thống.';
      analysis.autoFixAvailable = true;
      analysis.fixScript = `
// Auto-fix: File access protection
// 1. Sanitize file paths
// 2. Restrict file access
// 3. Block directory traversal
      `.trim();
      analysis.affectedFiles = ['server/routes/upload.js', 'server/middleware/fileValidation.js'];
      analysis.suggestedActions = [
        'Chặn IP ngay',
        'Kiểm tra file system permissions',
        'Cập nhật path validation',
        'Scan server files'
      ];
      break;

    default:
      analysis.recommendation = 'Phát hiện hoạt động đáng ngờ. Cần kiểm tra thủ công.';
      analysis.suggestedActions = [
        'Xem xét chi tiết request',
        'Kiểm tra logs',
        'Monitor tiếp'
      ];
  }

  return analysis;
}

// Middleware phát hiện tấn công
export const securityMonitor = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Whitelist localhost - không scan localhost
  const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1' || clientIP === 'localhost';
  
  if (isLocalhost) {
    return next(); // Skip security check for localhost
  }
  
  // 1. Kiểm tra IP có bị chặn không
  if (blockedIPs.has(clientIP)) {
    const blockInfo = blockedIPs.get(clientIP);
    if (Date.now() < blockInfo.until) {
      return res.status(403).json({
        message: '🚫 IP của bạn đã bị chặn do hoạt động đáng ngờ',
        reason: blockInfo.reason,
        unblockAt: new Date(blockInfo.until).toISOString()
      });
    } else {
      blockedIPs.delete(clientIP); // Hết thời gian chặn
    }
  }

  // 2. Rate limiting check
  const rateLimit = rateLimitMap.get(clientIP) || { count: 0, windowStart: Date.now() };
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 phút
  const RATE_LIMIT_MAX = 100; // 100 requests/phút

  if (Date.now() - rateLimit.windowStart > RATE_LIMIT_WINDOW) {
    rateLimit.count = 0;
    rateLimit.windowStart = Date.now();
  }
  
  rateLimit.count++;
  rateLimitMap.set(clientIP, rateLimit);

  if (rateLimit.count > RATE_LIMIT_MAX) {
    // DDoS detected
    await createSecurityIncident({
      type: 'ddos',
      severity: 'high',
      description: `DDoS attack detected from IP ${clientIP}`,
      details: {
        ip: clientIP,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('user-agent'),
        requestCount: rateLimit.count
      }
    });

    // Chặn IP tạm thời 1 giờ
    blockIP(clientIP, 'DDoS attack detected', 60 * 60 * 1000);

    return res.status(429).json({
      message: '⚠️ Too many requests. Your IP has been temporarily blocked.',
      reason: 'Rate limit exceeded'
    });
  }

  // 3. Kiểm tra payload có chứa mã độc không
  const payload = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  let threatDetected = false;
  let threatType = null;
  let threatSeverity = 'medium';

  // SQL Injection check
  for (const pattern of ATTACK_PATTERNS.sql_injection) {
    if (pattern.test(payload)) {
      threatDetected = true;
      threatType = 'sql_injection';
      threatSeverity = 'critical';
      break;
    }
  }

  // XSS check
  if (!threatDetected) {
    for (const pattern of ATTACK_PATTERNS.xss) {
      if (pattern.test(payload)) {
        threatDetected = true;
        threatType = 'xss';
        threatSeverity = 'high';
        break;
      }
    }
  }

  // Path Traversal check
  if (!threatDetected) {
    for (const pattern of ATTACK_PATTERNS.path_traversal) {
      if (pattern.test(payload)) {
        threatDetected = true;
        threatType = 'path_traversal';
        threatSeverity = 'high';
        break;
      }
    }
  }

  // Nếu phát hiện mối đe dọa
  if (threatDetected) {
    await createSecurityIncident({
      type: threatType,
      severity: threatSeverity,
      description: `${threatType.toUpperCase()} attack detected from IP ${clientIP}`,
      details: {
        ip: clientIP,
        endpoint: req.originalUrl,
        method: req.method,
        payload: req.body,
        userAgent: req.get('user-agent'),
        headers: req.headers
      }
    });

    // Chặn IP ngay lập tức nếu là critical
    if (threatSeverity === 'critical') {
      blockIP(clientIP, `${threatType} attack`, 24 * 60 * 60 * 1000); // 24 giờ
      
      return res.status(403).json({
        message: '🚫 Malicious request detected. Your IP has been blocked.',
        reason: 'Security threat detected'
      });
    }
  }

  next();
};

// Tạo security incident và phân tích bằng AI
async function createSecurityIncident(data) {
  try {
    // Phân tích mối đe dọa bằng AI
    const aiAnalysis = await analyzeSecurityThreat(data);

    const incident = await SecurityIncident.create({
      ...data,
      aiAnalysis,
      attackPattern: {
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        blocked: data.severity === 'critical'
      }
    });

    // Emit real-time alert to admin via Socket.io
    const io = global.io;
    if (io) {
      io.emit('security-alert', {
        incident: incident.toObject(),
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🚨 [SECURITY] ${data.type.toUpperCase()} detected from ${data.details.ip}`);
    
    return incident;
  } catch (error) {
    console.error('Error creating security incident:', error);
  }
}

// Chặn IP tạm thời
function blockIP(ip, reason, duration = 60 * 60 * 1000) {
  blockedIPs.set(ip, {
    until: Date.now() + duration,
    reason: reason,
    blockedAt: new Date()
  });
  console.log(`🚫 [SECURITY] Blocked IP ${ip} for ${duration / 1000 / 60} minutes. Reason: ${reason}`);
}

// Export blocked IPs list (for admin dashboard)
export function getBlockedIPs() {
  const list = [];
  blockedIPs.forEach((info, ip) => {
    if (Date.now() < info.until) {
      list.push({
        ip,
        ...info,
        remainingTime: info.until - Date.now()
      });
    }
  });
  return list;
}

// Unblock IP manually (admin action)
export function unblockIP(ip) {
  if (blockedIPs.has(ip)) {
    blockedIPs.delete(ip);
    console.log(`✅ [SECURITY] Unblocked IP ${ip} manually`);
    return true;
  }
  return false;
}
