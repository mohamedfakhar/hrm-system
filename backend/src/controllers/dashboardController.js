const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

//  HR + Admin Stats 
exports.getHRStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalEmployees = await Employee.countDocuments();

        const presentToday = await Attendance.countDocuments({
            date: today,
            status: { $in: ['present', 'late'] }
        });

        const absentToday = totalEmployees - presentToday;

        const pendingLeaves = await LeaveRequest.countDocuments({
            status: 'pending'
        });

        const lateToday = await Attendance.countDocuments({
            date: today,
            status: 'late'
        });

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
                ...(req.user.role === 'admin' && { hrManagersCount })
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//  Employee Stats 
exports.getEmployeeStats = async (req, res) => {
    try {
        const employee = await Employee.findOne({ user_id: req.user.id });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const monthAttendance = await Attendance.find({
            employee_id: employee._id,
            date: { $gte: firstDay, $lte: lastDay }
        });

        const presentDays = monthAttendance.filter(a =>
            a.status === 'present' || a.status === 'late'
        ).length;

        const lateDays = monthAttendance.filter(a => a.status === 'late').length;

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
        res.status(500).json({ success: false, message: error.message });
    }
};