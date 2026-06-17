const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post("/refresh-token", authController.refreshToken);

// Protected routes
router.get('/test-role', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: `You are logged in as ${req.user.role}`
  });
});

module.exports = router;