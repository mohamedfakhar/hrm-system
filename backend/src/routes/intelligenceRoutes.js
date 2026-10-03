const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');

// All intelligence endpoints are strictly restricted to authenticated HR and Admin users
router.use(authenticate, isHR);

// List all anomalies with optional status, severity, domain filters
router.get('/anomalies', intelligenceController.getAnomalies);

// Summary counts for dashboard KPI cards
router.get('/anomalies/stats', intelligenceController.getAnomalyStats);

// Single anomaly detail
router.get('/anomalies/:id', intelligenceController.getAnomalyById);

// Trigger manual anomaly scan
router.post('/anomalies/scan', intelligenceController.runAnomalyScan);

// Review anomaly (POST and PATCH supported)
router.post('/anomalies/:id/review', intelligenceController.reviewAnomaly);
router.patch('/anomalies/:id/review', intelligenceController.reviewAnomaly);

// Dismiss anomaly (POST and PATCH supported)
router.post('/anomalies/:id/dismiss', intelligenceController.dismissAnomaly);
router.patch('/anomalies/:id/dismiss', intelligenceController.dismissAnomaly);

// Smart Recommendations Sub-Router
router.use('/recommendations', require('./recommendationRoutes'));

// HR Smart Assistant Sub-Router
router.use('/assistant', require('./assistantRoutes'));

module.exports = router;
