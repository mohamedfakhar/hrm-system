const { isHR, isAdmin, authorize } = require('./authMiddleware');

module.exports = {
  isHR,
  isAdmin,
  authorize
};
