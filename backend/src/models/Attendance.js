const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required']
  },
  check_in: {
    type: String,
    default: null
  },
  check_out: {
    type: String,
    default: null
  },
  working_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  late_minutes: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day'],
    default: 'absent'
  },
  notes: {
    type: String,
    default: null
  }
}, { timestamps: true });

attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);