const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const { calculatePayroll } = require('../utils/calculations');
const sendNotification = require('../utils/sendNotification');

class PayrollService {
  /**
   * HR: Generate monthly payroll for all employees
   */
  async generatePayroll(app, { month, year }) {
    const numMonth = Number(month);
    const numYear = Number(year);

    if (!numMonth || numMonth < 1 || numMonth > 12) {
      const err = new Error('Valid month (1-12) is required');
      err.statusCode = 400;
      throw err;
    }

    if (!numYear || numYear < 2000) {
      const err = new Error('Valid year (>= 2000) is required');
      err.statusCode = 400;
      throw err;
    }

    const employees = await Employee.find().populate('user_id', 'is_active');
    const results = [];

    const startDate = new Date(numYear, numMonth - 1, 1);
    const endDate = new Date(numYear, numMonth, 0, 23, 59, 59, 999);

    for (const employee of employees) {
      // Skip deactivated accounts if desired, or process if employed
      if (employee.user_id && employee.user_id.is_active === false) {
        continue;
      }

      // Fetch monthly attendance records
      const attendanceRecords = await Attendance.find({
        employee_id: employee._id,
        date: { $gte: startDate, $lte: endDate }
      });

      // Count approved leave days in this month to avoid false absence deduction
      const approvedLeaves = await LeaveRequest.find({
        employee_id: employee._id,
        status: 'approved',
        leave_type: 'annual',
        start_date: { $lte: endDate },
        end_date: { $gte: startDate }
      });

      const approvedLeaveDays = approvedLeaves.reduce((sum, l) => sum + (l.days_count || 0), 0);

      // Single source of truth calculation
      const calc = calculatePayroll(employee, attendanceRecords, approvedLeaveDays);

      const payroll = await Payroll.findOneAndUpdate(
        { employee_id: employee._id, month: numMonth, year: numYear },
        {
          basic_salary: employee.basic_salary,
          ...calc,
          payment_status: 'pending'
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      ).populate('employee_id', 'full_name employee_code department');

      results.push(payroll);
    }

    return results;
  }

  /**
   * HR: Get all payroll records, filterable by month and year
   */
  async getAllPayroll({ month, year }) {
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    return await Payroll.find(filter)
      .populate('employee_id', 'full_name employee_code department job_role')
      .sort({ year: -1, month: -1 });
  }

  /**
   * Employee: Get my personal payroll history
   */
  async getMyPayroll(userId) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    return await Payroll.find({ employee_id: employee._id })
      .sort({ year: -1, month: -1 });
  }

  /**
   * HR: Mark a payroll record as paid & dispatch notification
   */
  async markAsPaid(app, payrollId) {
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      const err = new Error('Payroll record not found');
      err.statusCode = 404;
      throw err;
    }

    payroll.payment_status = 'paid';
    payroll.paid_at = new Date();
    await payroll.save();

    const employee = await Employee.findById(payroll.employee_id);
    if (employee) {
      await sendNotification(app, employee.user_id, {
        title: 'Salary Paid',
        message: `Your salary for ${payroll.month}/${payroll.year} — Net: ${payroll.net_salary} EGP has been marked as paid.`,
        type: 'salary_paid',
        related_id: payroll._id
      });
    }

    return await Payroll.findById(payroll._id)
      .populate('employee_id', 'full_name employee_code department');
  }
}

module.exports = new PayrollService();
