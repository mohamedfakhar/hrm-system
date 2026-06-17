const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['leave_approved', 'leave_rejected', 'salary_paid', 'late_warning', 'info'],
    required: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  related_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  related_type: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);