const payrollService = require('../services/payrollService');

// POST /api/payroll/generate (HR/Admin)
exports.generatePayroll = async (req, res, next) => {
  try {
    const results = await payrollService.generatePayroll(req.app, req.body);
    res.json({
      success: true,
      message: 'Monthly payroll generated successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payroll (HR/Admin)
exports.getAllPayroll = async (req, res, next) => {
  try {
    const payrolls = await payrollService.getAllPayroll(req.query);
    res.json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payroll/me (Employee/HR/Admin)
exports.getMyPayroll = async (req, res, next) => {
  try {
    const payrolls = await payrollService.getMyPayroll(req.user.id);
    res.json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/payroll/:id/pay or PATCH /api/payroll/:id/pay (HR/Admin)
exports.markAsPaid = async (req, res, next) => {
  try {
    const payroll = await payrollService.markAsPaid(req.app, req.params.id);
    res.json({
      success: true,
      message: 'Payroll marked as paid successfully',
      data: payroll
    });
  } catch (error) {
    next(error);
  }
};