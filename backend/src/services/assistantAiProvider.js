const {
  isArabic,
  normalizeArabic,
  mapArabicDepartment,
  mapArabicDatePhrase,
  transliterateArabicName
} = require('../utils/assistant/arabicNormalizer');

/**
 * Assistant AI Provider Service
 * Provides intent detection & entity extraction supporting:
 * - English queries
 * - Modern Standard Arabic & Egyptian Arabic queries
 * - Mixed Arabic + English queries
 * - Prompt injection detection & safe refusal
 * - 100% deterministic rule-based parsing fallback with pluggable LLM support
 */

class AssistantAiProvider {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'deterministic';
    this.apiKey = process.env.AI_API_KEY || null;
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Parse user query to identify matching intent and arguments
   * @param {string} message 
   * @returns {Promise<{toolName: string, arguments: object, isRefusal?: boolean, refusalReason?: string}|null>}
   */
  async detectIntent(message) {
    if (!message || typeof message !== 'string' || !message.trim()) return null;
    const raw = message.trim();
    const qLower = raw.toLowerCase();
    const norm = normalizeArabic(raw);

    // =========================================================================
    // 0. SECURITY & PROMPT INJECTION REFUSAL GUARD
    // Protects against prompt injection, credential dumping, and arbitrary query probes
    // =========================================================================
    if (this.isMaliciousProbe(qLower, norm)) {
      return {
        toolName: '__refusal__',
        isRefusal: true,
        refusalReason: 'security_violation',
        arguments: {}
      };
    }

    // =========================================================================
    // 1. EMPLOYEE COUNT / DEPARTMENT HEADCOUNT
    // English: "How many employees are there?", "How many employees in Engineering?"
    // Arabic:  "كام موظف عندنا؟", "عدد الموظفين كام؟", "كام موظف في قسم Engineering؟"
    // Mixed:   "كام employees عندنا؟", "How many موظفين في قسم Engineering؟"
    // =========================================================================
    if (
      qLower.includes('how many employees') ||
      qLower.includes('employee count') ||
      qLower.includes('number of employees') ||
      qLower.includes('total employees') ||
      qLower.includes('count employees') ||
      norm.includes('كام موظف') ||
      norm.includes('كم موظف') ||
      norm.includes('عدد الموظفين') ||
      norm.includes('اجمالي الموظفين') ||
      norm.includes('عدد موظفين') ||
      norm.includes('كام واحد شغال') ||
      norm.includes('كم عدد الموظفين') ||
      (norm.includes('كام') && (qLower.includes('employee') || qLower.includes('employees')))
    ) {
      const department = this.extractDepartment(raw, norm);
      return {
        toolName: 'getEmployeeCount',
        arguments: { department }
      };
    }

    // =========================================================================
    // 2. EMPLOYEES BY DEPARTMENT / SPECIFIC EMPLOYEE CARD
    // English: "Show employees in Engineering", "List employees in Sales", "Show me employee EMP0001"
    // Arabic:  "وريني موظفين قسم Engineering", "مين شغال في قسم Engineering", "وريني بيانات الموظف EMP0001"
    // Mixed:   "Showلي الموظفين اللي في قسم Engineering", "وريني employees in Engineering"
    // =========================================================================
    if (
      (qLower.includes('employees in') ||
        qLower.includes('list employees') ||
        qLower.includes('who works in') ||
        qLower.includes('show employees') ||
        norm.includes('وريني موظفين') ||
        norm.includes('مين شغال في') ||
        norm.includes('مين في قسم') ||
        norm.includes('اعرض موظفين') ||
        norm.includes('قائمه موظفين') ||
        norm.includes('قائمة موظفين') ||
        norm.includes('بيانات الموظف') ||
        qLower.includes('show me employee')) &&
      !qLower.includes('how many') &&
      !norm.includes('كام') &&
      !norm.includes('كم')
    ) {
      // Check if query is targeting a specific employee code like EMP0001
      const codeMatch = raw.match(/\b(EMP\d+)\b/i);
      if (codeMatch) {
        return {
          toolName: 'getEmployeeAttendance',
          arguments: { employeeQuery: codeMatch[1], datePhrase: 'this month' }
        };
      }

      const department = this.extractDepartment(raw, norm);
      if (department) {
        return {
          toolName: 'getEmployeesByDepartment',
          arguments: { department }
        };
      }
    }

    // =========================================================================
    // 3. LATE EMPLOYEES
    // English: "Who was late the most this month?", "Show employees with repeated lateness"
    // Arabic:  "مين أكتر موظفين اتأخروا الشهر ده؟", "مين اتأخر أكتر الشهر ده؟", "مين اكتر واحد اتأخر؟"
    // Mixed:   "مين was late the most this month?", "Showلي الموظفين اللي اتأخروا الشهر ده"
    // =========================================================================
    if (
      qLower.includes('late the most') ||
      qLower.includes('most late') ||
      qLower.includes('repeated lateness') ||
      qLower.includes('late employees') ||
      qLower.includes('who was late') ||
      qLower.includes('who is late') ||
      norm.includes('اتأخروا') ||
      norm.includes('اتاخروا') ||
      norm.includes('اتأخر اكتر') ||
      norm.includes('اتاخر اكتر') ||
      norm.includes('اكتر موظفين اتاخروا') ||
      norm.includes('اكتر موظف اتاخر') ||
      norm.includes('اكتر واحد اتاخر') ||
      norm.includes('المتاخرين') ||
      norm.includes('المتأخرين') ||
      norm.includes('تاخيرات') ||
      norm.includes('تأخيرات') ||
      (norm.includes('اتأخر') && !this.extractEmployeeName(raw, norm)) ||
      (norm.includes('اتاخر') && !this.extractEmployeeName(raw, norm))
    ) {
      const datePhrase = this.extractDatePhrase(raw, norm) || 'this month';
      return {
        toolName: 'getLateEmployees',
        arguments: { datePhrase }
      };
    }

    // =========================================================================
    // 4. ABSENT EMPLOYEES
    // English: "Who was absent today?", "How many employees are absent today?"
    // Arabic:  "مين كان غايب النهارده؟", "وريني الغياب النهارده", "مين غايب النهارده"
    // Mixed:   "مين was absent today?", "وريني absent employees النهارده"
    // =========================================================================
    if (
      (qLower.includes('absent') && !qLower.includes('leave') && !qLower.includes('attendance summary')) ||
      norm.includes('مين كان غايب') ||
      norm.includes('مين غايب') ||
      norm.includes('وريني الغياب') ||
      norm.includes('الغياب النهارده') ||
      norm.includes('الغياب اليوم') ||
      norm.includes('مين غاب') ||
      norm.includes('غياب الموظفين')
    ) {
      const datePhrase = this.extractDatePhrase(raw, norm) || 'today';
      return {
        toolName: 'getAbsentEmployees',
        arguments: { datePhrase }
      };
    }

    // =========================================================================
    // 5. ATTENDANCE SUMMARY
    // English: "Show attendance summary for this month", "attendance statistics"
    // Arabic:  "ملخص الحضور الشهر ده", "تقرير الحضور", "احصائيات الحضور"
    // Mixed:   "وريني attendance summary", "attendance summary الشهر ده"
    // =========================================================================
    if (
      (qLower.includes('attendance summary') ||
        qLower.includes('attendance statistics') ||
        qLower.includes('attendance rate') ||
        norm.includes('ملخص الحضور') ||
        norm.includes('تقرير الحضور') ||
        norm.includes('احصائيات الحضور') ||
        norm.includes('موقف الحضور')) &&
      !this.extractEmployeeName(raw, norm)
    ) {
      const datePhrase = this.extractDatePhrase(raw, norm) || 'this month';
      return {
        toolName: 'getAttendanceSummary',
        arguments: { datePhrase }
      };
    }

    // =========================================================================
    // 6. SPECIFIC EMPLOYEE ATTENDANCE
    // English: "Show Ahmed's attendance this month", "Ahmed attendance"
    // Arabic:  "وريني حضور أحمد الشهر ده", "حضور احمد الشهر ده", "سجل حضور احمد"
    // Mixed:   "Showلي Ahmed attendance", "حضور Ahmed الشهر ده"
    // =========================================================================
    if (
      qLower.includes('attendance') ||
      norm.includes('حضور') ||
      norm.includes('سجل حضور')
    ) {
      const empName = this.extractEmployeeName(raw, norm);
      if (empName) {
        const datePhrase = this.extractDatePhrase(raw, norm) || 'this month';
        return {
          toolName: 'getEmployeeAttendance',
          arguments: { employeeQuery: empName, datePhrase }
        };
      }
    }

    // =========================================================================
    // 7. PENDING LEAVES
    // English: "How many pending leave requests are there?", "Show pending leave requests"
    // Arabic:  "كام طلب إجازة معلق؟", "وريني طلبات الإجازات المعلقة", "مين عنده طلبات إجازة معلقة؟"
    // Mixed:   "كام pending leave requests؟", "وريني pending leaves"
    // =========================================================================
    if (
      qLower.includes('pending leave') ||
      qLower.includes('pending leaves') ||
      qLower.includes('pending time-off') ||
      norm.includes('طلب اجازه معلق') ||
      norm.includes('طلبات الاجازات المعلقه') ||
      norm.includes('طلبات الاجازه المعلقه') ||
      norm.includes('اجازات معلقه') ||
      norm.includes('اجازات قيد الانتظار') ||
      norm.includes('طلبات اجازه معلقه') ||
      norm.includes('مين عنده طلبات اجازه')
    ) {
      return {
        toolName: 'getPendingLeaves',
        arguments: {}
      };
    }

    // =========================================================================
    // 8. LEAVE SUMMARY
    // English: "Show leave summary this month", "leave statistics", "Which employees took the most leave?"
    // Arabic:  "ملخص الإجازات الشهر ده", "تقرير الاجازات", "احصائيات الاجازات"
    // Mixed:   "وريني leave summary", "leave summary الشهر ده"
    // =========================================================================
    if (
      qLower.includes('leave summary') ||
      qLower.includes('leave statistics') ||
      qLower.includes('leaves this month') ||
      qLower.includes('most leave') ||
      norm.includes('ملخص الاجازات') ||
      norm.includes('تقرير الاجازات') ||
      norm.includes('احصائيات الاجازات') ||
      norm.includes('اجمالي الاجازات')
    ) {
      const datePhrase = this.extractDatePhrase(raw, norm) || 'this month';
      return {
        toolName: 'getLeaveSummary',
        arguments: { datePhrase }
      };
    }

    // =========================================================================
    // 9. PAYROLL DEDUCTIONS SPIKES
    // English: "Which employees have deductions above 25%?", "total deductions this month"
    // Arabic:  "مين عنده خصومات أكتر من 25%؟", "إجمالي الخصومات كام؟", "الموظفين اللي عندهم خصومات"
    // Mixed:   "مين عنده deductions اكتر من 25%؟", "deductions اعلي من 25%"
    // =========================================================================
    if (
      qLower.includes('deduction') ||
      qLower.includes('deductions') ||
      norm.includes('خصومات') ||
      norm.includes('استقطاعات') ||
      norm.includes('خصم')
    ) {
      const pctMatch = raw.match(/(\d+)%/);
      const thresholdPercent = pctMatch ? parseInt(pctMatch[1]) : 25;
      return {
        toolName: 'getPayrollDeductions',
        arguments: { thresholdPercent }
      };
    }

    // =========================================================================
    // 10. PAYROLL SUMMARY
    // English: "What is the payroll summary for this month?", "total payroll", "Show payroll information"
    // Arabic:  "ملخص المرتبات الشهر ده", "إجمالي المرتبات كام؟", "وريني بيانات المرتبات الشهر ده"
    // Mixed:   "Showلي payroll summary الشهر ده", "وريني payroll this month"
    // =========================================================================
    if (
      qLower.includes('payroll') ||
      qLower.includes('total salary') ||
      qLower.includes('salary summary') ||
      norm.includes('مرتبات') ||
      norm.includes('رواتب') ||
      norm.includes('المرتبات') ||
      norm.includes('الرواتب') ||
      norm.includes('مسير الرواتب')
    ) {
      return {
        toolName: 'getPayrollSummary',
        arguments: {}
      };
    }

    // =========================================================================
    // 11. LOW PERFORMANCE EMPLOYEES
    // English: "Show me employees with performance score below 60", "low performance", "underperforming"
    // Arabic:  "مين تقييمه أقل من 60؟", "الموظفين اللي تقييمهم ضعيف", "تقييم اقل من 60"
    // Mixed:   "وريني performance أقل من 60", "مين performance below 60"
    // =========================================================================
    if (
      (qLower.includes('below') && (qLower.includes('performance') || qLower.includes('score'))) ||
      qLower.includes('low performance') ||
      qLower.includes('underperforming') ||
      norm.includes('اقل من') && (norm.includes('تقييم') || norm.includes('درجه') || norm.includes('performance')) ||
      norm.includes('تقييمهم ضعيف') ||
      norm.includes('اداء منخفض') ||
      norm.includes('اداء ضعيف') ||
      norm.includes('تحت الستين')
    ) {
      const scoreMatch = raw.match(/(\d+)/);
      const thresholdScore = scoreMatch ? parseInt(scoreMatch[1]) : 60;
      return {
        toolName: 'getLowPerformanceEmployees',
        arguments: { thresholdScore }
      };
    }

    // =========================================================================
    // 12. PERFORMANCE SUMMARY
    // English: "What is the average performance score?", "Who has the highest performance score?", "performance summary"
    // Arabic:  "متوسط تقييم الموظفين كام؟", "مين أعلى موظف في التقييم؟", "ملخص التقييم"
    // Mixed:   "متوسط ال performance كام؟", "وريني performance summary"
    // =========================================================================
    if (
      qLower.includes('performance summary') ||
      qLower.includes('performance distribution') ||
      qLower.includes('evaluation summary') ||
      qLower.includes('average performance') ||
      qLower.includes('highest performance') ||
      norm.includes('متوسط تقييم') ||
      norm.includes('متوسط التقييمات') ||
      norm.includes('ملخص التقييم') ||
      norm.includes('تقرير تقييم الاداء') ||
      norm.includes('اعلي موظف في التقييم') ||
      norm.includes('اعلى موظف في التقييم') ||
      norm.includes('اعلي تقييم') ||
      (norm.includes('تقييم') && !this.extractEmployeeName(raw, norm) && !norm.includes('اقل من'))
    ) {
      return {
        toolName: 'getPerformanceSummary',
        arguments: {}
      };
    }

    // =========================================================================
    // 13. SPECIFIC EMPLOYEE ANOMALIES
    // English: "Why was Ahmed flagged by the anomaly system?", "Why was Ahmed flagged?", "Show Ahmed's anomaly alerts"
    // Arabic:  "ليه أحمد عليه تنبيه؟", "وريني مشاكل أحمد", "تنبيهات احمد"
    // Mixed:   "ليه Ahmed was flagged؟", "وريني Ahmed anomalies"
    // =========================================================================
    const isGeneralSeverityOrOpenQuery =
      qLower.includes('high severity') ||
      qLower.includes('medium severity') ||
      qLower.includes('low severity') ||
      norm.includes('عالي الخطورة') ||
      norm.includes('عاليه الخطوره') ||
      norm.includes('عالية الخطورة') ||
      norm.includes('متوسط الخطورة') ||
      norm.includes('متوسطة الخطورة') ||
      norm.includes('منخفض الخطورة') ||
      norm.includes('منخفضة الخطورة');

    if (
      !isGeneralSeverityOrOpenQuery &&
      (qLower.includes('flagged') ||
        qLower.includes('anomaly') ||
        qLower.includes('anomalies') ||
        norm.includes('تنبيه') ||
        norm.includes('تنبيهات') ||
        norm.includes('مشاكل') ||
        norm.includes('مشكله')) &&
      this.extractEmployeeName(raw, norm)
    ) {
      const empName = this.extractEmployeeName(raw, norm);
      return {
        toolName: 'getEmployeeAnomalies',
        arguments: { employeeQuery: empName }
      };
    }

    // =========================================================================
    // 14. OPEN ANOMALIES
    // English: "Show current anomaly alerts", "Show high severity anomalies", "How many high severity anomalies are open?"
    // Arabic:  "وريني التنبيهات الحالية", "كام تنبيه عالي الخطورة؟", "وريني التنبيهات عالية الخطورة"
    // Mixed:   "وريني high severity anomalies", "كام high severity anomalies؟"
    // =========================================================================
    if (
      qLower.includes('anomaly') ||
      qLower.includes('anomalies') ||
      norm.includes('تنبيه') ||
      norm.includes('تنبيهات')
    ) {
      let severity = null;
      if (qLower.includes('high') || norm.includes('عالي') || norm.includes('خطير') || norm.includes('عال')) {
        severity = 'high';
      } else if (qLower.includes('medium') || norm.includes('متوسط')) {
        severity = 'medium';
      } else if (qLower.includes('low') || norm.includes('منخفض')) {
        severity = 'low';
      }

      return {
        toolName: 'getOpenAnomalies',
        arguments: { severity }
      };
    }

    // =========================================================================
    // 15. SPECIFIC EMPLOYEE RECOMMENDATIONS
    // English: "Show Ahmed's recommendations", "What is recommended for Ahmed"
    // Arabic:  "وريني توصيات أحمد", "توصيات احمد"
    // Mixed:   "Showلي Ahmed recommendations", "توصيات Ahmed"
    // =========================================================================
    if (
      (qLower.includes('recommend') || norm.includes('توصيات') || norm.includes('توصيه')) &&
      this.extractEmployeeName(raw, norm)
    ) {
      const empName = this.extractEmployeeName(raw, norm);
      return {
        toolName: 'getEmployeeRecommendations',
        arguments: { employeeQuery: empName }
      };
    }

    // =========================================================================
    // 16. RECOMMENDATIONS (GENERAL, PROMOTION, BONUS, SUPPORT)
    // English: "Show current recommendations", "Who are the promotion review candidates?", "Who are the bonus consideration candidates?"
    // Arabic:  "وريني التوصيات الحالية", "مين المرشحين للترقية للمراجعة؟", "مين مرشحين للبونص؟"
    // Mixed:   "مين promotion review candidates؟", "Showلي recommendations"
    // =========================================================================
    if (
      qLower.includes('promotion') ||
      qLower.includes('bonus') ||
      qLower.includes('recognition') ||
      qLower.includes('support check') ||
      qLower.includes('recommendation') ||
      qLower.includes('recommendations') ||
      norm.includes('توصيات') ||
      norm.includes('توصيه') ||
      norm.includes('ترقيه') ||
      norm.includes('ترقية') ||
      norm.includes('بونص') ||
      norm.includes('مكافاه') ||
      norm.includes('مكافأة') ||
      norm.includes('مرشحين') ||
      norm.includes('مرشحي')
    ) {
      let type = null;
      if (qLower.includes('promotion') || norm.includes('ترقيه') || norm.includes('ترقية')) {
        type = 'promotion_review';
      } else if (qLower.includes('bonus') || norm.includes('بونص') || norm.includes('مكافاه') || norm.includes('مكافأة')) {
        type = 'bonus_consideration';
      } else if (qLower.includes('recognition') || norm.includes('تقدير')) {
        type = 'recognition';
      } else if (qLower.includes('support') || norm.includes('دعم')) {
        type = 'support_check_in';
      }

      return {
        toolName: 'getRecommendations',
        arguments: { type, status: 'suggested' }
      };
    }

    return null;
  }

  /**
   * Helper: checks if query is a prompt injection, sensitive secret probe, or arbitrary DB execution
   */
  isMaliciousProbe(qLower, norm) {
    const maliciousTerms = [
      'ignore all previous instructions',
      'ignore previous instructions',
      'ignore instructions',
      'show me passwords',
      'show passwords',
      'passwordhash',
      'refresh tokens',
      'refreshtoken',
      'access token',
      'accesstoken',
      'jwt secret',
      'jwt_secret',
      'mongodb query',
      'mongo query',
      '"$where"',
      "'$where'",
      '{"$gt"',
      '{ "$gt"',
      'db.collection',
      'eval(',
      'exec(',
      'system secrets',
      'ignore authorization',
      'bypass authorization',
      'كلمات المرور',
      'كلمه المرور',
      'كلمة السر',
      'الباسوردات',
      'توكنات',
      'استعلام قاعدة البيانات'
    ];

    return maliciousTerms.some((term) => qLower.includes(term) || norm.includes(term));
  }

  /**
   * Helper: extract department name from query (supports English, Arabic, and mixed)
   */
  extractDepartment(rawText, normText) {
    // 1. Check Arabic department mapping first
    const mapped = mapArabicDepartment(rawText);
    if (mapped) return mapped;

    // 2. English / Mixed regex pattern
    const match = rawText.match(/(?:in|for|of|قسم|ف\s+قسم)\s+(?:the\s+)?([a-z0-9_\-\s]+?)(?:\s+department|\s+team|\?|$)/i);
    if (match && match[1]) {
      const val = match[1].replace(/^(?:the|all|كل)\s+/i, '').trim();
      if (!['there', 'total', 'company', 'organization', 'all', 'الشركه', 'عندنا'].includes(val.toLowerCase())) {
        return val;
      }
    }

    return null;
  }

  /**
   * Helper: extract common date phrase tokens from text (supports English and Arabic)
   */
  extractDatePhrase(rawText, normText) {
    const arabicMapped = mapArabicDatePhrase(normText || rawText);
    if (arabicMapped) return arabicMapped;

    const lower = rawText.toLowerCase();
    if (lower.includes('today')) return 'today';
    if (lower.includes('yesterday')) return 'yesterday';
    if (lower.includes('this week')) return 'this week';
    if (lower.includes('last week')) return 'last week';
    if (lower.includes('this month')) return 'this month';
    if (lower.includes('last month')) return 'last month';
    if (lower.includes('this quarter')) return 'this quarter';
    if (lower.includes('this year')) return 'this year';

    return null;
  }

  /**
   * Helper: extract potential employee name from query (supports English, Arabic, and mixed)
   */
  extractEmployeeName(rawText, normText) {
    // 1. Check for canonical employee code like EMP0001
    const codeMatch = rawText.match(/\b(EMP\d+)\b/i);
    if (codeMatch) return codeMatch[1].toUpperCase();

    // 2. English possessive patterns: "Ahmed's attendance", "Ahmed's performance"
    const possessive = rawText.match(/([a-z\u0600-\u06FF\s]+?)(?:'s|’s)\s+(?:attendance|performance|recommendations|anomalies)/i);
    if (possessive && possessive[1]) {
      const candidate = possessive[1].replace(/^(?:show|get|view|what is|why is|وريني|اعرض)\s+/i, '').trim();
      if (candidate && candidate.length > 2) return candidate;
    }

    // 3. English "why was [Name] flagged"
    const whyFlagged = rawText.match(/why\s+(?:was|is)\s+([a-z\s]+?)\s+flagged/i);
    if (whyFlagged && whyFlagged[1]) return whyFlagged[1].trim();

    // 4. Arabic "ليه [Name] عليه تنبيه" or "ليه [Name] معموله flag"
    const arabicWhyFlagged = rawText.match(/ليه\s+([a-z\u0600-\u06FF\s]+?)\s+(?:عليه|عنده|معموله|متسجل|was|flagged)/i);
    if (arabicWhyFlagged && arabicWhyFlagged[1]) return arabicWhyFlagged[1].trim();

    const nonEmp = [
      'الموظفين', 'الموظف', 'الشركه', 'القسم',
      'الشهر ده', 'الشهر', 'الشهردة', 'الشهر الحالي', 'هذا الشهر', 'الشهر اللي فات', 'الشهر الماضي',
      'الاسبوع ده', 'الاسبوع', 'الاسبوع الحالي', 'هذا الاسبوع', 'الاسبوع اللي فات', 'الاسبوع الماضي',
      'النهارده', 'اليوم', 'امبارح', 'امس',
      'عالية الخطورة', 'عاليه الخطوره', 'عالي الخطورة', 'عالي الخطوره', 'عالية', 'عاليه', 'عالي', 'خطيرة', 'خطيره', 'خطورة', 'خطوره',
      'متوسطة الخطورة', 'متوسطه الخطوره', 'متوسطة', 'متوسطه', 'متوسط',
      'منخفضة الخطورة', 'منخفضه الخطوره', 'منخفضة', 'منخفضه', 'منخفض',
      'المفتوحة', 'المفتوحه', 'مفتوحة', 'مفتوحه', 'الحالية', 'الحاليه', 'حالية', 'حاليه',
      'الجديدة', 'الجديده', 'جديدة', 'جديده',
      'الترقية', 'الترقيه', 'ترقية', 'ترقيه', 'البونص', 'بونص', 'المكافأة', 'المكافاه', 'مكافأة', 'مكافاه',
      'عالي', 'منخفض', 'متوسط', 'الاداء', 'الأداء', 'التقييم',
      'this month', 'last month', 'this week', 'last week', 'today', 'yesterday',
      'high', 'high severity', 'medium', 'medium severity', 'low', 'low severity', 'open', 'critical', 'all'
    ];

    const isNonEmp = (val) => {
      if (!val) return true;
      const v = val.toLowerCase().trim();
      if (nonEmp.includes(v)) return true;
      if (/^(?:عالي|عاليه|عالية|متوسط|متوسطه|متوسطة|منخفض|منخفضه|منخفضة|خطير|خطيره|خطيرة|خطورة|خطوره|مفتوح|مفتوحه|مفتوحة|حالي|حاليه|حالية)(?:\s+(?:الخطورة|الخطوره|الشده|الشدة))?$/i.test(v)) return true;
      if (/^(?:high|medium|low|critical|open|pending|active|all)(?:\s+severity)?$/i.test(v)) return true;
      return false;
    };

    // 5. Arabic "حضور [Name]" or "وريني حضور [Name]" or "سجل حضور [Name]"
    if (!normText.includes('ملخص') && !normText.includes('تقرير') && !normText.includes('احصائيات') && !normText.includes('نسبه') && !normText.includes('موقف')) {
      const arabicAttendance = rawText.match(/(?:^|[\s،,])(?:حضور|غياب|توصيات|مشاكل|تنبيهات|تقييم)\s+([a-z\u0600-\u06FF\s]+?)(?:\s+النهارده|\s+الشهر|\s+الاسبوع|\s+this|\s+in|\?|$)/i);
      if (arabicAttendance && arabicAttendance[1]) {
        const candidate = arabicAttendance[1].replace(/^(?:الموظف|موظف)\s+/i, '').trim();
        if (candidate.length >= 2 && !isNonEmp(candidate)) {
          return candidate;
        }
      }
    }

    // 6. "Show Ahmed attendance" or "Showلي Ahmed attendance"
    const showPattern = rawText.match(/(?:show|showلي|وريني|اعرض)\s+([a-z\u0600-\u06FF\s]+?)\s+(?:attendance|performance|recommendations|anomalies|حضور|تقييم)/i);
    if (showPattern && showPattern[1]) {
      const candidate = showPattern[1].trim();
      const forbidden = [
        'me', 'لي', 'high', 'low', 'medium', 'high severity', 'medium severity', 'low severity',
        'current', 'open', 'all', 'recent', 'pending', 'new', 'latest', 'active',
        'سجل', 'كل', 'الحاليه', 'المفتوحه', 'العاليه', 'المتوسطه', 'المنخفضه'
      ];
      if (candidate.length >= 2 && !forbidden.includes(candidate.toLowerCase()) && !isNonEmp(candidate)) {
        return candidate;
      }
    }

    // 7. General for/about patterns
    const forPattern = rawText.match(/(?:for|about|عن)\s+([a-z\u0600-\u06FF\s]+?)(?:\s+this|\s+in|\?|$)/i);
    if (forPattern && forPattern[1]) {
      const candidate = forPattern[1].trim();
      const nonEmployees = [
        'today', 'yesterday', 'this week', 'this month', 'engineering', 'sales', 'hr',
        'النهارده', 'الشهر ده', 'high', 'medium', 'low', 'high severity', 'all'
      ];
      if (!nonEmployees.includes(candidate.toLowerCase()) && !isNonEmp(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}

module.exports = new AssistantAiProvider();
