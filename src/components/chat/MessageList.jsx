import { motion } from 'framer-motion';

export default function MessageList({ messages, currentUserId }) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-sm">Chưa có tin nhắn nào</p>
        <p className="text-xs mt-1">Hãy gửi tin nhắn đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        const isOwn = message.senderId._id === currentUserId || message.senderId === currentUserId;
        const sender = message.senderId;
        const senderName = typeof sender === 'object' ? sender.name : 'User';

        return (
          <motion.div
            key={message._id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
              {/* Sender name */}
              {!isOwn && (
                <div className="text-xs text-gray-500 mb-1 px-2">
                  {senderName}
                  {message.senderRole === 'merchant' && ' 🍳'}
                  {message.senderRole === 'shipper' && ' 🛵'}
                  {message.senderRole === 'admin' && ' 👑'}
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-gradient-primary text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.message}
                </p>
              </div>

              {/* Time */}
              <div className="text-[10px] text-gray-400 mt-1 px-2">
                {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
