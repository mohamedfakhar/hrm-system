const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');

// All recommendation endpoints are strictly restricted to authenticated HR and Admin users
router.use(authenticate, isHR);

// List all recommendations with optional filters (type, status, employee_id)
router.get('/', recommendationController.getRecommendations);

// Summary counts for dashboard KPI cards
router.get('/stats', recommendationController.getRecommendationStats);

// Single recommendation detail
router.get('/:id', recommendationController.getRecommendationById);

// Trigger recommendation scan
router.post('/generate', recommendationController.generateRecommendations);

// Accept recommendation (supports POST and PATCH)
router.post('/:id/accept', recommendationController.acceptRecommendation);
router.patch('/:id/accept', recommendationController.acceptRecommendation);

// Reject recommendation (supports POST and PATCH)
router.post('/:id/reject', recommendationController.rejectRecommendation);
router.patch('/:id/reject', recommendationController.rejectRecommendation);

module.exports = router;
