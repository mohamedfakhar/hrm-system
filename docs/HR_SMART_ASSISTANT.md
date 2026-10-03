# HR Smart Assistant — Architecture, Multilingual Engine & Technical Reference (Phase 4)

## 1. System Architecture Overview

The HR Smart Assistant is a secure, tool-governed conversational AI feature engineered for HR Managers and System Administrators. It enables natural language queries against operational HR workforce data while enforcing strict zero-trust boundaries: **the AI is never permitted to execute raw database queries or execute arbitrary code**.

```text
User Question (English / Arabic / Mixed)
        │
        ▼
   POST /api/intelligence/assistant/chat
        │
        ▼
   Authentication (`authenticate`) & Role Guard (`isHR`)
   (Employees blocked with 403 Forbidden, Unauthenticated blocked with 401)
        │
        ▼
   Assistant Service Orchestrator (`assistantService.js`)
        │
        ▼
   Prompt Injection & Security Threat Detection
   (Attacks safely refused without execution)
        │
        ▼
   Arabic Normalization & Dialect Mapping (`arabicNormalizer.js`)
   (Alef/Yaa normalization, Egyptian phrases, transliteration)
        │
        ▼
   Intent Detection & Argument Parsing (`assistantAiProvider.js`)
   (English, Arabic, and Mixed intent patterns)
        │
        ▼
   Tool Registry Dispatch (`assistantToolRegistry.js`)
   (Strict argument validation, bilingual date parsing, cross-lingual entity resolution)
        │
        ▼
   Existing Business Models / Service Layer
   (Attendance, Leaves, Payroll, Performance, Anomaly, Recommendation Models)
        │
        ▼
   Structured Data Extraction (Safe projections, strict limit caps)
        │
        ▼
   Bilingual Response Formatter (`assistantResponseService.js`)
   (Language-aware: English answers for English queries, Arabic for Arabic, with transparent source attribution)
        │
        ▼
   Assistant Audit Logging (`AssistantAuditLog.js`)
        │
        ▼
   Structured JSON Response to User
```

---

## 2. Security Invariants & Attack Hardening

1. **No Raw Queries**:
   - The LLM and intent parser never execute raw MongoDB queries, string concatenations, or arbitrary filters.
   - All data fetching is executed through strictly typed, predefined deterministic tools.

2. **Server-Side Authorization**:
   - Every request is guarded by `authenticate` and `isHR` (`req.user.role === 'hr' || req.user.role === 'admin'`).
   - Requests from `employee` tokens receive `403 Forbidden`. Unauthenticated requests receive `401 Unauthorized`.

3. **Prompt Injection & Attack Refusal**:
   - Malicious queries attempting to override system behavior ("ignore previous instructions", "give me the mongodb query", injection payloads like `{"$where": "..."}`, "show refresh tokens", "ignore authorization") are intercepted and refused safely.
   - Safe refusal messages:
     - English: *"I am an HR Assistant strictly restricted to authorized HR analytics..."*
     - Arabic: *"أنا مساعد موارد بشرية مخصص فقط للاستعلامات المعتمدة..."*

4. **Data Sanitization & Privacy Projections**:
   - Sensitive credentials (`password`, `passwordHash`, `refreshToken`, `accessToken`, `jwtSecret`) are completely excluded from all tool projections and audit logs.
   - Salary figures are aggregate-only (`getPayrollSummary`) or threshold-flagged (`getPayrollDeductions`) — never exposed arbitrarily.

5. **Result Capping**:
   - All collection queries enforce a maximum record cap of 50 items to prevent Denial of Service or large memory leaks.

6. **Entity Ambiguity Protection**:
   - When a user queries for an employee by name (e.g., "Ahmed") and multiple matching records exist in the database, the assistant refuses to guess and explicitly instructs the user:
     `"I found multiple employees matching \"Ahmed\" (EMP0001: Ahmed Mohamed, EMP0002: Ahmed Ali). Please specify their unique employee code."`

7. **Non-Punitive, Factual Tone**:
   - The assistant never speculates on employee intentions or character (e.g., "lazy" or "burned out"). It strictly reports statistical facts and rule triggers (e.g., `"The system generated ATT_LATENESS_SPIKE because the configured threshold of late check-ins was exceeded in the evaluated period."`).

---

## 3. Multilingual Engine (English, Arabic, Mixed)

### 3.1 Arabic Normalization Pipeline (`arabicNormalizer.js`)
- **Character Normalization**:
  - Alef variations (`أ`, `إ`, `آ` → `ا`)
  - Teh Marbuta (`ة` → `ه`)
  - Alef Maqsura (`ى` → `ي`)
  - Tashkeel / diacritics stripped (`ً`, `ٌ`, `ٍ`, `َ`, `ُ`, `ِ`, `ّ`, `ْ`)
  - Hindi-Arabic digits mapped to Western Arabic (`١٢٣` → `123`)
  - Punctuation stripped (`؟`, `!`, `،`, `...`)
- **Egyptian & Colloquial Phrasing**:
  - `النهارده` → `today`
  - `امبارح` → `yesterday`
  - `الشهر ده` / `الشهردة` → `this month`
  - `الاسبوع ده` → `this week`
  - `كام` / `قد ايه` → `how many` / count intent
  - `مين` / `ايه` → `who` / `what`
  - `وريني` / `اعرضلي` / `هاتلي` → `show me`
- **Department Name Mapping**:
  - `الهندسة` / `التطوير` → `Engineering`
  - `المبيعات` → `Sales`
  - `الموارد البشرية` / `شؤون الموظفين` → `HR`
  - `التسويق` → `Marketing`
  - `المالية` / `الحسابات` → `Finance`
  - `خدمة العملاء` → `Support`

### 3.2 Cross-Lingual Entity Resolution (`entityResolver.js`)
Arabic names queried in the assistant are transliterated and matched against stored employee profiles:
- Compound names supported: `"أحمد محمد"` → `"Ahmed Mohamed"`
- Popular Arabic names: `محمد` → `Mohamed`, `علي` → `Ali`, `محمود` → `Mahmoud`, `حسن` → `Hassan`, `سارة` → `Sara`, `فاطمة` → `Fatma`, etc.

### 3.3 Language-Aware Response Generation (`assistantResponseService.js`)
- Queries in Arabic receive fluent, professional Arabic responses with localized terminology.
- Queries in English receive clear English summaries.
- Mixed queries (e.g., `"Showلي Ahmed Mohamed attendance"`, `"مين was late the most this month?"`) resolve intent and provide coherent answers with transparent source attribution chips.

---

## 4. Tool Registry Reference

All tools reside in [`assistantToolRegistry.js`](file:///c:/Users/Mohamed%20Fakhar/Desktop/hrm-system/backend/src/services/assistantToolRegistry.js) and accept typed, validated inputs:

| Tool Name | Input Arguments | Description | Source Domain |
| :--- | :--- | :--- | :--- |
| `getEmployeeCount` | `{ department }` | Total active employee headcount, optionally filtered by department. | Employee |
| `getEmployeesByDepartment` | `{ department, limit }` | List of employees in a department (safe fields only). | Employee |
| `getAttendanceSummary` | `{ period, startDate, endDate, department }` | Aggregate attendance metrics (present, late, absent, avg hours). | Attendance |
| `getLateEmployees` | `{ period, startDate, endDate, department, limit }` | Top employees with late check-ins and total late minutes. | Attendance |
| `getAbsentEmployees` | `{ period, startDate, endDate, department, limit }` | Employees with absent records in the period. | Attendance |
| `getPendingLeaves` | `{ limit }` | Pending leave requests awaiting HR approval. | Leave |
| `getLeaveSummary` | `{ period, status, type, limit }` | Breakdown of leave requests by type and approval status. | Leave |
| `getPayrollSummary` | `{ month, year }` | Headcount, total basic, total net, deductions, and bonuses. | Payroll |
| `getPayrollDeductions` | `{ thresholdPercent, month, year, limit }` | Employees whose payroll deductions exceed configured threshold (default 25%). | Payroll |
| `getPerformanceSummary` | `{ period }` | Average score, grade distribution, and lowest performer. | Performance |
| `getLowPerformanceEmployees`| `{ thresholdScore, period, limit }` | Finalized evaluations below score threshold (default 60). | Performance |
| `getOpenAnomalies` | `{ severity, domain, limit }` | Counts and list of unresolved workforce anomalies. | Intelligence |
| `getEmployeeAnomalies` | `{ employeeId, name, employeeCode }` | Open & active anomaly alerts for a specific employee with rule evidence. | Intelligence |
| `getRecommendations` | `{ type, limit }` | Data-backed candidate recommendations (promotion, bonus, support). | Recommendations |
| `getEmployeeRecommendations`| `{ employeeId, name, employeeCode }` | Pending candidate recommendations for a specific employee. | Recommendations |
| `getEmployeeAttendance` | `{ employeeId, name, employeeCode, period }` | Attendance profile and metrics for an individual employee. | Attendance |

---

## 5. Date Understanding & Normalization

The date parser utility ([`dateParser.js`](file:///c:/Users/Mohamed%20Fakhar/Desktop/hrm-system/backend/src/utils/assistant/dateParser.js)) translates common phrases into UTC start and end bounds:

- `today` / `النهارده` / `اليوم`: Start of today (00:00:00.000) to End of today (23:59:59.999).
- `yesterday` / `امبارح` / `امس`: Start of yesterday to End of yesterday.
- `this week` / `الاسبوع ده` / `هذا الاسبوع`: Monday 00:00:00 to Sunday 23:59:59.
- `last week` / `الاسبوع اللي فات` / `الاسبوع الماضي`: Previous Monday 00:00:00 to previous Sunday 23:59:59.
- `this month` / `الشهر ده` / `هذا الشهر`: 1st day of current month to last day of current month.
- `last month` / `الشهر اللي فات` / `الشهر الماضي`: 1st day of prior month to last day of prior month.
- `this quarter` / `الربع ده` / `الربع الحالي`: Current 3-month calendar quarter range.
- `this year` / `السنة دي` / `هذا العام`: Jan 1st to Dec 31st of current year.

---

## 6. AI Provider Abstraction

Configured in [`assistantAiProvider.js`](file:///c:/Users/Mohamed%20Fakhar/Desktop/hrm-system/backend/src/services/assistantAiProvider.js):

- **Deterministic Fallback Engine**: If no external API key is provided, the assistant uses a comprehensive, rule-based natural language intent parser covering English, Modern Standard Arabic, and Egyptian dialect. Every query executes deterministically with zero third-party latency, cost, or downtime.
- **External LLM Integration**: Pluggable AI providers supported via environment variables:
  ```env
  AI_PROVIDER=openai # or 'anthropic' / 'gemini'
  AI_MODEL=gpt-4o-mini
  AI_API_KEY=your_key_here
  ```

---

## 7. Audit Logging (`AssistantAuditLog`)

Every question evaluated by the assistant generates an immutable audit record in MongoDB ([`AssistantAuditLog.js`](file:///c:/Users/Mohamed%20Fakhar/Desktop/hrm-system/backend/src/models/AssistantAuditLog.js)):

```json
{
  "_id": "674d89a...",
  "user_id": "674d88e...",
  "question": "مين أكتر موظفين اتأخروا الشهر ده؟",
  "intent": "getLateEmployees",
  "tool_name": "getLateEmployees",
  "tool_arguments": { "period": "this_month" },
  "success": true,
  "response_summary": "تم العثور على 1 موظفين لديهم تسجيلات تأخير خلال الشهر ده...",
  "execution_time_ms": 12,
  "createdAt": "2026-10-03T15:29:45.000Z"
}
```

Audit logs are inspectable via `GET /api/intelligence/assistant/logs` or directly in the UI via the "Audit Log" inspector modal.

---

## 8. API Reference

### 8.1 English Chat Query
`POST /api/intelligence/assistant/chat`

**Headers**:
- `Authorization: Bearer <HR_OR_ADMIN_JWT>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "message": "Who was late the most this month?"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "answer": "Ahmed Mohamed had the highest number of late attendance records this month, with 1 late day (totaling 389 minutes late).",
    "intent": "getLateEmployees",
    "sources": [
      {
        "type": "attendance",
        "tool": "getLateEmployees"
      }
    ],
    "structuredData": {
      "count": 1,
      "period": "this month",
      "employees": [
        {
          "name": "Ahmed Mohamed",
          "employee_code": "EMP0001",
          "late_days": 1,
          "total_late_minutes": 389
        }
      ]
    }
  }
}
```

### 8.2 Arabic Chat Query
`POST /api/intelligence/assistant/chat`

**Request Body**:
```json
{
  "message": "مين أكتر موظفين اتأخروا الشهر ده؟"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "answer": "تم العثور على 1 موظف لديه تسجيلات تأخير خلال الشهر ده. أكثر الموظفين تأخيراً: Ahmed Mohamed (1 يوم، إجمالي 389 دقيقة تأخير).",
    "intent": "getLateEmployees",
    "sources": [
      {
        "type": "attendance",
        "tool": "getLateEmployees"
      }
    ],
    "structuredData": {
      "count": 1,
      "period": "الشهر ده",
      "employees": [
        {
          "name": "Ahmed Mohamed",
          "employee_code": "EMP0001",
          "late_days": 1,
          "total_late_minutes": 389
        }
      ]
    }
  }
}
```

---

## 9. Frontend Interface (`/hr/assistant`)

Implemented in [`HRAssistant.jsx`](file:///c:/Users/Mohamed%20Fakhar/Desktop/hrm-system/frontend/src/pages/hr/HRAssistant.jsx):
- **Stitch Design System**: Styled using surface tokens, primary accent cards, rounded borders, and Material Symbols.
- **RTL-Safe Display**: Chat messages and input bar use `dir="auto"` to automatically render Arabic right-to-left and English left-to-right cleanly.
- **Bilingual Quick Actions**: Prompt pills in English and Arabic for instant 1-click insights.
- **Structured Metric Cards**: Interactive counter grids and breakdown cards for attendance, anomalies, payroll, and recommendation results.
- **Data Source Chips**: Discloses underlying backend service and tool responsible for the generated answer.
- **Audit Log Inspector**: Built-in modal for HR/Admin to inspect recent system queries and execution benchmarks.
