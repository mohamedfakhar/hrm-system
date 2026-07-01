const express = require('express');
const router = express.Router();
const { authenticate, isHR } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.use(authenticate);

// HR + Admin Dashboard Stats
router.get('/hr-stats', isHR, dashboardController.getHRStats);

// Employee Dashboard Stats
router.get('/employee-stats', dashboardController.getEmployeeStats);

module.exports = router;