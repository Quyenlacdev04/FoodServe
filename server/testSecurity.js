/**
 * 🧪 Security Test Script - Tạo cuộc tấn công giả
 * Chạy script này để test AI Security Monitor
 * 
 * Usage: node testSecurity.js
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Màu sắc cho console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. SQL Injection Attack
async function attackSQLInjection() {
  log('red', '💉', 'Đang tấn công SQL Injection...');
  
  const payloads = [
    { email: "admin' OR '1'='1", password: "password" },
    { email: "user@test.com'; DROP TABLE users--", password: "123" },
    { email: "' UNION SELECT * FROM users--", password: "test" },
    { email: "admin' AND 1=1--", password: "pass" },
  ];

  for (const payload of payloads) {
    try {
      await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      log('yellow', '  ↳', `SQL Injection: ${payload.email}`);
      await sleep(500);
    } catch (err) {
      // Ignore errors
    }
  }
  
  log('green', '✅', 'SQL Injection attack hoàn tất!\n');
}

// 2. XSS Attack
async function attackXSS() {
  log('red', '⚠️', 'Đang tấn công XSS...');
  
  const payloads = [
    { name: "<script>alert('XSS')</script>" },
    { name: "<img src=x onerror=alert('XSS')>" },
    { name: "javascript:alert('XSS')" },
    { name: "<iframe src='javascript:alert(1)'></iframe>" },
    { description: "<script>document.cookie</script>" },
  ];

  for (const payload of payloads) {
    try {
      await fetch(`${API_BASE}/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      log('yellow', '  ↳', `XSS: ${payload.name || payload.description}`);
      await sleep(500);
    } catch (err) {
      // Ignore errors
    }
  }
  
  log('green', '✅', 'XSS attack hoàn tất!\n');
}

// 3. Brute Force Attack
async function attackBruteForce() {
  log('red', '🔨', 'Đang tấn công Brute Force...');
  
  const passwords = [
    '123456', 'password', '123456789', '12345678', '12345',
    'qwerty', 'abc123', 'password123', '111111', '123123'
  ];

  for (const pass of passwords) {
    try {
      await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@foodserve.vn',
          password: pass
        })
      });
      log('yellow', '  ↳', `Brute Force: Thử password "${pass}"`);
      await sleep(300);
    } catch (err) {
      // Ignore errors
    }
  }
  
  log('green', '✅', 'Brute Force attack hoàn tất!\n');
}

// 4. DDoS Attack
async function attackDDoS() {
  log('red', '🌊', 'Đang tấn công DDoS...');
  
  const requests = [];
  const count = 105; // Vượt quá rate limit (100 requests/phút)
  
  for (let i = 0; i < count; i++) {
    requests.push(
      fetch(`${API_BASE}/api/restaurants`)
        .catch(() => {})
    );
  }
  
  await Promise.all(requests);
  log('yellow', '  ↳', `DDoS: Gửi ${count} requests trong 1 lần`);
  log('green', '✅', 'DDoS attack hoàn tất!\n');
}

// 5. Path Traversal Attack
async function attackPathTraversal() {
  log('red', '📁', 'Đang tấn công Path Traversal...');
  
  const paths = [
    '../../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
    '../../../../../../../etc/hosts',
  ];

  for (const path of paths) {
    try {
      await fetch(`${API_BASE}/api/restaurants/${path}`);
      log('yellow', '  ↳', `Path Traversal: ${path}`);
      await sleep(500);
    } catch (err) {
      // Ignore errors
    }
  }
  
  log('green', '✅', 'Path Traversal attack hoàn tất!\n');
}

// 6. Suspicious Activity
async function attackSuspicious() {
  log('red', '👁️', 'Đang tạo hoạt động đáng ngờ...');
  
  const activities = [
    { method: 'DELETE', endpoint: '/api/users/all' },
    { method: 'POST', endpoint: '/api/admin/delete-database' },
    { method: 'GET', endpoint: '/api/users/passwords' },
  ];

  for (const activity of activities) {
    try {
      await fetch(`${API_BASE}${activity.endpoint}`, {
        method: activity.method
      });
      log('yellow', '  ↳', `Suspicious: ${activity.method} ${activity.endpoint}`);
      await sleep(500);
    } catch (err) {
      // Ignore errors
    }
  }
  
  log('green', '✅', 'Suspicious activity hoàn tất!\n');
}

// Main function
async function main() {
  console.clear();
  log('cyan', '🧪', '='.repeat(60));
  log('cyan', '🛡️', ' SECURITY TEST - Tạo cuộc tấn công giả');
  log('cyan', '🧪', '='.repeat(60));
  console.log();
  
  log('blue', 'ℹ️', 'Server phải đang chạy tại http://localhost:5000');
  log('blue', 'ℹ️', 'Mở Admin Dashboard → Security Monitor để xem real-time');
  console.log();
  
  log('magenta', '⏰', 'Bắt đầu trong 3 giây...\n');
  await sleep(3000);

  try {
    // Kiểm tra server có chạy không
    log('blue', '🔍', 'Kiểm tra server...');
    const healthCheck = await fetch(`${API_BASE}/api/health`);
    if (!healthCheck.ok) {
      throw new Error('Server không phản hồi');
    }
    log('green', '✅', 'Server đang chạy!\n');
    await sleep(1000);

    // Chạy các cuộc tấn công
    await attackSQLInjection();
    await sleep(2000);
    
    await attackXSS();
    await sleep(2000);
    
    await attackBruteForce();
    await sleep(2000);
    
    await attackDDoS();
    await sleep(2000);
    
    await attackPathTraversal();
    await sleep(2000);
    
    await attackSuspicious();
    
    // Kết thúc
    console.log();
    log('cyan', '🎉', '='.repeat(60));
    log('green', '✅', ' HOÀN TẤT! Tất cả các cuộc tấn công giả đã được tạo');
    log('cyan', '🎉', '='.repeat(60));
    console.log();
    
    log('yellow', '📊', 'Giờ hãy mở Admin Dashboard để xem kết quả:');
    log('yellow', '   ', '1. Vào http://localhost:3000/admin-login.html');
    log('yellow', '   ', '2. Đăng nhập với admin@foodserve.vn / admin123');
    log('yellow', '   ', '3. Nhấn vào "🛡️ AI Security Monitor"');
    log('yellow', '   ', '4. Bạn sẽ thấy tất cả các cuộc tấn công!');
    console.log();
    
    log('cyan', '💡', 'Thử nhấn "Chi tiết" và "⚡ Tự động sửa lỗi" để test AI!');
    console.log();

  } catch (error) {
    console.error();
    log('red', '❌', 'LỖI: Server không chạy hoặc không phản hồi');
    log('yellow', '💡', 'Hãy chạy: cd server && npm run dev');
    console.log();
    process.exit(1);
  }
}

// Run
main().catch(err => {
  console.error(err);
  process.exit(1);
});
