const jwt = require('jsonwebtoken');

//  Verify Token 
exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

//  HR or Admin 
exports.isHR = (req, res, next) => {
  if (req.user.role !== 'hr' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: HR only' });
  }
  next();
};

//  Admin only 
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }
  next();
};