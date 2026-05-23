import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiMessageCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatBox({ orderId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const { user } = useSelector((s) => s.auth);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Kết nối Socket.io
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join room của đơn hàng
    newSocket.emit('join-order', orderId);

    // Lắng nghe tin nhắn mới
    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Fetch tin nhắn cũ
    fetchMessages();

    return () => {
      newSocket.disconnect();
    };
  }, [orderId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/order/${orderId}`);
      const data = await response.json();
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !user) return;

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          senderId: user._id,
          senderRole: user.role || 'user',
          message: messageText,
          type: 'text'
        })
      });

      if (response.ok) {
        // Tin nhắn sẽ được thêm vào qua socket event
        scrollToBottom();
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiMessageCircle className="text-2xl" />
          <div>
            <h3 className="font-bold">Chat đơn hàng</h3>
            <p className="text-xs text-white/80">#{orderId.slice(-8)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all"
        >
          <FiX />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} currentUserId={user?._id} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} />
    </motion.div>
  );
}
