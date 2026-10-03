# Performance Evaluation System — Architecture & Developer Guide

## 1. Overview & Objectives

The Performance Evaluation System enables periodic, multi-factor appraisal of personnel by combining:
1. **Subjective Skills Scoring**: Manager / HR rating across structured competency dimensions (e.g. Communication, Teamwork, Problem Solving, Technical Skills).
2. **Objective Attendance Telemetry**: Live snapshot of working days, present days, late days, late minutes, and unexcused absences.

The system ensures:
- **Server-Side Authoritative Calculations**: Neither grades nor final scores can be forged by the client.
- **Historical Immutability**: Once an evaluation is `finalized`, its scores and attendance metrics are permanently frozen to ensure retroactive attendance modifications cannot distort past evaluation records or compensation audits.
- **Role-Based Access Control**: Employees can view only their own finalized evaluations; drafts remain strictly restricted to HR and Administrators.

---

## 2. Mathematical Formulas (Formula Version 1.0)

### 2.1 Attendance Metrics & Score
$$\text{Attendance Score} = \max\left(0, \min\left(100, 100 - (\text{late\_days} \times 3) - (\text{unexcused\_absences} \times 10) - \frac{\text{total\_late\_minutes}}{30}\right)\right)$$

### 2.2 Skill Score (Weighted Average)
$$\text{Skill Score} = \frac{\sum_{i=1}^{n} (\text{score}_i \times \text{weight}_i)}{\sum_{i=1}^{n} \text{weight}_i}$$

### 2.3 Final Score (70/30 Hybrid Weighting)
$$\text{Final Score} = (\text{Skill Score} \times 0.70) + (\text{Attendance Score} \times 0.30)$$

### 2.4 Grade Mapping
| Final Score Range | Grade | Description |
| :---: | :---: | :--- |
| **90.00 – 100.00** | **A** | Exceptional performance exceeding all benchmarks |
| **80.00 – 89.99** | **B** | Proficient performance consistently meeting requirements |
| **70.00 – 79.99** | **C** | Satisfactory performance with growth opportunities |
| **60.00 – 69.99** | **D** | Needs structured improvement plan |
| **0.00 – 59.99** | **F** | Unsatisfactory |

---

## 3. Data Model Schema (`PerformanceEvaluation`)

```js
{
  employee_id: ObjectId (ref: 'Employee', required: true),
  evaluator_id: ObjectId (ref: 'User', required: true),
  period_type: String (enum: ['monthly', 'quarterly', 'annual'], default: 'quarterly'),
  period_key: String (required: true, e.g. '2026-Q1'),
  start_date: Date (required: true),
  end_date: Date (required: true),
  skills: [{
    name: String (required: true),
    category: String (default: 'Core'),
    score: Number (min: 1, max: 100, required: true),
    weight: Number (min: 0, max: 1, default: 0.25)
  }],
  skill_score: Number (min: 0, max: 100, required: true),
  attendance_metrics: {
    total_working_days: Number (default: 0),
    present_days: Number (default: 0),
    late_days: Number (default: 0),
    total_late_minutes: Number (default: 0),
    unexcused_absences: Number (default: 0)
  },
  attendance_score: Number (min: 0, max: 100, required: true),
  formula_version: String (default: '1.0'),
  final_score: Number (min: 0, max: 100, required: true),
  grade: String (enum: ['A', 'B', 'C', 'D', 'F'], required: true),
  feedback: String,
  recommendation_note: String,
  status: String (enum: ['draft', 'submitted', 'finalized'], default: 'draft'),
  finalized_at: Date (default: null),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
- `{ employee_id: 1, period_key: 1 }` (Unique): Prevents duplicate evaluations for the same employee and period.
- `{ period_key: 1, final_score: -1 }`: Rapid ranking and quartile reporting.
- `{ employee_id: 1, status: 1 }`: Fast employee status retrieval.

---

## 4. API Reference

| Method | Endpoint | Auth / Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/performance` | `hr`, `admin` | List all evaluations with optional `?period=...&status=...&grade=...` filters |
| `GET` | `/api/performance/me` | `employee` | Retrieve employee's own finalized evaluations |
| `GET` | `/api/performance/preview-attendance` | `hr`, `admin` | Live preview of attendance metrics and score for arbitrary date range |
| `GET` | `/api/performance/employee/:employeeId` | `hr`, `admin` | Get all evaluations for a specific employee |
| `GET` | `/api/performance/:id` | Authenticated | Get evaluation details (Employee restricted to own finalized records) |
| `POST` | `/api/performance` | `hr`, `admin` | Create evaluation draft or finalized record |
| `PUT` | `/api/performance/:id` | `hr`, `admin` | Update draft evaluation (Finalized records return 400 Bad Request) |
| `POST` / `PATCH` | `/api/performance/:id/finalize` | `hr`, `admin` | Permanently freeze attendance snapshot, calculate grade, and publish |
| `DELETE` | `/api/performance/:id` | `hr`, `admin` | Delete draft evaluation |

---

## 5. Frontend Pages & Routing

1. **HR Performance Management** (`/hr/performance`):
   - Executive table with search, period filter, status filter, and grade filter.
   - Interactive Create/Edit Modal with live attendance telemetry calculation and formula preview.
   - Comprehensive View Modal with skill ratings and frozen metrics snapshot.
2. **Employee Performance History** (`/employee/performance`):
   - Historical evaluation stream showing final score, grade, evaluated competencies, and manager feedback.
