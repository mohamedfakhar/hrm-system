/**
 * HRM System — Comprehensive Demo Seed Script
 *
 * Populates realistic, rich organizational demo data across all modules:
 * - Admin, HR, and Employee user accounts
 * - 5 realistic employees across Engineering, Sales, HR, Marketing
 * - Attendance history with on-time, late, and absent days
 * - Leave requests (pending, approved, rejected)
 * - Monthly payroll records with bonuses and deductions
 * - Performance evaluations (Draft & Finalized, Grades A, B, F)
 * - Operational anomaly alerts (High, Medium, Low)
 * - Smart candidate recommendations (Promotion, Bonus, Recognition, Support)
 * - Real-time notifications for both HR and Employee
 *
 * Usage:
 *   node seed_demo.js
 *
 * All demo credentials use: Password123!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const Attendance = require('./src/models/Attendance');
const LeaveRequest = require('./src/models/LeaveRequest');
const Payroll = require('./src/models/Payroll');
const PerformanceEvaluation = require('./src/models/PerformanceEvaluation');
const AnomalyAlert = require('./src/models/AnomalyAlert');
const Recommendation = require('./src/models/Recommendation');
const Notification = require('./src/models/Notification');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_system';
  console.log(`\nConnecting to MongoDB at: ${uri}`);
  await mongoose.connect(uri);

  console.log('Seeding HRM Demo Data...\n');

  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // ===========================================================================
  // 1. CORE USERS
  // ===========================================================================
  console.log('[1/7] Creating/Updating Demo Users...');

  // Admin
  const admin = await User.findOneAndUpdate(
    { email: 'admin@hrm.com' },
    { email: 'admin@hrm.com', password: hashedPassword, role: 'admin', is_active: true },
    { upsert: true, returnDocument: 'after' }
  );

  // HR Manager
  const hr = await User.findOneAndUpdate(
    { email: 'hr@hrm.com' },
    { email: 'hr@hrm.com', password: hashedPassword, role: 'hr', is_active: true },
    { upsert: true, returnDocument: 'after' }
  );

  // Employee 1: Alex Morgan (Default demo employee)
  const empUser1 = await User.findOneAndUpdate(
    { email: 'employee@hrm.com' },
    { email: 'employee@hrm.com', password: hashedPassword, role: 'employee', is_active: true },
    { upsert: true, returnDocument: 'after' }
  );

  // Employee 2: Ahmed Mohamed (Key Egyptian / Arabic query benchmark)
  const empUser2 = await User.findOneAndUpdate(
    { email: 'ahmed@hrm.com' },
    { email: 'ahmed@hrm.com', password: hashedPassword, role: 'employee', is_active: true },
    { upsert: true, returnDocument: 'after' }
  );

  // Employee 3: Sara Connor (Sales)
  const empUser3 = await User.findOneAndUpdate(
    { email: 'sara@hrm.com' },
    { email: 'sara@hrm.com', password: hashedPassword, role: 'employee', is_active: true },
    { upsert: true, returnDocument: 'after' }
  );

  // Employee 4: Tariq Mansour (HR Specialist)
  const empUser4 = await User.findOneAndUpdate(
    { email: 'tariq@hrm.com' },
    { email: 'tariq@hrm.com', password: hashedPassword, role: 'employee', is_active: true },
    { upsert: true, returnDocument: 'after' }
  );

  // Employee 5: Layla Hassan (Marketing)
  const empUser5 = await User.findOneAndUpdate(
    { email: 'layla@hrm.com' },
    { email: 'layla@hrm.com', password: hashedPassword, role: 'employee', is_active: true },
    { upsert: true, returnDocument: 'after' }
  );

  const demoCodes = ['EMP0001', 'EMP0002', 'EMP0003', 'EMP0004', 'EMP0005'];
  const demoUserIds = [admin._id, hr._id, empUser1._id, empUser2._id, empUser3._id, empUser4._id, empUser5._id];

  const oldDemoEmps = await Employee.find({
    $or: [
      { employee_code: { $in: demoCodes } },
      { user_id: { $in: demoUserIds } }
    ]
  }).select('_id');
  const oldDemoEmpIds = oldDemoEmps.map(e => e._id);

  if (oldDemoEmpIds.length > 0) {
    await Attendance.deleteMany({ employee_id: { $in: oldDemoEmpIds } });
    await LeaveRequest.deleteMany({ employee_id: { $in: oldDemoEmpIds } });
    await Payroll.deleteMany({ employee_id: { $in: oldDemoEmpIds } });
    await PerformanceEvaluation.deleteMany({ employee_id: { $in: oldDemoEmpIds } });
    await AnomalyAlert.deleteMany({ employee_id: { $in: oldDemoEmpIds } });
    await Recommendation.deleteMany({ employee_id: { $in: oldDemoEmpIds } });
    await Employee.deleteMany({ _id: { $in: oldDemoEmpIds } });
  }

  // Also remove old demo notifications
  await Notification.deleteMany({ user_id: { $in: demoUserIds } });

  // ===========================================================================
  // 2. EMPLOYEE PROFILES
  // ===========================================================================
  console.log('[2/7] Creating/Updating Employee Profiles...');

  const emp1 = await Employee.create({
    user_id: empUser1._id,
    employee_code: 'EMP0002',
    full_name: 'Alex Morgan',
    job_role: 'Senior Software Engineer',
    department: 'Engineering',
    basic_salary: 16000,
    annual_leave_balance: 18,
    hire_date: new Date('2024-01-15'),
    phone: '+201012345671',
    address: '742 Evergreen Terrace, Cairo'
  });

  const emp2 = await Employee.create({
    user_id: empUser2._id,
    employee_code: 'EMP0001',
    full_name: 'Ahmed Mohamed',
    job_role: 'Full Stack Developer',
    department: 'Engineering',
    basic_salary: 14000,
    annual_leave_balance: 15,
    hire_date: new Date('2024-06-01'),
    phone: '+201012345672',
    address: '15 El-Tahrir Street, Cairo'
  });

  const emp3 = await Employee.create({
    user_id: empUser3._id,
    employee_code: 'EMP0003',
    full_name: 'Sara Connor',
    job_role: 'Senior Account Executive',
    department: 'Sales',
    basic_salary: 13000,
    annual_leave_balance: 20,
    hire_date: new Date('2024-03-10'),
    phone: '+201012345673',
    address: '22 Al-Nasr Road, Alexandria'
  });

  const emp4 = await Employee.create({
    user_id: empUser4._id,
    employee_code: 'EMP0004',
    full_name: 'Tariq Mansour',
    job_role: 'HR Specialist',
    department: 'HR',
    basic_salary: 11000,
    annual_leave_balance: 21,
    hire_date: new Date('2024-08-20'),
    phone: '+201012345674',
    address: '5 Cleopatra Square, Heliopolis'
  });

  const emp5 = await Employee.create({
    user_id: empUser5._id,
    employee_code: 'EMP0005',
    full_name: 'Layla Hassan',
    job_role: 'Growth Marketing Manager',
    department: 'Marketing',
    basic_salary: 12500,
    annual_leave_balance: 19,
    hire_date: new Date('2024-02-01'),
    phone: '+201012345675',
    address: '90 North Road, New Cairo'
  });

  // ===========================================================================
  // 3. ATTENDANCE RECORDS (Past 14 Days & Today)
  // ===========================================================================
  console.log('[3/7] Seeding Attendance Records...');

  const employees = [emp1, emp2, emp3, emp4, emp5];

  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setUTCHours(0, 0, 0, 0);

    // Skip weekends (Friday & Saturday in regional context, or Sat & Sun)
    const dayOfWeek = d.getUTCDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

    for (const emp of employees) {
      // Create interesting patterns
      let status = 'present';
      let check_in = '09:00';
      let check_out = '17:00';
      let working_hours = 8;
      let late_minutes = 0;

      if (emp.employee_code === 'EMP0001') {
        // Ahmed Mohamed has occasional lateness and 1 absent day
        if (i === 1 || i === 3 || i === 7 || i === 9) {
          status = 'late';
          check_in = '09:45';
          check_out = '17:00';
          working_hours = 7.25;
          late_minutes = 45;
        } else if (i === 4) {
          status = 'absent';
          check_in = null;
          check_out = null;
          working_hours = 0;
          late_minutes = 0;
        }
      } else if (emp.employee_code === 'EMP0002') {
        // Alex Morgan: today check in
        if (i === 0) {
          status = 'present';
          check_in = '08:55';
          check_out = null;
          working_hours = 4;
        }
      } else if (emp.employee_code === 'EMP0003' && i === 6) {
        status = 'late';
        check_in = '09:30';
        late_minutes = 30;
        working_hours = 7.5;
      }

      await Attendance.findOneAndUpdate(
        { employee_id: emp._id, date: d },
        {
          employee_id: emp._id,
          date: d,
          check_in,
          check_out,
          working_hours,
          late_minutes,
          status,
          notes: status === 'late' ? 'Heavy morning traffic' : null
        },
        { upsert: true }
      );
    }
  }

  // ===========================================================================
  // 4. LEAVE REQUESTS
  // ===========================================================================
  console.log('[4/7] Seeding Leave Requests...');

  // Pending leave for Alex Morgan
  const startPending = new Date();
  startPending.setDate(startPending.getDate() + 5);
  const endPending = new Date();
  endPending.setDate(endPending.getDate() + 7);

  await LeaveRequest.findOneAndUpdate(
    { employee_id: emp1._id, status: 'pending' },
    {
      employee_id: emp1._id,
      leave_type: 'annual',
      start_date: startPending,
      end_date: endPending,
      days_count: 3,
      reason: 'Family vacation travel',
      status: 'pending'
    },
    { upsert: true }
  );

  // Approved leave for Ahmed Mohamed
  const startApproved = new Date();
  startApproved.setDate(startApproved.getDate() - 10);
  const endApproved = new Date();
  endApproved.setDate(endApproved.getDate() - 8);

  await LeaveRequest.findOneAndUpdate(
    { employee_id: emp2._id, leave_type: 'annual' },
    {
      employee_id: emp2._id,
      leave_type: 'annual',
      start_date: startApproved,
      end_date: endApproved,
      days_count: 3,
      reason: 'Personal affairs',
      status: 'approved',
      reviewed_by: hr._id,
      reviewed_at: new Date()
    },
    { upsert: true }
  );

  // Approved Sick leave for Sara Connor (verifies non-deduction from annual balance)
  await LeaveRequest.findOneAndUpdate(
    { employee_id: emp3._id, leave_type: 'sick' },
    {
      employee_id: emp3._id,
      leave_type: 'sick',
      start_date: startApproved,
      end_date: endApproved,
      days_count: 2,
      reason: 'Doctor prescribed rest',
      status: 'approved',
      reviewed_by: hr._id,
      reviewed_at: new Date()
    },
    { upsert: true }
  );

  // ===========================================================================
  // 5. MONTHLY PAYROLL
  // ===========================================================================
  console.log('[5/7] Seeding Payroll Records...');

  // Alex Morgan: Pending
  await Payroll.findOneAndUpdate(
    { employee_id: emp1._id, month: currentMonth, year: currentYear },
    {
      employee_id: emp1._id,
      month: currentMonth,
      year: currentYear,
      basic_salary: 16000,
      working_days: 22,
      present_days: 20,
      absent_days: 0,
      late_hours: 0,
      bonuses: 1000,
      total_deductions: 500,
      net_salary: 16500,
      payment_status: 'pending'
    },
    { upsert: true }
  );

  // Ahmed Mohamed: High deduction spike (>25%)
  await Payroll.findOneAndUpdate(
    { employee_id: emp2._id, month: currentMonth, year: currentYear },
    {
      employee_id: emp2._id,
      month: currentMonth,
      year: currentYear,
      basic_salary: 14000,
      working_days: 22,
      present_days: 18,
      absent_days: 1,
      late_hours: 4,
      late_deduction: 800,
      absent_deduction: 700,
      bonuses: 0,
      total_deductions: 4200, // >25% deduction spike!
      net_salary: 9800,
      payment_status: 'pending'
    },
    { upsert: true }
  );

  // Sara Connor: Paid
  await Payroll.findOneAndUpdate(
    { employee_id: emp3._id, month: currentMonth, year: currentYear },
    {
      employee_id: emp3._id,
      month: currentMonth,
      year: currentYear,
      basic_salary: 13000,
      working_days: 22,
      present_days: 21,
      absent_days: 0,
      bonuses: 2500,
      total_deductions: 600,
      net_salary: 14900,
      payment_status: 'paid',
      paid_at: new Date()
    },
    { upsert: true }
  );

  // Tariq Mansour: Paid
  await Payroll.findOneAndUpdate(
    { employee_id: emp4._id, month: currentMonth, year: currentYear },
    {
      employee_id: emp4._id,
      month: currentMonth,
      year: currentYear,
      basic_salary: 11000,
      working_days: 22,
      present_days: 22,
      absent_days: 0,
      bonuses: 500,
      total_deductions: 300,
      net_salary: 11200,
      payment_status: 'paid',
      paid_at: new Date()
    },
    { upsert: true }
  );

  // ===========================================================================
  // 6. PERFORMANCE, ANOMALIES & RECOMMENDATIONS
  // ===========================================================================
  console.log('[6/7] Seeding HR Intelligence (Evaluations, Anomalies, Recommendations)...');

  // Alex Morgan: Grade A (Promotion Candidate)
  await PerformanceEvaluation.findOneAndUpdate(
    { employee_id: emp1._id, period_key: `${currentYear}-Q1` },
    {
      employee_id: emp1._id,
      evaluator_id: hr._id,
      period_type: 'quarterly',
      period_key: `${currentYear}-Q1`,
      start_date: new Date(`${currentYear}-01-01`),
      end_date: new Date(`${currentYear}-03-31`),
      skills: [
        { name: 'System Architecture', score: 95, weight: 1.5 },
        { name: 'Code Quality', score: 90, weight: 1.0 },
        { name: 'Collaboration & Mentorship', score: 92, weight: 1.0 }
      ],
      skill_score: 93,
      attendance_metrics: { total_working_days: 60, present_days: 59, late_days: 1, unexcused_absences: 0 },
      attendance_score: 98,
      final_score: 94.5,
      grade: 'A',
      feedback: 'Outstanding technical leadership and reliable execution throughout Q1.',
      status: 'finalized',
      finalized_at: new Date()
    },
    { upsert: true }
  );

  // Ahmed Mohamed: Grade F (Low Performance & Lateness Anomaly)
  await PerformanceEvaluation.findOneAndUpdate(
    { employee_id: emp2._id, period_key: `${currentYear}-Q1` },
    {
      employee_id: emp2._id,
      evaluator_id: hr._id,
      period_type: 'quarterly',
      period_key: `${currentYear}-Q1`,
      start_date: new Date(`${currentYear}-01-01`),
      end_date: new Date(`${currentYear}-03-31`),
      skills: [
        { name: 'Task Completion', score: 55, weight: 1.0 },
        { name: 'Code Quality', score: 50, weight: 1.0 }
      ],
      skill_score: 52.5,
      attendance_metrics: { total_working_days: 60, present_days: 48, late_days: 8, unexcused_absences: 4 },
      attendance_score: 60,
      final_score: 54.8,
      grade: 'F',
      feedback: 'Repeated delays and missing sprint deliverables. Needs coaching and support check-in.',
      status: 'finalized',
      finalized_at: new Date()
    },
    { upsert: true }
  );

  // High-Severity Anomaly for Ahmed Mohamed (Lateness Spike)
  await AnomalyAlert.findOneAndUpdate(
    { employee_id: emp2._id, anomaly_code: 'ATT_LATENESS_SPIKE' },
    {
      employee_id: emp2._id,
      domain: 'attendance',
      anomaly_code: 'ATT_LATENESS_SPIKE',
      title: 'Lateness Spike Detected',
      description: 'Employee had 5 late check-ins in the last 14 days (exceeds threshold of 3).',
      severity: 'high',
      status: 'open',
      metrics_snapshot: { observed: { late_count: 5, late_minutes: 210 }, timeframe: '14_days' }
    },
    { upsert: true }
  );

  // High-Severity Payroll Anomaly for Ahmed Mohamed
  await AnomalyAlert.findOneAndUpdate(
    { employee_id: emp2._id, anomaly_code: 'PAY_DEDUCTION_SPIKE' },
    {
      employee_id: emp2._id,
      domain: 'payroll',
      anomaly_code: 'PAY_DEDUCTION_SPIKE',
      title: 'Salary Deduction Spike (>25%)',
      description: 'Total deductions of 4,200 exceed 25% of gross basic salary (30% deduction rate).',
      severity: 'high',
      status: 'open',
      metrics_snapshot: { observed: { total_deductions: 4200, basic_salary: 14000, deduction_pct: 30 } }
    },
    { upsert: true }
  );

  // Medium-Severity Anomaly for Alex Morgan
  await AnomalyAlert.findOneAndUpdate(
    { employee_id: emp1._id, anomaly_code: 'LEV_FREQUENCY_SPIKE' },
    {
      employee_id: emp1._id,
      domain: 'leave',
      anomaly_code: 'LEV_FREQUENCY_SPIKE',
      title: 'Leave Frequency Spike',
      description: 'Employee submitted 3 leave requests within a 30-day window.',
      severity: 'medium',
      status: 'open',
      metrics_snapshot: { observed: { requests_count: 3 }, timeframe: '30_days' }
    },
    { upsert: true }
  );

  // Smart Recommendations
  // 1. Promotion Review Candidate for Alex Morgan
  await Recommendation.findOneAndUpdate(
    { employee_id: emp1._id, rule_code: 'PROMOTION_REVIEW_CANDIDATE' },
    {
      employee_id: emp1._id,
      type: 'promotion_review',
      title: 'Promotion Review Candidate',
      summary: 'Alex Morgan qualifies for promotion review based on 2+ years tenure and Grade A performance.',
      rationale: [
        'Tenure of 26 months exceeds 12-month minimum',
        'Consistently achieved Grade A performance evaluation',
        'High skill mastery score of 93%'
      ],
      rule_code: 'PROMOTION_REVIEW_CANDIDATE',
      rule_version: '1.0',
      status: 'suggested',
      supporting_data: { tenure_months: 26, performance_score: 94.5, performance_grade: 'A', open_anomalies: 1, high_severity_anomalies: 0 }
    },
    { upsert: true }
  );

  // 2. Bonus Consideration for Sara Connor
  await Recommendation.findOneAndUpdate(
    { employee_id: emp3._id, rule_code: 'BONUS_CONSIDERATION_CANDIDATE' },
    {
      employee_id: emp3._id,
      type: 'bonus_consideration',
      title: 'Quarterly Bonus Consideration',
      summary: 'Sara Connor exceeded sales targets with zero high-severity anomalies.',
      rationale: ['Top quarterly revenue contributor', 'Grade B performance score with perfect attendance'],
      rule_code: 'BONUS_CONSIDERATION_CANDIDATE',
      rule_version: '1.0',
      status: 'suggested',
      supporting_data: { performance_score: 88, open_anomalies: 0, high_severity_anomalies: 0 }
    },
    { upsert: true }
  );

  // 3. Support Check-In for Ahmed Mohamed
  await Recommendation.findOneAndUpdate(
    { employee_id: emp2._id, rule_code: 'SUPPORT_CHECK_IN_HIGH_ANOMALY' },
    {
      employee_id: emp2._id,
      type: 'support_check_in',
      title: 'Support Check-In Recommended',
      summary: 'Recommend 1-on-1 check-in due to multiple high-severity lateness and deduction alerts.',
      rationale: ['Multiple high-severity operational anomalies open', 'Q1 performance evaluation below 60'],
      rule_code: 'SUPPORT_CHECK_IN_HIGH_ANOMALY',
      rule_version: '1.0',
      status: 'suggested',
      supporting_data: { performance_score: 54.8, open_anomalies: 2, high_severity_anomalies: 2 }
    },
    { upsert: true }
  );

  // ===========================================================================
  // 7. REAL-TIME NOTIFICATIONS
  // ===========================================================================
  console.log('[7/7] Seeding Notifications...');

  // Notifications for Alex Morgan
  await Notification.create([
    {
      user_id: empUser1._id,
      title: 'Performance Evaluation Finalized',
      message: `Your Q1 performance evaluation has been published. Final Score: 94.5 (Grade A).`,
      type: 'info',
      is_read: false
    },
    {
      user_id: empUser1._id,
      title: 'Leave Request Received',
      message: 'Your annual leave request (3 days) has been submitted and is pending HR approval.',
      type: 'info',
      is_read: true
    }
  ]);

  // Notifications for HR Manager
  await Notification.create([
    {
      user_id: hr._id,
      title: 'High Anomaly: Lateness Spike Detected',
      message: 'Ahmed Mohamed: Employee had 5 late check-ins in the last 14 days.',
      type: 'info',
      is_read: false
    },
    {
      user_id: hr._id,
      title: 'New Smart Recommendation',
      message: 'Alex Morgan qualifies for Promotion Review Candidate.',
      type: 'info',
      is_read: false
    },
    {
      user_id: hr._id,
      title: 'Pending Leave Request',
      message: 'Alex Morgan requested 3 days annual leave awaiting review.',
      type: 'info',
      is_read: false
    }
  ]);

  console.log('\n======================================================');
  console.log('🎉 COMPREHENSIVE HRM DEMO DATA SEEDED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('\nReady-to-Use Demo Accounts (Password for all: Password123!)');
  console.log('──────────────────────────────────────────────────────');
  console.log('1. Admin:    admin@hrm.com    → Full Access + Add HR (/admin/add-hr)');
  console.log('2. HR:       hr@hrm.com       → Full HR Portal (/hr/dashboard)');
  console.log('3. Employee: employee@hrm.com → Alex Morgan (/employee/dashboard)');
  console.log('4. Employee: ahmed@hrm.com    → Ahmed Mohamed (Lateness anomaly & low score)');
  console.log('5. Employee: sara@hrm.com     → Sara Connor (Sales bonus candidate)');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed Error:', err);
  process.exit(1);
});
