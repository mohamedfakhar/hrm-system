const employeeService = require('../services/employeeService');

// GET /api/employees
exports.getAllEmployees = async (req, res, next) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/me
exports.getMyProfile = async (req, res, next) => {
  try {
    const employee = await employeeService.getMyProfile(req.user.id);
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees
exports.createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/employees/:id
exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employees/:id (Admin only)
exports.deleteEmployee = async (req, res, next) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};