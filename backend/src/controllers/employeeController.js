const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
 
// Get all employees
exports.getAllEmployees = async (req, res) => {
  console.log(' Getting all employees...');
  
  try {
    const { search, department, job_role, is_active } = req.query;
 
    const filters = {};
    if (search) filters.search = search;
    if (department) filters.department = department;
    if (job_role) filters.job_role = job_role;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
 
    const employees = await Employee.findAll(filters);
 
    console.log(` Found ${employees.length} employees`);
 
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error(' Get all employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};
 
// Get single employee
exports.getEmployee = async (req, res) => {
  console.log(' Getting employee:', req.params.id);
  
  try {
    const employee = await Employee.findById(req.params.id);
 
    if (!employee) {
      console.log(' Employee not found');
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
 
    console.log(' Employee found:', employee.full_name);
 
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error(' Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};
 
// Create new employee
exports.createEmployee = async (req, res) => {
  console.log(' Creating new employee...');
  
  try {
    const {
      email,
      password,
      full_name,
      job_role,
      department,
      basic_salary,
      annual_leave_balance,
      hire_date,
      phone,
      address
    } = req.body;
 
    // Validation
    if (!email || !password || !full_name || !job_role || !basic_salary) {
      console.log(' Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email, password, full name, job role, and basic salary are required'
      });
    }
 
    console.log(' Checking if user exists...');
 
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log(' User already exists');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
 
    console.log(' Hashing password...');
 
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
 
    console.log(' Creating user account...');
 
    // Create user account
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: 'employee'
    });
 
    console.log(' User created with ID:', newUser.id);
    console.log(' Generating employee code...');
 
    // Generate employee code
    const employeeCode = await Employee.generateEmployeeCode();
 
    console.log(' Employee code:', employeeCode);
    console.log(' Creating employee record...');
 
    // Create employee record
    const employeeData = {
      user_id: newUser.id,
      employee_code: employeeCode,
      full_name,
      job_role,
      department: department || null,
      basic_salary,
      annual_leave_balance: annual_leave_balance || 21,
      hire_date: hire_date || new Date().toISOString().split('T')[0],
      phone: phone || null,
      address: address || null,
      profile_picture: null
    };
 
    const employee = await Employee.create(employeeData);

    console.log(' Employee created successfully:', employee.id);
 
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: employee.id,
        user_id: newUser.id,
        employee_code: employeeCode,
        email,
        full_name,
        job_role,
        department,
        basic_salary
      }
    });
  } catch (error) {
    console.error(' Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};
 
// Update employee
exports.updateEmployee = async (req, res) => {
  console.log(' Updating employee:', req.params.id);
  
  try {
    const employeeId = req.params.id;
    const updates = req.body;
 
    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.log(' Employee not found');
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
 
    console.log(' Updating employee data...');
 
    // Update employee data
    const allowedUpdates = [
      'full_name',
      'job_role',
      'department',
      'basic_salary',
      'annual_leave_balance',
      'hire_date',
      'phone',
      'address'
    ];
 
    const employeeUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        employeeUpdates[field] = updates[field];
      }
    });
 
    if (Object.keys(employeeUpdates).length > 0) {
      await Employee.update(employeeId, employeeUpdates);
    }
 
    // Update user data (if email provided)
    if (updates.email) {
      console.log(' Updating email...');
      
      // Check if email already exists for another user
      const existingUser = await User.findByEmail(updates.email);
      if (existingUser && existingUser.id !== employee.user_id) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }
 
      await User.update(employee.user_id, { email: updates.email });
    }
 
    console.log(' Employee updated successfully');
 
    // Fetch updated employee
    const updatedEmployee = await Employee.findById(employeeId);
 
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    console.error(' Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};
 
// Delete employee
exports.deleteEmployee = async (req, res) => {
  console.log(' Deleting employee:', req.params.id);
  
  try {
    const employeeId = req.params.id;
 
    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.log(' Employee not found');
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
 
    console.log(' Deleting employee and associated user...');
 
    // Delete employee (will cascade delete)
    const deleted = await Employee.delete(employeeId);
 
    if (!deleted) {
      throw new Error('Failed to delete employee');
    }
 
    console.log(' Employee deleted successfully');
 
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error(' Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};
 
// Deactivate employee account
exports.deactivateEmployee = async (req, res) => {
  console.log(' Deactivating employee:', req.params.id);
  
  try {
    const employeeId = req.params.id;
 
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
 
    await Employee.deactivate(employeeId);
 
    console.log(' Employee deactivated');
 
    res.json({
      success: true,
      message: 'Employee account deactivated successfully'
    });
  } catch (error) {
    console.error(' Deactivate employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate employee',
      error: error.message
    });
  }
};
 
// Activate employee account
exports.activateEmployee = async (req, res) => {
  console.log(' Activating employee:', req.params.id);
  
  try {
    const employeeId = req.params.id;
 
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
 
    await Employee.activate(employeeId);
 
    console.log(' Employee activated');
 
    res.json({
      success: true,
      message: 'Employee account activated successfully'
    });
  } catch (error) {
    console.error(' Activate employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate employee',
      error: error.message
    });
  }
};
 
// Get employee statistics
exports.getStats = async (req, res) => {
  console.log(' Getting employee statistics...');
  
  try {
    const stats = await Employee.getStats();
 
    console.log(' Statistics retrieved');
 
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(' Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
 
// Get departments list
exports.getDepartments = async (req, res) => {
  console.log(' Getting departments list...');
  
  try {
    const departments = await Employee.getDepartments();
 
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error(' Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};
 
// Get job roles list
exports.getJobRoles = async (req, res) => {
  console.log(' Getting job roles list...');
  
  try {
    const jobRoles = await Employee.getJobRoles();
 
    res.json({
      success: true,
      data: jobRoles
    });
  } catch (error) {
    console.error(' Get job roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job roles',
      error: error.message
    });
  }
};
 
// Get current employee profile (for logged-in employee)
exports.getMyProfile = async (req, res) => {
  console.log(' Getting my profile for user:', req.user.id);
  
  try {
    const employee = await Employee.findByUserId(req.user.id);
 
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
 
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error(' Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};