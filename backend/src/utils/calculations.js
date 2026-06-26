exports.calculatePayroll = (employee, attendanceRecords) => {
  const workingDays = 22;
  const dailyRate = employee.basic_salary / workingDays;
  const hourlyRate = dailyRate / 8;

  const presentDays = attendanceRecords.filter(
    (r) => r.status === "present" || r.status === "late",
  ).length;
  const absentDays = attendanceRecords.filter(
    (r) => r.status === "absent",
  ).length;
  const totalLateMinutes = attendanceRecords.reduce(
    (sum, r) => sum + (r.late_minutes || 0),
    0,
  );
  const lateHours = totalLateMinutes / 60;

  const lateDeduction = parseFloat((lateHours * hourlyRate).toFixed(2));
  const absentDeduction = parseFloat((absentDays * dailyRate).toFixed(2));
  const totalDeductions = parseFloat(
    (lateDeduction + absentDeduction).toFixed(2),
  );
  const netSalary = parseFloat(
    (employee.basic_salary - totalDeductions).toFixed(2),
  );

  return {
    working_days: workingDays,
    present_days: presentDays,
    absent_days: absentDays,
    late_hours: parseFloat(lateHours.toFixed(2)),
    late_deduction: lateDeduction,
    absent_deduction: absentDeduction,
    total_deductions: totalDeductions,
    net_salary: netSalary < 0 ? 0 : netSalary,
  };
};
