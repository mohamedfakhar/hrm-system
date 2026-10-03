const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_ENV = 'test';
const { app } = require('./src/server');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const PerformanceEvaluation = require('./src/models/PerformanceEvaluation');
const Attendance = require('./src/models/Attendance');
const AnomalyAlert = require('./src/models/AnomalyAlert');
const Recommendation = require('./src/models/Recommendation');
const recommendationService = require('./src/services/recommendationService');

let server;
let baseUrl;
let hrToken;
let employeeToken;
let testEmployee;
let hrUser;

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
}

async function setup() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrm_system');
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  const jwt = require('jsonwebtoken');
  const timestamp = Date.now();

  // Setup HR user
  hrUser = await User.create({
    email: `hr_rec_${timestamp}@hrm.com`,
    password: 'hashedPassword',
    role: 'hr'
  });
  hrToken = jwt.sign(
    { id: hrUser._id, email: hrUser.email, role: 'hr' },
    process.env.JWT_SECRET
  );

  // Setup Employee user
  const empUser = await User.create({
    email: `employee_rec_${timestamp}@hrm.com`,
    password: 'hashedPassword',
    role: 'employee'
  });
  employeeToken = jwt.sign(
    { id: empUser._id, email: empUser.email, role: 'employee' },
    process.env.JWT_SECRET
  );

  // Setup target Employee profile (hire_date 14 months ago for full tenure eligibility)
  const fourteenMonthsAgo = new Date();
  fourteenMonthsAgo.setMonth(fourteenMonthsAgo.getMonth() - 14);

  await Employee.deleteMany({ employee_code: 'EMP_REC_TEST' });
  testEmployee = await Employee.create({
    user_id: empUser._id,
    employee_code: 'EMP_REC_TEST',
    full_name: 'Test Rec Employee',
      job_role: 'Senior Software Engineer',
      department: 'Engineering',
      basic_salary: 20000,
      annual_leave_balance: 21,
      hire_date: fourteenMonthsAgo,
      phone: '+201099887766'
  });

  // Clean up any test recommendations, evaluations, anomalies, and attendance for this employee
  await Recommendation.deleteMany({ employee_id: testEmployee._id });
  await PerformanceEvaluation.deleteMany({ employee_id: testEmployee._id });
  await AnomalyAlert.deleteMany({ employee_id: testEmployee._id });
  await Attendance.deleteMany({ employee_id: testEmployee._id });
}

async function runTests() {
  console.log('\n--- STARTING SMART RECOMMENDATIONS INTEGRATION TESTS ---\n');

  try {
    await setup();

    // Helper: Seed attendance records (30 days, all present, 0 late = 100% punctuality)
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      await Attendance.create({
        employee_id: testEmployee._id,
        date: d,
        check_in: '09:00',
        check_out: '17:00',
        working_hours: 8,
        late_minutes: 0,
        status: 'present'
      });
    }

    // -------------------------------------------------------------
    // Test 1: Bonus Consideration Candidate
    // tenure >= 6 months, grade = A, punctuality >= 95%, 0 high anomaly
    // -------------------------------------------------------------
    console.log('[Test 1] Testing Bonus Consideration Candidate...');
    const finalizedEvalA = await PerformanceEvaluation.create({
      employee_id: testEmployee._id,
      evaluator_id: hrUser._id,
      period_type: 'quarterly',
      period_key: '2026-Q1',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-03-31'),
      skills: [
        { name: 'Technical Skills', score: 95, weight: 0.5 },
        { name: 'Problem Solving', score: 95, weight: 0.5 }
      ],
      skill_score: 95,
      attendance_metrics: {
        total_working_days: 60,
        present_days: 60,
        late_days: 0,
        total_late_minutes: 0,
        unexcused_absences: 0
      },
      attendance_score: 100,
      final_score: 96.5,
      grade: 'A',
      status: 'finalized',
      finalized_at: new Date()
    });

    const candidates1 = await recommendationService.generateRecommendationsForEmployee(testEmployee._id);
    const bonusCandidate = candidates1.find((c) => c.rule_code === 'PERFORMANCE_BONUS_CANDIDATE');
    assert(bonusCandidate && bonusCandidate.type === 'bonus_consideration', 'Expected bonus_consideration candidate');
    console.log('  ✓ Employee qualifies for bonus_consideration');

    // -------------------------------------------------------------
    // Test 2: Bonus Blocked by High Anomaly
    // -------------------------------------------------------------
    console.log('[Test 2] Testing Bonus Blocked by High-Severity Open Anomaly...');
    const highAnomaly = await AnomalyAlert.create({
      employee_id: testEmployee._id,
      domain: 'attendance',
      anomaly_code: 'ATT_CONSECUTIVE_ABSENT',
      title: 'Consecutive Absence Detected',
      description: '2 consecutive unexcused absences',
      severity: 'high',
      status: 'open'
    });

    const candidates2 = await recommendationService.generateRecommendationsForEmployee(testEmployee._id);
    const bonusBlocked = candidates2.find((c) => c.rule_code === 'PERFORMANCE_BONUS_CANDIDATE');
    assert(!bonusBlocked, 'Bonus candidate should have been blocked by high-severity open anomaly');
    console.log('  ✓ High-severity anomaly successfully blocked bonus_consideration');

    // -------------------------------------------------------------
    // Test 3: Recognition Candidate
    // grade = A, score >= 90, punctuality >= 95%
    // -------------------------------------------------------------
    console.log('[Test 3] Testing Recognition Candidate...');
    const recognitionCandidate = candidates1.find((c) => c.rule_code === 'PERFORMANCE_RECOGNITION_CANDIDATE');
    assert(recognitionCandidate && recognitionCandidate.type === 'recognition', 'Expected recognition candidate');
    console.log('  ✓ Employee qualifies for recognition candidate');

    // -------------------------------------------------------------
    // Test 4: Promotion Review Candidate
    // tenure >= 12 months, grade = A, score >= 90, punctuality >= 95%, 0 high anomaly
    // -------------------------------------------------------------
    console.log('[Test 4] Testing Promotion Review Candidate...');
    highAnomaly.status = 'dismissed';
    highAnomaly.resolution_note = 'Resolved';
    await highAnomaly.save();

    const candidates4 = await recommendationService.generateRecommendationsForEmployee(testEmployee._id);
    const promotionCandidate = candidates4.find((c) => c.rule_code === 'PROMOTION_REVIEW_CANDIDATE');
    assert(promotionCandidate && promotionCandidate.type === 'promotion_review', 'Expected promotion_review candidate');
    console.log('  ✓ Employee qualifies for promotion_review (tenure: 14 months)');

    // -------------------------------------------------------------
    // Test 5: Promotion Review Blocked by Insufficient Tenure (< 12 months)
    // -------------------------------------------------------------
    console.log('[Test 5] Testing Promotion Blocked by Insufficient Tenure (< 12 months)...');
    testEmployee.hire_date = new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000); // 5 months ago
    await testEmployee.save();

    const candidates5 = await recommendationService.generateRecommendationsForEmployee(testEmployee._id);
    const promoBlocked = candidates5.find((c) => c.rule_code === 'PROMOTION_REVIEW_CANDIDATE');
    assert(!promoBlocked, 'Promotion candidate should be blocked when tenure < 12 months');
    console.log('  ✓ Promotion blocked for tenure < 12 months');

    // Restore tenure for subsequent tests
    const fourteenMonthsAgo = new Date();
    fourteenMonthsAgo.setMonth(fourteenMonthsAgo.getMonth() - 14);
    testEmployee.hire_date = fourteenMonthsAgo;
    await testEmployee.save();

    // -------------------------------------------------------------
    // Test 6: Support Check-In via High-Severity Anomaly
    // -------------------------------------------------------------
    console.log('[Test 6] Testing Support Check-In via High-Severity Anomaly...');
    highAnomaly.status = 'open';
    await highAnomaly.save();

    const candidates6 = await recommendationService.generateRecommendationsForEmployee(testEmployee._id);
    const supportCandidate = candidates6.find((c) => c.rule_code === 'SUPPORT_CHECK_IN');
    assert(supportCandidate && supportCandidate.type === 'support_check_in', 'Expected support_check_in candidate');
    console.log('  ✓ Support check-in generated from high-severity open anomaly');

    // -------------------------------------------------------------
    // Test 7: Support Check-In via Low Performance Score (< 60)
    // -------------------------------------------------------------
    console.log('[Test 7] Testing Support Check-In via Low Performance Score (< 60)...');
    highAnomaly.status = 'dismissed';
    await highAnomaly.save();

    finalizedEvalA.final_score = 54;
    finalizedEvalA.grade = 'F';
    await finalizedEvalA.save();

    const candidates7 = await recommendationService.generateRecommendationsForEmployee(testEmployee._id);
    const supportLowPerf = candidates7.find((c) => c.rule_code === 'SUPPORT_CHECK_IN');
    assert(supportLowPerf && supportLowPerf.type === 'support_check_in', 'Expected support_check_in candidate');
    console.log('  ✓ Support check-in generated from performance score < 60');

    // -------------------------------------------------------------
    // Test 8: Draft Performance Evaluation is Ignored
    // -------------------------------------------------------------
    console.log('[Test 8] Testing Draft Performance Evaluation is Ignored...');
    await PerformanceEvaluation.deleteMany({ employee_id: testEmployee._id });
    await PerformanceEvaluation.create({
      employee_id: testEmployee._id,
      evaluator_id: hrUser._id,
      period_type: 'quarterly',
      period_key: '2026-Q2',
      start_date: new Date('2026-04-01'),
      end_date: new Date('2026-06-30'),
      skills: [{ name: 'Technical Skills', score: 98, weight: 1 }],
      skill_score: 98,
      attendance_score: 95,
      final_score: 97,
      grade: 'A',
      status: 'draft' // DRAFT!
    });

    const candidates8 = await recommendationService.generateRecommendationsForEmployee(testEmployee._id);
    const bonusFromDraft = candidates8.find((c) => c.rule_code === 'PERFORMANCE_BONUS_CANDIDATE');
    const recognitionFromDraft = candidates8.find((c) => c.rule_code === 'PERFORMANCE_RECOGNITION_CANDIDATE');
    assert(!bonusFromDraft && !recognitionFromDraft, 'Draft evaluation must not trigger performance recommendations');
    console.log('  ✓ Draft performance evaluation correctly ignored');

    // Restore finalized evaluation for remaining workflow tests
    await PerformanceEvaluation.create({
      employee_id: testEmployee._id,
      evaluator_id: hrUser._id,
      period_type: 'quarterly',
      period_key: '2026-Q1',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-03-31'),
      skills: [{ name: 'Technical Skills', score: 95, weight: 1 }],
      skill_score: 95,
      attendance_score: 100,
      final_score: 96.5,
      grade: 'A',
      status: 'finalized'
    });

    // -------------------------------------------------------------
    // Test 9 & 10: Server-Side Generation & Deduplication
    // -------------------------------------------------------------
    console.log('[Test 9 & 10] Testing API Scan & Deduplication...');
    const scanRes1 = await request('/intelligence/recommendations/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(scanRes1.status === 200 && scanRes1.data.success, 'Recommendation generation failed');
    const createdFirst = scanRes1.data.data.recommendations_created;

    // Run second scan
    const scanRes2 = await request('/intelligence/recommendations/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const createdSecond = scanRes2.data.data.recommendations_created;
    assert(createdSecond === 0, `Deduplication failed: created ${createdSecond} duplicates on second run`);
    console.log(`  ✓ First scan created ${createdFirst} recommendations; second scan created 0 duplicates (properly updated in-place)`);

    // -------------------------------------------------------------
    // Test 11: Accept Recommendation Workflow
    // -------------------------------------------------------------
    console.log('[Test 11] Testing Accept Recommendation Workflow...');
    const recsListRes = await request(`/intelligence/recommendations?employee_id=${testEmployee._id}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const allRecs = recsListRes.data.data;
    assert(allRecs && allRecs.length > 0, 'No recommendations found to accept');

    const targetRec = allRecs[0];
    const acceptRes = await request(`/intelligence/recommendations/${targetRec._id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { review_notes: 'Approved for executive bonus pool consideration' }
    });

    assert(acceptRes.status === 200, 'Accept endpoint should return 200');
    assert(acceptRes.data.data.status === 'accepted', 'Expected status accepted');
    assert(acceptRes.data.data.reviewed_by && acceptRes.data.data.reviewed_at, 'reviewed_by and reviewed_at must exist');
    console.log('  ✓ Recommendation accepted with reviewed_by and timestamp');

    // -------------------------------------------------------------
    // Test 12: Reject Recommendation Workflow
    // -------------------------------------------------------------
    console.log('[Test 12] Testing Reject Recommendation Workflow...');
    if (allRecs.length < 2) {
      const tempRec = await Recommendation.create({
        employee_id: testEmployee._id,
        type: 'support_check_in',
        title: 'Support Check-In',
        summary: 'Support check-in test',
        rule_code: 'TEMP_RULE',
        rule_version: '1.0'
      });
      allRecs.push(tempRec);
    }
    const rejectTarget = allRecs[1];

    // Rejection without notes must fail with 400
    const rejectWithoutNotes = await request(`/intelligence/recommendations/${rejectTarget._id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { review_notes: '' }
    });
    assert(rejectWithoutNotes.status === 400, 'Rejection without notes should return 400');
    console.log('  ✓ Rejection without review_notes properly rejected with 400');

    const rejectRes = await request(`/intelligence/recommendations/${rejectTarget._id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { review_notes: 'Employee already scheduled for separate cross-training program' }
    });
    assert(rejectRes.status === 200, 'Reject endpoint should return 200');
    assert(rejectRes.data.data.status === 'rejected', 'Expected status rejected');
    console.log('  ✓ Recommendation rejected with mandatory review_notes');

    // -------------------------------------------------------------
    // Test 13: Permission Isolation
    // -------------------------------------------------------------
    console.log('[Test 13] Testing Permission Isolation (Employee Forbidden)...');
    const empGet = await request('/intelligence/recommendations', {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(empGet.status === 403, 'Employee should receive 403 on GET /recommendations');
    console.log('  ✓ Employee blocked from GET /intelligence/recommendations with 403 Forbidden');

    const empPost = await request('/intelligence/recommendations/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {}
    });
    assert(empPost.status === 403, 'Employee should receive 403 on POST /generate');
    console.log('  ✓ Employee blocked from POST /intelligence/recommendations/generate with 403 Forbidden');

    // -------------------------------------------------------------
    // Test 14: Summary Stats API
    // -------------------------------------------------------------
    console.log('[Test 14] Testing Recommendations Stats API...');
    const statsRes = await request('/intelligence/recommendations/stats', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert(statsRes.status === 200, 'Stats endpoint should return 200');
    assert(typeof statsRes.data.data.totalSuggested === 'number', 'totalSuggested should be a number');
    console.log(`  ✓ Recommendation stats returned: ${statsRes.data.data.totalSuggested} suggested, ${statsRes.data.data.totalAccepted} accepted`);

    console.log('\n======================================================');
    console.log('🎉 ALL 14 RECOMMENDATION TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILURE:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }
}

runTests();
