const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  token: {
    type: String,
    required: true
  },

  expires_at: {
    type: Date,
    required: true
  },

  is_revoked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);