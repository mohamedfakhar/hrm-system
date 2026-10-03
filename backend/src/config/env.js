require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_system',
  jwtSecret: process.env.JWT_SECRET || 'hrm_access_secret_key_2024',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'hrm_refresh_secret_key_2024_different',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
