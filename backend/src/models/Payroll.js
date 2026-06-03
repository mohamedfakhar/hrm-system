const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basic_salary: {
    type: Number,
    required: true
  },
  working_days: {
    type: Number,
    default: 0
  },
  present_days: {
    type: Number,
    default: 0
  },
  absent_days: {
    type: Number,
    default: 0
  },
  late_hours: {
    type: Number,
    default: 0
  },
  late_deduction: {
    type: Number,
    default: 0
  },
  absent_deduction: {
    type: Number,
    default: 0
  },
  bonuses: {
    type: Number,
    default: 0
  },
  total_deductions: {
    type: Number,
    default: 0
  },
  net_salary: {
    type: Number,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paid_at: {
    type: Date,
    default: null
  }
}, { timestamps: true });

payrollSchema.index({ employee_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);