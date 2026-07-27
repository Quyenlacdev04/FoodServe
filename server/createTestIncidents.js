/**
 * Tạo test incidents trực tiếp vào database
 * Chạy: node createTestIncidents.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Import model
import SecurityIncident from './models/SecurityIncident.js';

const testIncidents = [
  {
    type: 'sql_injection',
    severity: 'critical',
    status: 'detected',
    description: 'SQL Injection attack detected from IP 192.168.1.100',
    details: {
      ip: '192.168.1.100',
      endpoint: '/api/auth/login',
      method: 'POST',
      payload: { email: "admin' OR '1'='1", password: 'pass' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      headers: {}
    },
    aiAnalysis: {
      threatLevel: 95,
      recommendation: 'Phát hiện SQL Injection nghiêm trọng! Cần chặn IP ngay lập tức và kiểm tra database logs.',
      autoFixAvailable: true,
      fixScript: 'Auto-fix: Thêm validation, sử dụng parameterized queries, chặn IP',
      affectedFiles: ['server/routes/auth.js', 'server/middleware/validation.js'],
      suggestedActions: [
        'Chặn IP ngay lập tức',
        'Kiểm tra database logs',
        'Cập nhật validation middleware',
        'Scan toàn bộ hệ thống',
        'Backup database'
      ]
    },
    attackPattern: {
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      blocked: false
    }
  },
  {
    type: 'xss',
    severity: 'high',
    status: 'detected',
    description: 'XSS Attack detected from IP 192.168.1.101',
    details: {
      ip: '192.168.1.101',
      endpoint: '/api/restaurants',
      method: 'POST',
      payload: { name: "<script>alert('XSS')</script>" },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      headers: {}
    },
    aiAnalysis: {
      threatLevel: 80,
      recommendation: 'Phát hiện XSS Attack! Input chứa mã độc JavaScript.',
      autoFixAvailable: true,
      fixScript: 'Auto-fix: Cập nhật sanitization, escape HTML entities, thêm CSP headers',
      affectedFiles: ['server/middleware/validation.js', 'server/middleware/sanitization.js'],
      suggestedActions: [
        'Chặn request ngay',
        'Kiểm tra user input forms',
        'Cập nhật sanitization rules',
        'Thêm Content Security Policy'
      ]
    },
    attackPattern: {
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      blocked: false
    }
  },
  {
    type: 'brute_force',
    severity: 'medium',
    status: 'detected',
    description: 'Brute Force Attack - Multiple failed login attempts from IP 192.168.1.102',
    details: {
      ip: '192.168.1.102',
      endpoint: '/api/auth/login',
      method: 'POST',
      payload: { email: 'admin@foodserve.vn', password: '123456' },
      userAgent: 'curl/7.68.0',
      headers: {}
    },
    aiAnalysis: {
      threatLevel: 65,
      recommendation: 'Phát hiện Brute Force Attack! Quá nhiều lần đăng nhập thất bại.',
      autoFixAvailable: true,
      fixScript: 'Auto-fix: Rate limiting, thêm CAPTCHA, chặn IP tạm thời',
      affectedFiles: ['server/routes/auth.js', 'server/middleware/rateLimiter.js'],
      suggestedActions: [
        'Chặn IP tạm thời (1 giờ)',
        'Thêm CAPTCHA',
        'Bật 2FA cho admin',
        'Kiểm tra user accounts'
      ]
    },
    attackPattern: {
      count: 8,
      firstSeen: new Date(),
      lastSeen: new Date(),
      blocked: false
    }
  },
  {
    type: 'ddos',
    severity: 'critical',
    status: 'detected',
    description: 'DDoS Attack detected - Unusual traffic from IP 192.168.1.103',
    details: {
      ip: '192.168.1.103',
      endpoint: '/api/restaurants',
      method: 'GET',
      payload: {},
      userAgent: 'Python-urllib/3.8',
      headers: {},
      requestCount: 105
    },
    aiAnalysis: {
      threatLevel: 90,
      recommendation: 'Phát hiện DDoS Attack! Lưu lượng bất thường từ một nguồn.',
      autoFixAvailable: true,
      fixScript: 'Auto-fix: Enable rate limiting, block IP, scale infrastructure',
      affectedFiles: ['server/index.js', 'server/middleware/rateLimiter.js'],
      suggestedActions: [
        'Chặn IP ngay lập tức',
        'Kích hoạt CloudFlare protection',
        'Scale up server resources',
        'Monitor system resources'
      ]
    },
    attackPattern: {
      count: 105,
      firstSeen: new Date(),
      lastSeen: new Date(),
      blocked: true
    }
  },
  {
    type: 'path_traversal',
    severity: 'high',
    status: 'detected',
    description: 'Path Traversal attempt from IP 192.168.1.104',
    details: {
      ip: '192.168.1.104',
      endpoint: '/api/restaurants/../../../../etc/passwd',
      method: 'GET',
      payload: {},
      userAgent: 'Nikto/2.1.6',
      headers: {}
    },
    aiAnalysis: {
      threatLevel: 75,
      recommendation: 'Phát hiện Path Traversal! Cố gắng truy cập file hệ thống.',
      autoFixAvailable: true,
      fixScript: 'Auto-fix: Sanitize file paths, restrict access, block traversal',
      affectedFiles: ['server/routes/upload.js', 'server/middleware/fileValidation.js'],
      suggestedActions: [
        'Chặn IP ngay',
        'Kiểm tra file system permissions',
        'Cập nhật path validation',
        'Scan server files'
      ]
    },
    attackPattern: {
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      blocked: false
    }
  }
];

async function createTestIncidents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing old test incidents...');
    await SecurityIncident.deleteMany({});
    console.log('✅ Cleared\n');

    console.log('📝 Creating test incidents...');
    for (const incident of testIncidents) {
      const created = await SecurityIncident.create(incident);
      console.log(`✅ Created: ${incident.type} (${incident.severity})`);
    }

    console.log('\n✅ Done! Created ' + testIncidents.length + ' test incidents');
    console.log('\n📊 Now go to Admin Dashboard → AI Security Monitor to see them!');
    console.log('🔗 http://localhost:3000/admin-login.html\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestIncidents();
