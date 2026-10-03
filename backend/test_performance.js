const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_ENV = 'test';
const { app } = require('./src/server');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const Attendance = require('./src/models/Attendance');
const PerformanceEvaluation = require('./src/models/PerformanceEvaluation');

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

async function runPerformanceTests() {
  console.log('--- STARTING PERFORMANCE EVALUATION INTEGRATION TESTS ---');

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

    // 1. Setup HR user & Employee users
    const hrEmail = `hr_perf_${timestamp}@test.com`;
    const hrUser = await User.create({
      email: hrEmail,
      password: 'hashedPassword',
      role: 'hr'
    });

    const empEmail1 = `emp1_perf_${timestamp}@test.com`;
    const empUser1 = await User.create({
      email: empEmail1,
      password: 'hashedPassword',
      role: 'employee'
    });

    const empProfile1 = await Employee.create({
      user_id: empUser1._id,
      full_name: 'Test Performance Employee 1',
      employee_code: `PERF_${timestamp}_1`,
      job_role: 'Developer',
      department: 'Engineering',
      basic_salary: 10000,
      hire_date: new Date('2025-01-01'),
      phone: '+1234567891'
    });

    const empEmail2 = `emp2_perf_${timestamp}@test.com`;
    const empUser2 = await User.create({
      email: empEmail2,
      password: 'hashedPassword',
      role: 'employee'
    });

    const empProfile2 = await Employee.create({
      user_id: empUser2._id,
      full_name: 'Test Performance Employee 2',
      employee_code: `PERF_${timestamp}_2`,
      job_role: 'Designer',
      department: 'Product',
      basic_salary: 12000,
      hire_date: new Date('2025-01-01'),
      phone: '+1234567892'
    });

    // Create some attendance records for empProfile1 in 2026-Q1 (Jan 2026)
    await Attendance.create([
      {
        employee_id: empProfile1._id,
        date: new Date('2026-01-05'),
        check_in: '09:00',
        check_out: '17:00',
        working_hours: 8,
        late_minutes: 0,
        status: 'present'
      },
      {
        employee_id: empProfile1._id,
        date: new Date('2026-01-06'),
        check_in: '09:30',
        check_out: '17:00',
        working_hours: 7.5,
        late_minutes: 30,
        status: 'late'
      }
    ]);

    const jwt = require('jsonwebtoken');
    const hrToken = jwt.sign(
      { id: hrUser._id, email: hrUser.email, role: 'hr' },
      process.env.JWT_SECRET
    );
    const empToken1 = jwt.sign(
      { id: empUser1._id, email: empUser1.email, role: 'employee' },
      process.env.JWT_SECRET
    );
    const empToken2 = jwt.sign(
      { id: empUser2._id, email: empUser2.email, role: 'employee' },
      process.env.JWT_SECRET
    );

    // TEST 1: Employee cannot create evaluation (RBAC)
    console.log('\n[Case 1] Verify Employee cannot create evaluation...');
    const empCreateRes = await request('/performance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken1}` },
      body: {
        employee_id: empProfile1._id,
        period_key: '2026-Q1',
        start_date: '2026-01-01',
        end_date: '2026-03-31'
      }
    });
    assert(empCreateRes.status === 403, 'Employee is blocked from POST /performance with 403 Forbidden');

    // TEST 2: HR previews attendance telemetry
    console.log('\n[Case 2] HR preview attendance metrics...');
    const previewRes = await request(
      `/performance/preview-attendance?employeeId=${empProfile1._id}&startDate=2026-01-01&endDate=2026-03-31`,
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    assert(previewRes.status === 200, 'Attendance preview returns 200');
    assert(previewRes.data?.data?.metrics?.late_days === 1, 'Attendance preview correctly identified 1 late day');
    assert(previewRes.data?.data?.metrics?.total_late_minutes === 30, 'Attendance preview correctly summed 30 late minutes');

    // TEST 3: HR creates draft evaluation
    console.log('\n[Case 3] HR creates draft evaluation...');
    const createRes = await request('/performance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        employee_id: empProfile1._id,
        period_type: 'monthly',
        period_key: `2026-01-${timestamp}`,
        start_date: '2026-01-05',
        end_date: '2026-01-06',
        skills: [
          { name: 'Communication', category: 'Core', score: 90, weight: 0.25 },
          { name: 'Teamwork', category: 'Core', score: 90, weight: 0.25 },
          { name: 'Problem Solving', category: 'Core', score: 90, weight: 0.25 },
          { name: 'Technical Skills', category: 'Role Specific', score: 90, weight: 0.25 }
        ],
        feedback: 'Great start to the year',
        status: 'draft'
      }
    });
    assert(createRes.status === 201, 'POST /performance returns 201 Created');
    const createdEval = createRes.data?.data;
    assert(createdEval.status === 'draft', 'Evaluation saved with draft status');
    assert(createdEval.skill_score === 90, 'Skill score calculated correctly: 90');
    assert(createdEval.attendance_score > 0, 'Attendance score calculated server-side');
    assert(createdEval.final_score > 0, 'Final score calculated server-side');
    assert(!!createdEval.grade, `Grade assigned server-side: ${createdEval.grade}`);

    const evalId = createdEval._id;

    // TEST 4: Duplicate period key for same employee is rejected
    console.log('\n[Case 4] Duplicate period key rejection...');
    const dupRes = await request('/performance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        employee_id: empProfile1._id,
        period_key: `2026-01-${timestamp}`,
        start_date: '2026-01-05',
        end_date: '2026-01-06'
      }
    });
    assert(dupRes.status === 400, 'Duplicate evaluation for same employee and period is rejected with 400');

    // TEST 5: Employee CANNOT see draft evaluation
    console.log('\n[Case 5] Employee cannot see draft evaluation...');
    const empViewDraftRes = await request(`/performance/${evalId}`, {
      headers: { Authorization: `Bearer ${empToken1}` }
    });
    assert(empViewDraftRes.status === 403, 'Employee is blocked from viewing draft evaluation with 403');

    // TEST 6: HR updates draft evaluation
    console.log('\n[Case 6] HR updates draft evaluation...');
    const updateRes = await request(`/performance/${evalId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        skills: [
          { name: 'Communication', category: 'Core', score: 95, weight: 0.25 },
          { name: 'Teamwork', category: 'Core', score: 95, weight: 0.25 },
          { name: 'Problem Solving', category: 'Core', score: 95, weight: 0.25 },
          { name: 'Technical Skills', category: 'Role Specific', score: 95, weight: 0.25 }
        ],
        feedback: 'Updated excellent review'
      }
    });
    assert(updateRes.status === 200, 'PUT /performance/:id returns 200');
    assert(updateRes.data?.data?.skill_score === 95, 'Skill score updated to 95');

    // TEST 7: HR finalizes evaluation
    console.log('\n[Case 7] HR finalizes evaluation...');
    const finalizeRes = await request(`/performance/${evalId}/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(finalizeRes.status === 200, 'POST /performance/:id/finalize returns 200');
    const finalizedEval = finalizeRes.data?.data;
    assert(finalizedEval.status === 'finalized', 'Evaluation status changed to finalized');
    assert(!!finalizedEval.finalized_at, 'finalized_at timestamp persisted');

    // TEST 8: Finalized evaluation CANNOT be edited (Immutability Guard)
    console.log('\n[Case 8] Immutability Guard: Finalized evaluation cannot be edited...');
    const immutableRes = await request(`/performance/${evalId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { feedback: 'Attempting to tamper finalized evaluation' }
    });
    assert(immutableRes.status === 400, 'Editing finalized evaluation rejected with 400 Bad Request');

    // TEST 9: Employee CAN see their own finalized evaluation
    console.log('\n[Case 9] Employee can view own finalized evaluation...');
    const empViewFinalRes = await request(`/performance/${evalId}`, {
      headers: { Authorization: `Bearer ${empToken1}` }
    });
    assert(empViewFinalRes.status === 200, 'Employee can view their own finalized evaluation');
    assert(empViewFinalRes.data?.data?.final_score === finalizedEval.final_score, 'Final score matches');

    // TEST 10: Employee gets own evaluations via /me
    console.log('\n[Case 10] Employee lists evaluations via /me...');
    const myEvalRes = await request('/performance/me', {
      headers: { Authorization: `Bearer ${empToken1}` }
    });
    assert(myEvalRes.status === 200, 'GET /performance/me returns 200');
    assert(myEvalRes.data?.data?.length === 1, 'Employee has 1 finalized evaluation');

    // TEST 11: Employee CANNOT see another employee\'s finalized evaluation
    console.log('\n[Case 11] Employee cannot see another employee\'s evaluation...');
    const emp2ViewRes = await request(`/performance/${evalId}`, {
      headers: { Authorization: `Bearer ${empToken2}` }
    });
    assert(emp2ViewRes.status === 403, 'Employee 2 blocked with 403 when trying to access Employee 1 evaluation');

    console.log('\n======================================================');
    console.log('🎉 ALL 11 PERFORMANCE EVALUATION TEST CASES PASSED!');
    console.log('======================================================\n');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

runPerformanceTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
