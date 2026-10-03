const assistantToolRegistry = require('./assistantToolRegistry');
const assistantAiProvider = require('./assistantAiProvider');
const assistantResponseService = require('./assistantResponseService');
const AssistantAuditLog = require('../models/AssistantAuditLog');
const { isArabic } = require('../utils/assistant/arabicNormalizer');

class AssistantService {
  /**
   * Main chat endpoint handler
   * @param {string} userId Authenticated HR/Admin User ID
   * @param {string} message Natural language query
   */
  async processQuery(userId, message) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      const err = new Error('A question prompt is required');
      err.statusCode = 400;
      throw err;
    }

    const cleanQuestion = message.trim();
    const isAr = isArabic(cleanQuestion);
    const startTime = Date.now();

    // 1. Detect Intent and Tool Selection
    const detection = await assistantAiProvider.detectIntent(cleanQuestion);

    // Security & Prompt Injection Refusal Guard
    if (detection && detection.isRefusal) {
      const executionTimeMs = Date.now() - startTime;
      const refusalAnswer = isAr
        ? "تم رفض الطلب لدواعي أمنية: الوصول إلى بيانات الاعتماد السرية أو استعلامات قاعدة البيانات المباشرة محظور تماماً."
        : "Request rejected for security: Access to internal credentials, database operations, or system secrets is prohibited.";

      await AssistantAuditLog.create({
        user_id: userId,
        question: cleanQuestion,
        intent: 'security_refusal',
        tool_name: null,
        tool_arguments: null,
        success: false,
        response_summary: refusalAnswer.slice(0, 200),
        error_message: 'Security Refusal: Unauthorized probe',
        execution_time_ms: executionTimeMs
      });

      return {
        answer: refusalAnswer,
        intent: null,
        sources: [],
        structuredData: null
      };
    }

    if (!detection || !detection.toolName) {
      const executionTimeMs = Date.now() - startTime;
      const defaultAnswer = isAr
        ? "يمكنني مساعدتك في استعلامات الموظفين، الحضور والانصراف، الإجازات، الرواتب، تقييمات الأداء، التنبيهات التشغيلية، والتوصيات. يمكنك تجربة سؤال مثل:\n" +
          "• 'مين أكتر موظف اتأخر الشهر ده؟'\n" +
          "• 'وريني التنبيهات عالية الخطورة'\n" +
          "• 'كام طلب إجازة معلق؟'\n" +
          "• 'مين المرشحين للترقية للمراجعة؟'\n" +
          "• 'ملخص المرتبات الشهر ده'"
        : "I can help with employees, attendance, leaves, payroll, performance evaluations, anomalies, and recommendations. Try asking:\n" +
          "• 'Who was late the most this month?'\n" +
          "• 'Show high anomaly alerts'\n" +
          "• 'Show pending leave requests'\n" +
          "• 'Who are the promotion review candidates?'\n" +
          "• 'Show payroll summary for this month'";

      // Audit Log for unrecognized question
      await AssistantAuditLog.create({
        user_id: userId,
        question: cleanQuestion,
        intent: 'unsupported',
        tool_name: null,
        tool_arguments: null,
        success: false,
        response_summary: defaultAnswer.slice(0, 200),
        error_message: 'Unsupported question intent',
        execution_time_ms: executionTimeMs
      });

      return {
        answer: defaultAnswer,
        intent: null,
        sources: [],
        structuredData: null
      };
    }

    const { toolName, arguments: toolArgs } = detection;
    const tool = assistantToolRegistry.getTool(toolName);

    if (!tool) {
      const err = new Error(`Tool "${toolName}" is not registered`);
      err.statusCode = 400;
      throw err;
    }

    try {
      // 2. Execute Predefined Backend Tool securely
      const toolResult = await tool.execute(toolArgs || {});
      const executionTimeMs = Date.now() - startTime;

      // 3. Format Natural Language Response (language-aware)
      const formatted = assistantResponseService.formatResponse(
        toolName,
        toolArgs,
        toolResult,
        cleanQuestion
      );

      // 4. Audit Log Execution
      await AssistantAuditLog.create({
        user_id: userId,
        question: cleanQuestion,
        intent: toolName,
        tool_name: toolName,
        tool_arguments: toolArgs,
        success: true,
        response_summary: formatted.answer.slice(0, 200),
        execution_time_ms: executionTimeMs
      });

      return {
        answer: formatted.answer,
        intent: toolName,
        sources: formatted.sources,
        structuredData: toolResult
      };
    } catch (toolError) {
      const executionTimeMs = Date.now() - startTime;

      await AssistantAuditLog.create({
        user_id: userId,
        question: cleanQuestion,
        intent: toolName,
        tool_name: toolName,
        tool_arguments: toolArgs,
        success: false,
        response_summary: null,
        error_message: toolError.message,
        execution_time_ms: executionTimeMs
      });

      throw toolError;
    }
  }

  /**
   * Fetch assistant audit trail
   */
  async getAuditLogs(params = {}) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(params.limit) || 20), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (params.intent) filter.intent = params.intent;
    if (params.success !== undefined) filter.success = params.success === 'true';

    const [total, logs] = await Promise.all([
      AssistantAuditLog.countDocuments(filter),
      AssistantAuditLog.find(filter)
        .populate('user_id', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs
    };
  }
}

module.exports = new AssistantService();
