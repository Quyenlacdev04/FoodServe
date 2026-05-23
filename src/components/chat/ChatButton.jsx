import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import ChatBox from './ChatBox';

export default function ChatButton({ orderId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (orderId && user) {
      fetchUnreadCount();
    }
  }, [orderId, user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/unread/${user._id}`);
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpen}
          className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:shadow-orange-500/50 transition-all"
        >
          <FiMessageCircle className="text-2xl" />
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </motion.button>
      )}

      {/* Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <ChatBox orderId={orderId} onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
