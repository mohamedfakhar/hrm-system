const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  employee_code: {
    type: String,
    unique: true,
    sparse: true
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  job_role: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true
  },
  department: {
    type: String,
    default: null,
    trim: true
  },
  basic_salary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary cannot be negative']
  },
  annual_leave_balance: {
    type: Number,
    default: 21,
    min: [0, 'Leave balance cannot be negative']
  },
  hire_date: {
    type: Date,
    required: [true, 'Hire date is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    default: null,
    trim: true
  },
  profile_picture: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Auto generate employee code before saving (handles concurrent/deleted sequence gaps)
employeeSchema.pre('save', async function () {
  if (!this.employee_code) {
    const lastEmployee = await mongoose.model('Employee')
      .findOne({ employee_code: /^EMP\d+$/ })
      .sort({ employee_code: -1 })
      .select('employee_code')
      .lean();

    let nextNum = 1;
    if (lastEmployee && lastEmployee.employee_code) {
      const match = lastEmployee.employee_code.match(/^EMP(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    this.employee_code = `EMP${String(nextNum).padStart(4, '0')}`;
  }
});

// Indexes for department filtering and name resolution
employeeSchema.index({ department: 1 });
employeeSchema.index({ full_name: 1 });

module.exports = mongoose.model('Employee', employeeSchema);