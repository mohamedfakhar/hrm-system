# HR Intelligence & Anomaly Detection — Architecture & Developer Guide

## 1. Overview & Non-Punitive Philosophy

The HR Intelligence layer continuously analyzes system operational telemetry across **Attendance**, **Leave Requests**, and **Payroll** to identify statistical anomalies and irregular patterns.

### Core Ethical Guidelines:
- **No Speculative Conclusions**: The system never generates psychological or disciplinary assertions (e.g. *no "burnout"*, *no "leave abuser"*, *no "bad employee"* labels).
- **Factual & Objective Framing**: Telemetry outputs strictly state measurable deviations:
  - *Example*: *"Employee had 5 late check-ins in the last 14 days compared to a baseline average of 1.2 per two-week window."*
- **Decision-Support Only**: The system flags patterns for human HR review. No automated disciplinary or employment actions occur without HR investigation.

---

## 2. Deterministic Anomaly Rule Matrix

| Anomaly Code | Domain | Rule / Trigger Condition | Severity | Notification Policy |
| :--- | :--- | :--- | :---: | :--- |
| `ATT_LATENESS_SPIKE` | Attendance | $\ge 4$ late arrivals in last 14 days **AND** recent lateness $> 3\times$ employee's 90-day baseline average. (Tenure $\ge 14$ days required). | `medium` | Dashboard alert + list |
| `ATT_CONSECUTIVE_ABSENT` | Attendance | $\ge 2$ consecutive business-day absences with **NO** corresponding approved leave request. | `high` | Real-time Socket.io dispatch to all HR managers |
| `LEV_FREQUENCY_SPIKE` | Leave | $\ge 3$ leave requests submitted within a 14-day window. | `low` | Dashboard operational review list |
| `PAY_DEDUCTION_SPIKE` | Payroll | Monthly `total_deductions` exceeds 25% of `basic_salary`. | `high` | Real-time Socket.io dispatch to HR managers |

---

## 3. Deduplication Architecture

To avoid generating redundant alert records every time a scan executes:
1. Before persisting an alert, the engine queries:
   ```js
   await AnomalyAlert.findOne({ employee_id, anomaly_code, status: 'open' });
   ```
2. If an open alert already exists for this pattern and employee:
   - The engine **updates** the `metrics_snapshot` and `description` to reflect current telemetry.
   - It **does not** create a duplicate record or trigger duplicate notification spam.
3. Once an HR manager reviews or dismisses an alert (`status = 'reviewed'` or `'dismissed'`), any subsequent recurrence in future evaluation windows can trigger a new alert.

---

## 4. Data Model Schema (`AnomalyAlert`)

```js
{
  employee_id: ObjectId (ref: 'Employee', required: true),
  domain: String (enum: ['attendance', 'leave', 'payroll'], required: true),
  anomaly_code: String (required: true),
  title: String (required: true),
  description: String (required: true),
  severity: String (enum: ['low', 'medium', 'high'], default: 'medium'),
  metrics_snapshot: {
    baseline: Mixed,
    observed: Mixed,
    deviation: Mixed,
    timeframe: String
  },
  status: String (enum: ['open', 'reviewed', 'dismissed'], default: 'open'),
  reviewed_by: ObjectId (ref: 'User', default: null),
  reviewed_at: Date (default: null),
  resolution_note: String (default: null),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes:
- `{ employee_id: 1, anomaly_code: 1, status: 1 }`: Guarantees fast deduplication lookup.
- `{ status: 1, severity: 1 }`: High-speed KPI counts and filtering.
- `{ createdAt: -1, severity: 1 }`: Time-series sorting.

---

## 5. API Reference

| Method | Endpoint | Auth / Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/intelligence/anomalies` | `hr`, `admin` | List all anomalies with `?domain=...&severity=...&status=...` filters |
| `GET` | `/api/intelligence/anomalies/stats` | `hr`, `admin` | Summary count of total open, high, medium, and low severity alerts |
| `GET` | `/api/intelligence/anomalies/:id` | `hr`, `admin` | Get anomaly details and metrics snapshot |
| `POST` | `/api/intelligence/anomalies/scan` | `hr`, `admin` | Execute manual scan across all active employees |
| `POST` / `PATCH` | `/api/intelligence/anomalies/:id/review` | `hr`, `admin` | Mark anomaly as reviewed (Requires `{ resolution_note }`) |
| `POST` / `PATCH` | `/api/intelligence/anomalies/:id/dismiss` | `hr`, `admin` | Dismiss anomaly (Requires `{ resolution_note }`) |

---

## 6. Frontend UI Components

1. **HR Intelligence Dashboard** (`/hr/intelligence`):
   - 4 KPI summary cards (Total Open, High, Medium, Low severity).
   - "Run Anomaly Scan" action button.
   - Filter bar and responsive data table with severity chips.
   - Review/Dismiss Modal with mandatory resolution note input.
2. **HR Dashboard Widget**:
   - Integrated telemetry banner on `/hr/dashboard` highlighting active anomaly counts and direct link.
