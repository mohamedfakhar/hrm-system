const mongoose = require('mongoose');

const assistantAuditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  question: {
    type: String,
    required: [true, 'Question prompt is required'],
    trim: true
  },
  intent: {
    type: String,
    default: null,
    trim: true
  },
  tool_name: {
    type: String,
    default: null,
    trim: true
  },
  tool_arguments: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  success: {
    type: Boolean,
    default: true
  },
  response_summary: {
    type: String,
    default: null,
    trim: true
  },
  error_message: {
    type: String,
    default: null,
    trim: true
  },
  execution_time_ms: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

assistantAuditLogSchema.index({ createdAt: -1 });
assistantAuditLogSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('AssistantAuditLog', assistantAuditLogSchema);
