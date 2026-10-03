const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required']
  },
  leave_type: {
    type: String,
    enum: ['annual', 'sick', 'emergency', 'unpaid'],
    required: [true, 'Leave type is required']
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  days_count: {
    type: Number,
    required: [true, 'Days count is required'],
    min: [1, 'Leave must be at least 1 day']
  },
  reason: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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
  rejection_reason: {
    type: String,
    default: null
  }
}, { timestamps: true });

LeaveRequestSchema.index({ employee_id: 1, createdAt: -1 });
LeaveRequestSchema.index({ status: 1 });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);