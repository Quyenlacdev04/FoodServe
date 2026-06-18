import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { FiSend, FiRefreshCw, FiShoppingCart } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { addToCart } from '../../store/slices/cartSlice'
import toast from 'react-hot-toast'

const QUICK_QUESTIONS = [
  '🌤️ Trời nóng nên ăn gì?',
  '🌧️ Trời mưa ăn gì ngon?',
  '😴 Đang mệt nên ăn gì?',
  '☀️ Gợi ý bữa sáng',
  '🍱 Bữa trưa ăn gì?',
  '🌙 Tối nay ăn gì?',
  '💰 Món ngon giá rẻ',
]

// Render text có **bold**
function renderText(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-primary-500 dark:text-primary-400">{part.slice(2, -2)}</strong>
    }
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
    ))
  })
}

// Card món ăn gợi ý
function DishCard({ dish, onOrder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 bg-white dark:bg-dark-200 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{dish.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-primary-500 font-bold text-xs">{Number(dish.price).toLocaleString('vi-VN')}đ</span>
          {dish.restaurant && (
            <span className="text-gray-400 text-xs truncate">• {dish.restaurant}</span>
          )}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onOrder(dish)}
        className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 shadow-sm"
      >
        <FiShoppingCart size={12} />
        Đặt ngay
      </motion.button>
    </motion.div>
  )
}

export default function FoodBot() {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Xin chào **${user?.name?.split(' ').pop() || 'bạn'}** 👋 Mình là **FoodBot** - trợ lý gợi ý món ăn!\n\nHãy mô tả tâm trạng hoặc thời tiết, mình sẽ gợi ý món phù hợp và bạn có thể **đặt ngay** từ đây! 🍽️`,
      time: new Date(),
      dishes: []
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Conversation state for auto-order flow
  const [conversationState, setConversationState] = useState({
    orderIntent: null,      // { dishId, dishName, quantity, price }
    address: null,
    phone: null,
    paymentMethod: null,
    step: 'idle'           // idle, order_intent, ask_address, ask_phone, ask_payment, confirm
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle creating order via chatbot
  const handleCreateOrder = async (orderData) => {
    try {
      const res = await fetch('http://localhost:5000/api/chatbot/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          dishId: orderData.dishId,
          quantity: orderData.quantity || 1,
          address: orderData.address,
          phone: orderData.phone,
          paymentMethod: orderData.paymentMethod,
          note: orderData.note || ''
        })
      })

      const data = await res.json()

      if (data.success) {
        // Add success message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${data.message}\n\n📦 Mã đơn: #${data.order.orderId.slice(-6).toUpperCase()}\n💰 Tổng tiền: ${Number(data.order.totalAmount).toLocaleString('vi-VN')}đ\n\nBạn có thể theo dõi đơn hàng trong mục **"Đơn hàng của tôi"** 🚀`,
          time: new Date()
        }])

        // Reset conversation state
        setConversationState({
          orderIntent: null,
          address: null,
          phone: null,
          paymentMethod: null,
          step: 'idle'
        })

        // Show success toast
        toast.success('🎉 Đặt hàng thành công qua Chatbot!', {
          duration: 5000
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error('❌ Lỗi khi đặt hàng: ' + error.message)
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '😔 Xin lỗi, có lỗi khi đặt hàng. Bạn có thể thử lại hoặc đặt qua trang chủ nhé!',
        time: new Date()
      }])

      // Reset state on error
      setConversationState({
        orderIntent: null,
        address: null,
        phone: null,
        paymentMethod: null,
        step: 'idle'
      })
    }
  }

  const handleOrder = (dish) => {
    if (dish.restaurantId) {
      // Thêm vào giỏ hàng
      dispatch(addToCart({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        restaurantId: dish.restaurantId,
        image: dish.image || ''
      }))
      toast.success(`Đã thêm "${dish.name}" vào giỏ hàng! 🛒`, {
        icon: '🍽️',
        duration: 3000
      })
      // Chuyển đến trang nhà hàng
      navigate(`/restaurant/${dish.restaurantId}`)
    } else {
      navigate('/')
    }
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    const userMsg = { role: 'user', content: msg, time: new Date(), dishes: [] }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: msg, 
          history, 
          userId: user?._id,
          conversationState // Send current conversation state
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Add bot response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply || 'Đây là gợi ý cho bạn!',
          dishes: data.dishes || [],
          time: new Date(),
          source: data.source
        }])

        // Handle bot response tags
        handleBotResponse(data, msg)
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '😔 Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé!',
          dishes: [],
          time: new Date()
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '😔 Không kết nối được server. Vui lòng kiểm tra lại!',
        dishes: [],
        time: new Date()
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Handle bot response and update conversation state
  const handleBotResponse = (data, userMessage) => {
    // 1. Order intent detected
    if (data.orderIntent) {
      setConversationState(prev => ({
        ...prev,
        orderIntent: data.orderIntent,
        step: 'order_intent'
      }))
    }

    // 2. Bot asking for address
    if (data.askAddress) {
      setConversationState(prev => ({
        ...prev,
        step: 'ask_address'
      }))
    }

    // 3. Bot asking for phone
    if (data.askPhone) {
      // Save the address from user's previous message
      if (conversationState.step === 'ask_address') {
        setConversationState(prev => ({
          ...prev,
          address: userMessage,
          step: 'ask_phone'
        }))
      } else {
        setConversationState(prev => ({
          ...prev,
          step: 'ask_phone'
        }))
      }
    }

    // 4. Bot asking for payment
    if (data.askPayment) {
      // Save the phone from user's previous message
      if (conversationState.step === 'ask_phone') {
        setConversationState(prev => ({
          ...prev,
          phone: userMessage,
          step: 'ask_payment'
        }))
      } else {
        setConversationState(prev => ({
          ...prev,
          step: 'ask_payment'
        }))
      }
    }

    // 5. Create order
    if (data.createOrder) {
      handleCreateOrder(data.createOrder)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Xin chào **${user?.name?.split(' ').pop() || 'bạn'}** 👋 Bắt đầu cuộc trò chuyện mới!\n\nBạn muốn ăn gì hôm nay? 🍽️`,
      time: new Date(),
      dishes: []
    }])
    // Reset conversation state
    setConversationState({
      orderIntent: null,
      address: null,
      phone: null,
      paymentMethod: null,
      step: 'idle'
    })
  }

  return (
    <div className="flex flex-col h-[640px] bg-white dark:bg-dark-200 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-orange-400 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🤖</div>
          <div>
            <h3 className="font-bold text-white text-sm">FoodBot AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              <span className="text-white/80 text-xs">Gợi ý & đặt món ngay</span>
            </div>
          </div>
        </div>
        <button onClick={resetChat} title="Cuộc trò chuyện mới"
          className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white">
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* Order Progress Bar */}
      {conversationState.step !== 'idle' && conversationState.orderIntent && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 bg-primary-50 dark:bg-primary-900/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              🛒 Đang đặt: {conversationState.orderIntent.dishName}
            </span>
            <button 
              onClick={() => {
                setConversationState({
                  orderIntent: null,
                  address: null,
                  phone: null,
                  paymentMethod: null,
                  step: 'idle'
                })
                toast.success('Đã hủy đơn hàng')
              }}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Hủy
            </button>
          </div>
          <div className="flex gap-1">
            {['order_intent', 'ask_address', 'ask_phone', 'ask_payment', 'confirm'].map((step, idx) => (
              <div 
                key={step}
                className={`flex-1 h-1 rounded-full transition-all ${
                  ['order_intent', 'ask_address', 'ask_phone', 'ask_payment', 'confirm'].indexOf(conversationState.step) >= idx
                    ? 'bg-primary-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>{conversationState.address && '✓ Địa chỉ'}</span>
            <span>{conversationState.phone && '✓ SĐT'}</span>
            <span>{conversationState.paymentMethod && '✓ Thanh toán'}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-sm flex-shrink-0 mt-1 shadow-sm">
                  🤖
                </div>
              )}

              <div className={`max-w-[82%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Bubble text */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-dark-100 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                }`}>
                  {renderText(msg.content)}
                </div>

                {/* Dish cards */}
                {msg.dishes && msg.dishes.length > 0 && (
                  <div className="w-full space-y-2">
                    {msg.dishes.map((dish, di) => (
                      <DishCard key={di} dish={dish} onOrder={handleOrder} />
                    ))}
                    <p className="text-xs text-gray-400 text-center pt-1">
                      💡 Click "Đặt ngay" để thêm vào giỏ và xem nhà hàng
                    </p>
                  </div>
                )}

                <span className="text-xs text-gray-400 px-1">
                  {msg.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  {msg.source === 'groq' && ' • AI ✨'}
                </span>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1 shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-sm">🤖</div>
            <div className="bg-gray-100 dark:bg-dark-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 bg-primary-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && !loading && conversationState.step === 'idle' && (
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-xs text-gray-400 mb-2">💡 Gợi ý nhanh:</p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_QUESTIONS.slice(0, 4).map(q => (
              <button key={q} onClick={() => sendMessage(q)} disabled={loading}
                className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 transition-colors border border-primary-200 dark:border-primary-800 disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Payment Method Buttons */}
      {conversationState.step === 'ask_payment' && !loading && (
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-xs text-gray-400 mb-2">💳 Chọn nhanh phương thức:</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { method: 'cash', label: '💵 Tiền mặt', value: 'tiền mặt' },
              { method: 'momo', label: '🟣 MoMo', value: 'momo' },
              { method: 'coins', label: '🪙 Xu', value: 'xu' }
            ].map(pm => (
              <button 
                key={pm.method}
                onClick={() => {
                  setInput(pm.value)
                  // Auto send after short delay
                  setTimeout(() => {
                    sendMessage(pm.value)
                  }, 100)
                }}
                className="text-xs px-3 py-2 bg-white dark:bg-dark-100 border-2 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all font-medium"
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Use Saved Address Button */}
      {conversationState.step === 'ask_address' && !loading && user?.address && (
        <div className="px-4 pb-2 flex-shrink-0">
          <button
            onClick={() => {
              setInput(user.address)
              setTimeout(() => {
                sendMessage(user.address)
              }, 100)
            }}
            className="w-full text-xs px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-100 transition-colors font-medium flex items-center justify-center gap-2"
          >
            📍 Dùng địa chỉ đã lưu: {user.address.slice(0, 40)}...
          </button>
        </div>
      )}

      {/* Use Saved Phone Button */}
      {conversationState.step === 'ask_phone' && !loading && user?.phone && (
        <div className="px-4 pb-2 flex-shrink-0">
          <button
            onClick={() => {
              setInput(user.phone)
              setTimeout(() => {
                sendMessage(user.phone)
              }, 100)
            }}
            className="w-full text-xs px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-100 transition-colors font-medium flex items-center justify-center gap-2"
          >
            📞 Dùng SĐT đã lưu: {user.phone}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi FoodBot... (VD: trời nóng nên ăn gì?)"
            rows={1}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 text-gray-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow disabled:opacity-50 max-h-24"
            style={{ minHeight: '44px' }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <FiSend size={18} />
          </motion.button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">Enter để gửi • Shift+Enter xuống dòng</p>
      </div>
    </div>
  )
}
