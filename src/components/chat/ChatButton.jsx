import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import ChatBox from './ChatBox';
import { io } from 'socket.io-client';

export default function ChatButton({ orderId, orderInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useSelector((s) => s.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;

    // Lấy unread count ban đầu
    fetchUnread();

    // Lắng nghe tin nhắn mới real-time để cập nhật badge
    const sock = io('http://localhost:5000');
    socketRef.current = sock;
    sock.emit('join-user', user._id);

    // Khi có tin nhắn mới ở đơn hàng này → tăng badge nếu chat đang đóng
    sock.on('new-message', (msg) => {
      const msgOrderId = msg.orderId?.toString?.() || msg.orderId;
      if (orderId && msgOrderId !== orderId.toString()) return;
      const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
      if (senderId === user._id) return; // Tin nhắn của mình, không đếm
      if (!isOpen) setUnreadCount(p => p + 1);
    });

    return () => sock.disconnect();
  }, [user?._id, orderId]);

  const fetchUnread = async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/messages/unread/${user._id}`);
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    // Mark read ngay khi mở
    if (orderId && user?._id) {
      fetch(`http://localhost:5000/api/messages/order/${orderId}/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      }).catch(() => {});
    }
  };

  // Không render nếu không có orderId (trừ shipper đang active)
  if (!orderId) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-primary-500 to-orange-400 text-white rounded-full shadow-2xl shadow-primary-500/30 flex items-center justify-center z-40 transition-all"
          >
            <FiMessageCircle size={24} />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <ChatBox
            orderId={orderId}
            orderInfo={orderInfo}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
