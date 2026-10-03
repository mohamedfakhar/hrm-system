const performanceService = require('../services/performanceService');

// GET /api/performance (HR/Admin)
exports.getAllEvaluations = async (req, res, next) => {
  try {
    const evaluations = await performanceService.getAllEvaluations(req.query);
    res.json({
      success: true,
      data: evaluations
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/performance/me (Employee: own finalized evaluations only)
exports.getMyEvaluations = async (req, res, next) => {
  try {
    const evaluations = await performanceService.getMyEvaluations(req.user.id);
    res.json({
      success: true,
      data: evaluations
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/performance/preview-attendance (HR/Admin: live attendance metrics preview)
exports.getAttendancePreview = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    if (!employeeId || !startDate || !endDate) {
      const err = new Error('employeeId, startDate, and endDate query parameters are required');
      err.statusCode = 400;
      throw err;
    }

    const preview = await performanceService.getAttendancePreview(employeeId, startDate, endDate);
    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/performance/employee/:employeeId (HR/Admin)
exports.getEmployeeEvaluations = async (req, res, next) => {
  try {
    const evaluations = await performanceService.getAllEvaluations({
      employee_id: req.params.employeeId
    });
    res.json({
      success: true,
      data: evaluations
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/performance/:id (HR/Admin or Employee own finalized)
exports.getEvaluationById = async (req, res, next) => {
  try {
    const evaluation = await performanceService.getEvaluationById(req.params.id, req.user);
    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/performance (HR/Admin)
exports.createEvaluation = async (req, res, next) => {
  try {
    const evaluation = await performanceService.createEvaluation(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Performance evaluation created successfully',
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/performance/:id (HR/Admin: drafts only)
exports.updateEvaluation = async (req, res, next) => {
  try {
    const evaluation = await performanceService.updateEvaluation(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Evaluation updated successfully',
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/performance/:id/finalize or PATCH /api/performance/:id/finalize (HR/Admin)
exports.finalizeEvaluation = async (req, res, next) => {
  try {
    const evaluation = await performanceService.finalizeEvaluation(
      req.app,
      req.params.id,
      req.user.id
    );
    res.json({
      success: true,
      message: 'Evaluation finalized and published successfully',
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/performance/:id (HR/Admin: draft only)
exports.deleteEvaluation = async (req, res, next) => {
  try {
    const result = await performanceService.deleteEvaluation(req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
