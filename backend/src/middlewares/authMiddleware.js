  const jwt = require('jsonwebtoken');

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

  exports.isHR = (req, res, next) => {
    console.log(' Checking HR role:', req.user.role); 
    
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      console.log(' Access denied - Role:', req.user.role);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    console.log(' HR/Admin access granted');
    next();
  };