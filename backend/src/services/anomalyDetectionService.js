const AnomalyAlert = require('../models/AnomalyAlert');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const sendNotification = require('../utils/sendNotification');

class AnomalyDetectionService {
  /**
   * Helper to get clean UTC/local date boundaries
   */
  getMidnightDate(daysAgo = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Rule 1: Lateness Spike
   * Condition: >= 4 late check-ins in the last 14 days AND > 3x 90-day baseline
   */
  async detectLatenessSpike(employee, now = new Date()) {
    // Tenure guard: Require at least 14 days tenure to avoid false positives for new hires
    const hireDate = new Date(employee.hire_date || employee.createdAt);
    const tenureDays = (now - hireDate) / (1000 * 60 * 60 * 24);
    if (tenureDays < 14) return null;

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    // 1. Recent 14-day lateness
    const recentLogs = await Attendance.find({
      employee_id: employee._id,
      date: { $gte: fourteenDaysAgo, $lte: now }
    });
    const recentLateCount = recentLogs.filter((a) => a.status === 'late').length;

    if (recentLateCount < 4) return null;

    // 2. Historical baseline (prior 76 days)
    const baselineLogs = await Attendance.find({
      employee_id: employee._id,
      date: { $gte: ninetyDaysAgo, $lt: fourteenDaysAgo }
    });
    const baselineLateCount = baselineLogs.filter((a) => a.status === 'late').length;

    // Normalized baseline average per 14-day window
    const baselinePeriods = Math.max(1, 76 / 14);
    const baselineRatePer14Days = parseFloat((baselineLateCount / baselinePeriods).toFixed(1));

    const threshold = Math.max(1, baselineRatePer14Days) * 3;

    if (recentLateCount > threshold) {
      return {
        employee_id: employee._id,
        domain: 'attendance',
        anomaly_code: 'ATT_LATENESS_SPIKE',
        title: 'Sudden Lateness Surge Detected',
        description: `Employee recorded ${recentLateCount} late arrivals in the last 14 days compared to a baseline average of ${baselineRatePer14Days} per two-week window.`,
        severity: 'medium',
        metrics_snapshot: {
          baseline: baselineRatePer14Days,
          observed: recentLateCount,
          deviation: `${(recentLateCount / Math.max(1, baselineRatePer14Days)).toFixed(1)}x`,
          timeframe: 'Past 14 days vs prior 76 days baseline'
        }
      };
    }

    return null;
  }

  /**
   * Rule 2: Consecutive Absence
   * Condition: >= 2 consecutive business-day absences with NO approved leave
   */
  async detectConsecutiveAbsence(employee, now = new Date()) {
    // Inspect past 10 calendar days to evaluate the last 5-7 business days
    const checkStart = new Date(now);
    checkStart.setDate(checkStart.getDate() - 10);
    checkStart.setHours(0, 0, 0, 0);

    const [attendanceLogs, approvedLeaves] = await Promise.all([
      Attendance.find({
        employee_id: employee._id,
        date: { $gte: checkStart, $lte: now }
      }),
      LeaveRequest.find({
        employee_id: employee._id,
        status: 'approved',
        start_date: { $lte: now },
        end_date: { $gte: checkStart }
      })
    ]);

    // Iterate backwards through past business days (up to 7 days, excluding today if in progress)
    const curDate = new Date(now);
    curDate.setDate(curDate.getDate() - 1);
    curDate.setHours(0, 0, 0, 0);

    let consecutiveUnexcused = 0;
    const absenceDates = [];

    for (let i = 0; i < 7; i++) {
      const dayOfWeek = curDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = curDate.toISOString().substring(0, 10);

        // Check if attendance record exists
        const att = attendanceLogs.find(
          (a) => a.date.toISOString().substring(0, 10) === dateStr
        );
        const isPresentOrLate = att && (att.status === 'present' || att.status === 'late' || att.status === 'half_day');

        // Check if approved leave exists for this date
        const hasLeave = approvedLeaves.some((l) => {
          const lStart = new Date(l.start_date);
          lStart.setHours(0, 0, 0, 0);
          const lEnd = new Date(l.end_date);
          lEnd.setHours(23, 59, 59, 999);
          return curDate >= lStart && curDate <= lEnd;
        });

        if (!isPresentOrLate && !hasLeave) {
          consecutiveUnexcused++;
          absenceDates.push(dateStr);
        } else {
          // If we encounter an attended day or approved leave, stop consecutive chain
          break;
        }
      }
      curDate.setDate(curDate.getDate() - 1);
    }

    if (consecutiveUnexcused >= 2) {
      return {
        employee_id: employee._id,
        domain: 'attendance',
        anomaly_code: 'ATT_CONSECUTIVE_ABSENT',
        title: 'Consecutive Unexcused Absence Detected',
        description: `Observed ${consecutiveUnexcused} consecutive business-day absences (${absenceDates.reverse().join(', ')}) with no corresponding approved leave request.`,
        severity: 'high',
        metrics_snapshot: {
          baseline: 0,
          observed: consecutiveUnexcused,
          deviation: `${consecutiveUnexcused} business days`,
          timeframe: 'Recent consecutive work days'
        }
      };
    }

    return null;
  }

  /**
   * Rule 3: Leave Frequency Spike
   * Condition: >= 3 leave requests within 14 days
   */
  async detectLeaveFrequencySpike(employee, now = new Date()) {
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const recentRequests = await LeaveRequest.find({
      employee_id: employee._id,
      createdAt: { $gte: fourteenDaysAgo, $lte: now }
    });

    if (recentRequests.length >= 3) {
      return {
        employee_id: employee._id,
        domain: 'leave',
        anomaly_code: 'LEV_FREQUENCY_SPIKE',
        title: 'Elevated Leave Request Frequency',
        description: `Employee submitted ${recentRequests.length} leave requests within a 14-day window. Operational schedule review recommended.`,
        severity: 'low',
        metrics_snapshot: {
          baseline: 1,
          observed: recentRequests.length,
          deviation: `${recentRequests.length} requests`,
          timeframe: 'Past 14 days'
        }
      };
    }

    return null;
  }

  /**
   * Rule 4: Payroll Deduction Spike
   * Condition: Latest monthly total_deductions > 25% of basic salary
   */
  async detectPayrollDeductionSpike(employee) {
    const latestPayroll = await Payroll.findOne({ employee_id: employee._id })
      .sort({ year: -1, month: -1 });

    if (!latestPayroll || !latestPayroll.basic_salary) return null;

    const basicSalary = Number(latestPayroll.basic_salary);
    const deductions = Number(latestPayroll.total_deductions) || 0;
    const deductionRatio = deductions / basicSalary;

    if (deductionRatio > 0.25) {
      const deductionPct = (deductionRatio * 100).toFixed(1);
      return {
        employee_id: employee._id,
        domain: 'payroll',
        anomaly_code: 'PAY_DEDUCTION_SPIKE',
        title: 'Abnormal Payroll Deduction Level',
        description: `Total deductions ($${deductions}) accounted for ${deductionPct}% of basic salary ($${basicSalary}) for period ${latestPayroll.month}/${latestPayroll.year}.`,
        severity: 'high',
        metrics_snapshot: {
          baseline: parseFloat((basicSalary * 0.25).toFixed(2)),
          observed: deductions,
          deviation: `${deductionPct}% of base`,
          timeframe: `Payroll ${latestPayroll.month}/${latestPayroll.year}`
        }
      };
    }

    return null;
  }

  /**
   * Full Detection Orchestrator
   * Scans all active employees and generates deduplicated alerts
   */
  async runAnomalyScan(app = null) {
    const employees = await Employee.find().populate('user_id');
    const now = new Date();

    let createdCount = 0;
    let updatedCount = 0;
    const newHighAlerts = [];

    for (const employee of employees) {
      if (employee.user_id && employee.user_id.is_active === false) {
        continue;
      }

      // Run 4 detection rules
      const candidatePromises = [
        this.detectLatenessSpike(employee, now),
        this.detectConsecutiveAbsence(employee, now),
        this.detectLeaveFrequencySpike(employee, now),
        this.detectPayrollDeductionSpike(employee)
      ];

      const candidates = (await Promise.all(candidatePromises)).filter(Boolean);

      for (const candidate of candidates) {
        // DEDUPLICATION: Check if identical open alert exists
        const existingAlert = await AnomalyAlert.findOne({
          employee_id: employee._id,
          anomaly_code: candidate.anomaly_code,
          status: 'open'
        });

        if (existingAlert) {
          // Update telemetry snapshot without spamming duplicates
          existingAlert.metrics_snapshot = candidate.metrics_snapshot;
          existingAlert.description = candidate.description;
          await existingAlert.save();
          updatedCount++;
        } else {
          // Persist new alert
          const created = await AnomalyAlert.create(candidate);
          createdCount++;

          if (created.severity === 'high') {
            newHighAlerts.push({ alert: created, employee });
          }
        }
      }
    }

    // Dispatch real-time notifications for High-Severity anomalies to all HR/Admin managers
    if (newHighAlerts.length > 0 && app) {
      try {
        const hrUsers = await User.find({ role: { $in: ['hr', 'admin'] }, is_active: true });
        for (const { alert, employee } of newHighAlerts) {
          for (const hr of hrUsers) {
            await sendNotification(app, hr._id, {
              title: `High Anomaly: ${alert.title}`,
              message: `${employee.full_name}: ${alert.description}`,
              type: 'info',
              related_id: alert._id,
              related_type: 'anomaly'
            });
          }
        }
      } catch (notifErr) {
        console.error('Error dispatching anomaly notifications:', notifErr.message);
      }
    }

    return {
      scanned_employees: employees.length,
      alerts_created: createdCount,
      alerts_updated: updatedCount,
      scanned_at: now
    };
  }

  /**
   * List anomalies with filters (HR/Admin)
   */
  async getAnomalies(query = {}) {
    const filter = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.severity && query.severity !== 'all') {
      filter.severity = query.severity;
    }
    if (query.domain && query.domain !== 'all') {
      filter.domain = query.domain;
    }
    if (query.employee_id) {
      filter.employee_id = query.employee_id;
    }

    return await AnomalyAlert.find(filter)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('reviewed_by', 'email role')
      .sort({ createdAt: -1 });
  }

  /**
   * Get KPI Summary counts for HR Dashboard
   */
  async getAnomalyStats() {
    const [totalOpen, highOpen, mediumOpen, lowOpen] = await Promise.all([
      AnomalyAlert.countDocuments({ status: 'open' }),
      AnomalyAlert.countDocuments({ status: 'open', severity: 'high' }),
      AnomalyAlert.countDocuments({ status: 'open', severity: 'medium' }),
      AnomalyAlert.countDocuments({ status: 'open', severity: 'low' })
    ]);

    return {
      totalOpen,
      highOpen,
      mediumOpen,
      lowOpen
    };
  }

  /**
   * Get single anomaly by ID
   */
  async getAnomalyById(id) {
    const alert = await AnomalyAlert.findById(id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('reviewed_by', 'email role');

    if (!alert) {
      const err = new Error('Anomaly alert not found');
      err.statusCode = 404;
      throw err;
    }

    return alert;
  }

  /**
   * Mark anomaly as reviewed (Requires resolution note)
   */
  async reviewAnomaly(id, userId, resolutionNote) {
    if (!resolutionNote || !resolutionNote.trim()) {
      const err = new Error('Resolution note is required when reviewing an anomaly');
      err.statusCode = 400;
      throw err;
    }

    const alert = await AnomalyAlert.findById(id);
    if (!alert) {
      const err = new Error('Anomaly alert not found');
      err.statusCode = 404;
      throw err;
    }

    alert.status = 'reviewed';
    alert.reviewed_by = userId;
    alert.reviewed_at = new Date();
    alert.resolution_note = resolutionNote.trim();
    await alert.save();

    return await AnomalyAlert.findById(id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('reviewed_by', 'email role');
  }

  /**
   * Dismiss anomaly (Requires resolution note)
   */
  async dismissAnomaly(id, userId, resolutionNote) {
    if (!resolutionNote || !resolutionNote.trim()) {
      const err = new Error('Resolution note is required when dismissing an anomaly');
      err.statusCode = 400;
      throw err;
    }

    const alert = await AnomalyAlert.findById(id);
    if (!alert) {
      const err = new Error('Anomaly alert not found');
      err.statusCode = 404;
      throw err;
    }

    alert.status = 'dismissed';
    alert.reviewed_by = userId;
    alert.reviewed_at = new Date();
    alert.resolution_note = resolutionNote.trim();
    await alert.save();

    return await AnomalyAlert.findById(id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('reviewed_by', 'email role');
  }
}

module.exports = new AnomalyDetectionService();
