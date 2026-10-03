const Recommendation = require('../models/Recommendation');
const Employee = require('../models/Employee');
const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const Attendance = require('../models/Attendance');
const AnomalyAlert = require('../models/AnomalyAlert');
const User = require('../models/User');
const sendNotification = require('../utils/sendNotification');

class RecommendationService {
  /**
   * Calculate elapsed tenure in whole months
   * @param {Date|string} hireDate 
   * @param {Date} now 
   * @returns {number} tenure in months
   */
  calculateTenureMonths(hireDate, now = new Date()) {
    if (!hireDate) return 0;
    const start = new Date(hireDate);
    if (isNaN(start.getTime())) return 0;

    const diffTime = now.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    // Average days in month = 30.4375
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375));
  }

  /**
   * Calculate punctuality rate and metrics from attendance records
   * @param {ObjectId} employeeId 
   * @param {Date} now 
   * @returns {Promise<{punctuality_rate: number|null, late_days: number, total_late_minutes: number, unexcused_absences: number, eligible_days: number}>}
   */
  async calculateAttendanceTelemetry(employeeId, now = new Date()) {
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const logs = await Attendance.find({
      employee_id: employeeId,
      date: { $gte: ninetyDaysAgo, $lte: now }
    });

    if (!logs || logs.length === 0) {
      return {
        punctuality_rate: null,
        late_days: 0,
        total_late_minutes: 0,
        unexcused_absences: 0,
        eligible_days: 0
      };
    }

    const workingLogs = logs.filter((l) => ['present', 'late', 'half_day'].includes(l.status));
    const eligible_days = workingLogs.length;

    const late_days = logs.filter((l) => l.status === 'late').length;
    const total_late_minutes = logs.reduce((sum, l) => sum + (l.late_minutes || 0), 0);
    const unexcused_absences = logs.filter((l) => l.status === 'absent').length;

    if (eligible_days === 0) {
      return {
        punctuality_rate: null,
        late_days,
        total_late_minutes,
        unexcused_absences,
        eligible_days: 0
      };
    }

    // Punctuality rate clamped between 0 and 100
    const punctuality_rate = Math.max(0, Math.min(100, Math.round(100 - ((late_days / eligible_days) * 100))));

    return {
      punctuality_rate,
      late_days,
      total_late_minutes,
      unexcused_absences,
      eligible_days
    };
  }

  /**
   * Collect latest finalized performance evaluation
   * @param {ObjectId} employeeId 
   */
  async getLatestFinalizedEvaluation(employeeId) {
    return await PerformanceEvaluation.findOne({
      employee_id: employeeId,
      status: 'finalized'
    }).sort({ end_date: -1, updatedAt: -1 });
  }

  /**
   * Collect open anomalies count & high severity count
   * @param {ObjectId} employeeId 
   */
  async getOpenAnomaliesTelemetry(employeeId) {
    const openAlerts = await AnomalyAlert.find({
      employee_id: employeeId,
      status: 'open'
    });

    const open_anomalies = openAlerts.length;
    const high_severity_anomalies = openAlerts.filter((a) => a.severity === 'high').length;

    return {
      open_anomalies,
      high_severity_anomalies,
      openAlerts
    };
  }

  /**
   * Gather complete telemetry for an employee needed by all recommendation rules
   */
  async calculateEmployeeRecommendationData(employee, now = new Date()) {
    const tenure_months = this.calculateTenureMonths(employee.hire_date, now);
    const attendance = await this.calculateAttendanceTelemetry(employee._id, now);
    const latestEval = await this.getLatestFinalizedEvaluation(employee._id);
    const anomalyTelemetry = await this.getOpenAnomaliesTelemetry(employee._id);

    return {
      employee,
      tenure_months,
      attendance,
      latestEval,
      anomalyTelemetry
    };
  }

  /**
   * Rule 1: Bonus Consideration Candidate
   * Conditions:
   * - tenure >= 6 months
   * - latest finalized evaluation grade = 'A'
   * - punctuality rate >= 95%
   * - high severity open anomalies = 0
   */
  evaluateBonusCandidate(data) {
    const { employee, tenure_months, attendance, latestEval, anomalyTelemetry } = data;

    if (tenure_months < 6) return null;
    if (!latestEval || latestEval.grade !== 'A') return null;
    if (attendance.punctuality_rate === null || attendance.punctuality_rate < 95) return null;
    if (anomalyTelemetry.high_severity_anomalies > 0) return null;

    return {
      employee_id: employee._id,
      type: 'bonus_consideration',
      title: 'Bonus Consideration',
      summary: 'Employee meets configured criteria for bonus consideration based on excellent performance, punctuality, and clean anomaly history.',
      rationale: [
        `Performance grade: A with final score of ${latestEval.final_score}/100`,
        `Punctuality rate: ${attendance.punctuality_rate}% across recent attendance records`,
        `Tenure: ${tenure_months} months (minimum 6 months required)`,
        'Zero high-severity open operational anomalies'
      ],
      supporting_data: {
        tenure_months,
        performance_score: latestEval.final_score,
        performance_grade: latestEval.grade,
        skill_score: latestEval.skill_score,
        attendance_score: latestEval.attendance_score,
        punctuality_rate: attendance.punctuality_rate,
        late_days: attendance.late_days,
        total_late_minutes: attendance.total_late_minutes,
        unexcused_absences: attendance.unexcused_absences,
        open_anomalies: anomalyTelemetry.open_anomalies,
        high_severity_anomalies: anomalyTelemetry.high_severity_anomalies,
        last_evaluation_id: latestEval._id,
        last_evaluation_period: latestEval.period_key
      },
      rule_code: 'PERFORMANCE_BONUS_CANDIDATE',
      rule_version: '1.0'
    };
  }

  /**
   * Rule 2: Recognition Candidate
   * Conditions:
   * - latest finalized evaluation grade = 'A'
   * - final_score >= 90
   * - punctuality rate >= 95%
   */
  evaluateRecognitionCandidate(data) {
    const { employee, tenure_months, attendance, latestEval, anomalyTelemetry } = data;

    if (!latestEval || latestEval.grade !== 'A' || latestEval.final_score < 90) return null;
    if (attendance.punctuality_rate === null || attendance.punctuality_rate < 95) return null;

    return {
      employee_id: employee._id,
      type: 'recognition',
      title: 'Performance Recognition',
      summary: 'Employee demonstrated outstanding competency and exemplary punctuality worthy of peer or formal recognition.',
      rationale: [
        `Performance grade: A with score of ${latestEval.final_score}/100 (minimum 90 required)`,
        `Punctuality rate: ${attendance.punctuality_rate}% (minimum 95% required)`,
        `Skill score achieved: ${latestEval.skill_score}/100`
      ],
      supporting_data: {
        tenure_months,
        performance_score: latestEval.final_score,
        performance_grade: latestEval.grade,
        skill_score: latestEval.skill_score,
        attendance_score: latestEval.attendance_score,
        punctuality_rate: attendance.punctuality_rate,
        late_days: attendance.late_days,
        total_late_minutes: attendance.total_late_minutes,
        unexcused_absences: attendance.unexcused_absences,
        open_anomalies: anomalyTelemetry.open_anomalies,
        high_severity_anomalies: anomalyTelemetry.high_severity_anomalies,
        last_evaluation_id: latestEval._id,
        last_evaluation_period: latestEval.period_key
      },
      rule_code: 'PERFORMANCE_RECOGNITION_CANDIDATE',
      rule_version: '1.0'
    };
  }

  /**
   * Rule 3: Promotion Review Candidate
   * Conditions:
   * - tenure >= 12 months
   * - latest finalized evaluation grade = 'A'
   * - final_score >= 90
   * - punctuality rate >= 95%
   * - high severity open anomalies = 0
   */
  evaluatePromotionCandidate(data) {
    const { employee, tenure_months, attendance, latestEval, anomalyTelemetry } = data;

    if (tenure_months < 12) return null;
    if (!latestEval || latestEval.grade !== 'A' || latestEval.final_score < 90) return null;
    if (attendance.punctuality_rate === null || attendance.punctuality_rate < 95) return null;
    if (anomalyTelemetry.high_severity_anomalies > 0) return null;

    return {
      employee_id: employee._id,
      type: 'promotion_review',
      title: 'Promotion Review',
      summary: 'Employee meets tenure and high-performance criteria for promotion review. Final assessment by management is recommended.',
      rationale: [
        `Company tenure: ${tenure_months} months (minimum 12 months required)`,
        `Performance grade: A with final score of ${latestEval.final_score}/100`,
        `Punctuality rate: ${attendance.punctuality_rate}%`,
        'Zero high-severity open operational anomalies'
      ],
      supporting_data: {
        tenure_months,
        performance_score: latestEval.final_score,
        performance_grade: latestEval.grade,
        skill_score: latestEval.skill_score,
        attendance_score: latestEval.attendance_score,
        punctuality_rate: attendance.punctuality_rate,
        late_days: attendance.late_days,
        total_late_minutes: attendance.total_late_minutes,
        unexcused_absences: attendance.unexcused_absences,
        open_anomalies: anomalyTelemetry.open_anomalies,
        high_severity_anomalies: anomalyTelemetry.high_severity_anomalies,
        last_evaluation_id: latestEval._id,
        last_evaluation_period: latestEval.period_key
      },
      rule_code: 'PROMOTION_REVIEW_CANDIDATE',
      rule_version: '1.0'
    };
  }

  /**
   * Rule 4: Support Check-In Candidate
   * Conditions:
   * - high_severity_anomalies > 0 OR
   * - latest finalized evaluation score < 60
   */
  evaluateSupportCheckIn(data) {
    const { employee, tenure_months, attendance, latestEval, anomalyTelemetry } = data;

    const hasHighAnomaly = anomalyTelemetry.high_severity_anomalies > 0;
    const hasLowScore = latestEval && latestEval.final_score < 60;

    if (!hasHighAnomaly && !hasLowScore) return null;

    const rationale = [];
    if (hasHighAnomaly) {
      rationale.push(`${anomalyTelemetry.high_severity_anomalies} high-priority operational anomaly currently open`);
    }
    if (hasLowScore) {
      rationale.push(`Latest finalized evaluation score is ${latestEval.final_score}/100 (below 60 threshold)`);
    }
    rationale.push('Support check-in recommended to explore training assistance or operational alignment');

    return {
      employee_id: employee._id,
      type: 'support_check_in',
      title: 'Support Check-In',
      summary: 'A supportive check-in is recommended to discuss operational patterns, workflow support, or training assistance.',
      rationale,
      supporting_data: {
        tenure_months,
        performance_score: latestEval ? latestEval.final_score : null,
        performance_grade: latestEval ? latestEval.grade : null,
        skill_score: latestEval ? latestEval.skill_score : null,
        attendance_score: latestEval ? latestEval.attendance_score : null,
        punctuality_rate: attendance.punctuality_rate,
        late_days: attendance.late_days,
        total_late_minutes: attendance.total_late_minutes,
        unexcused_absences: attendance.unexcused_absences,
        open_anomalies: anomalyTelemetry.open_anomalies,
        high_severity_anomalies: anomalyTelemetry.high_severity_anomalies,
        last_evaluation_id: latestEval ? latestEval._id : null,
        last_evaluation_period: latestEval ? latestEval.period_key : null
      },
      rule_code: 'SUPPORT_CHECK_IN',
      rule_version: '1.0'
    };
  }

  /**
   * Generate candidates for a single employee
   */
  async generateRecommendationsForEmployee(employeeId, app = null) {
    const employee = await Employee.findById(employeeId);
    if (!employee) return [];

    const data = await this.calculateEmployeeRecommendationData(employee);
    const candidates = [];

    const bonus = this.evaluateBonusCandidate(data);
    if (bonus) candidates.push(bonus);

    const recognition = this.evaluateRecognitionCandidate(data);
    if (recognition) candidates.push(recognition);

    const promotion = this.evaluatePromotionCandidate(data);
    if (promotion) candidates.push(promotion);

    const support = this.evaluateSupportCheckIn(data);
    if (support) candidates.push(support);

    return candidates;
  }

  /**
   * Run recommendation scan for all eligible employees with deduplication
   */
  async generateRecommendations(app = null) {
    const employees = await Employee.find();
    let createdCount = 0;
    let updatedCount = 0;
    const newHighValueRecs = [];

    for (const employee of employees) {
      const candidates = await this.generateRecommendationsForEmployee(employee._id);

      for (const candidate of candidates) {
        // Deduplication Check:
        // 1. Check if a suggested recommendation exists for (employee_id, rule_code, status: 'suggested')
        const existingSuggested = await Recommendation.findOne({
          employee_id: candidate.employee_id,
          rule_code: candidate.rule_code,
          status: 'suggested'
        });

        if (existingSuggested) {
          // Update supporting telemetry snapshot and rationale in-place
          existingSuggested.supporting_data = candidate.supporting_data;
          existingSuggested.rationale = candidate.rationale;
          existingSuggested.summary = candidate.summary;
          existingSuggested.title = candidate.title;
          await existingSuggested.save();
          updatedCount++;
          continue;
        }

        // 2. Check if already reviewed (accepted or rejected)
        const existingReviewed = await Recommendation.findOne({
          employee_id: candidate.employee_id,
          rule_code: candidate.rule_code,
          status: { $in: ['accepted', 'rejected'] }
        });

        if (existingReviewed) {
          // Do not recreate accepted or rejected recommendations on every scan
          continue;
        }

        // 3. Persist new suggested recommendation
        const created = await Recommendation.create(candidate);
        createdCount++;

        if (['promotion_review', 'bonus_consideration'].includes(created.type)) {
          newHighValueRecs.push({ rec: created, employee });
        }
      }
    }

    // Dispatch notification to HR/Admin users for high-value recommendations
    if (newHighValueRecs.length > 0 && app) {
      try {
        const hrUsers = await User.find({ role: { $in: ['hr', 'admin'] }, is_active: true });
        for (const { rec, employee } of newHighValueRecs) {
          for (const hr of hrUsers) {
            await sendNotification(app, hr._id, {
              title: `Smart Recommendation: ${rec.title}`,
              message: `${employee.full_name} meets criteria for ${rec.title.toLowerCase()}.`,
              type: 'info',
              related_id: rec._id,
              related_type: 'recommendation'
            });
          }
        }
      } catch (err) {
        console.error('Error dispatching recommendation notifications:', err.message);
      }
    }

    return {
      scanned_employees: employees.length,
      recommendations_created: createdCount,
      recommendations_updated: updatedCount,
      generated_at: new Date()
    };
  }

  /**
   * List recommendations with filters & pagination
   */
  async getRecommendations(query = {}) {
    const filter = {};

    if (query.type && query.type !== 'all') {
      filter.type = query.type;
    }
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.employee_id) {
      filter.employee_id = query.employee_id;
    }

    return await Recommendation.find(filter)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('reviewed_by', 'email role')
      .sort({ createdAt: -1 });
  }

  /**
   * Get single recommendation by ID
   */
  async getRecommendationById(id) {
    const rec = await Recommendation.findById(id)
      .populate('employee_id', 'full_name employee_code department job_role hire_date basic_salary')
      .populate('reviewed_by', 'email role')
      .populate('supporting_data.last_evaluation_id');

    if (!rec) {
      const err = new Error('Recommendation not found');
      err.statusCode = 404;
      throw err;
    }

    return rec;
  }

  /**
   * Accept recommendation workflow
   */
  async acceptRecommendation(id, userId, reviewNotes) {
    const rec = await Recommendation.findById(id);
    if (!rec) {
      const err = new Error('Recommendation not found');
      err.statusCode = 404;
      throw err;
    }

    rec.status = 'accepted';
    rec.reviewed_by = userId;
    rec.reviewed_at = new Date();
    rec.review_notes = reviewNotes ? reviewNotes.trim() : null;
    await rec.save();

    return await Recommendation.findById(id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('reviewed_by', 'email role');
  }

  /**
   * Reject recommendation workflow (Requires review notes)
   */
  async rejectRecommendation(id, userId, reviewNotes) {
    if (!reviewNotes || !reviewNotes.trim()) {
      const err = new Error('Review notes are required when rejecting a recommendation');
      err.statusCode = 400;
      throw err;
    }

    const rec = await Recommendation.findById(id);
    if (!rec) {
      const err = new Error('Recommendation not found');
      err.statusCode = 404;
      throw err;
    }

    rec.status = 'rejected';
    rec.reviewed_by = userId;
    rec.reviewed_at = new Date();
    rec.review_notes = reviewNotes.trim();
    await rec.save();

    return await Recommendation.findById(id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('reviewed_by', 'email role');
  }

  /**
   * Get recommendation counts for HR dashboard & KPIs
   */
  async getRecommendationStats() {
    const [
      totalSuggested,
      totalAccepted,
      totalRejected,
      bonusSuggestions,
      promotionSuggestions,
      recognitionSuggestions,
      supportSuggestions
    ] = await Promise.all([
      Recommendation.countDocuments({ status: 'suggested' }),
      Recommendation.countDocuments({ status: 'accepted' }),
      Recommendation.countDocuments({ status: 'rejected' }),
      Recommendation.countDocuments({ status: 'suggested', type: 'bonus_consideration' }),
      Recommendation.countDocuments({ status: 'suggested', type: 'promotion_review' }),
      Recommendation.countDocuments({ status: 'suggested', type: 'recognition' }),
      Recommendation.countDocuments({ status: 'suggested', type: 'support_check_in' })
    ]);

    return {
      totalSuggested,
      totalAccepted,
      totalRejected,
      byType: {
        bonus_consideration: bonusSuggestions,
        promotion_review: promotionSuggestions,
        recognition: recognitionSuggestions,
        support_check_in: supportSuggestions
      }
    };
  }
}

module.exports = new RecommendationService();
