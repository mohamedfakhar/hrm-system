const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_ENV = 'test';
const { app } = require('./src/server');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const Attendance = require('./src/models/Attendance');
const LeaveRequest = require('./src/models/LeaveRequest');
const Payroll = require('./src/models/Payroll');
const AnomalyAlert = require('./src/models/AnomalyAlert');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, fetchOptions);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data, headers: res.headers };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runAnomalyTests() {
  console.log('--- STARTING ANOMALY DETECTION INTEGRATION TESTS ---');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_system');
  }
  console.log('✓ MongoDB Connected');

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
  console.log(`✓ Test Server running at ${baseUrl}`);

  try {
    const timestamp = Date.now();

    // 1. Setup HR user & Employee
    const hrEmail = `hr_anom_${timestamp}@test.com`;
    const hrUser = await User.create({
      email: hrEmail,
      password: 'hashedPassword',
      role: 'hr'
    });

    const empEmail = `emp_anom_${timestamp}@test.com`;
    const empUser = await User.create({
      email: empEmail,
      password: 'hashedPassword',
      role: 'employee'
    });

    // Employee with tenure > 14 days (hired 60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const employee = await Employee.create({
      user_id: empUser._id,
      full_name: 'Anomaly Test Employee',
      employee_code: `ANOM_${timestamp}`,
      job_role: 'QA Analyst',
      department: 'Quality Assurance',
      basic_salary: 8000,
      hire_date: sixtyDaysAgo,
      phone: '+1234567899'
    });

    const jwt = require('jsonwebtoken');
    const hrToken = jwt.sign(
      { id: hrUser._id, email: hrUser.email, role: 'hr' },
      process.env.JWT_SECRET
    );
    const empToken = jwt.sign(
      { id: empUser._id, email: empUser.email, role: 'employee' },
      process.env.JWT_SECRET
    );

    // TEST 1: Role permission guard (Employee blocked from /intelligence/anomalies)
    console.log('\n[Case 1] Verify Employee is blocked from Anomaly APIs...');
    const empBlockRes = await request('/intelligence/anomalies', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(empBlockRes.status === 403, 'Employee is blocked with 403 Forbidden');

    // 2. Setup telemetry triggers:
    // A. Lateness spike (create 4 late check-ins in last 5 days)
    const now = new Date();
    for (let i = 1; i <= 4; i++) {
      const lateDate = new Date(now);
      lateDate.setDate(lateDate.getDate() - i);
      await Attendance.create({
        employee_id: employee._id,
        date: lateDate,
        check_in: '09:45',
        late_minutes: 45,
        status: 'late'
      });
    }

    // B. Leave frequency spike (create 3 leave requests in last 7 days)
    for (let i = 1; i <= 3; i++) {
      const leaveDate = new Date(now);
      leaveDate.setDate(leaveDate.getDate() - i);
      await LeaveRequest.create({
        employee_id: employee._id,
        leave_type: 'emergency',
        start_date: leaveDate,
        end_date: leaveDate,
        days_count: 1,
        reason: `Urgent personal matter ${i}`,
        status: 'pending'
      });
    }

    // C. Payroll deduction spike (total_deductions = 3000 > 25% of 8000 = 2000)
    await Payroll.create({
      employee_id: employee._id,
      month: 9,
      year: 2026,
      basic_salary: 8000,
      working_days: 22,
      present_days: 15,
      absent_days: 7,
      absent_deduction: 3000,
      total_deductions: 3000,
      net_salary: 5000,
      payment_status: 'paid'
    });

    // TEST 2: Trigger manual Anomaly Scan
    console.log('\n[Case 2] HR triggers anomaly detection scan...');
    const scanRes = await request('/intelligence/anomalies/scan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(scanRes.status === 200, 'POST /intelligence/anomalies/scan returns 200');
    assert(scanRes.data?.data?.alerts_created >= 2, 'Generated at least 2 distinct operational anomalies');

    // TEST 3: List generated anomalies
    console.log('\n[Case 3] HR lists detected anomalies...');
    const listRes = await request(`/intelligence/anomalies?employee_id=${employee._id}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(listRes.status === 200, 'GET /intelligence/anomalies returns 200');
    const employeeAnomalies = listRes.data?.data || [];
    assert(employeeAnomalies.length >= 2, `Found ${employeeAnomalies.length} anomalies for employee`);

    const latenessAlert = employeeAnomalies.find((a) => a.anomaly_code === 'ATT_LATENESS_SPIKE');
    assert(!!latenessAlert, 'Detected ATT_LATENESS_SPIKE alert');
    assert(latenessAlert.severity === 'medium', 'Lateness spike has medium severity');

    const leaveAlert = employeeAnomalies.find((a) => a.anomaly_code === 'LEV_FREQUENCY_SPIKE');
    assert(!!leaveAlert, 'Detected LEV_FREQUENCY_SPIKE alert');
    assert(leaveAlert.severity === 'low', 'Leave frequency spike has low severity');

    const payrollAlert = employeeAnomalies.find((a) => a.anomaly_code === 'PAY_DEDUCTION_SPIKE');
    assert(!!payrollAlert, 'Detected PAY_DEDUCTION_SPIKE alert');
    assert(payrollAlert.severity === 'high', 'Payroll deduction spike has high severity');

    // TEST 4: Deduplication test (Re-running scan does NOT duplicate open alerts)
    console.log('\n[Case 4] Verify deduplication on re-scan...');
    const scanRes2 = await request('/intelligence/anomalies/scan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(scanRes2.status === 200, 'Second scan returns 200');
    assert(scanRes2.data?.data?.alerts_created === 0, 'No duplicate alerts created on re-scan (alerts_created === 0)');

    // TEST 5: Anomaly stats API
    console.log('\n[Case 5] Fetch anomaly summary stats...');
    const statsRes = await request('/intelligence/anomalies/stats', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(statsRes.status === 200, 'GET /intelligence/anomalies/stats returns 200');
    assert(statsRes.data?.data?.totalOpen >= 3, 'Total open anomalies matches expectations');

    // TEST 6: Review action requires resolution note
    console.log('\n[Case 6] Review without resolution note is rejected...');
    const badReviewRes = await request(`/intelligence/anomalies/${latenessAlert._id}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { resolution_note: '' }
    });
    assert(badReviewRes.status === 400, 'Review without note rejected with 400 Bad Request');

    // TEST 7: Review action succeeds with note
    console.log('\n[Case 7] Review anomaly with resolution note...');
    const reviewRes = await request(`/intelligence/anomalies/${latenessAlert._id}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { resolution_note: 'Discussed with employee: temporary public transit delay on their route.' }
    });
    assert(reviewRes.status === 200, 'Review action returns 200');
    assert(reviewRes.data?.data?.status === 'reviewed', 'Status updated to reviewed');
    assert(!!reviewRes.data?.data?.reviewed_at, 'reviewed_at timestamp recorded');

    // TEST 8: Dismiss action succeeds
    console.log('\n[Case 8] Dismiss anomaly with resolution note...');
    const dismissRes = await request(`/intelligence/anomalies/${leaveAlert._id}/dismiss`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { resolution_note: 'Expected seasonal emergency leave submissions.' }
    });
    assert(dismissRes.status === 200, 'Dismiss action returns 200');
    assert(dismissRes.data?.data?.status === 'dismissed', 'Status updated to dismissed');

    console.log('\n======================================================');
    console.log('🎉 ALL 8 ANOMALY DETECTION TEST CASES PASSED!');
    console.log('======================================================\n');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

runAnomalyTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Anomaly Test Suite Failed:', err);
    process.exit(1);
  });
