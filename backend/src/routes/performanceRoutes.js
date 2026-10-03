const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');

// All routes require valid JWT authentication
router.use(authenticate);

// Employee access: finalized personal evaluations
router.get('/me', performanceController.getMyEvaluations);

// HR/Admin: Preview live attendance metrics before submitting
router.get('/preview-attendance', isHR, performanceController.getAttendancePreview);

// HR/Admin: List all evaluations with filters
router.get('/', isHR, performanceController.getAllEvaluations);

// HR/Admin: Get evaluation history of specific employee
router.get('/employee/:employeeId', isHR, performanceController.getEmployeeEvaluations);

// Single evaluation detail (HR or employee own finalized)
router.get('/:id', performanceController.getEvaluationById);

// HR/Admin: Create new evaluation (draft or finalized)
router.post('/', isHR, performanceController.createEvaluation);

// HR/Admin: Update draft evaluation
router.put('/:id', isHR, performanceController.updateEvaluation);

// HR/Admin: Finalize evaluation (supports POST & PATCH)
router.post('/:id/finalize', isHR, performanceController.finalizeEvaluation);
router.patch('/:id/finalize', isHR, performanceController.finalizeEvaluation);

// HR/Admin: Delete draft evaluation
router.delete('/:id', isHR, performanceController.deleteEvaluation);

module.exports = router;
