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
import authRoutes from './routes/auth.js'
import restaurantRoutes from './routes/restaurants.js'
import orderRoutes from './routes/orders.js'
import partnerRoutes from './routes/partner.js'
import settingRoutes from './routes/settings.js'
import notificationRoutes from './routes/notifications.js'
import { checkExpiringSubscriptions, checkOnStartup } from './utils/subscriptionChecker.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: ['http://localhost:3000', 'http://localhost:5173'], methods: ['GET', 'POST'] }
})

// Store Socket.io instance on express app to prevent circular imports
app.set('io', io)

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh!'), false)
    }
  }
})

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được upload!' })
    }
    
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`
    res.json({ 
      message: 'Upload thành công!', 
      imageUrl: imageUrl,
      filename: req.file.filename
    })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi upload file', error: error.message })
  }
})

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('📦 Connected to MongoDB Atlas')
    // Kiểm tra subscription ngay khi khởi động
    checkOnStartup(io)
  })
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/partner', partnerRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodServe API is running 🚀' })
})

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
})
