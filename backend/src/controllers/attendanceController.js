const attendanceService = require('../services/attendanceService');

// POST /api/attendance/checkin
exports.checkIn = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkIn(req.user.id);
    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/checkout
exports.checkOut = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkOut(req.user.id);
    res.json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/today
exports.getTodayStatus = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getTodayStatus(req.user.id);
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/me
exports.getMyAttendance = async (req, res, next) => {
  try {
    const records = await attendanceService.getMyAttendance(req.user.id);
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance (HR/Admin)
exports.getAllAttendance = async (req, res, next) => {
  try {
    const records = await attendanceService.getAllAttendance(req.query.date);
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};