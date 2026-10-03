const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify Access Token
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists and is active
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated or no longer exists',
        code: 'USER_INACTIVE'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
      code: 'INVALID_TOKEN'
    });
  }
};

// HR or Admin only
exports.isHR = (req, res, next) => {
  if (!req.user || (req.user.role !== 'hr' && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: HR or Admin privilege required',
      code: 'FORBIDDEN'
    });
  }
  next();
};

// Admin only
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privilege required',
      code: 'FORBIDDEN'
    });
  }
  next();
};

// General role check helper
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Requires one of [${roles.join(', ')}]`,
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};