const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const sendNotification = require('../utils/sendNotification');

class LeaveService {
  /**
   * Submit a new leave request
   */
  async createLeave(userId, { leave_type, start_date, end_date, reason }) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (end < start) {
      const err = new Error('End date must be on or after start date');
      err.statusCode = 400;
      throw err;
    }

    // Difference in calendar days + 1 inclusive
    const diffTime = Math.abs(end - start);
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Only annual leave requires balance check against annual_leave_balance
    if (leave_type === 'annual' && employee.annual_leave_balance < daysCount) {
      const err = new Error(
        `Insufficient annual leave balance. You have ${employee.annual_leave_balance} days remaining, requested ${daysCount} days.`
      );
      err.statusCode = 400;
      throw err;
    }

    const leave = await LeaveRequest.create({
      employee_id: employee._id,
      leave_type,
      start_date: start,
      end_date: end,
      days_count: daysCount,
      reason: reason || null,
      status: 'pending'
    });

    return leave;
  }

  /**
   * Get leave history for logged-in employee
   */
  async getMyLeaves(userId) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    return await LeaveRequest.find({ employee_id: employee._id })
      .sort({ createdAt: -1 });
  }

  /**
   * HR: Get all leave requests, optionally filtered by status
   */
  async getAllLeaves(status) {
    const filter = {};
    if (status) {
      filter.status = status;
    }

    return await LeaveRequest.find(filter)
      .populate('employee_id', 'full_name employee_code department phone annual_leave_balance')
      .populate('reviewed_by', 'email role')
      .sort({ createdAt: -1 });
  }

  /**
   * HR: Approve leave request
   */
  async approveLeave(app, reviewerId, leaveId) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      const err = new Error('Leave request not found');
      err.statusCode = 404;
      throw err;
    }

    if (leave.status !== 'pending') {
      const err = new Error(`Request has already been ${leave.status}`);
      err.statusCode = 400;
      throw err;
    }

    const employee = await Employee.findById(leave.employee_id);
    if (!employee) {
      const err = new Error('Associated employee not found');
      err.statusCode = 404;
      throw err;
    }

    // Deduct balance ONLY for annual leaves
    if (leave.leave_type === 'annual') {
      if (employee.annual_leave_balance < leave.days_count) {
        const err = new Error('Employee annual leave balance is insufficient for approval');
        err.statusCode = 400;
        throw err;
      }
      employee.annual_leave_balance = Math.max(0, employee.annual_leave_balance - leave.days_count);
      await employee.save();
    }

    leave.status = 'approved';
    leave.reviewed_by = reviewerId;
    leave.reviewed_at = new Date();
    await leave.save();

    // Trigger in-app notification & socket event
    await sendNotification(app, employee.user_id, {
      title: 'Leave Request Approved',
      message: `Your ${leave.leave_type} leave request (${leave.days_count} day(s)) has been approved.`,
      type: 'leave_approved',
      related_id: leave._id
    });

    return leave;
  }

  /**
   * HR: Reject leave request
   */
  async rejectLeave(app, reviewerId, leaveId, rejectionReason) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      const err = new Error('Leave request not found');
      err.statusCode = 404;
      throw err;
    }

    if (leave.status !== 'pending') {
      const err = new Error(`Request has already been ${leave.status}`);
      err.statusCode = 400;
      throw err;
    }

    leave.status = 'rejected';
    leave.reviewed_by = reviewerId;
    leave.reviewed_at = new Date();
    leave.rejection_reason = rejectionReason || 'No reason provided';
    await leave.save();

    const employee = await Employee.findById(leave.employee_id);
    if (employee) {
      await sendNotification(app, employee.user_id, {
        title: 'Leave Request Rejected',
        message: `Your ${leave.leave_type} leave request has been rejected. Reason: ${leave.rejection_reason}`,
        type: 'leave_rejected',
        related_id: leave._id
      });
    }

    return leave;
  }
}

module.exports = new LeaveService();
