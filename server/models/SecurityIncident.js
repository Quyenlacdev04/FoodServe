import mongoose from 'mongoose';

const securityIncidentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['sql_injection', 'xss', 'brute_force', 'ddos', 'path_traversal', 'suspicious_activity', 'rate_limit_exceeded', 'unauthorized_access']
  },
  severity: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['detected', 'analyzing', 'fixed', 'ignored'],
    default: 'detected'
  },
  description: { type: String, required: true },
  details: {
    ip: String,
    userId: String,
    endpoint: String,
    method: String,
    payload: mongoose.Schema.Types.Mixed,
    userAgent: String,
    headers: mongoose.Schema.Types.Mixed
  },
  aiAnalysis: {
    threatLevel: Number, // 0-100
    recommendation: String,
    autoFixAvailable: { type: Boolean, default: false },
    fixScript: String,
    affectedFiles: [String],
    suggestedActions: [String]
  },
  attackPattern: {
    count: { type: Number, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    blocked: { type: Boolean, default: false }
  },
  resolution: {
    fixedAt: Date,
    fixedBy: String, // Admin ID
    fixMethod: String, // 'auto' | 'manual'
    fixDetails: String,
    successful: Boolean
  }
}, { timestamps: true });

// Indexes
securityIncidentSchema.index({ type: 1, status: 1 });
securityIncidentSchema.index({ severity: 1, createdAt: -1 });
securityIncidentSchema.index({ status: 1, createdAt: -1 });
securityIncidentSchema.index({ 'details.ip': 1 });
securityIncidentSchema.index({ 'attackPattern.blocked': 1 });

export default mongoose.model('SecurityIncident', securityIncidentSchema);
