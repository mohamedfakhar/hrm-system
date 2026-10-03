const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const sendNotification = require('../utils/sendNotification');

// Default initial skill templates
const DEFAULT_SKILLS = [
  { name: 'Communication', category: 'Core', score: 80, weight: 0.25 },
  { name: 'Teamwork', category: 'Core', score: 80, weight: 0.25 },
  { name: 'Problem Solving', category: 'Core', score: 80, weight: 0.25 },
  { name: 'Technical Skills', category: 'Role Specific', score: 80, weight: 0.25 }
];

class PerformanceService {
  /**
   * Calculate business days (Monday-Friday) between two dates inclusive
   */
  getBusinessDays(startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    curDate.setHours(0, 0, 0, 0);
    const stopDate = new Date(endDate.getTime());
    stopDate.setHours(23, 59, 59, 999);

    while (curDate <= stopDate) {
      const dayOfWeek = curDate.getDay();
      // 0 = Sunday, 6 = Saturday in JavaScript
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }

  /**
   * Deterministically calculate attendance metrics for an employee across date range
   */
  async calculateAttendanceMetrics(employeeId, startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const businessDays = this.getBusinessDays(start, end);

    // Fetch attendance logs within window
    const attendanceLogs = await Attendance.find({
      employee_id: employeeId,
      date: { $gte: start, $lte: end }
    });

    const presentDays = attendanceLogs.filter(
      (a) => a.status === 'present' || a.status === 'late' || a.status === 'half_day'
    ).length;

    const lateDays = attendanceLogs.filter((a) => a.status === 'late').length;

    const totalLateMinutes = attendanceLogs.reduce(
      (sum, a) => sum + (Number(a.late_minutes) || 0),
      0
    );

    // Fetch approved leaves during the window
    const approvedLeaves = await LeaveRequest.find({
      employee_id: employeeId,
      status: 'approved',
      start_date: { $lte: end },
      end_date: { $gte: start }
    });

    const approvedLeaveDays = approvedLeaves.reduce(
      (sum, l) => sum + (Number(l.days_count) || 0),
      0
    );

    const explicitAbsences = attendanceLogs.filter((a) => a.status === 'absent').length;

    let unexcusedAbsences = explicitAbsences;
    if (explicitAbsences === 0 && attendanceLogs.length > 0) {
      unexcusedAbsences = Math.max(0, businessDays - presentDays - approvedLeaveDays);
    }

    return {
      total_working_days: businessDays,
      present_days: presentDays,
      late_days: lateDays,
      total_late_minutes: totalLateMinutes,
      unexcused_absences: unexcusedAbsences
    };
  }

  /**
   * Deterministic Attendance Score formula v1.0
   * Clamped [0, 100]
   */
  calculateAttendanceScore(metrics) {
    const { late_days = 0, unexcused_absences = 0, total_late_minutes = 0 } = metrics;

    const score = 100 - (late_days * 3) - (unexcused_absences * 10) - (total_late_minutes / 30);
    return Math.max(0, Math.min(100, parseFloat(score.toFixed(2))));
  }

  /**
   * Calculate weighted or average skill score
   */
  calculateSkillScore(skills = []) {
    if (!skills || skills.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const skill of skills) {
      const score = Math.max(1, Math.min(100, Number(skill.score) || 0));
      const weight = Number(skill.weight) > 0 ? Number(skill.weight) : 1;
      totalWeight += weight;
      weightedSum += score * weight;
    }

    if (totalWeight <= 0) return 0;
    return parseFloat((weightedSum / totalWeight).toFixed(2));
  }

  /**
   * Calculate final score: 70% skills + 30% attendance (v1.0)
   */
  calculateFinalScore(skillScore, attendanceScore) {
    const finalScore = (Number(skillScore) * 0.70) + (Number(attendanceScore) * 0.30);
    return parseFloat(Math.max(0, Math.min(100, finalScore)).toFixed(2));
  }

  /**
   * Centralized letter grade mapping
   */
  calculateGrade(finalScore) {
    const score = Number(finalScore);
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Live preview of attendance metrics for frontend form interaction
   */
  async getAttendancePreview(employeeId, startDate, endDate) {
    const metrics = await this.calculateAttendanceMetrics(employeeId, startDate, endDate);
    const attendanceScore = this.calculateAttendanceScore(metrics);
    return {
      metrics,
      attendanceScore
    };
  }

  /**
   * Create new evaluation (draft or submitted/finalized)
   */
  async createEvaluation(evaluatorId, data) {
    const {
      employee_id,
      period_type = 'quarterly',
      period_key,
      start_date,
      end_date,
      skills,
      feedback = '',
      recommendation_note = '',
      status = 'draft'
    } = data;

    if (!employee_id) {
      const err = new Error('Employee ID is required');
      err.statusCode = 400;
      throw err;
    }

    if (!period_key) {
      const err = new Error('Period key is required (e.g. 2026-Q1)');
      err.statusCode = 400;
      throw err;
    }

    if (!start_date || !end_date) {
      const err = new Error('Start date and end date are required');
      err.statusCode = 400;
      throw err;
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (end < start) {
      const err = new Error('End date must be on or after start date');
      err.statusCode = 400;
      throw err;
    }

    const employee = await Employee.findById(employee_id);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    // Check duplicate evaluation for same employee and period
    const existing = await PerformanceEvaluation.findOne({
      employee_id,
      period_key: period_key.trim()
    });

    if (existing) {
      const err = new Error(`An evaluation for ${period_key} already exists for this employee`);
      err.statusCode = 400;
      throw err;
    }

    // Skills handling
    const evaluationSkills = skills && skills.length > 0 ? skills : DEFAULT_SKILLS;
    const skillScore = this.calculateSkillScore(evaluationSkills);

    // Deterministic attendance calculation
    const attendanceMetrics = await this.calculateAttendanceMetrics(employee_id, start, end);
    const attendanceScore = this.calculateAttendanceScore(attendanceMetrics);

    const finalScore = this.calculateFinalScore(skillScore, attendanceScore);
    const grade = this.calculateGrade(finalScore);

    const isFinalized = status === 'finalized';

    const evaluation = await PerformanceEvaluation.create({
      employee_id,
      evaluator_id: evaluatorId,
      period_type,
      period_key: period_key.trim(),
      start_date: start,
      end_date: end,
      skills: evaluationSkills,
      skill_score: skillScore,
      attendance_metrics: attendanceMetrics,
      attendance_score: attendanceScore,
      formula_version: '1.0',
      final_score: finalScore,
      grade,
      feedback,
      recommendation_note,
      status: isFinalized ? 'finalized' : (status || 'draft'),
      finalized_at: isFinalized ? new Date() : null
    });

    return await PerformanceEvaluation.findById(evaluation._id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('evaluator_id', 'email role');
  }

  /**
   * Update draft evaluation (Finalized records are strictly immutable)
   */
  async updateEvaluation(id, data) {
    const evaluation = await PerformanceEvaluation.findById(id);
    if (!evaluation) {
      const err = new Error('Evaluation not found');
      err.statusCode = 404;
      throw err;
    }

    // IMMUTABILITY GUARD
    if (evaluation.status === 'finalized') {
      const err = new Error('Finalized evaluations cannot be edited');
      err.statusCode = 400;
      throw err;
    }

    const {
      skills,
      feedback,
      recommendation_note,
      start_date,
      end_date,
      status
    } = data;

    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      if (end < start) {
        const err = new Error('End date must be on or after start date');
        err.statusCode = 400;
        throw err;
      }
      evaluation.start_date = start;
      evaluation.end_date = end;

      // Re-evaluate attendance metrics
      evaluation.attendance_metrics = await this.calculateAttendanceMetrics(
        evaluation.employee_id,
        start,
        end
      );
      evaluation.attendance_score = this.calculateAttendanceScore(evaluation.attendance_metrics);
    }

    if (skills && Array.isArray(skills)) {
      evaluation.skills = skills;
      evaluation.skill_score = this.calculateSkillScore(skills);
    }

    if (feedback !== undefined) evaluation.feedback = feedback;
    if (recommendation_note !== undefined) evaluation.recommendation_note = recommendation_note;

    // Recalculate scores
    evaluation.final_score = this.calculateFinalScore(
      evaluation.skill_score,
      evaluation.attendance_score
    );
    evaluation.grade = this.calculateGrade(evaluation.final_score);

    if (status === 'finalized') {
      evaluation.status = 'finalized';
      evaluation.finalized_at = new Date();
    } else if (status) {
      evaluation.status = status;
    }

    await evaluation.save();

    return await PerformanceEvaluation.findById(evaluation._id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('evaluator_id', 'email role');
  }

  /**
   * Finalize evaluation and dispatch real-time employee notification
   */
  async finalizeEvaluation(app, id, evaluatorId) {
    const evaluation = await PerformanceEvaluation.findById(id).populate('employee_id');
    if (!evaluation) {
      const err = new Error('Evaluation not found');
      err.statusCode = 404;
      throw err;
    }

    if (evaluation.status === 'finalized') {
      return evaluation;
    }

    // Freeze snapshot of attendance metrics at finalization
    const metrics = await this.calculateAttendanceMetrics(
      evaluation.employee_id._id,
      evaluation.start_date,
      evaluation.end_date
    );
    evaluation.attendance_metrics = metrics;
    evaluation.attendance_score = this.calculateAttendanceScore(metrics);
    evaluation.skill_score = this.calculateSkillScore(evaluation.skills);
    evaluation.final_score = this.calculateFinalScore(
      evaluation.skill_score,
      evaluation.attendance_score
    );
    evaluation.grade = this.calculateGrade(evaluation.final_score);
    evaluation.status = 'finalized';
    evaluation.finalized_at = new Date();
    if (evaluatorId) evaluation.evaluator_id = evaluatorId;

    await evaluation.save();

    // Dispatch notification to employee if linked to user account
    if (evaluation.employee_id && evaluation.employee_id.user_id && app) {
      await sendNotification(app, evaluation.employee_id.user_id, {
        title: 'Performance Evaluation Published',
        message: `Your performance evaluation for period ${evaluation.period_key} has been finalized. Final Score: ${evaluation.final_score} (Grade ${evaluation.grade}).`,
        type: 'info',
        related_id: evaluation._id,
        related_type: 'performance'
      });
    }

    return await PerformanceEvaluation.findById(evaluation._id)
      .populate('employee_id', 'full_name employee_code department job_role')
      .populate('evaluator_id', 'email role');
  }

  /**
   * List evaluations for HR/Admin with filters
   */
  async getAllEvaluations(query = {}) {
    const filter = {};

    if (query.period) {
      filter.period_key = query.period;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.grade) {
      filter.grade = query.grade;
    }
    if (query.employee_id) {
      filter.employee_id = query.employee_id;
    }

    const evaluations = await PerformanceEvaluation.find(filter)
      .populate('employee_id', 'full_name employee_code department job_role basic_salary')
      .populate('evaluator_id', 'email role')
      .sort({ createdAt: -1 });

    // Optional department filter in memory if populated
    if (query.department) {
      return evaluations.filter(
        (e) => e.employee_id && e.employee_id.department === query.department
      );
    }

    return evaluations;
  }

  /**
   * Get single evaluation by ID with role-based access control
   */
  async getEvaluationById(id, user) {
    const evaluation = await PerformanceEvaluation.findById(id)
      .populate('employee_id', 'full_name employee_code department job_role user_id')
      .populate('evaluator_id', 'email role');

    if (!evaluation) {
      const err = new Error('Evaluation not found');
      err.statusCode = 404;
      throw err;
    }

    // Role Guard: Employee can only view their own FINALIZED evaluations
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ user_id: user.id });
      if (!employee || evaluation.employee_id._id.toString() !== employee._id.toString()) {
        const err = new Error('Access denied: You can only view your own evaluations');
        err.statusCode = 403;
        throw err;
      }
      if (evaluation.status !== 'finalized') {
        const err = new Error('Evaluation is not yet published');
        err.statusCode = 403;
        throw err;
      }
    }

    return evaluation;
  }

  /**
   * Get finalized evaluations belonging to logged in employee
   */
  async getMyEvaluations(userId) {
    const employee = await Employee.findOne({ user_id: userId });
    if (!employee) {
      const err = new Error('Employee profile not found');
      err.statusCode = 404;
      throw err;
    }

    return await PerformanceEvaluation.find({
      employee_id: employee._id,
      status: 'finalized'
    })
      .populate('evaluator_id', 'email role')
      .sort({ end_date: -1 });
  }

  /**
   * Delete evaluation (Drafts only)
   */
  async deleteEvaluation(id) {
    const evaluation = await PerformanceEvaluation.findById(id);
    if (!evaluation) {
      const err = new Error('Evaluation not found');
      err.statusCode = 404;
      throw err;
    }

    if (evaluation.status === 'finalized') {
      const err = new Error('Finalized evaluations cannot be deleted');
      err.statusCode = 400;
      throw err;
    }

    await PerformanceEvaluation.findByIdAndDelete(id);
    return { id, message: 'Evaluation deleted successfully' };
  }
}

module.exports = new PerformanceService();
