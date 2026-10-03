const { isArabic } = require('../utils/assistant/arabicNormalizer');

/**
 * Assistant Response Service
 * Generates professional, factual, neutral natural-language answers
 * with dual language support:
 * - English responses for English queries
 * - Arabic responses for Arabic / Egyptian queries
 * - Data source attribution
 */

class AssistantResponseService {
  formatResponse(toolName, args, result, originalQuery = '') {
    const isAr = isArabic(originalQuery);

    if (!result) {
      return {
        answer: isAr
          ? "لم أتمكن من العثور على بيانات تطابق هذا الطلب."
          : "I couldn't find any data matching that request.",
        sources: []
      };
    }

    if (result.error) {
      return {
        answer: result.error,
        sources: []
      };
    }

    if (result.ambiguous) {
      const candidatesStr = (result.candidates || [])
        .map((c) => `${c.name} (${c.code})`)
        .join(', ');

      const answer = isAr
        ? `تم العثور على أكثر من موظف يطابق هذا الاسم. يرجى تحديد كود الموظف: ${candidatesStr}`
        : result.message || `I found multiple employees matching this query. Please specify the employee code: ${candidatesStr}`;

      return {
        answer,
        sources: [{ type: isAr ? 'سجل الموظفين' : 'employee', tool: toolName }]
      };
    }

    if (result.notFound) {
      const answer = isAr
        ? `لم يتم العثور على موظف يطابق "${result.query || ''}".`
        : result.message || `No employee found matching "${result.query || ''}".`;

      return {
        answer,
        sources: [{ type: isAr ? 'سجل الموظفين' : 'employee', tool: toolName }]
      };
    }

    switch (toolName) {
      // 1. Employee Count
      case 'getEmployeeCount': {
        const isAll = result.department === 'All Departments';
        const deptStr = isAll ? 'the organization' : `the ${result.department} department`;
        const deptStrAr = isAll ? 'المؤسسة' : `قسم ${result.department}`;

        return {
          answer: isAr
            ? `يوجد حالياً ${result.count} موظف نشط في ${deptStrAr}.`
            : `There are currently ${result.count} active employees in ${deptStr}.`,
          sources: [{ type: isAr ? 'الموظفين (Employee)' : 'employee', tool: toolName }]
        };
      }

      // 2. Employees by Department
      case 'getEmployeesByDepartment': {
        if (result.count === 0) {
          return {
            answer: isAr
              ? `لم يتم العثور على موظفين مسجلين في قسم ${result.department}.`
              : `No employees were found in the ${result.department} department.`,
            sources: [{ type: isAr ? 'الموظفين (Employee)' : 'employee', tool: toolName }]
          };
        }
        const sample = result.employees
          .slice(0, 5)
          .map((e) => `${e.full_name} (${e.job_role})`)
          .join(', ');
        const extra = result.count > 5
          ? (isAr ? ` و ${result.count - 5} موظفين آخرين.` : ` and ${result.count - 5} more.`)
          : '.';

        return {
          answer: isAr
            ? `تم العثور على ${result.count} موظف في قسم ${result.department}: ${sample}${extra}`
            : `Found ${result.count} employees in ${result.department}: ${sample}${extra}`,
          sources: [{ type: isAr ? 'الموظفين (Employee)' : 'employee', tool: toolName }]
        };
      }

      // 3. Attendance Summary
      case 'getAttendanceSummary': {
        const tf = isAr && result.timeframeAr ? result.timeframeAr : result.timeframe;
        return {
          answer: isAr
            ? `ملخص الحضور لـ (${tf}): إجمالي السجلات ${result.totalRecords} (${result.present} حضور، ${result.late} تأخير، ${result.absent} غياب). متوسط ساعات العمل اليومية ${result.averageWorkingHours} ساعة مع إجمالي ${result.totalLateMinutes} دقيقة تأخير.`
            : `For ${result.timeframe}: total attendance records: ${result.totalRecords} (${result.present} present, ${result.late} late, ${result.absent} absent). Average daily working hours were ${result.averageWorkingHours}h with a total of ${result.totalLateMinutes} late minutes.`,
          sources: [{ type: isAr ? 'الحضور والانصراف (Attendance)' : 'attendance', tool: toolName }]
        };
      }

      // 4. Late Employees
      case 'getLateEmployees': {
        const tf = isAr && result.timeframeAr ? result.timeframeAr : result.timeframe;
        if (result.total_late_employees === 0) {
          return {
            answer: isAr
              ? `لا يوجد موظفين متأخرين مسجلين لـ (${tf}).`
              : `No employees had late check-ins recorded for ${result.timeframe}.`,
            sources: [{ type: isAr ? 'الحضور والانصراف (Attendance)' : 'attendance', tool: toolName }]
          };
        }
        const top = result.employees[0];
        const others = result.employees
          .slice(1, 4)
          .map((e) => `${e.employee_name} (${e.late_days}${isAr ? ' يوم' : 'd'})`)
          .join(', ');
        const details = others
          ? (isAr ? ` يليه: ${others}.` : ` Followed by: ${others}.`)
          : '';

        return {
          answer: isAr
            ? `بناءً على سجلات الحضور لـ (${tf})، تم رصد ${result.total_late_employees} موظف متأخر. ${top.employee_name} كان الأكثر تأخيراً بعدد ${top.late_days} أيام تأخير (إجمالي ${top.total_late_minutes} دقيقة تأخير).${details}`
            : `Based on attendance records for ${result.timeframe}, ${result.total_late_employees} employees were late. ${top.employee_name} was late the most with ${top.late_days} late days (${top.total_late_minutes} total late minutes).${details}`,
          sources: [{ type: isAr ? 'الحضور والانصراف (Attendance)' : 'attendance', tool: toolName }]
        };
      }

      // 5. Absent Employees
      case 'getAbsentEmployees': {
        const tf = isAr && result.timeframeAr ? result.timeframeAr : result.timeframe;
        if (result.count === 0) {
          return {
            answer: isAr
              ? `لم يتم تسجيل أي حالات غياب غير مبررة لـ (${tf}).`
              : `No unexcused absences were recorded for ${result.timeframe}.`,
            sources: [{ type: isAr ? 'الحضور والانصراف (Attendance)' : 'attendance', tool: toolName }]
          };
        }
        const sample = result.employees
          .slice(0, 5)
          .map((e) => `${e.employee_name} (${e.absent_days} ${isAr ? 'يوم' : 'day(s)'})`)
          .join(', ');

        return {
          answer: isAr
            ? `تم تسجيل ${result.count} موظف لديهم حالات غياب لـ (${tf}): ${sample}.`
            : `There were ${result.count} employees with absence records for ${result.timeframe}: ${sample}.`,
          sources: [{ type: isAr ? 'الحضور والانصراف (Attendance)' : 'attendance', tool: toolName }]
        };
      }

      // 6. Pending Leaves
      case 'getPendingLeaves': {
        if (result.count === 0) {
          return {
            answer: isAr
              ? 'لا توجد طلبات إجازة معلقة حالياً تتطلب مراجعة الموارد البشرية.'
              : 'There are currently 0 pending leave requests requiring HR review.',
            sources: [{ type: isAr ? 'الإجازات (Leave)' : 'leave', tool: toolName }]
          };
        }
        const sample = result.requests
          .slice(0, 3)
          .map((r) => `${r.employee_name} (${r.leave_type}, ${r.days_count}${isAr ? ' يوم' : 'd'})`)
          .join('; ');

        return {
          answer: isAr
            ? `يوجد حالياً ${result.count} طلب إجازة معلق بانتظار مراجعة الموارد البشرية: ${sample}.`
            : `There are ${result.count} pending leave request(s) awaiting HR review: ${sample}.`,
          sources: [{ type: isAr ? 'الإجازات (Leave)' : 'leave', tool: toolName }]
        };
      }

      // 7. Leave Summary
      case 'getLeaveSummary': {
        const tf = isAr && result.timeframeAr ? result.timeframeAr : result.timeframe;
        return {
          answer: isAr
            ? `إحصائيات الإجازات لـ (${tf}): إجمالي ${result.total} طلب (${result.approved} معتمد، ${result.pending} معلق، ${result.rejected} مرفوض). إجمالي أيام الإجازات المعتمدة: ${result.totalDaysApproved} يوم.`
            : `Leave metrics for ${result.timeframe}: ${result.total} total requests (${result.approved} approved, ${result.pending} pending, ${result.rejected} rejected). Total approved time-off: ${result.totalDaysApproved} days.`,
          sources: [{ type: isAr ? 'الإجازات (Leave)' : 'leave', tool: toolName }]
        };
      }

      // 8. Payroll Summary
      case 'getPayrollSummary': {
        if (result.employeeCount === 0) {
          return {
            answer: isAr
              ? `لم يتم إنشاء أي مسيرات رواتب لشهر ${result.month}/${result.year}.`
              : `No payroll records generated for month ${result.month}/${result.year}.`,
            sources: [{ type: isAr ? 'المرتبات (Payroll)' : 'payroll', tool: toolName }]
          };
        }
        return {
          answer: isAr
            ? `ملخص مسير الرواتب لشهر ${result.month}/${result.year}: تم معالجة رواتب ${result.employeeCount} موظف. إجمالي الراتب الأساسي: $${result.totalBasicSalary.toLocaleString()}، البدلات: $${result.totalAllowances.toLocaleString()}، الخصومات: $${result.totalDeductions.toLocaleString()}، وصافي الصرف: $${result.totalNetSalary.toLocaleString()} (${result.paidCount} مدفوع، ${result.pendingCount} معلق).`
            : `Payroll summary for ${result.month}/${result.year}: ${result.employeeCount} employees processed. Total basic salary: $${result.totalBasicSalary.toLocaleString()}, allowances: $${result.totalAllowances.toLocaleString()}, deductions: $${result.totalDeductions.toLocaleString()}, net disbursement: $${result.totalNetSalary.toLocaleString()} (${result.paidCount} paid, ${result.pendingCount} pending).`,
          sources: [{ type: isAr ? 'المرتبات (Payroll)' : 'payroll', tool: toolName }]
        };
      }

      // 9. Payroll Deductions Spikes
      case 'getPayrollDeductions': {
        if (result.count === 0) {
          return {
            answer: isAr
              ? `لم يتجاوز أي موظف نسبة استقطاعات ${result.thresholdPercent}% من الراتب الأساسي في شهر ${result.month}/${result.year}.`
              : `No employees exceeded the ${result.thresholdPercent}% salary deduction threshold in ${result.month}/${result.year}.`,
            sources: [{ type: isAr ? 'المرتبات (Payroll)' : 'payroll', tool: toolName }]
          };
        }
        const sample = result.employees
          .slice(0, 3)
          .map((e) => `${e.employee_name} (${e.deduction_percentage}% ${isAr ? 'من الراتب' : 'of salary'})`)
          .join(', ');

        return {
          answer: isAr
            ? `تم رصد ${result.count} موظف تجاوزت استقطاعاتهم نسبة ${result.thresholdPercent}% من الراتب الأساسي لشهر ${result.month}/${result.year}: ${sample}.`
            : `Identified ${result.count} employee(s) with deductions exceeding ${result.thresholdPercent}% of basic salary in ${result.month}/${result.year}: ${sample}.`,
          sources: [{ type: isAr ? 'المرتبات (Payroll)' : 'payroll', tool: toolName }]
        };
      }

      // 10. Performance Summary
      case 'getPerformanceSummary': {
        if (result.totalFinalized === 0) {
          return {
            answer: isAr
              ? `لا توجد تقييمات أداء نهائية معتمدة للفترة "${result.periodKey}".`
              : `No finalized performance evaluations found for period "${result.periodKey}".`,
            sources: [{ type: isAr ? 'تقييم الأداء (Performance)' : 'performance', tool: toolName }]
          };
        }
        const dist = result.gradeDistribution;
        return {
          answer: isAr
            ? `ملخص تقييمات الأداء (${result.periodKey}): ${result.totalFinalized} تقييم نهائي معتمد بمتوسط درجات ${result.averageScore}/100. توزيع التقديرات: ${dist.A} ممتاز (A)، ${dist.B} جيد جداً (B)، ${dist.C} جيد (C)، ${dist.D} مقبول (D)، ${dist.F} ضعيف (F).`
            : `Performance review summary (${result.periodKey}): ${result.totalFinalized} finalized evaluations with an average final score of ${result.averageScore}/100. Grade distribution: ${dist.A} A's, ${dist.B} B's, ${dist.C} C's, ${dist.D} D's, ${dist.F} F's.`,
          sources: [{ type: isAr ? 'تقييم الأداء (Performance)' : 'performance', tool: toolName }]
        };
      }

      // 11. Low Performance Employees
      case 'getLowPerformanceEmployees': {
        if (result.count === 0) {
          return {
            answer: isAr
              ? `لا يوجد موظفون حصلوا على تقييم أقل من ${result.thresholdScore}/100 في التقييمات النهائية المعتمدة.`
              : `Zero employees scored below ${result.thresholdScore}/100 in finalized performance evaluations.`,
            sources: [{ type: isAr ? 'تقييم الأداء (Performance)' : 'performance', tool: toolName }]
          };
        }
        const list = result.employees
          .slice(0, 5)
          .map((e) => `${e.employee_name} (${e.score}/100, ${isAr ? 'تقدير' : 'Grade'} ${e.grade})`)
          .join(', ');

        return {
          answer: isAr
            ? `تم العثور على ${result.count} تقييم نهائي معتمد بدرجة أقل من ${result.thresholdScore}/100: ${list}.`
            : `Found ${result.count} finalized evaluation(s) scoring below ${result.thresholdScore}/100: ${list}.`,
          sources: [{ type: isAr ? 'تقييم الأداء (Performance)' : 'performance', tool: toolName }]
        };
      }

      // 12. Open Anomalies
      case 'getOpenAnomalies': {
        if (result.total === 0) {
          return {
            answer: isAr
              ? 'لا توجد تنبيهات تشغيلية مفتوحة حالياً في المنظومة.'
              : 'There are currently 0 open operational anomaly alerts across the workforce.',
            sources: [{ type: isAr ? 'التنبيهات الذكية (Anomaly)' : 'anomaly', tool: toolName }]
          };
        }
        return {
          answer: isAr
            ? `يوجد حالياً ${result.total} تنبيه تشغيلي مفتوح: ${result.high} عالي الخطورة، ${result.medium} متوسط الخطورة، و ${result.low} منخفض الخطورة.`
            : `There are ${result.total} open operational anomaly alert(s): ${result.high} high priority, ${result.medium} medium priority, and ${result.low} low priority.`,
          sources: [{ type: isAr ? 'التنبيهات الذكية (Anomaly)' : 'anomaly', tool: toolName }]
        };
      }

      // 13. Employee Anomalies
      case 'getEmployeeAnomalies': {
        const emp = result.employee;
        if (result.total_alerts === 0) {
          return {
            answer: isAr
              ? `لا توجد أي تنبيهات تشغيلية مسجلة للموظف ${emp.name} (${emp.code}). جميع المؤشرات ضمن النطاق الطبيعي.`
              : `No anomaly alerts have been flagged for ${emp.name} (${emp.code}). All patterns are within normal operational thresholds.`,
            sources: [{ type: isAr ? 'التنبيهات الذكية (Anomaly)' : 'anomaly', tool: toolName }]
          };
        }
        const desc = result.alerts
          .map((a) => `• [${a.severity.toUpperCase()}] ${a.title} (${a.code}): ${a.description}`)
          .join('\n');

        return {
          answer: isAr
            ? `الموظف ${emp.name} (${emp.code}) لديه ${result.total_alerts} تنبيه نمط تشغيلي:\n${desc}`
            : `${emp.name} (${emp.code}) has ${result.total_alerts} anomaly alert(s):\n${desc}`,
          sources: [{ type: isAr ? 'التنبيهات الذكية (Anomaly)' : 'anomaly', tool: toolName }]
        };
      }

      // 14. Recommendations
      case 'getRecommendations': {
        if (result.count === 0) {
          return {
            answer: isAr
              ? 'لا توجد توصيات ذكية مطابقة للشروط المحددة حالياً.'
              : 'No recommendations currently match the specified filters.',
            sources: [{ type: isAr ? 'التوصيات الذكية (Recommendation)' : 'recommendation', tool: toolName }]
          };
        }
        const sample = result.recommendations
          .slice(0, 3)
          .map((r) => `${r.employee_name} - ${r.title} (${r.type})`)
          .join('; ');

        return {
          answer: isAr
            ? `تم العثور على ${result.count} توصية ذكية مقترحة: ${sample}.`
            : `Found ${result.count} active smart recommendation(s): ${sample}.`,
          sources: [{ type: isAr ? 'التوصيات الذكية (Recommendation)' : 'recommendation', tool: toolName }]
        };
      }

      // 15. Employee Recommendations
      case 'getEmployeeRecommendations': {
        const emp = result.employee;
        if (result.count === 0) {
          return {
            answer: isAr
              ? `لا توجد توصيات ذكية معلقة حالياً للموظف ${emp.name} (${emp.code}).`
              : `There are currently no active smart recommendations for ${emp.name} (${emp.code}).`,
            sources: [{ type: isAr ? 'التوصيات الذكية (Recommendation)' : 'recommendation', tool: toolName }]
          };
        }
        const recList = result.recommendations
          .map((r) => `• ${r.title} (${r.status}): ${r.summary}`)
          .join('\n');

        return {
          answer: isAr
            ? `الموظف ${emp.name} (${emp.code}) لديه ${result.count} توصية ذكية:\n${recList}`
            : `${emp.name} (${emp.code}) has ${result.count} smart recommendation(s):\n${recList}`,
          sources: [{ type: isAr ? 'التوصيات الذكية (Recommendation)' : 'recommendation', tool: toolName }]
        };
      }

      // 16. Employee Attendance
      case 'getEmployeeAttendance': {
        const emp = result.employee;
        const tf = isAr && result.timeframeAr ? result.timeframeAr : result.timeframe;

        return {
          answer: isAr
            ? `سجل الحضور لـ ${emp.name} (${tf}): إجمالي ${result.totalDays} يوم مسجل (${result.present} حضور، ${result.late} تأخير مع ${result.lateMinutes} دقيقة تأخير، ${result.absent} غياب غير مبرر).`
            : `Attendance for ${emp.name} (${result.timeframe}): ${result.totalDays} total recorded days (${result.present} present, ${result.late} late with ${result.lateMinutes}m delay, ${result.absent} unexcused absences).`,
          sources: [{ type: isAr ? 'الحضور والانصراف (Attendance)' : 'attendance', tool: toolName }]
        };
      }

      default:
        return {
          answer: JSON.stringify(result),
          sources: []
        };
    }
  }
}

module.exports = new AssistantResponseService();
