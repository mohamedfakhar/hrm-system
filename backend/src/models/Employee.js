const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  employee_code: {
    type: String,
    uniqe: true,
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,

  },
  job_role: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true,

  },
  department: {
    type: String,
    default: 'null',
    trim: true,
  },
  basic_salary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min:0
  },
  annual_leave_balance: { 
     type: Number,
     default: 21,
      min: 0 
    },

  hire_date: {
    type: Date,
    required: true

  },
  phone_number: {
    type: Number,
    required: true,
    trim: true
  },
  address: {
    type: String,
    default: 'null',
    trim: true
  },
  profile_picture: {
    type: String,
    default: 'none'
  },
},
  { timestamps: true });

  // Auto generate employee code before saving 
employeeSchema.pre('save', async function (next) {
  if (!this.employee_code) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employee_code = `EMP${String(count+1).padStart(4, '0')}`
  }
  next();

})
module.exports = mongoose.model('Employee', employeeSchema);