import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import cron from 'node-cron'
import rateLimit from 'express-rate-limit'
import { uploadToCloud } from './utils/cloudinary.js'
import authRoutes from './routes/auth.js'
import restaurantRoutes from './routes/restaurants.js'
import orderRoutes from './routes/orders.js'
import partnerRoutes from './routes/partner.js'
import settingRoutes from './routes/settings.js'
import notificationRoutes from './routes/notifications.js'
import analyticsRoutes from './routes/analytics.js'
import reviewRoutes from './routes/reviews.js'
import favoriteRoutes from './routes/favorites.js'
import shipperRoutes from './routes/shipper.js'
import { startVoucherExpiryJob } from './services/voucherExpiry.js'
import messageRoutes from './routes/messages.js'
import paymentRoutes from './routes/payment.js'
import chatbotRoutes from './routes/chatbot.js'
import voucherRoutes from './routes/vouchers.js'
import { checkExpiringSubscriptions, checkOnStartup } from './utils/subscriptionChecker.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger, cleanOldLogs } from './middleware/logger.js'
import { optimizeMongoConnection, ensureIndexes, startCacheCleaner } from './utils/dbOptimizer.js'
import { sanitizeInput } from './middleware/validation.js'

import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

// Debug thư mục dist
const distPath = path.join(__dirname, '..', 'dist')
console.log('🔍 [Debug Deploy] NODE_ENV:', process.env.NODE_ENV)
console.log('🔍 [Debug Deploy] __dirname:', __dirname)
console.log('🔍 [Debug Deploy] Thư mục dist tồn tại không?:', fs.existsSync(distPath))
if (fs.existsSync(distPath)) {
  console.log('🔍 [Debug Deploy] Các file trong dist:', fs.readdirSync(distPath))
} else {
  console.log('🔍 [Debug Deploy] Các thư mục ở gốc dự án:', fs.readdirSync(path.join(__dirname, '..')))
}

const app = express()
// Trust proxy (Render, Heroku, etc.) để req.protocol trả về 'https' đúng
app.set('trust proxy', 1)
const httpServer = createServer(app)
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || '*']
  : ['http://localhost:3000', 'http://localhost:5173']

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
})

// Store Socket.io instance on express app to prevent circular imports
app.set('io', io)

// Middleware tự động chuyển đổi URL localhost:5000 thành host hiện tại của server
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object') {
      const host = req.get('host');
      const protocol = req.protocol;
      const currentOrigin = `${protocol}://${host}`;
      
      // Chuyển đối tượng JSON thành chuỗi để thay thế hàng loạt URL localhost:5000
      let jsonString = JSON.stringify(body);
      if (jsonString.includes('http://localhost:5000')) {
        jsonString = jsonString.replace(/http:\/\/localhost:5000/g, currentOrigin);
        try {
          const updatedBody = JSON.parse(jsonString);
          return originalJson.call(this, updatedBody);
        } catch (e) {
          console.error('Error parsing response body after URL replacement:', e);
        }
      }
    }
    return originalJson.call(this, body);
  };
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Middleware logging
app.use(requestLogger)

// Middleware sanitize input để tránh XSS
app.use(sanitizeInput)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (tăng lên cho development)
  message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút'
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 login attempts per 15 minutes (dev mode)
  message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
})

app.use('/api/', limiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// Serve static files from uploads directory (local dev fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ===== UPLOAD ENDPOINT =====
// Production: dùng Cloudinary (cloud storage - tránh mất ảnh khi Render restart)
// Development: nếu không có Cloudinary config, dùng local disk
if (process.env.CLOUDINARY_CLOUD_NAME) {
  // === Cloudinary upload (Production) ===
  app.post('/api/upload', uploadToCloud.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được upload!' })
      }
      // Cloudinary trả về URL public trực tiếp trong req.file.path
      const imageUrl = req.file.path
      res.json({
        message: 'Upload thành công!',
        imageUrl: imageUrl,
        filename: req.file.filename
      })
    } catch (error) {
      res.status(500).json({ message: 'Lỗi upload file', error: error.message })
    }
  })
} else {
  // === Local disk upload (Development) ===
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, path.join(__dirname, 'uploads')) },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  })
  const localUpload = multer({
    storage: localStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true)
      else cb(new Error('Chỉ chấp nhận file ảnh!'), false)
    }
  })
  app.post('/api/upload', localUpload.single('image'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Không có file nào được upload!' })
      const baseUrl = 'http://localhost:5000'
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`
      res.json({ message: 'Upload thành công!', imageUrl, filename: req.file.filename })
    } catch (error) {
      res.status(500).json({ message: 'Lỗi upload file', error: error.message })
    }
  })
}

// Database Connection
optimizeMongoConnection()

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('📦 Connected to MongoDB Atlas')
    
    // Tạo indexes cho tất cả models
    await ensureIndexes()
    
    // Kiểm tra subscription ngay khi khởi động
    checkOnStartup(io)
    
    // Xóa log cũ
    cleanOldLogs()
    
    // Bắt đầu cache cleaner
    startCacheCleaner()
  })
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/partner', partnerRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/vouchers', voucherRoutes)
app.use('/api/shipper', shipperRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodServe API is running 🚀' })
})

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(frontendPath))
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(frontendPath, 'index.html'))
    }
  })
}

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Join user room for personal notifications
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`)
    console.log(`User ${userId} joined their notification room`)
  })

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`)
  })

  socket.on('update-order-status', (data) => {
    io.to(`order-${data.orderId}`).emit('order-status-updated', data)
  })

  socket.on('new-message', (data) => {
    io.to(`order-${data.orderId}`).emit('message-received', data)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`🚀 FoodServe API running on http://localhost:${PORT}`)
  console.log(`📡 Socket.io ready`)
  
  // Cron job: Kiểm tra subscription mỗi ngày lúc 9:00 sáng
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Running daily subscription check...')
    checkExpiringSubscriptions(io)
  })
  
  console.log('⏰ Subscription checker scheduled (daily at 9:00 AM)')
  
  // Khởi động voucher expiry job
  startVoucherExpiryJob(io)
})
