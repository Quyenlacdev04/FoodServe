import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSend, FiMessageCircle, FiChevronLeft } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

// Avatar
function Avatar({ user, size = 8 }) {
  const s = `w-${size} h-${size}`;
  if (user?.avatar) return <img src={user.avatar} alt="" className={`${s} rounded-full object-cover`} />;
  const role = user?.role || user?.senderRole;
  const icon = role === 'shipper' ? '🛵' : role === 'merchant' ? '🍳' : role === 'admin' ? '👑' : '👤';
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {icon}
    </div>
  );
}

export default function ChatBox({ orderId, orderInfo, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const { user } = useSelector((s) => s.auth);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    // Kết nối Socket.io
    const sock = io('http://localhost:5000');
    setSocket(sock);

    // Join room đơn hàng
    sock.emit('join-order', orderId);
    sock.emit('join-user', user?._id);

    // Nhận tin mới real-time
    sock.on('new-message', (msg) => {
      setMessages(prev => {
        // Tránh duplicate
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    });

    fetchMessages();

    return () => sock.disconnect();
  }, [orderId]);

  const fetchMessages = async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/messages/order/${orderId}`);
      const data = await res.json();
      setMessages(data.messages || []);
      scrollToBottom(true);

      // Mark all as read
      if (user?._id) {
        fetch(`http://localhost:5000/api/messages/order/${orderId}/read-all`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user._id })
        }).catch(() => {});
      }
    } catch {}
    finally { setLoading(false); }
  };

  const scrollToBottom = (instant = false) => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
    }, 80);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || !orderId || !user || sending) return;

    setSending(true);
    setText('');

    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          senderId: user._id || user.id,
          senderRole: user.role || 'user',
          message: msg,
          type: 'text'
        })
      });
      if (!res.ok) {
        // Restore text if failed
        setText(msg);
      }
    } catch {
      setText(msg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Xác định tên đối thoại
  const getPartnerLabel = () => {
    if (!user) return 'Chat';
    if (user.role === 'shipper') return '👤 Khách hàng';
    if (user.role === 'merchant') return '🛵 Tài xế';
    // user thường: nếu có shipper thì chat với shipper, không thì merchant
    return orderInfo?.shipperId ? '🛵 Tài xế' : '🍳 Nhà hàng';
  };

  // Group tin nhắn liên tiếp cùng người
  const groupedMessages = messages.reduce((groups, msg, i) => {
    const prevMsg = messages[i - 1];
    const sameUser = prevMsg && (
      (typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId) ===
      (typeof prevMsg.senderId === 'object' ? prevMsg.senderId._id : prevMsg.senderId)
    );
    const timeDiff = prevMsg ? (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) / 1000 : 999;
    if (sameUser && timeDiff < 120) {
      groups[groups.length - 1].push(msg);
    } else {
      groups.push([msg]);
    }
    return groups;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed bottom-4 right-4 w-[360px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-100"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all shrink-0">
          <FiX className="text-white" size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm">{getPartnerLabel()}</div>
          <div className="text-white/70 text-xs truncate">
            {orderId ? `Đơn #${orderId.slice(-8).toUpperCase()}` : 'Không có đơn hàng'}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/70 text-xs">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : !orderId ? (
          <div className="text-center py-16">
            <FiMessageCircle className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Không có đơn hàng để chat</p>
            <p className="text-gray-300 text-xs mt-1">Nhận đơn hàng trước khi nhắn tin</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <FiMessageCircle className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">Bắt đầu cuộc trò chuyện</p>
            <p className="text-gray-300 text-xs mt-1">Nhắn tin cho {getPartnerLabel()}</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, gi) => {
              const firstMsg = group[0];
              const sender = firstMsg.senderId;
              const senderId = typeof sender === 'object' ? sender?._id : sender;
              const myId = user?._id || user?.id;
              const isOwn = senderId === myId;
              const senderName = typeof sender === 'object' ? sender?.name : null;
              const senderRole = firstMsg.senderRole || (typeof sender === 'object' ? sender?.role : null);

              return (
                <div key={gi} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                  {/* Avatar người khác */}
                  {!isOwn && (
                    <div className="w-8 h-8 shrink-0 mt-auto">
                      <Avatar user={typeof sender === 'object' ? sender : { role: senderRole }} size={8} />
                    </div>
                  )}

                  <div className={`flex flex-col gap-0.5 max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Tên người gửi */}
                    {!isOwn && (
                      <span className="text-[10px] text-gray-400 px-2 mb-0.5">
                        {senderName || (senderRole === 'shipper' ? '🛵 Tài xế' : senderRole === 'merchant' ? '🍳 Nhà hàng' : '👤 Khách')}
                      </span>
                    )}

                    {/* Bubble nhóm */}
                    {group.map((msg, mi) => {
                      const isFirst = mi === 0;
                      const isLast = mi === group.length - 1;
                      return (
                        <div key={msg._id || mi}
                          className={`px-3.5 py-2 text-sm max-w-full break-words ${
                            isOwn
                              ? `bg-primary-500 text-white ${isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-lg'}`
                              : `bg-white text-gray-800 border border-gray-100 shadow-sm ${isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-lg'}`
                          }`}>
                          {msg.message}
                        </div>
                      );
                    })}

                    {/* Timestamp của nhóm */}
                    <span className="text-[10px] text-gray-400 px-1">
                      {new Date(group[group.length - 1].createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={orderId ? 'Nhập tin nhắn...' : 'Cần có đơn hàng để chat'}
          disabled={!orderId || sending}
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        <motion.button
          type="submit"
          disabled={!text.trim() || !orderId || sending}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <FiSend size={16} />
          }
        </motion.button>
      </form>
    </motion.div>
  );
}
