/**
 * Tạo cuộc tấn công real-time (từng cái một để test)
 * Chạy: node createAttackRealtime.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { io as ioClient } from 'socket.io-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import SecurityIncident from './models/SecurityIncident.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const attacks = [
  {
    type: 'sql_injection',
    severity: 'critical',
    description: '🔴 SQL Injection attack detected from IP 192.168.1.100',
    details: {
      ip: '192.168.1.100',
      endpoint: '/api/auth/login',
      method: 'POST',
      payload: { email: "admin' OR '1'='1", password: 'pass' },
      userAgent: 'Mozilla/5.0'
    },
    aiAnalysis: {
      threatLevel: 95,
      recommendation: 'SQL Injection nghiêm trọng! Chặn IP ngay!',
      autoFixAvailable: true,
      suggestedActions: ['Chặn IP', 'Kiểm tra DB logs', 'Update validation']
    }
  },
  {
    type: 'xss',
    severity: 'high',
    description: '🟠 XSS Attack - Mã độc JavaScript detected!',
    details: {
      ip: '192.168.1.101',
      endpoint: '/api/restaurants',
      method: 'POST',
      payload: { name: "<script>alert('XSS')</script>" },
      userAgent: 'Mozilla/5.0'
    },
    aiAnalysis: {
      threatLevel: 80,
      recommendation: 'XSS Attack! Input chứa mã độc.',
      autoFixAvailable: true,
      suggestedActions: ['Sanitize input', 'Add CSP headers', 'Block request']
    }
  },
  {
    type: 'brute_force',
    severity: 'medium',
    description: '🟡 Brute Force - 10 lần login thất bại!',
    details: {
      ip: '192.168.1.102',
      endpoint: '/api/auth/login',
      method: 'POST',
      payload: { email: 'admin@foodserve.vn', password: '123456' },
      userAgent: 'curl/7.68.0'
    },
    aiAnalysis: {
      threatLevel: 65,
      recommendation: 'Brute Force detected! Quá nhiều thử password.',
      autoFixAvailable: true,
      suggestedActions: ['Rate limit', 'Add CAPTCHA', 'Block IP 1h']
    }
  },
  {
    type: 'ddos',
    severity: 'critical',
    description: '🔴 DDoS Attack - 105 requests/phút!',
    details: {
      ip: '192.168.1.103',
      endpoint: '/api/restaurants',
      method: 'GET',
      requestCount: 105,
      userAgent: 'Python-urllib/3.8'
    },
    aiAnalysis: {
      threatLevel: 90,
      recommendation: 'DDoS Attack! Lưu lượng bất thường.',
      autoFixAvailable: true,
      suggestedActions: ['Block IP now', 'Enable CloudFlare', 'Scale resources']
    }
  },
  {
    type: 'path_traversal',
    severity: 'high',
    description: '🟠 Path Traversal - Truy cập file hệ thống!',
    details: {
      ip: '192.168.1.104',
      endpoint: '/api/../../../../etc/passwd',
      method: 'GET',
      userAgent: 'Nikto/2.1.6'
    },
    aiAnalysis: {
      threatLevel: 75,
      recommendation: 'Path Traversal! Cố truy cập /etc/passwd',
      autoFixAvailable: true,
      suggestedActions: ['Block IP', 'Sanitize paths', 'Check permissions']
    }
  }
];

async function createAttackRealtime() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Connect to Socket.io
    const socket = ioClient('http://localhost:5000');
    console.log('🔌 Connecting to Socket.io...\n');

    await sleep(1000);

    console.log('🚨 Bắt đầu tạo các cuộc tấn công real-time...');
    console.log('📺 Hãy mở Admin Dashboard → Security Monitor để xem!\n');

    for (let i = 0; i < attacks.length; i++) {
      const attack = attacks[i];
      
      console.log(`\n[${i + 1}/${attacks.length}] Đang tấn công: ${attack.type.toUpperCase()}`);
      console.log(`   Severity: ${attack.severity}`);
      console.log(`   IP: ${attack.details.ip}`);
      
      // Create incident in DB
      const incident = await SecurityIncident.create({
        ...attack,
        status: 'detected',
        attackPattern: {
          count: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
          blocked: false
        }
      });

      console.log(`   ✅ Created incident: ${incident._id}`);

      // Emit via Socket.io for real-time update
      socket.emit('security-alert', {
        incident: incident.toObject(),
        timestamp: new Date().toISOString()
      });

      console.log(`   📡 Emitted to Socket.io`);
      console.log(`   🔔 Admin sẽ thấy alert ngay bây giờ!`);

      // Đợi 5 giây trước khi tạo attack tiếp theo
      if (i < attacks.length - 1) {
        console.log(`\n   ⏰ Đợi 5 giây trước attack tiếp theo...`);
        await sleep(5000);
      }
    }

    console.log('\n\n🎉 ===== HOÀN TẤT! =====');
    console.log(`✅ Đã tạo ${attacks.length} cuộc tấn công real-time`);
    console.log('📊 Kiểm tra Admin Dashboard để xem kết quả!\n');

    socket.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAttackRealtime();
