const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');

// All payroll routes require authentication
router.use(authenticate);

// HR/Admin: Generate monthly payroll
router.post('/generate', isHR, payrollController.generatePayroll);

// HR/Admin: Get all payroll records with optional month/year filter
router.get('/', isHR, payrollController.getAllPayroll);

// Authenticated Employee: Get personal payroll records
router.get('/me', payrollController.getMyPayroll);

// HR/Admin: Mark a payroll record as paid (supports PUT & PATCH)
router.put('/:id/pay', isHR, payrollController.markAsPaid);
router.patch('/:id/pay', isHR, payrollController.markAsPaid);

module.exports = router;