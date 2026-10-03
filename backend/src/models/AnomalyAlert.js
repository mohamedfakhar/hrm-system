const mongoose = require('mongoose');

const anomalyAlertSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  domain: {
    type: String,
    enum: ['attendance', 'leave', 'payroll'],
    required: [true, 'Anomaly domain is required'],
    index: true
  },
  anomaly_code: {
    type: String,
    required: [true, 'Anomaly code is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Anomaly title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Anomaly description is required'],
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  metrics_snapshot: {
    baseline: { type: mongoose.Schema.Types.Mixed, default: null },
    observed: { type: mongoose.Schema.Types.Mixed, default: null },
    deviation: { type: mongoose.Schema.Types.Mixed, default: null },
    timeframe: { type: String, default: null }
  },
  status: {
    type: String,
    enum: ['open', 'reviewed', 'dismissed'],
    default: 'open',
    index: true
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewed_at: {
    type: Date,
    default: null
  },
  resolution_note: {
    type: String,
    default: null,
    trim: true
  }
}, { timestamps: true });

// Prevent multiple open alerts of the same type for the same employee
anomalyAlertSchema.index({ employee_id: 1, anomaly_code: 1, status: 1 });
anomalyAlertSchema.index({ status: 1, severity: 1 });
anomalyAlertSchema.index({ createdAt: -1, severity: 1 });

module.exports = mongoose.model('AnomalyAlert', anomalyAlertSchema);
