const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required']
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

notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);