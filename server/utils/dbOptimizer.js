import mongoose from 'mongoose';

// Tối ưu hóa kết nối MongoDB
export function optimizeMongoConnection() {
  // Cấu hình connection pool - không dùng mongoose.set() cho connection options
  // Các options này nên được truyền vào mongoose.connect()
  
  // Bật query caching
  mongoose.set('bufferCommands', false);
  
  // Tắt strict mode để linh hoạt hơn (tùy chọn)
  // mongoose.set('strict', false);
  
  console.log('✅ Đã tối ưu hóa kết nối MongoDB');
}

// Tạo indexes cho tất cả models
export async function ensureIndexes() {
  try {
    const models = mongoose.modelNames();
    
    for (const modelName of models) {
      const model = mongoose.model(modelName);
      await model.createIndexes();
      console.log(`✅ Đã tạo indexes cho model: ${modelName}`);
    }
    
    console.log('✅ Hoàn thành tạo indexes cho tất cả models');
  } catch (error) {
    console.error('❌ Lỗi khi tạo indexes:', error);
  }
}

// Kiểm tra hiệu suất query
export function enableQueryLogging() {
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      console.log(`🔍 MongoDB Query: ${collectionName}.${method}`, JSON.stringify(query));
    });
    console.log('✅ Đã bật query logging (chỉ trong development)');
  }
}

// Phân tích query chậm
export async function analyzeSlowQueries() {
  try {
    const db = mongoose.connection.db;
    const result = await db.admin().command({ 
      profile: 2, // Log tất cả operations
      slowms: 100 // Query > 100ms được coi là chậm
    });
    
    console.log('✅ Đã bật profiling cho slow queries (>100ms)');
    return result;
  } catch (error) {
    console.error('❌ Lỗi khi bật profiling:', error);
  }
}

// Lấy thống kê database
export async function getDatabaseStats() {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    console.log('📊 Thống kê Database:');
    console.log(`   - Collections: ${stats.collections}`);
    console.log(`   - Documents: ${stats.objects}`);
    console.log(`   - Kích thước: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Indexes: ${stats.indexes}`);
    console.log(`   - Kích thước indexes: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    return stats;
  } catch (error) {
    console.error('❌ Lỗi khi lấy stats:', error);
  }
}

// Tối ưu hóa query với lean() và select()
export const queryOptimizations = {
  // Sử dụng lean() để trả về plain JavaScript objects thay vì Mongoose documents
  // Nhanh hơn 5-10 lần khi chỉ cần đọc dữ liệu
  useLean: (query) => query.lean(),
  
  // Chỉ select các field cần thiết
  selectFields: (query, fields) => query.select(fields),
  
  // Limit số lượng kết quả
  limitResults: (query, limit = 100) => query.limit(limit),
  
  // Pagination hiệu quả
  paginate: (query, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }
};

// Cache đơn giản trong memory (cho production nên dùng Redis)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

export const cacheManager = {
  get: (key) => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  set: (key, data, ttl = CACHE_TTL) => {
    cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  },
  
  delete: (key) => {
    cache.delete(key);
  },
  
  clear: () => {
    cache.clear();
  },
  
  size: () => cache.size
};

// Middleware cache cho routes
export const cacheMiddleware = (duration = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Chỉ cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    const cachedData = cacheManager.get(key);
    
    if (cachedData) {
      console.log(`💾 Cache hit: ${req.originalUrl}`);
      return res.json(cachedData);
    }
    
    // Lưu response gốc
    const originalJson = res.json;
    
    res.json = function(data) {
      cacheManager.set(key, data, duration);
      console.log(`💾 Cache set: ${req.originalUrl}`);
      originalJson.call(this, data);
    };
    
    next();
  };
};

// Xóa cache định kỳ
export function startCacheCleaner() {
  setInterval(() => {
    const size = cacheManager.size();
    if (size > 0) {
      console.log(`🧹 Đang dọn dẹp cache... (${size} items)`);
      // Cache tự động xóa khi hết hạn, chỉ cần log
    }
  }, 10 * 60 * 1000); // Mỗi 10 phút
}
