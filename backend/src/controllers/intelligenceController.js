const anomalyDetectionService = require('../services/anomalyDetectionService');

// GET /api/intelligence/anomalies (HR/Admin)
exports.getAnomalies = async (req, res, next) => {
  try {
    const anomalies = await anomalyDetectionService.getAnomalies(req.query);
    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/intelligence/anomalies/stats (HR/Admin)
exports.getAnomalyStats = async (req, res, next) => {
  try {
    const stats = await anomalyDetectionService.getAnomalyStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/intelligence/anomalies/:id (HR/Admin)
exports.getAnomalyById = async (req, res, next) => {
  try {
    const anomaly = await anomalyDetectionService.getAnomalyById(req.params.id);
    res.json({
      success: true,
      data: anomaly
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/intelligence/anomalies/scan (HR/Admin manual scan)
exports.runAnomalyScan = async (req, res, next) => {
  try {
    const result = await anomalyDetectionService.runAnomalyScan(req.app);
    res.json({
      success: true,
      message: 'Anomaly scan completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/intelligence/anomalies/:id/review (or PATCH) (HR/Admin)
exports.reviewAnomaly = async (req, res, next) => {
  try {
    const { resolution_note } = req.body;
    const anomaly = await anomalyDetectionService.reviewAnomaly(
      req.params.id,
      req.user.id,
      resolution_note
    );
    res.json({
      success: true,
      message: 'Anomaly marked as reviewed',
      data: anomaly
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/intelligence/anomalies/:id/dismiss (or PATCH) (HR/Admin)
exports.dismissAnomaly = async (req, res, next) => {
  try {
    const { resolution_note } = req.body;
    const anomaly = await anomalyDetectionService.dismissAnomaly(
      req.params.id,
      req.user.id,
      resolution_note
    );
    res.json({
      success: true,
      message: 'Anomaly dismissed',
      data: anomaly
    });
  } catch (error) {
    next(error);
  }
};
