import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import restaurantRoutes from './routes/restaurants.js'
import orderRoutes from './routes/orders.js'
import partnerRoutes from './routes/partner.js'
import settingRoutes from './routes/settings.js'

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

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('📦 Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/partner', partnerRoutes)
app.use('/api/settings', settingRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodServe API is running 🚀' })
})

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

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
})
