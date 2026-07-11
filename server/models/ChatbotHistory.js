import mongoose from 'mongoose';

const ChatbotHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  dishes: {
    type: Array,
    default: []
  },
  source: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('ChatbotHistory', ChatbotHistorySchema);
