# Smart Employee Recommendation System (Phase 3 Architecture)

## 1. Overview & Objective

The **Smart Employee Recommendation System** provides automated, data-driven decision support for HR and executive leadership. It identifies employees who meet objective criteria for:
1. **Bonus Consideration** (`bonus_consideration`)
2. **Promotion Review** (`promotion_review`)
3. **Performance Recognition** (`recognition`)
4. **Support Check-In** (`support_check_in`)

### Core Architectural Principles
- **Decision-Support Only**: The engine generates *suggestions* with factual evidence. It never commits final HR decisions (e.g., modifying salary, promoting an employee, or issuing reprimands).
- **Non-Punitive & Neutral**: No subjective or sensitive labels (e.g., no "burnout", "lazy", "problematic", or "unreliable"). Recommendations are grounded entirely in verifiable database records.
- **Server-Side Authority**: Evidence, punctuality metrics, tenure, and performance grades are calculated server-side from official attendance logs and finalized evaluation documents. Clients cannot forge telemetry.
- **Strict Deduplication & Auditability**: Scans preserve review history; accepted or rejected recommendations are not duplicated, and suggested recommendations have their telemetry refreshed in-place.

---

## 2. Recommendation Data Model (`Recommendation`)

**Collection**: `recommendations`

```javascript
{
  employee_id: ObjectId (ref: 'Employee', required, indexed),
  type: String (enum: ['bonus_consideration', 'promotion_review', 'recognition', 'support_check_in'], required, indexed),
  title: String (required, trim),
  summary: String (required, trim),
  rationale: [String], // Array of objective evidence bullets
  supporting_data: {
    tenure_months: Number,
    performance_score: Number,
    performance_grade: String,
    skill_score: Number,
    attendance_score: Number,
    punctuality_rate: Number,
    late_days: Number,
    total_late_minutes: Number,
    unexcused_absences: Number,
    open_anomalies: Number,
    high_severity_anomalies: Number,
    last_evaluation_id: ObjectId (ref: 'PerformanceEvaluation'),
    last_evaluation_period: String
  },
  rule_code: String (required, trim),
  rule_version: String (default: '1.0'),
  status: String (enum: ['suggested', 'accepted', 'rejected'], default: 'suggested', indexed),
  reviewed_by: ObjectId (ref: 'User', default: null),
  reviewed_at: Date (default: null),
  review_notes: String (default: null, trim),
  createdAt: Date,
  updatedAt: Date
}
```

### Targeted Indexes
- `{ employee_id: 1, rule_code: 1, status: 1 }`: Fast deduplication and employee candidate lookups.
- `{ status: 1, type: 1 }`: High-efficiency filtering for HR dashboard and table views.
- `{ createdAt: -1, status: 1 }`: Chronological sorting of pending suggestions.

---

## 3. Recommendation Rules Engine (Rule Version 1.0)

| Rule Code | Type | Criteria / Thresholds | Rationale Wording |
| :--- | :--- | :--- | :--- |
| `PERFORMANCE_BONUS_CANDIDATE` | `bonus_consideration` | 1. Tenure $\ge 6$ months<br>2. Latest finalized performance grade = `A`<br>3. Punctuality rate $\ge 95\%$<br>4. Zero high-severity open anomalies | "Performance grade: A with final score of {score}/100"<br>"Punctuality rate: {rate}% across recent logs"<br>"Tenure: {months} months (min 6 required)"<br>"Zero high-severity open operational anomalies" |
| `PERFORMANCE_RECOGNITION_CANDIDATE` | `recognition` | 1. Latest finalized performance grade = `A`<br>2. Final score $\ge 90$<br>3. Punctuality rate $\ge 95\%$ | "Performance grade: A with score of {score}/100 (min 90 required)"<br>"Punctuality rate: {rate}% (min 95% required)"<br>"Skill score achieved: {skill}/100" |
| `PROMOTION_REVIEW_CANDIDATE` | `promotion_review` | 1. Tenure $\ge 12$ months<br>2. Latest finalized performance grade = `A`<br>3. Final score $\ge 90$<br>4. Punctuality rate $\ge 95\%$<br>5. Zero high-severity open anomalies | "Company tenure: {months} months (min 12 required)"<br>"Performance grade: A with final score of {score}/100"<br>"Punctuality rate: {rate}%"<br>"Zero high-severity open operational anomalies" |
| `SUPPORT_CHECK_IN` | `support_check_in` | 1. High-severity open anomalies $> 0$<br>**OR**<br>2. Latest finalized evaluation score $< 60$ | "{count} high-priority operational anomaly currently open"<br>"Latest finalized evaluation score is {score}/100 (below 60 threshold)"<br>"Support check-in recommended to explore training assistance or operational alignment" |

---

## 4. Mathematical Telemetry Formulas

### 4.1 Company Tenure
$$\text{Tenure Months} = \max\left(0, \left\lfloor \frac{\text{now} - \text{hire\_date}}{1000 \times 60 \times 60 \times 24 \times 30.4375} \right\rfloor\right)$$

### 4.2 Punctuality Rate
Evaluated across recent attendance records (up to 90 days):
$$\text{Punctuality Rate} = \max\left(0, \min\left(100, 100 - \left(\frac{\text{late\_days}}{\text{eligible\_working\_days}} \times 100\right)\right)\right)$$
- If $\text{eligible\_working\_days} == 0$, $\text{punctuality\_rate} = \text{null}$, which safely fails rules requiring punctuality.

---

## 5. Deduplication & Review Life Cycle

1. **Suggested State**:
   - If an automated or manual scan detects an employee qualifying for an open recommendation, the system queries for `{ employee_id, rule_code, status: 'suggested' }`.
   - If found, it updates the supporting telemetry snapshot and rationale in-place without generating a duplicate.
2. **Accepted State**:
   - HR clicks **Accept Recommendation** with optional review notes.
   - Updates status to `accepted`, stamps `reviewed_by = req.user.id` and `reviewed_at = new Date()`.
   - Subsequent scans will **not** re-suggest or overwrite accepted recommendations.
3. **Rejected State**:
   - HR clicks **Reject Recommendation**.
   - Requires a non-empty `review_notes` string explaining the rejection context.
   - Updates status to `rejected`, stamps `reviewed_by` and `reviewed_at`.
   - Subsequent scans respect HR's decision and will **not** immediately re-suggest the same rule candidate.

---

## 6. Security & Permission Matrix

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/intelligence/recommendations` | `GET` | `hr`, `admin` | List recommendations with filters (`type`, `status`, `employee_id`) |
| `/api/intelligence/recommendations/stats` | `GET` | `hr`, `admin` | Retrieve KPI counts by status and suggestion type |
| `/api/intelligence/recommendations/:id` | `GET` | `hr`, `admin` | View full telemetry evidence for a specific recommendation |
| `/api/intelligence/recommendations/generate` | `POST` | `hr`, `admin` | Trigger workforce telemetry scan and candidate generation |
| `/api/intelligence/recommendations/:id/accept` | `POST`, `PATCH` | `hr`, `admin` | Accept recommendation for executive review |
| `/api/intelligence/recommendations/:id/reject` | `POST`, `PATCH` | `hr`, `admin` | Reject recommendation (requires `review_notes`) |

*Employees receive `403 Forbidden` if attempting to call any recommendation endpoint. Recommendation evidence and rationale are confidential to HR and Admin users.*
