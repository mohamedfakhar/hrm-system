const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },

  role: {
    type: String,
    enum: ['employee', 'hr', 'admin'],
    default: 'employee'
  },

  is_active: {
    type: Boolean,
    default: true
  },

  last_login: {
    type: Date,
    default: null
  }
}, { timestamps: true });

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);