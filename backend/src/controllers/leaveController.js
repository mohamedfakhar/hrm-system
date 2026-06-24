const LeaveRequest       = require('../models/LeaveRequest');
const Employee           = require('../models/Employee');
const sendNotification   = require('../utils/sendNotification');

//  Submit Leave Request 
exports.createLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (leave_type === 'annual' && employee.annual_leave_balance < daysCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough balance. You have ${employee.annual_leave_balance} days left`
      });
    }

    const leave = await LeaveRequest.create({
      employee_id: employee._id,
      leave_type,
      start_date: start,
      end_date: end,
      days_count: daysCount,
      reason
    });

    res.status(201).json({ success: true, message: 'Leave request submitted', data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get My Leaves 
exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const leaves = await LeaveRequest.find({ employee_id: employee._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get All Leaves (HR) 
exports.getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const filter     = {};
    if (status) filter.status = status;

    const leaves = await LeaveRequest.find(filter)
      .populate('employee_id', 'full_name employee_code department')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Approve Leave 
exports.approveLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    leave.status = 'approved';
    leave.reviewed_by = req.user.id;
    leave.reviewed_at = new Date();
    await leave.save();

    await Employee.findByIdAndUpdate(leave.employee_id, {
      $inc: { annual_leave_balance: -leave.days_count }
    });

    const employee = await Employee.findById(leave.employee_id);
    await sendNotification(req.app, employee.user_id, {
      title: 'Leave Request Approved ',
      message:`Your ${leave.leave_type} leave (${leave.days_count} days) has been approved.`,
      type: 'leave_approved',
      related_id: leave._id
    });

    res.json({ success: true, message: 'Leave approved', data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Reject Leave 
exports.rejectLeave = async (req, res) => {
  try {
    const { rejection_reason } = req.body;

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    leave.status  = 'rejected';
    leave.reviewed_by = req.user.id;
    leave.reviewed_at = new Date();
    leave.rejection_reason = rejection_reason || 'No reason provided';
    await leave.save();

    const employee = await Employee.findById(leave.employee_id);
    await sendNotification(req.app, employee.user_id, {
      title:  'Leave Request Rejected ',
      message:`Your ${leave.leave_type} leave request has been rejected. Reason: ${leave.rejection_reason}`,
      type: 'leave_rejected',
      related_id: leave._id
    });

    res.json({ success: true, message: 'Leave rejected', data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};