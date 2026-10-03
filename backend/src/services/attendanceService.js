const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

class AttendanceService {
  /**
   * Helper to normalize a date to midnight UTC/local
   */
  getMidnightDate(d = new Date()) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Check in employee for today
   */
  async checkIn(userId) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    const today = this.getMidnightDate();

    const existing = await Attendance.findOne({
      employee_id: employee._id,
      date: today
    });

    if (existing) {
      const err = new Error('Already checked in today');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const checkInTime = now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0');

    // Work starts at 09:00 with 15 min grace (09:15)
    const workStartMinutes = 9 * 60; // 540 min
    const graceMinutes = 15;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let lateMinutes = 0;
    let status = 'present';

    if (currentMinutes > (workStartMinutes + graceMinutes)) {
      lateMinutes = currentMinutes - workStartMinutes;
      status = 'late';
    }

    const attendance = await Attendance.create({
      employee_id: employee._id,
      date: today,
      check_in: checkInTime,
      late_minutes: lateMinutes,
      status
    });

    return attendance;
  }

  /**
   * Check out employee for today
   */
  async checkOut(userId) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    const today = this.getMidnightDate();

    const attendance = await Attendance.findOne({
      employee_id: employee._id,
      date: today
    });

    if (!attendance) {
      const err = new Error('You have not checked in today');
      err.statusCode = 400;
      throw err;
    }

    if (attendance.check_out) {
      const err = new Error('Already checked out today');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const checkOutTime = now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0');

    const checkInParts = attendance.check_in.split(':');
    const checkInMinutes = parseInt(checkInParts[0], 10) * 60 + parseInt(checkInParts[1], 10);
    const checkOutMinutes = now.getHours() * 60 + now.getMinutes();
    const workingHours = parseFloat(Math.max(0, (checkOutMinutes - checkInMinutes) / 60).toFixed(2));

    attendance.check_out = checkOutTime;
    attendance.working_hours = workingHours;
    await attendance.save();

    return attendance;
  }

  /**
   * Get today's attendance status for logged-in employee
   */
  async getTodayStatus(userId) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    const today = this.getMidnightDate();
    const record = await Attendance.findOne({
      employee_id: employee._id,
      date: today
    });

    return record || null;
  }

  /**
   * Get attendance history for logged-in employee
   */
  async getMyAttendance(userId) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    return await Attendance.find({ employee_id: employee._id })
      .sort({ date: -1 });
  }

  /**
   * HR: Get all employees attendance for a specific date (default: today)
   */
  async getAllAttendance(dateQuery) {
    const searchDate = this.getMidnightDate(dateQuery || new Date());

    return await Attendance.find({ date: searchDate })
      .populate('employee_id', 'full_name employee_code department phone')
      .sort({ check_in: 1 });
  }
}

module.exports = new AttendanceService();
