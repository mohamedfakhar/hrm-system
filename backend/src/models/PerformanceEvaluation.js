const mongoose = require('mongoose');

const skillItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  category: {
    type: String,
    default: 'Core',
    trim: true
  },
  score: {
    type: Number,
    required: [true, 'Skill score is required'],
    min: [1, 'Skill score must be at least 1'],
    max: [100, 'Skill score cannot exceed 100']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    max: [1, 'Weight cannot exceed 1'],
    default: 0.25
  }
}, { _id: false });

const performanceEvaluationSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  evaluator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Evaluator ID is required']
  },
  period_type: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    default: 'quarterly',
    required: [true, 'Period type is required']
  },
  period_key: {
    type: String,
    required: [true, 'Period key is required (e.g. 2026-Q1)'],
    trim: true
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  skills: {
    type: [skillItemSchema],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one skill must be evaluated'
    }
  },
  skill_score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  attendance_metrics: {
    total_working_days: { type: Number, default: 0, min: 0 },
    present_days: { type: Number, default: 0, min: 0 },
    late_days: { type: Number, default: 0, min: 0 },
    total_late_minutes: { type: Number, default: 0, min: 0 },
    unexcused_absences: { type: Number, default: 0, min: 0 }
  },
  attendance_score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  formula_version: {
    type: String,
    default: '1.0'
  },
  final_score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    required: true
  },
  feedback: {
    type: String,
    default: '',
    trim: true
  },
  recommendation_note: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'finalized'],
    default: 'draft',
    index: true
  },
  finalized_at: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Prevent duplicate evaluations for same employee and period
performanceEvaluationSchema.index({ employee_id: 1, period_key: 1 }, { unique: true });
performanceEvaluationSchema.index({ period_key: 1, final_score: -1 });
performanceEvaluationSchema.index({ employee_id: 1, status: 1 });

module.exports = mongoose.model('PerformanceEvaluation', performanceEvaluationSchema);
