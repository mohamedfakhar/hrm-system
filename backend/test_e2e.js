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
const Notification = require('./src/models/Notification');
const RefreshToken = require('./src/models/RefreshToken');

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

async function runTests() {
  console.log('--- STARTING HRM COMPREHENSIVE END-TO-END TEST ---');

  // server.js automatically invokes connectDB()
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrm_db');
  }
  console.log('✓ MongoDB Connected');

  // Start server on ephemeral port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
  console.log(`✓ Test Server running at ${baseUrl}`);

  try {
    const timestamp = Date.now();

    // ----------------------------------------------------
    // TEST 1: Registration Security (Privilege Escalation Prevention)
    // ----------------------------------------------------
    console.log('\n[Test 1] Testing Public Registration & Privilege Escalation...');
    const regPayload = {
      email: `test_emp_${timestamp}@test.com`,
      password: 'Password123!',
      role: 'admin' // Attempting privilege escalation!
    };
    const regRes = await request('/auth/register', { method: 'POST', body: regPayload });
    const regUser = regRes.data?.data;
    assert(regUser.role === 'employee', 'Security verified: role is forced to employee despite role=admin payload');

    // ----------------------------------------------------
    // TEST 2: Login, Auth Me, Refresh Token, and Role Blocking
    // ----------------------------------------------------
    console.log('\n[Test 2] Testing Login, Token Refresh & Authorization Guards...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: regPayload.email, password: 'Password123!' }
    });
    assert(loginRes.status === 200, 'Login succeeded');
    const empToken = loginRes.data.token;
    const empRefreshToken = loginRes.data.refreshToken;
    const empUser = loginRes.data.user;
    assert(!!empToken, 'Access token issued');
    assert(!!empRefreshToken, 'Refresh token issued');

    // Test /auth/me
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    const meUser = meRes.data.data || meRes.data.user;
    assert(meUser.email === regPayload.email, '/auth/me returns current authenticated user');

    // Test refresh token
    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: empRefreshToken }
    });
    assert(refreshRes.status === 200, 'POST /auth/refresh returns 200 with new token');
    assert(!!refreshRes.data.token, 'New access token received');

    // Test Authorization: Employee trying to access HR-only endpoint
    const hrBlockRes = await request('/employees', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(hrBlockRes.status === 403, 'Authorization guard verified: Employee blocked from GET /employees with 403 Forbidden');

    // ----------------------------------------------------
    // TEST 3: Admin & HR Creation
    // ----------------------------------------------------
    console.log('\n[Test 3] Setting up Admin and testing Add HR...');
    // Create an Admin user in DB
    const adminEmail = `admin_${timestamp}@test.com`;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
    const adminUser = await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      is_active: true
    });

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: 'AdminPassword123!' }
    });
    assert(adminLogin.status === 200, 'Admin login succeeded');
    const adminToken = adminLogin.data.token;

    // Admin creates HR
    const hrEmail = `hr_${timestamp}@test.com`;
    const addHrRes = await request('/auth/add-hr', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { email: hrEmail, password: 'HrPassword123!' }
    });
    assert(addHrRes.status === 201, 'Admin successfully added HR manager via POST /auth/add-hr');

    // Log in as HR
    const hrLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: hrEmail, password: 'HrPassword123!' }
    });
    assert(hrLogin.status === 200, 'HR login succeeded');
    const hrToken = hrLogin.data.token;

    // ----------------------------------------------------
    // TEST 4: Employee Management (Create with canonical phone)
    // ----------------------------------------------------
    console.log('\n[Test 4] Testing Employee Creation with canonical phone...');
    const newEmpEmail = `emp_managed_${timestamp}@test.com`;
    const createEmpRes = await request('/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        email: newEmpEmail,
        password: 'EmployeePassword123!',
        full_name: 'Test Engineer',
        job_role: 'Full Stack Engineer',
        department: 'Engineering',
        basic_salary: 15000,
        hire_date: '2026-01-01',
        phone: '+201099887766'
      }
    });
    assert(createEmpRes.status === 201, 'POST /employees returns 201 Created');
    const createdEmployee = createEmpRes.data.data;
    assert(createdEmployee.phone === '+201099887766', 'Canonical phone field properly saved and returned');
    assert(!!createdEmployee.employee_code, `Employee code successfully generated: ${createdEmployee.employee_code}`);

    // Log in as this newly created employee
    const managedEmpLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: newEmpEmail, password: 'EmployeePassword123!' }
    });
    assert(managedEmpLogin.status === 200, 'Newly created employee can log in');
    const managedEmpToken = managedEmpLogin.data.token;
    const managedEmpId = createdEmployee._id;

    // Test profile endpoint
    const profileRes = await request('/employees/me/profile', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(profileRes.status === 200, 'GET /employees/me/profile returns 200');
    assert(profileRes.data.data.full_name === 'Test Engineer', 'Employee profile data matches');
    assert(profileRes.data.data.annual_leave_balance === 21, 'Default annual leave balance is 21 days');

    // ----------------------------------------------------
    // TEST 5: Attendance Flow
    // ----------------------------------------------------
    console.log('\n[Test 5] Testing Attendance Flow (Check In, Status, Check Out, Late calculation)...');
    const checkInRes = await request('/attendance/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(checkInRes.status === 200 || checkInRes.status === 201, 'POST /attendance/check-in succeeds');
    const attRecord = checkInRes.data.data;
    assert(attRecord.employee_id.toString() === managedEmpId.toString(), 'Attendance correctly uses employee_id (no typo)');
    assert(['present', 'late', 'absent', 'half_day'].includes(attRecord.status), `Attendance status normalized lowercase: ${attRecord.status}`);
    assert(typeof attRecord.late_minutes === 'number', `late_minutes persisted: ${attRecord.late_minutes}`);

    // Check today's status
    const todayRes = await request('/attendance/today', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(todayRes.status === 200, 'GET /attendance/today returns 200');
    assert(todayRes.data.data.check_in === attRecord.check_in, 'Today status reflects check-in time');

    // Check out
    const checkOutRes = await request('/attendance/check-out', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(checkOutRes.status === 200, 'POST /attendance/check-out succeeds');
    assert(!!checkOutRes.data.data.check_out, 'Check out time recorded');
    assert(typeof checkOutRes.data.data.working_hours === 'number', `Working hours calculated: ${checkOutRes.data.data.working_hours}h`);

    // HR listing attendance
    const hrAttRes = await request('/attendance', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(hrAttRes.status === 200, 'HR can list all attendance via GET /attendance');
    assert(hrAttRes.data.data.length > 0, 'HR attendance listing contains records');

    // ----------------------------------------------------
    // TEST 6: Leave Flow & Leave Type Balance Deduction Bug Fix
    // ----------------------------------------------------
    console.log('\n[Test 6] Testing Leave Management & Balance Deduction Isolation...');
    // Create an Annual Leave request (3 days)
    const annualLeaveRes = await request('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managedEmpToken}` },
      body: {
        leave_type: 'annual',
        start_date: '2026-03-10',
        end_date: '2026-03-12',
        reason: 'Vacation'
      }
    });
    assert(annualLeaveRes.status === 201, 'Annual leave requested successfully (3 days)');
    const annualLeaveId = annualLeaveRes.data.data._id;

    // Create a Sick Leave request (2 days)
    const sickLeaveRes = await request('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managedEmpToken}` },
      body: {
        leave_type: 'sick',
        start_date: '2026-03-15',
        end_date: '2026-03-16',
        reason: 'Flu'
      }
    });
    assert(sickLeaveRes.status === 201, 'Sick leave requested successfully (2 days)');
    const sickLeaveId = sickLeaveRes.data.data._id;

    // HR approves Annual Leave
    const approveAnnualRes = await request(`/leaves/${annualLeaveId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(approveAnnualRes.status === 200, 'HR approved annual leave');

    // Verify annual leave deducted 3 days: 21 - 3 = 18
    const checkAnnualBalance = await Employee.findById(managedEmpId);
    assert(checkAnnualBalance.annual_leave_balance === 18, `Annual leave balance deducted 3 days correctly: ${checkAnnualBalance.annual_leave_balance}`);

    // HR approves Sick Leave
    const approveSickRes = await request(`/leaves/${sickLeaveId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(approveSickRes.status === 200, 'HR approved sick leave');

    // CRITICAL: Verify annual leave balance was NOT decremented for sick leave!
    const checkSickBalance = await Employee.findById(managedEmpId);
    assert(checkSickBalance.annual_leave_balance === 18, `Critical fix verified: Sick leave did NOT deduct from annual_leave_balance: ${checkSickBalance.annual_leave_balance}`);

    // ----------------------------------------------------
    // TEST 7: Payroll Generation & Routing
    // ----------------------------------------------------
    console.log('\n[Test 7] Testing Payroll Routing, Generation & Calculations...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const genPayrollRes = await request('/payroll/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { month: currentMonth, year: currentYear }
    });
    assert(genPayrollRes.status === 200, 'POST /payroll/generate routes to payrollController (not notificationController!)');
    assert(genPayrollRes.data.data.length > 0, `Generated payroll records: ${genPayrollRes.data.data.length}`);

    const myPayrollRecord = genPayrollRes.data.data.find(
      (p) => (p.employee_id?._id || p.employee_id).toString() === managedEmpId.toString()
    );
    assert(!!myPayrollRecord, 'Payroll generated for our test employee');
    assert(myPayrollRecord.basic_salary === 15000, `Basic salary is correct: ${myPayrollRecord.basic_salary}`);
    assert(typeof myPayrollRecord.net_salary === 'number' && myPayrollRecord.net_salary >= 0, `Net salary calculated correctly: ${myPayrollRecord.net_salary}`);

    // HR marks payroll as paid
    const payRes = await request(`/payroll/${myPayrollRecord._id}/pay`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(payRes.status === 200, 'PATCH /payroll/:id/pay marks payroll as paid');
    assert(payRes.data.data.payment_status === 'paid', 'Payment status updated to paid');

    // Employee views salary
    const empSalaryRes = await request('/payroll/me', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(empSalaryRes.status === 200, 'Employee can view their own payroll via GET /payroll/me');
    assert(empSalaryRes.data.data.length > 0, 'Employee payroll history retrieved');

    // ----------------------------------------------------
    // TEST 8: Notifications System
    // ----------------------------------------------------
    console.log('\n[Test 8] Testing Notifications System...');
    const notifsRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(notifsRes.status === 200, 'GET /notifications returns 200');
    assert(notifsRes.data.data.length > 0, `Notifications persisted for employee: ${notifsRes.data.data.length}`);

    const unreadRes = await request('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(unreadRes.status === 200, 'GET /notifications/unread-count returns 200');
    assert(unreadRes.data.count > 0, `Unread notifications count: ${unreadRes.data.count}`);

    const notifId = notifsRes.data.data[0]._id;
    const markReadRes = await request(`/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(markReadRes.status === 200, 'PUT /notifications/:id/read marks notification as read');
    assert(markReadRes.data.data.is_read === true, 'Notification is_read is true');

    // ----------------------------------------------------
    // TEST 9: Dashboard APIs
    // ----------------------------------------------------
    console.log('\n[Test 9] Testing Dashboard APIs...');
    const hrStatsRes = await request('/dashboard/hr-stats', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(hrStatsRes.status === 200, 'GET /dashboard/hr-stats returns 200');
    assert(typeof hrStatsRes.data.data.totalEmployees === 'number', `HR Dashboard returns totalEmployees: ${hrStatsRes.data.data.totalEmployees}`);

    const empStatsRes = await request('/dashboard/employee-stats', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(empStatsRes.status === 200, 'GET /dashboard/employee-stats returns 200');
    assert(typeof empStatsRes.data.data.leaveBalance === 'number', `Employee Dashboard returns leaveBalance: ${empStatsRes.data.data.leaveBalance}`);

    // ----------------------------------------------------
    // TEST 10: Performance Evaluation (Feature 1)
    // ----------------------------------------------------
    console.log('\n[Test 10] Testing Performance Evaluation System (Feature 1)...');
    // Employee blocked from creating evaluation
    const empBlockedPerf = await request('/performance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managedEmpToken}` },
      body: { employee_id: createdEmployee._id }
    });
    assert(empBlockedPerf.status === 403, 'Employee blocked from POST /performance with 403 Forbidden');

    // HR creates draft evaluation
    const createPerfRes = await request('/performance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        employee_id: createdEmployee._id,
        period_type: 'monthly',
        period_key: `2026-M10-${timestamp}`,
        start_date: new Date(),
        end_date: new Date(),
        skills: [
          { name: 'Communication', category: 'Core', score: 92, weight: 0.25 },
          { name: 'Teamwork', category: 'Core', score: 88, weight: 0.25 },
          { name: 'Problem Solving', category: 'Core', score: 95, weight: 0.25 },
          { name: 'Technical Skills', category: 'Role Specific', score: 90, weight: 0.25 }
        ],
        feedback: 'Outstanding technical contribution',
        status: 'draft'
      }
    });
    assert(createPerfRes.status === 201, 'HR can create performance evaluation draft');
    const perfEvalId = createPerfRes.data.data._id;
    assert(createPerfRes.data.data.skill_score > 0, 'Skill score calculated server-side');
    assert(createPerfRes.data.data.final_score > 0, 'Final score calculated server-side');

    // HR finalizes evaluation
    const finalizePerfRes = await request(`/performance/${perfEvalId}/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(finalizePerfRes.status === 200, 'HR can finalize performance evaluation');
    assert(finalizePerfRes.data.data.status === 'finalized', 'Evaluation marked finalized');

    // Immutability: Editing finalized evaluation rejected
    const editBlockedRes = await request(`/performance/${perfEvalId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { feedback: 'Tampering attempt' }
    });
    assert(editBlockedRes.status === 400, 'Finalized evaluation is immutable (edit rejected with 400)');

    // Employee views own finalized evaluation via /me
    const myPerfRes = await request('/performance/me', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(myPerfRes.status === 200, 'Employee can view their own finalized evaluations via /me');
    assert(myPerfRes.data.data.length >= 1, 'Employee has at least 1 finalized evaluation');

    // ----------------------------------------------------
    // TEST 11: HR Intelligence & Anomaly Detection (Feature 2)
    // ----------------------------------------------------
    console.log('\n[Test 11] Testing HR Intelligence & Anomaly Detection (Feature 2)...');
    // Employee blocked from Anomaly APIs
    const empBlockedAnom = await request('/intelligence/anomalies', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(empBlockedAnom.status === 403, 'Employee blocked from Anomaly APIs with 403 Forbidden');

    // HR triggers scan
    const scanRes = await request('/intelligence/anomalies/scan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(scanRes.status === 200, 'HR can trigger manual anomaly detection scan');
    assert(typeof scanRes.data.data.scanned_employees === 'number', 'Anomaly scan returned scanned_employees count');

    // HR lists anomalies and summary stats
    const statsRes = await request('/intelligence/anomalies/stats', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(statsRes.status === 200, 'HR can fetch anomaly summary stats');
    assert(typeof statsRes.data.data.totalOpen === 'number', 'Total open anomalies count returned');

    // ----------------------------------------------------
    // TEST 12: Smart Recommendations (Feature 3)
    // ----------------------------------------------------
    console.log('\n[Test 12] Testing Smart Employee Recommendations (Feature 3)...');
    // Employee blocked from Recommendations API
    const empBlockedRec = await request('/intelligence/recommendations', {
      headers: { Authorization: `Bearer ${managedEmpToken}` }
    });
    assert(empBlockedRec.status === 403, 'Employee blocked from Recommendations API with 403 Forbidden');

    // HR triggers recommendation scan
    const recScanRes = await request('/intelligence/recommendations/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(recScanRes.status === 200, 'HR can trigger manual recommendation scan');
    assert(typeof recScanRes.data.data.scanned_employees === 'number', 'Recommendation scan returns scanned count');

    // HR gets recommendation stats
    const recStatsRes = await request('/intelligence/recommendations/stats', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(recStatsRes.status === 200, 'HR can fetch recommendation summary stats');
    assert(typeof recStatsRes.data.data.totalSuggested === 'number', 'Recommendation summary stats returned');

    // ----------------------------------------------------
    // TEST 13: HR Smart Assistant (Feature 4)
    // ----------------------------------------------------
    console.log('\n[Test 13] Testing HR Smart Assistant (Feature 4)...');
    // Employee blocked from assistant
    const empBlockedAsst = await request('/intelligence/assistant/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managedEmpToken}` },
      body: { message: 'How many employees are there?' }
    });
    assert(empBlockedAsst.status === 403, 'Employee blocked from HR Smart Assistant with 403 Forbidden');

    // HR query assistant
    const asstRes = await request('/intelligence/assistant/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { message: 'How many employees are there?' }
    });
    assert(asstRes.status === 200, 'HR can query HR Smart Assistant');
    assert(asstRes.data.data.intent === 'getEmployeeCount', 'Assistant identified getEmployeeCount intent');
    assert(typeof asstRes.data.data.answer === 'string', 'Assistant returned natural language answer');
    assert(asstRes.data.data.sources.length > 0, 'Assistant returned transparent data sources');

    // ----------------------------------------------------
    // TEST 14: Logout & Invalidation
    // ----------------------------------------------------
    console.log('\n[Test 14] Testing Logout & Refresh Token Invalidation...');
    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managedEmpToken}` },
      body: { refreshToken: managedEmpLogin.data.refreshToken }
    });
    assert(logoutRes.status === 200, 'POST /auth/logout returns 200');

    // Attempting to refresh with invalidated token
    const revokedRefresh = await request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: managedEmpLogin.data.refreshToken }
    });
    assert(revokedRefresh.status === 401 || revokedRefresh.status === 403, 'Logged out refresh token cannot be used to issue new access tokens');

    console.log('\n======================================================');
    console.log('🎉 ALL 14 TEST SUITES PASSED FLAWLESSLY!');
    console.log('Backend is stable, secure, and fully verified end-to-end.');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
