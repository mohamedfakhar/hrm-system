const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

//  Get All Employees 
exports.getAllEmployees = async (req, res) => {
  try {

    const employees = await Employee.find().populate('user_id', 'email role');

    res.json({ success: true, data: employees });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get Single Employee 
exports.getEmployee = async (req, res) => {
  try {

    const employee = await Employee.findById(req.params.id).populate('user_id', 'email role');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get My Profile 
exports.getMyProfile = async (req, res) => {
  try {

    const employee = await Employee.findOne({ user_id: req.user.id }).populate('user_id', 'email role');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: employee });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Create Employee 
exports.createEmployee = async (req, res) => {
  try {
    const { email, password, full_name, job_role, department,
            basic_salary, hire_date, phone, address } = req.body;

    // 1. Check email not used before
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the user account
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'employee'
    });

    // 4. Create the employee profile linked to the user
    const employee = await Employee.create({
      user_id: user._id,
      full_name,
      job_role,
      department,
      basic_salary,
      hire_date,
      phone,
      address
    });

    res.status(201).json({ success: true, message: 'Employee created', data: employee });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Update Employee 
exports.updateEmployee = async (req, res) => {
  try {

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update only the fields that were sent
    const { full_name, job_role, department,
            basic_salary, hire_date, phone, address } = req.body;

    if (full_name)  employee.full_name = full_name;
    if (job_role) employee.job_role = job_role;
    if (department) employee.department = department;
    if (basic_salary) employee.basic_salary = basic_salary;
    if (hire_date) employee.hire_date = hire_date;
    if (phone) employee.phone = phone;
    if (address) employee.address = address;

    await employee.save();

    res.json({ success: true, message: 'Employee updated', data: employee });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Delete Employee 
exports.deleteEmployee = async (req, res) => {
  try {

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await User.findByIdAndUpdate(employee.user_id, { is_active: false });

    res.json({ success: true, message: 'Employee deactivated' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};