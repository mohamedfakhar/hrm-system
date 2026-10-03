const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const AnomalyAlert = require('../models/AnomalyAlert');
const Recommendation = require('../models/Recommendation');
const { parseDateRange } = require('../utils/assistant/dateParser');
const { resolveEmployee } = require('../utils/assistant/entityResolver');

/**
 * Controlled Assistant Tool Registry
 * All tools strictly validate arguments, sanitize outputs, and enforce safe limits.
 * No arbitrary MongoDB queries are permitted.
 */
class AssistantToolRegistry {
  constructor() {
    this.tools = {
      // 1. Employee Count
      getEmployeeCount: {
        name: 'getEmployeeCount',
        description: 'Returns total employee count, optionally filtered by department.',
        parameters: {
          department: { type: 'string', description: 'Department name (e.g. Engineering, Sales)' }
        },
        execute: async ({ department }) => {
          const filter = {};
          if (department && department.trim()) {
            filter.department = new RegExp(`^${department.trim()}$`, 'i');
          }
          const count = await Employee.countDocuments(filter);
          const formattedDept = department
            ? department.trim().charAt(0).toUpperCase() + department.trim().slice(1)
            : 'All Departments';
          return {
            count,
            department: formattedDept
          };
        }
      },

      // 2. Employees by Department
      getEmployeesByDepartment: {
        name: 'getEmployeesByDepartment',
        description: 'Returns safe list of employees in a specified department.',
        parameters: {
          department: { type: 'string', required: true, description: 'Department name' },
          limit: { type: 'number', description: 'Maximum records to return (max 50)' }
        },
        execute: async ({ department, limit = 50 }) => {
          if (!department || !department.trim()) {
            return { error: 'Department name is required' };
          }
          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);
          const employees = await Employee.find({
            department: new RegExp(`^${department.trim()}$`, 'i')
          })
            .select('_id employee_code full_name job_role department hire_date')
            .limit(safeLimit);

          return {
            department: department.trim(),
            count: employees.length,
            employees
          };
        }
      },

      // 3. Attendance Summary
      getAttendanceSummary: {
        name: 'getAttendanceSummary',
        description: 'Returns attendance summary metrics for a given date range or phrase (today, this week, this month).',
        parameters: {
          datePhrase: { type: 'string', description: 'today, yesterday, this week, this month, etc.' },
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        },
        execute: async ({ datePhrase, startDate, endDate }) => {
          let range;
          if (startDate && endDate) {
            range = {
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              label: `${startDate} to ${endDate}`
            };
          } else {
            range = parseDateRange(datePhrase);
          }

          const records = await Attendance.find({
            date: { $gte: range.startDate, $lte: range.endDate }
          });

          const totalRecords = records.length;
          const present = records.filter((r) => r.status === 'present').length;
          const late = records.filter((r) => r.status === 'late').length;
          const absent = records.filter((r) => r.status === 'absent').length;
          const half_day = records.filter((r) => r.status === 'half_day').length;

          const totalHours = records.reduce((sum, r) => sum + (r.working_hours || 0), 0);
          const totalLateMinutes = records.reduce((sum, r) => sum + (r.late_minutes || 0), 0);

          return {
            timeframe: range.label,
            totalRecords,
            present,
            late,
            absent,
            half_day,
            averageWorkingHours: totalRecords > 0 ? parseFloat((totalHours / totalRecords).toFixed(1)) : 0,
            totalLateMinutes
          };
        }
      },

      // 4. Late Employees
      getLateEmployees: {
        name: 'getLateEmployees',
        description: 'Returns employees with the highest lateness in a period.',
        parameters: {
          datePhrase: { type: 'string', description: 'this month, this week, today' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          limit: { type: 'number', description: 'Max items (default 10, max 50)' }
        },
        execute: async ({ datePhrase, startDate, endDate, limit = 10 }) => {
          let range;
          if (startDate && endDate) {
            range = { startDate: new Date(startDate), endDate: new Date(endDate), label: `${startDate} to ${endDate}` };
          } else {
            range = parseDateRange(datePhrase || 'this month');
          }

          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50);

          const records = await Attendance.find({
            date: { $gte: range.startDate, $lte: range.endDate },
            status: 'late'
          }).populate('employee_id', 'full_name employee_code department job_role');

          const map = new Map();
          for (const r of records) {
            if (!r.employee_id) continue;
            const id = r.employee_id._id.toString();
            if (!map.has(id)) {
              map.set(id, {
                employee_id: id,
                employee_name: r.employee_id.full_name,
                employee_code: r.employee_id.employee_code,
                department: r.employee_id.department,
                job_role: r.employee_id.job_role,
                late_days: 0,
                total_late_minutes: 0
              });
            }
            const emp = map.get(id);
            emp.late_days += 1;
            emp.total_late_minutes += r.late_minutes || 0;
          }

          const sorted = Array.from(map.values())
            .sort((a, b) => b.late_days - a.late_days || b.total_late_minutes - a.total_late_minutes)
            .slice(0, safeLimit);

          return {
            timeframe: range.label,
            total_late_employees: map.size,
            employees: sorted
          };
        }
      },

      // 5. Absent Employees
      getAbsentEmployees: {
        name: 'getAbsentEmployees',
        description: 'Returns employees marked absent for a date or period.',
        parameters: {
          datePhrase: { type: 'string', description: 'today, yesterday, this week' },
          limit: { type: 'number' }
        },
        execute: async ({ datePhrase, limit = 20 }) => {
          const range = parseDateRange(datePhrase || 'today');
          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);

          const records = await Attendance.find({
            date: { $gte: range.startDate, $lte: range.endDate },
            status: 'absent'
          }).populate('employee_id', 'full_name employee_code department job_role');

          const map = new Map();
          for (const r of records) {
            if (!r.employee_id) continue;
            const id = r.employee_id._id.toString();
            if (!map.has(id)) {
              map.set(id, {
                employee_id: id,
                employee_name: r.employee_id.full_name,
                employee_code: r.employee_id.employee_code,
                department: r.employee_id.department,
                absent_days: 0
              });
            }
            map.get(id).absent_days += 1;
          }

          const employees = Array.from(map.values())
            .sort((a, b) => b.absent_days - a.absent_days)
            .slice(0, safeLimit);

          return {
            timeframe: range.label,
            count: map.size,
            employees
          };
        }
      },

      // 6. Pending Leaves
      getPendingLeaves: {
        name: 'getPendingLeaves',
        description: 'Returns pending leave requests requiring HR review.',
        parameters: {
          limit: { type: 'number' }
        },
        execute: async ({ limit = 20 }) => {
          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);
          const totalPending = await LeaveRequest.countDocuments({ status: 'pending' });
          const requests = await LeaveRequest.find({ status: 'pending' })
            .populate('employee_id', 'full_name employee_code department job_role')
            .sort({ createdAt: -1 })
            .limit(safeLimit);

          return {
            count: totalPending,
            requests: requests.map((r) => ({
              id: r._id,
              employee_name: r.employee_id?.full_name || 'Staff',
              employee_code: r.employee_id?.employee_code || 'EMP',
              leave_type: r.leave_type,
              start_date: r.start_date,
              end_date: r.end_date,
              days_count: r.days_count,
              reason: r.reason
            }))
          };
        }
      },

      // 7. Leave Summary
      getLeaveSummary: {
        name: 'getLeaveSummary',
        description: 'Returns leave request metrics and status breakdown.',
        parameters: {
          datePhrase: { type: 'string' },
          status: { type: 'string', description: 'pending, approved, rejected' }
        },
        execute: async ({ datePhrase, status }) => {
          const range = parseDateRange(datePhrase || 'this month');
          const filter = {
            start_date: { $gte: range.startDate, $lte: range.endDate }
          };
          if (status && ['pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
            filter.status = status.toLowerCase();
          }

          const requests = await LeaveRequest.find(filter);
          const total = requests.length;
          const pending = requests.filter((r) => r.status === 'pending').length;
          const approved = requests.filter((r) => r.status === 'approved').length;
          const rejected = requests.filter((r) => r.status === 'rejected').length;

          const totalDaysApproved = requests
            .filter((r) => r.status === 'approved')
            .reduce((sum, r) => sum + (r.days_count || 0), 0);

          return {
            timeframe: range.label,
            total,
            pending,
            approved,
            rejected,
            totalDaysApproved
          };
        }
      },

      // 8. Payroll Summary
      getPayrollSummary: {
        name: 'getPayrollSummary',
        description: 'Returns aggregate payroll expenditures for a given month and year.',
        parameters: {
          month: { type: 'number', description: '1-12' },
          year: { type: 'number', description: 'e.g. 2026' }
        },
        execute: async ({ month, year }) => {
          const now = new Date();
          const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
          const targetYear = year ? parseInt(year) : now.getFullYear();

          const records = await Payroll.find({ month: targetMonth, year: targetYear });

          const employeeCount = records.length;
          const totalBasicSalary = records.reduce((sum, r) => sum + (r.basic_salary || 0), 0);
          const totalAllowances = records.reduce((sum, r) => sum + (r.total_allowances || 0), 0);
          const totalDeductions = records.reduce((sum, r) => sum + (r.total_deductions || 0), 0);
          const totalNetSalary = records.reduce((sum, r) => sum + (r.net_salary || 0), 0);
          const paidCount = records.filter((r) => r.status === 'paid').length;
          const pendingCount = records.filter((r) => r.status === 'pending').length;

          return {
            month: targetMonth,
            year: targetYear,
            employeeCount,
            totalBasicSalary: parseFloat(totalBasicSalary.toFixed(2)),
            totalAllowances: parseFloat(totalAllowances.toFixed(2)),
            totalDeductions: parseFloat(totalDeductions.toFixed(2)),
            totalNetSalary: parseFloat(totalNetSalary.toFixed(2)),
            paidCount,
            pendingCount
          };
        }
      },

      // 9. Payroll Deductions Spike
      getPayrollDeductions: {
        name: 'getPayrollDeductions',
        description: 'Returns employees with payroll deductions exceeding a threshold percentage of basic salary.',
        parameters: {
          month: { type: 'number' },
          year: { type: 'number' },
          thresholdPercent: { type: 'number', description: 'Default 25 percent' },
          limit: { type: 'number' }
        },
        execute: async ({ month, year, thresholdPercent = 25, limit = 20 }) => {
          const now = new Date();
          const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
          const targetYear = year ? parseInt(year) : now.getFullYear();
          const threshold = parseFloat(thresholdPercent) || 25;
          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);

          const records = await Payroll.find({
            month: targetMonth,
            year: targetYear
          }).populate('employee_id', 'full_name employee_code department job_role');

          const flagged = [];
          for (const r of records) {
            if (!r.employee_id) continue;
            const basic = r.basic_salary || 0;
            const ded = r.total_deductions || 0;
            if (basic > 0) {
              const pct = (ded / basic) * 100;
              if (pct > threshold) {
                flagged.push({
                  employee_name: r.employee_id.full_name,
                  employee_code: r.employee_id.employee_code,
                  department: r.employee_id.department,
                  basic_salary: basic,
                  total_deductions: ded,
                  deduction_percentage: parseFloat(pct.toFixed(1))
                });
              }
            }
          }

          return {
            month: targetMonth,
            year: targetYear,
            thresholdPercent: threshold,
            count: flagged.length,
            employees: flagged.slice(0, safeLimit)
          };
        }
      },

      // 10. Performance Summary
      getPerformanceSummary: {
        name: 'getPerformanceSummary',
        description: 'Returns overall performance evaluation grade distribution and average score for finalized evaluations.',
        parameters: {
          periodKey: { type: 'string', description: 'e.g. 2026-Q1' }
        },
        execute: async ({ periodKey }) => {
          const filter = { status: 'finalized' };
          if (periodKey) filter.period_key = periodKey;

          const evals = await PerformanceEvaluation.find(filter);
          const totalFinalized = evals.length;

          const sumScore = evals.reduce((sum, e) => sum + (e.final_score || 0), 0);
          const averageScore = totalFinalized > 0 ? parseFloat((sumScore / totalFinalized).toFixed(1)) : 0;

          const gradeDistribution = {
            A: evals.filter((e) => e.grade === 'A').length,
            B: evals.filter((e) => e.grade === 'B').length,
            C: evals.filter((e) => e.grade === 'C').length,
            D: evals.filter((e) => e.grade === 'D').length,
            F: evals.filter((e) => e.grade === 'F').length
          };

          return {
            periodKey: periodKey || 'All Finalized Periods',
            totalFinalized,
            averageScore,
            gradeDistribution
          };
        }
      },

      // 11. Low Performance Employees
      getLowPerformanceEmployees: {
        name: 'getLowPerformanceEmployees',
        description: 'Returns finalized evaluations with scores below a specified threshold (e.g. < 60).',
        parameters: {
          thresholdScore: { type: 'number', description: 'Score cutoff (default 60)' },
          limit: { type: 'number' }
        },
        execute: async ({ thresholdScore = 60, limit = 20 }) => {
          const threshold = parseFloat(thresholdScore) || 60;
          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);

          const evals = await PerformanceEvaluation.find({
            status: 'finalized',
            final_score: { $lt: threshold }
          })
            .populate('employee_id', 'full_name employee_code department job_role')
            .sort({ final_score: 1 })
            .limit(safeLimit);

          return {
            thresholdScore: threshold,
            count: evals.length,
            employees: evals.map((e) => ({
              employee_name: e.employee_id?.full_name || 'Staff',
              employee_code: e.employee_id?.employee_code || 'EMP',
              department: e.employee_id?.department || 'General',
              score: e.final_score,
              grade: e.grade,
              period_key: e.period_key
            }))
          };
        }
      },

      // 12. Open Anomalies
      getOpenAnomalies: {
        name: 'getOpenAnomalies',
        description: 'Returns open operational pattern anomalies across attendance, leave, and payroll.',
        parameters: {
          severity: { type: 'string', description: 'high, medium, low' },
          domain: { type: 'string', description: 'attendance, leave, payroll' },
          limit: { type: 'number' }
        },
        execute: async ({ severity, domain, limit = 20 }) => {
          const filter = { status: 'open' };
          if (severity && ['high', 'medium', 'low'].includes(severity.toLowerCase())) {
            filter.severity = severity.toLowerCase();
          }
          if (domain && ['attendance', 'leave', 'payroll'].includes(domain.toLowerCase())) {
            filter.domain = domain.toLowerCase();
          }

          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);
          const [total, high, medium, low, alerts] = await Promise.all([
            AnomalyAlert.countDocuments(filter),
            AnomalyAlert.countDocuments({ ...filter, severity: 'high' }),
            AnomalyAlert.countDocuments({ ...filter, severity: 'medium' }),
            AnomalyAlert.countDocuments({ ...filter, severity: 'low' }),
            AnomalyAlert.find(filter)
              .populate('employee_id', 'full_name employee_code department job_role')
              .sort({ createdAt: -1 })
              .limit(safeLimit)
          ]);

          return {
            total,
            high,
            medium,
            low,
            alerts: alerts.map((a) => ({
              id: a._id,
              employee_name: a.employee_id?.full_name || 'Staff',
              employee_code: a.employee_id?.employee_code || 'EMP',
              domain: a.domain,
              anomaly_code: a.anomaly_code,
              title: a.title,
              description: a.description,
              severity: a.severity,
              metrics: a.metrics_snapshot
            }))
          };
        }
      },

      // 13. Employee Anomalies
      getEmployeeAnomalies: {
        name: 'getEmployeeAnomalies',
        description: 'Returns anomaly alerts and factual pattern triggers for a specific employee.',
        parameters: {
          employeeQuery: { type: 'string', required: true, description: 'Employee name or code' }
        },
        execute: async ({ employeeQuery }) => {
          const resolved = await resolveEmployee(employeeQuery);
          if (resolved.ambiguous) {
            return {
              ambiguous: true,
              message: `Multiple employees match "${employeeQuery}". Please specify the employee code: ${resolved.candidates.map((c) => `${c.name} (${c.code})`).join(', ')}`
            };
          }
          if (resolved.notFound) {
            return { notFound: true, message: `No employee found matching "${employeeQuery}".` };
          }

          const employee = resolved.employee;
          const alerts = await AnomalyAlert.find({
            employee_id: employee._id
          }).sort({ createdAt: -1 });

          return {
            employee: {
              name: employee.full_name,
              code: employee.employee_code,
              department: employee.department
            },
            total_alerts: alerts.length,
            alerts: alerts.map((a) => ({
              code: a.anomaly_code,
              domain: a.domain,
              title: a.title,
              severity: a.severity,
              status: a.status,
              description: a.description,
              metrics: a.metrics_snapshot
            }))
          };
        }
      },

      // 14. Recommendations
      getRecommendations: {
        name: 'getRecommendations',
        description: 'Returns smart candidate recommendations (bonus consideration, promotion review, recognition, support check-ins).',
        parameters: {
          type: { type: 'string', description: 'bonus_consideration, promotion_review, recognition, support_check_in' },
          status: { type: 'string', description: 'suggested, accepted, rejected' },
          limit: { type: 'number' }
        },
        execute: async ({ type, status = 'suggested', limit = 20 }) => {
          const filter = {};
          if (status && status !== 'all') filter.status = status;
          if (type && type !== 'all') filter.type = type;

          const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);
          const recs = await Recommendation.find(filter)
            .populate('employee_id', 'full_name employee_code department job_role')
            .sort({ createdAt: -1 })
            .limit(safeLimit);

          return {
            count: recs.length,
            recommendations: recs.map((r) => ({
              id: r._id,
              employee_name: r.employee_id?.full_name || 'Staff',
              employee_code: r.employee_id?.employee_code || 'EMP',
              type: r.type,
              title: r.title,
              summary: r.summary,
              rationale: r.rationale,
              status: r.status,
              rule_code: r.rule_code
            }))
          };
        }
      },

      // 15. Employee Recommendations
      getEmployeeRecommendations: {
        name: 'getEmployeeRecommendations',
        description: 'Returns recommendations specific to an individual employee.',
        parameters: {
          employeeQuery: { type: 'string', required: true, description: 'Employee name or code' }
        },
        execute: async ({ employeeQuery }) => {
          const resolved = await resolveEmployee(employeeQuery);
          if (resolved.ambiguous) {
            return {
              ambiguous: true,
              message: `Multiple employees match "${employeeQuery}". Please specify the employee code: ${resolved.candidates.map((c) => `${c.name} (${c.code})`).join(', ')}`
            };
          }
          if (resolved.notFound) {
            return { notFound: true, message: `No employee found matching "${employeeQuery}".` };
          }

          const employee = resolved.employee;
          const recs = await Recommendation.find({
            employee_id: employee._id
          }).sort({ createdAt: -1 });

          return {
            employee: {
              name: employee.full_name,
              code: employee.employee_code,
              department: employee.department
            },
            count: recs.length,
            recommendations: recs.map((r) => ({
              type: r.type,
              title: r.title,
              summary: r.summary,
              rationale: r.rationale,
              status: r.status
            }))
          };
        }
      },

      // 16. Employee Specific Attendance
      getEmployeeAttendance: {
        name: 'getEmployeeAttendance',
        description: 'Returns attendance history and punctuality metrics for a specific employee.',
        parameters: {
          employeeQuery: { type: 'string', required: true, description: 'Employee name or code' },
          datePhrase: { type: 'string' }
        },
        execute: async ({ employeeQuery, datePhrase }) => {
          const resolved = await resolveEmployee(employeeQuery);
          if (resolved.ambiguous) {
            return {
              ambiguous: true,
              message: `Multiple employees match "${employeeQuery}". Please specify the employee code: ${resolved.candidates.map((c) => `${c.name} (${c.code})`).join(', ')}`
            };
          }
          if (resolved.notFound) {
            return { notFound: true, message: `No employee found matching "${employeeQuery}".` };
          }

          const range = parseDateRange(datePhrase || 'this month');
          const logs = await Attendance.find({
            employee_id: resolved.employee._id,
            date: { $gte: range.startDate, $lte: range.endDate }
          }).sort({ date: -1 });

          const totalDays = logs.length;
          const present = logs.filter((l) => l.status === 'present').length;
          const late = logs.filter((l) => l.status === 'late').length;
          const absent = logs.filter((l) => l.status === 'absent').length;
          const lateMinutes = logs.reduce((sum, l) => sum + (l.late_minutes || 0), 0);

          return {
            employee: {
              name: resolved.employee.full_name,
              code: resolved.employee.employee_code
            },
            timeframe: range.label,
            totalDays,
            present,
            late,
            absent,
            lateMinutes
          };
        }
      }
    };
  }

  getTool(name) {
    return this.tools[name] || null;
  }

  getAllTools() {
    return Object.values(this.tools);
  }
}

module.exports = new AssistantToolRegistry();
