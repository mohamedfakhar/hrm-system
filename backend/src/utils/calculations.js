/**
 * Deterministic Payroll Calculation Utility
 * Single Source of Truth for salary computations across services and controllers.
 *
 * Assumptions:
 * - 22 standard working days per month
 * - 8 working hours per day
 * - Status values are normalized lowercase: 'present', 'late', 'absent', 'half_day'
 * - Approved paid leaves (e.g. annual) protect an employee from unexcused absence deductions
 */
exports.calculatePayroll = (employee, attendanceRecords = [], approvedLeaveDays = 0, bonuses = 0) => {
  const workingDays = 22;
  const basicSalary = Number(employee.basic_salary) || 0;
  const dailyRate = parseFloat((basicSalary / workingDays).toFixed(2));
  const hourlyRate = parseFloat((dailyRate / 8).toFixed(2));

  // Count present & late days
  const presentDays = attendanceRecords.filter(
    (r) => r.status === 'present' || r.status === 'late'
  ).length;

  // Total late minutes recorded across all attendance logs
  const totalLateMinutes = attendanceRecords.reduce(
    (sum, r) => sum + (Number(r.late_minutes) || 0),
    0
  );
  const lateHours = parseFloat((totalLateMinutes / 60).toFixed(2));
  const lateDeduction = parseFloat((lateHours * hourlyRate).toFixed(2));

  // Absence Determination:
  // 1. Count records explicitly recorded with status 'absent'
  const explicitAbsences = attendanceRecords.filter(
    (r) => r.status === 'absent'
  ).length;

  // 2. If no explicit absences logged, but attendance records exist for the month,
  // evaluate unexcused missing days: workingDays - presentDays - approvedLeaveDays
  let absentDays = explicitAbsences;
  if (explicitAbsences === 0 && attendanceRecords.length > 0) {
    const accountedDays = presentDays + (Number(approvedLeaveDays) || 0);
    absentDays = Math.max(0, workingDays - accountedDays);
  }

  const absentDeduction = parseFloat((absentDays * dailyRate).toFixed(2));
  const totalDeductions = parseFloat((lateDeduction + absentDeduction).toFixed(2));
  const bonusAmount = parseFloat((Number(bonuses) || 0).toFixed(2));

  const netSalaryCalculated = parseFloat(
    (basicSalary - totalDeductions + bonusAmount).toFixed(2)
  );

  return {
    working_days: workingDays,
    present_days: presentDays,
    absent_days: absentDays,
    late_hours: lateHours,
    late_deduction: lateDeduction,
    absent_deduction: absentDeduction,
    bonuses: bonusAmount,
    total_deductions: totalDeductions,
    net_salary: netSalaryCalculated < 0 ? 0 : netSalaryCalculated
  };
};
