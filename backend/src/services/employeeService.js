const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const User = require('../models/User');

class EmployeeService {
  /**
   * Create an employee profile and linked user account
   */
  async createEmployee(data) {
    const {
      email,
      password,
      full_name,
      job_role,
      department,
      basic_salary,
      hire_date,
      phone,
      address,
      annual_leave_balance
    } = data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('Email already in use');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'employee'
    });

    const employee = await Employee.create({
      user_id: user._id,
      full_name,
      job_role,
      department: department || null,
      basic_salary: Number(basic_salary),
      hire_date: new Date(hire_date),
      phone,
      address: address || null,
      annual_leave_balance: annual_leave_balance !== undefined ? Number(annual_leave_balance) : 21
    });

    return await Employee.findById(employee._id).populate('user_id', 'email role is_active');
  }

  /**
   * List all employees with user metadata
   */
  async getAllEmployees() {
    return await Employee.find()
      .populate('user_id', 'email role is_active last_login')
      .sort({ createdAt: -1 });
  }

  /**
   * Get single employee by employee ID
   */
  async getEmployeeById(id) {
    const employee = await Employee.findById(id).populate('user_id', 'email role is_active last_login');
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }
    return employee;
  }

  /**
   * Get profile of currently authenticated user
   */
  async getMyProfile(userId) {
    const employee = await Employee.findOne({ user_id: userId }).populate('user_id', 'email role is_active');
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }
    return employee;
  }

  /**
   * Update employee details
   */
  async updateEmployee(id, updateData) {
    const employee = await Employee.findById(id);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    const allowedFields = [
      'full_name',
      'job_role',
      'department',
      'basic_salary',
      'hire_date',
      'phone',
      'address',
      'annual_leave_balance'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        employee[field] = updateData[field];
      }
    });

    await employee.save();
    return await Employee.findById(employee._id).populate('user_id', 'email role is_active');
  }

  /**
   * Deactivate employee and linked user account
   */
  async deleteEmployee(id) {
    const employee = await Employee.findById(id);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    await User.findByIdAndUpdate(employee.user_id, { is_active: false });
    return true;
  }
}

module.exports = new EmployeeService();
