const recommendationService = require('../services/recommendationService');

// GET /api/intelligence/recommendations
exports.getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.query);
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/intelligence/recommendations/stats
exports.getRecommendationStats = async (req, res, next) => {
  try {
    const stats = await recommendationService.getRecommendationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/intelligence/recommendations/:id
exports.getRecommendationById = async (req, res, next) => {
  try {
    const recommendation = await recommendationService.getRecommendationById(req.params.id);
    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/intelligence/recommendations/generate
exports.generateRecommendations = async (req, res, next) => {
  try {
    const result = await recommendationService.generateRecommendations(req.app);
    res.status(200).json({
      success: true,
      message: 'Employee recommendations generated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/intelligence/recommendations/:id/accept
// PATCH /api/intelligence/recommendations/:id/accept
exports.acceptRecommendation = async (req, res, next) => {
  try {
    const { review_notes } = req.body;
    const updated = await recommendationService.acceptRecommendation(
      req.params.id,
      req.user.id,
      review_notes
    );

    res.json({
      success: true,
      message: 'Recommendation accepted successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/intelligence/recommendations/:id/reject
// PATCH /api/intelligence/recommendations/:id/reject
exports.rejectRecommendation = async (req, res, next) => {
  try {
    const { review_notes } = req.body;
    const updated = await recommendationService.rejectRecommendation(
      req.params.id,
      req.user.id,
      review_notes
    );

    res.json({
      success: true,
      message: 'Recommendation rejected',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
