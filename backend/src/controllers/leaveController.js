const leaveService = require('../services/leaveService');

// POST /api/leaves
exports.createLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.createLeave(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/leaves/me
exports.getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await leaveService.getMyLeaves(req.user.id);
    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/leaves (HR/Admin)
exports.getAllLeaves = async (req, res, next) => {
  try {
    const leaves = await leaveService.getAllLeaves(req.query.status);
    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/leaves/:id/approve (HR/Admin)
exports.approveLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.approveLeave(req.app, req.user.id, req.params.id);
    res.json({
      success: true,
      message: 'Leave approved successfully',
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/leaves/:id/reject (HR/Admin)
exports.rejectLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.rejectLeave(
      req.app,
      req.user.id,
      req.params.id,
      req.body.rejection_reason
    );
    res.json({
      success: true,
      message: 'Leave rejected successfully',
      data: leave
    });
  } catch (error) {
    next(error);
  }
};