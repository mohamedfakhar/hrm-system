const Payroll  = require('../models/Payroll');
const Employee  = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { calculatePayroll } = require('../utils/calculations');
const sendNotification  = require('../utils/sendNotification');

//  Generate Payroll 
exports.generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    const employees = await Employee.find();
    const results   = [];

    for (const employee of employees) {
      const startDate = new Date(year, month - 1, 1);
      const endDate   = new Date(year, month, 0);

      const records = await Attendance.find({
        employee_id: employee._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const calc = calculatePayroll(employee, records);

      const payroll = await Payroll.findOneAndUpdate(
        { employee_id: employee._id, month, year },
        { basic_salary: employee.basic_salary, ...calc, payment_status: 'pending' },
        { upsert: true, new: true }
      );

      results.push(payroll);
    }

    res.json({ success: true, message: 'Payroll generated', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get All Payroll 
exports.getAllPayroll = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = month;
    if (year)  filter.year  = year;

    const payrolls = await Payroll.find(filter)
      .populate('employee_id', 'full_name employee_code department');

    res.json({ success: true, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get My Payroll 
exports.getMyPayroll = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const payrolls = await Payroll.find({ employee_id: employee._id })
      .sort({ year: -1, month: -1 });

    res.json({ success: true, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Mark as Paid 
exports.markAsPaid = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    payroll.payment_status = 'paid';
    payroll.paid_at        = new Date();
    await payroll.save();

    const employee = await Employee.findById(payroll.employee_id);
    if (employee) {
      await sendNotification(req.app, employee.user_id, {
        title: 'Salary Paid ',
        message: `Your salary for ${payroll.month}/${payroll.year} — Net: ${payroll.net_salary} EGP has been paid.`,
        type:  'salary_paid',
        related_id: payroll._id
      });
    }

    res.json({ success: true, message: 'Marked as paid', data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};