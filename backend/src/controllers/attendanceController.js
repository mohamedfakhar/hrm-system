const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

//  Check In 
exports.checkIn = async (req, res) => {
  try {
    //  Get the employee profile from the logged-in user
    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    //  Check if already checked in today
    const existing = await Attendance.findOne({
      employee_id: employee._id,
      date: today
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    //  Get current time as string "HH:MM"
    const now = new Date();
    const checkInTime = now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0');

    //  Check if late (work starts at 09:00, grace period 15 min)
    const workStartHour = 9;
    const workStartMinute = 0;
    const gracePeriod = 15;

    const totalWorkStartMinutes = workStartHour * 60 + workStartMinute + gracePeriod;
    const totalNowMinutes = now.getHours() * 60 + now.getMinutes();

    let lateMinutes = 0;
    let status = 'present';

    if (totalNowMinutes > totalWorkStartMinutes) {
      lateMinutes = totalNowMinutes - (workStartHour * 60 + workStartMinute);
      status = 'late';
    }

    //  Create attendance record
    const attendance = await Attendance.create({
      employee_id: employee._id,
      date: today,
      check_in: checkInTime,
      late_minutes: lateMinutes,
      status: status
    });

    res.status(201).json({ success: true, message: 'Checked in successfully', data: attendance });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Check Out 
exports.checkOut = async (req, res) => {
  try {
    //  Get employee
    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    //  Get today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee_id: employee._id,
      date: today
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'You have not checked in today' });
    }

    if (attendance.check_out) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    //  Get current time as string "HH:MM"
    const now = new Date();
    const checkOutTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    //  Calculate working hours
    const checkInParts = attendance.check_in.split(':');
    const checkInTotal = parseInt(checkInParts[0]) * 60 + parseInt(checkInParts[1]);
    const checkOutTotal = now.getHours() * 60 + now.getMinutes();
    const workingHours = ((checkOutTotal - checkInTotal) / 60).toFixed(2);

    //  Update the record
    attendance.check_out = checkOutTime;
    attendance.working_hours = workingHours;
    await attendance.save();

    res.json({ success: true, message: 'Checked out successfully', data: attendance });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get My Attendance 
exports.getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const records = await Attendance.find({ employee_id: employee._id })
      .sort({ date: -1 });

    res.json({ success: true, data: records });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Get Today's Status (am I checked in?) 
exports.getTodayStatus = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user_id: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee_id: employee._id,
      date: today
    });

    res.json({ success: true, data: attendance || null });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//  Get All Employees Attendance (HR) 
exports.getAllAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    // Default: today
    const searchDate = date ? new Date(date) : new Date();
    searchDate.setHours(0, 0, 0, 0);

    const records = await Attendance.find({ date: searchDate })
      .populate('employee_id', 'full_name employee_code department');

    res.json({ success: true, data: records });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};