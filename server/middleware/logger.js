import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục logs nếu chưa có
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Ghi log vào file
function writeLog(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    message,
    ...data
  };
  
  const logFile = path.join(logsDir, `${type}-${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('Lỗi ghi log:', err);
  });
}

// Middleware ghi log request
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Lưu response gốc
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Ghi log
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id || 'anonymous'
    };
    
    // Chỉ log lỗi và request quan trọng
    if (res.statusCode >= 400) {
      writeLog('error', 'Request thất bại', logData);
      console.error(`❌ ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    } else if (req.method !== 'GET') {
      writeLog('request', 'Request thành công', logData);
      console.log(`✅ ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Log lỗi hệ thống
export const logError = (error, context = {}) => {
  writeLog('error', error.message, {
    stack: error.stack,
    ...context
  });
  console.error('🔥 Lỗi hệ thống:', error);
};

// Log hoạt động quan trọng
export const logActivity = (activity, userId, details = {}) => {
  writeLog('activity', activity, {
    userId,
    ...details
  });
  console.log(`📝 ${activity} - User: ${userId}`);
};

// Xóa log cũ (giữ log 30 ngày)
export function cleanOldLogs() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  fs.readdir(logsDir, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlink(filePath, (err) => {
            if (!err) console.log(`🗑️  Đã xóa log cũ: ${file}`);
          });
        }
      });
    });
  });
}
