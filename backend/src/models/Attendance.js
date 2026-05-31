const db = require('../config/database');

class Attendance {
  // Check if employee already checked in today
  static async getTodayAttendance(employeeId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = CURDATE()',
        [employeeId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error(' getTodayAttendance error:', error);
      throw error;
    }
  }

  // Record check-in
  static async checkIn(employeeId, checkInTime) {
    try {
      const workStartTime = '09:00:00'; // Should come from settings
      const lateTolerance = 15; // minutes

      // Calculate late minutes
      const [timeResult] = await db.query(
        `SELECT TIMESTAMPDIFF(MINUTE, ?, ?) as late_minutes`,
        [workStartTime, checkInTime]
      );

      let lateMinutes = timeResult[0].late_minutes;
      let status = 'present';

      // Determine status
      if (lateMinutes < 0) {
        lateMinutes = 0; // Early arrival
        status = 'present';
      } else if (lateMinutes > lateTolerance) {
        status = 'late';
      } else {
        status = 'present';
        lateMinutes = 0; // Within grace period
      }

      const [result] = await db.query(
        `INSERT INTO attendance (employee_id, date, check_in, late_minutes, status)
         VALUES (?, CURDATE(), ?, ?, ?)`,
        [employeeId, checkInTime, lateMinutes, status]
      );

      return {
        id: result.insertId,
        employee_id: employeeId,
        date: new Date().toISOString().split('T')[0],
        check_in: checkInTime,
        late_minutes: lateMinutes,
        status: status
      };
    } catch (error) {
      console.error(' checkIn error:', error);
      throw error;
    }
  }

  // Record check-out
  static async checkOut(employeeId, checkOutTime) {
    try {
      const workEndTime = '17:00:00';

      // Get today's check-in
      const todayAttendance = await this.getTodayAttendance(employeeId);

      if (!todayAttendance) {
        throw new Error('No check-in found for today');
      }

      if (todayAttendance.check_out) {
        throw new Error('Already checked out today');
      }

      // Calculate working hours
      const [timeResult] = await db.query(
        `SELECT TIMESTAMPDIFF(MINUTE, ?, ?) / 60.0 as working_hours`,
        [todayAttendance.check_in, checkOutTime]
      );

      const workingHours = parseFloat(timeResult[0].working_hours).toFixed(2);

      // Update attendance record
      const [result] = await db.query(
        `UPDATE attendance 
         SET check_out = ?, working_hours = ? 
         WHERE employee_id = ? AND date = CURDATE()`,
        [checkOutTime, workingHours, employeeId]
      );

      return {
        employee_id: employeeId,
        date: new Date().toISOString().split('T')[0],
        check_in: todayAttendance.check_in,
        check_out: checkOutTime,
        working_hours: workingHours,
        status: todayAttendance.status
      };
    } catch (error) {
      console.error(' checkOut error:', error);
      throw error;
    }
  }

  // Get attendance history for an employee
  static async getEmployeeAttendance(employeeId, filters = {}) {
    try {
      let query = `
        SELECT * FROM attendance 
        WHERE employee_id = ?
      `;
      const params = [employeeId];

      // Filter by date range
      if (filters.startDate) {
        query += ` AND date >= ?`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND date <= ?`;
        params.push(filters.endDate);
      }

      // Filter by status
      if (filters.status) {
        query += ` AND status = ?`;
        params.push(filters.status);
      }

      query += ` ORDER BY date DESC`;

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('getEmployeeAttendance error:', error);
      throw error;
    }
  }

  // Get today's attendance (HR view)
  static async getTodayAttendanceAll() {
    try {
      const query = `
        SELECT 
          e.id,
          e.employee_code,
          e.full_name,
          e.job_role,
          a.check_in,
          a.check_out,
          a.working_hours,
          a.late_minutes,
          a.status
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = CURDATE()
        ORDER BY e.full_name
      `;

      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      console.error(' getTodayAttendanceAll error:', error);
      throw error;
    }
  }

  // Get attendance report for a date range
  static async getAttendanceReport(filters = {}) {
    try {
      let query = `
        SELECT 
          e.id,
          e.employee_code,
          e.full_name,
          COUNT(*) as total_days,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
          SUM(CASE WHEN a.late_minutes > 0 THEN a.late_minutes ELSE 0 END) as total_late_minutes,
          SUM(a.working_hours) as total_working_hours,
          AVG(a.working_hours) as avg_working_hours
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id
        WHERE 1=1
      `;
      const params = [];

      // Filter by date range
      if (filters.startDate) {
        query += ` AND a.date >= ?`;
        params.push(filters.startDate);
      } else {
        // Default: current month
        query += ` AND MONTH(a.date) = MONTH(CURDATE()) AND YEAR(a.date) = YEAR(CURDATE())`;
      }

      if (filters.endDate) {
        query += ` AND a.date <= ?`;
        params.push(filters.endDate);
      }

      // Filter by employee
      if (filters.employeeId) {
        query += ` AND e.id = ?`;
        params.push(filters.employeeId);
      }

      query += ` GROUP BY e.id, e.employee_code, e.full_name ORDER BY e.full_name`;

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('getAttendanceReport error:', error);
      throw error;
    }
  }

  // Get late employees (for alerts)
  static async getLateEmployees() {
    try {
      const [rows] = await db.query(`
        SELECT 
          e.id,
          e.employee_code,
          e.full_name,
          a.check_in,
          a.late_minutes
        FROM employees e
        INNER JOIN attendance a ON e.id = a.employee_id
        WHERE a.date = CURDATE() AND a.status = 'late'
        ORDER BY a.late_minutes DESC
      `);
      return rows;
    } catch (error) {
      console.error('getLateEmployees error:', error);
      throw error;
    }
  }

  // Get absent employees (for alerts)
  static async getAbsentEmployees() {
    try {
      const [rows] = await db.query(`
        SELECT 
          e.id,
          e.employee_code,
          e.full_name
        FROM employees e
        WHERE e.id NOT IN (
          SELECT DISTINCT employee_id FROM attendance WHERE date = CURDATE()
        )
        ORDER BY e.full_name
      `);
      return rows;
    } catch (error) {
      console.error('getAbsentEmployees error:', error);
      throw error;
    }
  }

  // Get attendance statistics
  static async getAttendanceStats(month, year) {
    try {
      const [stats] = await db.query(`
        SELECT 
          COUNT(DISTINCT employee_id) as total_employees,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as total_present,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as total_late,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as total_absent,
          AVG(working_hours) as avg_working_hours,
          SUM(late_minutes) as total_late_minutes
        FROM attendance
        WHERE MONTH(date) = ? AND YEAR(date) = ?
      `, [month, year]);
      return stats[0];
    } catch (error) {
      console.error('getAttendanceStats error:', error);
      throw error;
    }
  }

  // Manually add attendance (for HR)
  static async manuallyAddAttendance(employeeId, date, checkIn, checkOut, status) {
    try {
      // Check if attendance already exists
      const existing = await db.query(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
        [employeeId, date]
      );

      let workingHours = 0;
      let lateMinutes = 0;

      if (checkIn && checkOut) {
        const [timeResult] = await db.query(
          `SELECT TIMESTAMPDIFF(MINUTE, ?, ?) / 60.0 as hours`,
          [checkIn, checkOut]
        );
        workingHours = parseFloat(timeResult[0].hours).toFixed(2);
      }

      if (existing[0].length > 0) {
        // Update existing
        await db.query(
          `UPDATE attendance 
           SET check_in = ?, check_out = ?, working_hours = ?, status = ? 
           WHERE employee_id = ? AND date = ?`,
          [checkIn, checkOut, workingHours, status, employeeId, date]
        );
      } else {
        // Insert new
        await db.query(
          `INSERT INTO attendance (employee_id, date, check_in, check_out, working_hours, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [employeeId, date, checkIn, checkOut, workingHours, status]
        );
      }

      return true;
    } catch (error) {
      console.error('manuallyAddAttendance error:', error);
      throw error;
    }
  }

  // Get monthly summary
  static async getMonthlySummary(employeeId, month, year) {
    try {
      const [summary] = await db.query(`
        SELECT 
          e.full_name,
          e.employee_code,
          COUNT(*) as days_recorded,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
          SUM(a.late_minutes) as total_late_minutes,
          SUM(a.working_hours) as total_working_hours,
          AVG(a.working_hours) as avg_working_hours
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id 
          AND MONTH(a.date) = ? AND YEAR(a.date) = ?
        WHERE e.id = ?
        GROUP BY e.id, e.full_name, e.employee_code
      `, [month, year, employeeId]);
      
      return summary[0] || null;
    } catch (error) {
      console.error('getMonthlySummary error:', error);
      throw error;
    }
  }
}

module.exports = Attendance;