const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');
// Public routes
router.post('/register', authController.register);
router.post('/login',  authController.login);
router.post('/refresh', authController.refreshToken); 
router.post('/logout',  authController.logout);    

// Admin only 
router.post('/add-hr', authenticate, isAdmin, authController.addHR);

// Protected routes
router.get('/me', authenticate, authController.getMe);
console.log(authenticate);
console.log(authController.getMe);
module.exports = router;