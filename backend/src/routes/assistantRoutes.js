const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');

// All assistant routes require authentication and HR/Admin privileges
router.use(authenticate, isHR);

// POST /api/intelligence/assistant/chat
router.post('/chat', assistantController.chat);

// GET /api/intelligence/assistant/logs
router.get('/logs', assistantController.getLogs);

module.exports = router;
