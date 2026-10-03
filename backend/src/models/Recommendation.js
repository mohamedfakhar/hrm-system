const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['bonus_consideration', 'promotion_review', 'recognition', 'support_check_in'],
    required: [true, 'Recommendation type is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Recommendation title is required'],
    trim: true
  },
  summary: {
    type: String,
    required: [true, 'Recommendation summary is required'],
    trim: true
  },
  rationale: {
    type: [String],
    default: []
  },
  supporting_data: {
    tenure_months: { type: Number, default: null },
    performance_score: { type: Number, default: null },
    performance_grade: { type: String, default: null },
    skill_score: { type: Number, default: null },
    attendance_score: { type: Number, default: null },
    punctuality_rate: { type: Number, default: null },
    late_days: { type: Number, default: null },
    total_late_minutes: { type: Number, default: null },
    unexcused_absences: { type: Number, default: null },
    open_anomalies: { type: Number, default: 0 },
    high_severity_anomalies: { type: Number, default: 0 },
    last_evaluation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PerformanceEvaluation',
      default: null
    },
    last_evaluation_period: { type: String, default: null }
  },
  rule_code: {
    type: String,
    required: [true, 'Rule code is required'],
    trim: true
  },
  rule_version: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['suggested', 'accepted', 'rejected'],
    default: 'suggested',
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
  review_notes: {
    type: String,
    default: null,
    trim: true
  }
}, { timestamps: true });

// Targeted compound indexes for fast query filtering and deduplication checks
recommendationSchema.index({ employee_id: 1, rule_code: 1, status: 1 });
recommendationSchema.index({ status: 1, type: 1 });
recommendationSchema.index({ createdAt: -1, status: 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
