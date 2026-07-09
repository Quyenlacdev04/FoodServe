import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import FoodBot from '../components/chatbot/FoodBot'

export default function ChatbotPage() {
  const { isAuthenticated } = useSelector(s => s.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 Trợ lý AI - FoodBot
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gợi ý món ăn, lên thực đơn và tự động đặt hàng thông minh.
          </p>
        </div>
        <div className="flex-1 bg-white dark:bg-dark-200 rounded-3xl shadow-card overflow-hidden relative">
          {/* Mở rộng FoodBot để lấp đầy không gian */}
          <div className="absolute inset-0">
             <FoodBot />
          </div>
        </div>
      </div>
    </div>
  )
}
