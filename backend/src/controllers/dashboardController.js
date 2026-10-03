const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const AnomalyAlert = require('../models/AnomalyAlert');
const Recommendation = require('../models/Recommendation');

// GET /api/dashboard/hr-stats (HR & Admin)
exports.getHRStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await Employee.countDocuments();

    const presentToday = await Attendance.countDocuments({
      date: today,
      status: { $in: ['present', 'late'] }
    });

    const absentToday = Math.max(0, totalEmployees - presentToday);

    const pendingLeaves = await LeaveRequest.countDocuments({
      status: 'pending'
    });

    const lateToday = await Attendance.countDocuments({
      date: today,
      status: 'late'
    });

    const [openAnomalies, highAnomalies, suggestedRecommendations] = await Promise.all([
      AnomalyAlert.countDocuments({ status: 'open' }),
      AnomalyAlert.countDocuments({ status: 'open', severity: 'high' }),
      Recommendation.countDocuments({ status: 'suggested' })
    ]);

    let hrManagersCount = 0;
    if (req.user.role === 'admin') {
      hrManagersCount = await User.countDocuments({ role: 'hr' });
    }

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        absentToday,
        pendingLeaves,
        lateToday,
        openAnomalies,
        highAnomalies,
        suggestedRecommendations,
        ...(req.user.role === 'admin' && { hrManagersCount })
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/employee-stats (Employee)
exports.getEmployeeStats = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthAttendance = await Attendance.find({
      employee_id: employee._id,
      date: { $gte: firstDay, $lte: lastDay }
    });

    const presentDays = monthAttendance.filter(
      (a) => a.status === 'present' || a.status === 'late'
    ).length;

    const lateDays = monthAttendance.filter((a) => a.status === 'late').length;

    const pendingLeaves = await LeaveRequest.countDocuments({
      employee_id: employee._id,
      status: 'pending'
    });

    const lastPayroll = await Payroll.findOne({ employee_id: employee._id })
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: {
        leaveBalance: employee.annual_leave_balance,
        presentDaysThisMonth: presentDays,
        lateDaysThisMonth: lateDays,
        pendingLeaveRequests: pendingLeaves,
        lastSalary: lastPayroll?.net_salary || 0,
        lastSalaryMonth: lastPayroll ? `${lastPayroll.month}/${lastPayroll.year}` : null,
        lastSalaryStatus: lastPayroll?.payment_status || null
      }
    });
  } catch (error) {
    next(error);
  }
};