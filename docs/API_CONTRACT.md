# HRM SYSTEM — COMPLETE API CONTRACT & REFERENCE

This document serves as the single source of truth for Frontend and Backend integration across all system modules.

Base URL: `http://localhost:5000/api` (or environment variable `VITE_API_URL`)

---

## 1. Authentication & Session (`/api/auth`)

### 1.1 Register (Public)
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: None (Public)
- **Allowed Roles**: Anyone (Always creates `employee` role; privilege escalation to `admin` or `hr` is blocked server-side)
- **Request Body**:
  ```json
  {
    "email": "employee@company.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "674efc1...",
      "email": "employee@company.com",
      "role": "employee"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Email/password missing or invalid format
  - `409 Conflict`: User already exists with this email

---

### 1.2 Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "employee@company.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  - Sets `httpOnly` secure cookie: `refreshToken=<token>`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "674efc1...",
      "email": "employee@company.com",
      "role": "employee"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Validation failure
  - `401 Unauthorized`: Invalid credentials or deactivated account

---

### 1.3 Refresh Access Token
- **Method**: `POST`
- **URL**: `/api/auth/refresh`
- **Auth**: Refresh Token via cookie (`refreshToken`) OR request body
- **Request Body** (optional if cookie is present):
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "674efc1...",
      "email": "employee@company.com",
      "role": "employee"
    }
  }
  ```
- **Errors**:
  - `401 Unauthorized`: Missing, expired, revoked, or invalid token

---

### 1.4 Get Authenticated User Profile (`/auth/me`)
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Auth**: Bearer `<accessToken>`
- **Allowed Roles**: Any active user
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "674efc1...",
      "email": "employee@company.com",
      "role": "employee",
      "is_active": true
    }
  }
  ```
- **Errors**:
  - `401 Unauthorized`: Missing or expired access token

---

### 1.5 Logout
- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Auth**: Bearer `<accessToken>` OR refresh cookie / body
- **Request Body** (optional):
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response (200 OK)**:
  - Clears `refreshToken` cookie
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### 1.6 Add HR Manager (Admin Only)
- **Method**: `POST`
- **URL**: `/api/auth/add-hr`
- **Auth**: Bearer `<adminToken>`
- **Allowed Roles**: `admin`
- **Request Body**:
  ```json
  {
    "email": "hr.manager@company.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "HR account created successfully",
    "data": {
      "id": "674efc9...",
      "email": "hr.manager@company.com",
      "role": "hr"
    }
  }
  ```
- **Errors**:
  - `403 Forbidden`: User role is not admin

---

## 2. Employee Management (`/api/employees`)

All routes require `Bearer <accessToken>`.

### 2.1 Get Current Employee Profile
- **Method**: `GET`
- **URL**: `/api/employees/me` (alias: `/api/employees/me/profile`)
- **Allowed Roles**: Any authenticated employee
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "674efc1...",
      "user_id": {
        "_id": "674efc1...",
        "email": "ahmed@company.com"
      },
      "employee_code": "EMP0001",
      "full_name": "Ahmed Hassan",
      "phone": "+201234567890",
      "job_role": "Software Engineer",
      "department": "Engineering",
      "basic_salary": 18000,
      "hire_date": "2024-01-15T00:00:00.000Z",
      "annual_leave_balance": 21,
      "address": "Cairo, Egypt",
      "is_active": true
    }
  }
  ```

---

### 2.2 Get All Employees (HR/Admin)
- **Method**: `GET`
- **URL**: `/api/employees`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 15,
    "data": [
      {
        "_id": "674efc1...",
        "employee_code": "EMP0001",
        "full_name": "Ahmed Hassan",
        "phone": "+201234567890",
        "job_role": "Software Engineer",
        "department": "Engineering",
        "basic_salary": 18000,
        "is_active": true,
        "user_id": {
          "_id": "...",
          "email": "ahmed@company.com"
        }
      }
    ]
  }
  ```

---

### 2.3 Create New Employee (HR/Admin)
- **Method**: `POST`
- **URL**: `/api/employees`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**:
  ```json
  {
    "email": "new.hire@company.com",
    "password": "InitialPassword123!",
    "full_name": "Sara Mohamed",
    "job_role": "Product Designer",
    "department": "Design",
    "basic_salary": 16000,
    "hire_date": "2026-03-01",
    "phone": "+201011223344",
    "address": "Alexandria, Egypt"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Employee created successfully",
    "data": {
      "_id": "674efd9...",
      "employee_code": "EMP0002",
      "full_name": "Sara Mohamed",
      "phone": "+201011223344",
      "job_role": "Product Designer",
      "department": "Design",
      "basic_salary": 16000,
      "annual_leave_balance": 21,
      "is_active": true
    }
  }
  ```

---

### 2.4 Update Employee (HR/Admin)
- **Method**: `PUT`
- **URL**: `/api/employees/:id`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**: Any editable field (`full_name`, `job_role`, `department`, `basic_salary`, `phone`, `address`, `annual_leave_balance`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Employee updated successfully",
    "data": { ... }
  }
  ```

---

### 2.5 Deactivate Employee (HR/Admin)
- **Method**: `DELETE`
- **URL**: `/api/employees/:id`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Employee deactivated successfully"
  }
  ```

---

## 3. Attendance Management (`/api/attendance`)

All routes require `Bearer <accessToken>`.

### 3.1 Check In (Employee)
- **Method**: `POST`
- **URL**: `/api/attendance/checkin` (alias: `/api/attendance/check-in`)
- **Allowed Roles**: `employee`
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Checked in successfully",
    "data": {
      "_id": "674f10a...",
      "employee_id": "674efc1...",
      "date": "2026-10-02T00:00:00.000Z",
      "check_in": "09:05",
      "check_out": null,
      "working_hours": 0,
      "late_minutes": 0,
      "status": "present"
    }
  }
  ```
- **Business Rule**:
  - Work starts at 09:00 with 15 minutes grace period.
  - Check-in before 09:15 -> `status: "present"`, `late_minutes: 0`.
  - Check-in after 09:15 -> `status: "late"`, `late_minutes: total_minutes_after_09:00`.

---

### 3.2 Check Out (Employee)
- **Method**: `POST`
- **URL**: `/api/attendance/checkout` (alias: `/api/attendance/check-out`)
- **Allowed Roles**: `employee`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Checked out successfully",
    "data": {
      "_id": "674f10a...",
      "check_in": "09:05",
      "check_out": "17:10",
      "working_hours": 8.08,
      "status": "present"
    }
  }
  ```

---

### 3.3 Get Today's Status (Employee)
- **Method**: `GET`
- **URL**: `/api/attendance/today`
- **Allowed Roles**: `employee`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "674f10a...",
      "check_in": "09:05",
      "check_out": null,
      "status": "present",
      "late_minutes": 0
    }
  }
  ```
  *(Returns `data: null` if not checked in yet).*

---

### 3.4 Get My Attendance History (Employee)
- **Method**: `GET`
- **URL**: `/api/attendance/me` (alias: `/api/attendance/my-attendance`)
- **Allowed Roles**: `employee`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674f10a...",
        "date": "2026-10-02T00:00:00.000Z",
        "check_in": "09:05",
        "check_out": "17:10",
        "working_hours": 8.08,
        "late_minutes": 0,
        "status": "present"
      }
    ]
  }
  ```

---

### 3.5 Get All Attendance (HR/Admin)
- **Method**: `GET`
- **URL**: `/api/attendance`
- **Allowed Roles**: `hr`, `admin`
- **Query Parameters**:
  - `date`: `YYYY-MM-DD` (optional, filter by specific day)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674f10a...",
        "employee_id": {
          "_id": "674efc1...",
          "full_name": "Ahmed Hassan",
          "employee_code": "EMP0001",
          "department": "Engineering"
        },
        "date": "2026-10-02T00:00:00.000Z",
        "check_in": "09:05",
        "check_out": "17:10",
        "working_hours": 8.08,
        "late_minutes": 0,
        "status": "present"
      }
    ]
  }
  ```

---

## 4. Leave Management (`/api/leaves`)

All routes require `Bearer <accessToken>`.

### 4.1 Request Leave (Employee)
- **Method**: `POST`
- **URL**: `/api/leaves`
- **Allowed Roles**: `employee`
- **Request Body**:
  ```json
  {
    "leave_type": "annual", // "annual" | "sick" | "emergency" | "unpaid"
    "start_date": "2026-11-10",
    "end_date": "2026-11-12",
    "reason": "Family vacation"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Leave request submitted successfully",
    "data": {
      "_id": "674f201...",
      "employee_id": "674efc1...",
      "leave_type": "annual",
      "start_date": "2026-11-10T00:00:00.000Z",
      "end_date": "2026-11-12T00:00:00.000Z",
      "days_count": 3,
      "status": "pending",
      "reason": "Family vacation"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: End date before start date, or requested annual days exceed `annual_leave_balance`.

---

### 4.2 Get My Leaves (Employee)
- **Method**: `GET`
- **URL**: `/api/leaves/me`
- **Allowed Roles**: `employee`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674f201...",
        "leave_type": "annual",
        "start_date": "2026-11-10T00:00:00.000Z",
        "end_date": "2026-11-12T00:00:00.000Z",
        "days_count": 3,
        "status": "approved",
        "reason": "Family vacation",
        "reviewed_at": "2026-10-02T21:40:00.000Z"
      }
    ]
  }
  ```

---

### 4.3 Get All Leaves (HR/Admin)
- **Method**: `GET`
- **URL**: `/api/leaves`
- **Allowed Roles**: `hr`, `admin`
- **Query Parameters**:
  - `status`: `pending` | `approved` | `rejected` (optional)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674f201...",
        "employee_id": {
          "_id": "674efc1...",
          "full_name": "Ahmed Hassan",
          "employee_code": "EMP0001"
        },
        "leave_type": "annual",
        "start_date": "2026-11-10T00:00:00.000Z",
        "end_date": "2026-11-12T00:00:00.000Z",
        "days_count": 3,
        "status": "pending"
      }
    ]
  }
  ```

---

### 4.4 Approve Leave (HR/Admin)
- **Method**: `PUT`
- **URL**: `/api/leaves/:id/approve`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Leave request approved",
    "data": {
      "_id": "674f201...",
      "status": "approved",
      "reviewed_by": "674efc9...",
      "reviewed_at": "2026-10-02T21:40:00.000Z"
    }
  }
  ```
- **Business Rule (Verified)**:
  - If `leave_type === 'annual'`, deducts `days_count` from `annual_leave_balance`.
  - If `leave_type !== 'annual'` (e.g. `sick`, `emergency`), `annual_leave_balance` remains untouched.
  - Automatically sends notification to employee via DB and real-time Socket.io.

---

### 4.5 Reject Leave (HR/Admin)
- **Method**: `PUT`
- **URL**: `/api/leaves/:id/reject`
- **Allowed Roles**: `hr`, `admin`
- **Request Body** (optional):
  ```json
  {
    "rejection_reason": "High project workload during requested dates"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Leave request rejected",
    "data": {
      "_id": "674f201...",
      "status": "rejected",
      "rejection_reason": "High project workload during requested dates"
    }
  }
  ```

---

## 5. Payroll Management (`/api/payroll`)

All routes require `Bearer <accessToken>`.

### 5.1 Generate Monthly Payroll (HR/Admin)
- **Method**: `POST`
- **URL**: `/api/payroll/generate`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**:
  ```json
  {
    "month": 10,
    "year": 2026
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payroll generated successfully for 10/2026",
    "count": 12,
    "data": [
      {
        "_id": "674f301...",
        "employee_id": {
          "_id": "674efc1...",
          "full_name": "Ahmed Hassan",
          "employee_code": "EMP0001",
          "department": "Engineering"
        },
        "month": 10,
        "year": 2026,
        "basic_salary": 18000,
        "working_days": 22,
        "present_days": 20,
        "absent_days": 1,
        "late_hours": 2.5,
        "late_deduction": 255.68,
        "absent_deduction": 818.18,
        "bonuses": 0,
        "total_deductions": 1073.86,
        "net_salary": 16926.14,
        "payment_status": "pending"
      }
    ]
  }
  ```

---

### 5.2 Get All Payrolls (HR/Admin)
- **Method**: `GET`
- **URL**: `/api/payroll`
- **Allowed Roles**: `hr`, `admin`
- **Query Parameters**:
  - `month`: number (1-12, optional)
  - `year`: number (optional)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 12,
    "data": [ ... ]
  }
  ```

---

### 5.3 Get My Personal Payroll History (Employee)
- **Method**: `GET`
- **URL**: `/api/payroll/me`
- **Allowed Roles**: `employee`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674f301...",
        "month": 10,
        "year": 2026,
        "basic_salary": 18000,
        "total_deductions": 1073.86,
        "bonuses": 0,
        "net_salary": 16926.14,
        "payment_status": "paid"
      }
    ]
  }
  ```

---

### 5.4 Mark Payroll as Paid (HR/Admin)
- **Method**: `PATCH` (or `PUT`)
- **URL**: `/api/payroll/:id/pay`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payroll marked as paid successfully",
    "data": {
      "_id": "674f301...",
      "payment_status": "paid"
    }
  }
  ```

---

## 6. Notifications System (`/api/notifications`)

All routes require `Bearer <accessToken>`.

### 6.1 Get My Notifications
- **Method**: `GET`
- **URL**: `/api/notifications`
- **Query Parameters**:
  - `limit`: number (default: 50)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674f401...",
        "user_id": "674efc1...",
        "title": "Leave Approved",
        "message": "Your leave request for 2026-11-10 has been approved.",
        "type": "leave",
        "is_read": false,
        "createdAt": "2026-10-02T21:40:00.000Z"
      }
    ]
  }
  ```

---

### 6.2 Get Unread Notifications Count
- **Method**: `GET`
- **URL**: `/api/notifications/unread-count`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 3,
    "data": {
      "count": 3
    }
  }
  ```

---

### 6.3 Mark Notification as Read
- **Method**: `PUT`
- **URL**: `/api/notifications/:id/read`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "674f401...",
      "is_read": true
    }
  }
  ```

---

### 6.4 Mark All Notifications as Read
- **Method**: `PUT`
- **URL**: `/api/notifications/read-all`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "All notifications marked as read"
  }
  ```

---

### 6.5 Real-Time Socket.io Connection
- **URL**: `http://localhost:5000`
- **Authentication**:
  - Pass JWT token in handshake:
    ```javascript
    const socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
      withCredentials: true
    });
    ```
- **Events**:
  - Server emits: `notification` with payload `{ _id, title, message, type, is_read, createdAt }`.
  - Multi-tab support: Multiple active browser sessions per user are supported via `Set<socketId>`.

---

## 7. Dashboard (`/api/dashboard`)

All routes require `Bearer <accessToken>`.

### 7.1 HR / Admin Dashboard Statistics
- **Method**: `GET`
- **URL**: `/api/dashboard/hr-stats`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalEmployees": 42,
      "presentToday": 36,
      "absentToday": 4,
      "lateToday": 2,
      "pendingLeaves": 5,
      "hrManagersCount": 3
    }
  }
  ```

---

### 7.2 Employee Dashboard Statistics
- **Method**: `GET`
- **URL**: `/api/dashboard/employee-stats`
- **Allowed Roles**: `employee`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "leaveBalance": 18,
      "presentDaysThisMonth": 20,
      "lateDaysThisMonth": 1,
      "pendingLeaveRequests": 0,
      "lastSalary": 16926.14,
      "lastSalaryMonth": "October 2026",
      "lastSalaryStatus": "paid"
    }
  }
  ```

---

## 8. Centralized Error Response Format

All error responses from the backend adhere to the standardized structure:

```json
{
  "success": false,
  "message": "Human readable explanation of the error",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "phone",
      "message": "\"phone\" must be a valid phone number"
    }
  ]
}
```

Standard HTTP status codes:
- `400 Bad Request`: Validation failure or business logic constraint violation
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated user lacks permission for the endpoint
- `404 Not Found`: Resource does not exist
- `409 Conflict`: Unique constraint violation (e.g. duplicate email)
- `429 Too Many Requests`: Rate limiter triggered
- `500 Internal Server Error`: Unhandled server error

---

## 9. Performance Evaluation APIs (`/api/performance`)

### 9.1 List All Evaluations (HR/Admin)
- **Method**: `GET`
- **URL**: `/api/performance`
- **Query Params**: `period`, `status`, `grade`, `department`, `employee_id`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674ef...",
        "employee_id": {
          "_id": "674ee...",
          "full_name": "Alex Morgan",
          "employee_code": "EMP001",
          "department": "Engineering"
        },
        "period_key": "2026-Q1",
        "period_type": "quarterly",
        "skill_score": 90,
        "attendance_score": 95,
        "final_score": 91.5,
        "grade": "A",
        "status": "finalized"
      }
    ]
  }
  ```

### 9.2 Get Employee's Own Finalized Evaluations
- **Method**: `GET`
- **URL**: `/api/performance/me`
- **Allowed Roles**: `employee`
- **Response (200 OK)**: Returns list of finalized evaluations belonging to authenticated employee.

### 9.3 Preview Attendance Telemetry
- **Method**: `GET`
- **URL**: `/api/performance/preview-attendance?employeeId=...&startDate=...&endDate=...`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "metrics": {
        "total_working_days": 65,
        "present_days": 63,
        "late_days": 2,
        "total_late_minutes": 25,
        "unexcused_absences": 0
      },
      "attendanceScore": 93.17
    }
  }
  ```

### 9.4 Create Performance Evaluation (Draft or Finalized)
- **Method**: `POST`
- **URL**: `/api/performance`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**:
  ```json
  {
    "employee_id": "674ee...",
    "period_type": "quarterly",
    "period_key": "2026-Q1",
    "start_date": "2026-01-01",
    "end_date": "2026-03-31",
    "skills": [
      { "name": "Communication", "category": "Core", "score": 90, "weight": 0.25 },
      { "name": "Teamwork", "category": "Core", "score": 90, "weight": 0.25 }
    ],
    "feedback": "Strong quarter",
    "recommendation_note": "Promotion track",
    "status": "draft"
  }
  ```
- **Response (201 Created)**: Returns created evaluation record.

### 9.5 Finalize Evaluation (Freeze Snapshot & Publish)
- **Method**: `POST` or `PATCH`
- **URL**: `/api/performance/:id/finalize`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**: Returns finalized evaluation. Emits real-time notification to employee.

---

## 10. HR Intelligence & Anomaly Detection APIs (`/api/intelligence/anomalies`)

### 10.1 List Detected Anomalies
- **Method**: `GET`
- **URL**: `/api/intelligence/anomalies`
- **Query Params**: `domain` (`attendance|leave|payroll`), `severity` (`high|medium|low`), `status` (`open|reviewed|dismissed`)
- **Allowed Roles**: `hr`, `admin`

### 10.2 Anomaly Summary Statistics
- **Method**: `GET`
- **URL**: `/api/intelligence/anomalies/stats`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalOpen": 5,
      "highOpen": 2,
      "mediumOpen": 2,
      "lowOpen": 1
    }
  }
  ```

### 10.3 Trigger Manual Anomaly Scan
- **Method**: `POST`
- **URL**: `/api/intelligence/anomalies/scan`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Anomaly scan completed successfully",
    "data": {
      "scanned_employees": 18,
      "alerts_created": 3,
      "alerts_updated": 1,
      "scanned_at": "2026-10-03T00:30:00.000Z"
    }
  }
  ```

### 10.4 Review Anomaly
- **Method**: `POST` or `PATCH`
- **URL**: `/api/intelligence/anomalies/:id/review`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**:
  ```json
  {
    "resolution_note": "Discussed with department head. Approved temporary work from home."
  }
  ```

### 10.5 Dismiss Anomaly
- **Method**: `POST` or `PATCH`
- **URL**: `/api/intelligence/anomalies/:id/dismiss`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**:
  ```json
  {
    "resolution_note": "Expected variance due to seasonal shifts."
  }
  ```

---

## 11. Smart Recommendations (`/api/intelligence/recommendations`)

All routes require `Bearer <accessToken>` with `hr` or `admin` role. Employees attempting to access these routes receive `403 Forbidden`.

### 11.1 List Recommendations
- **Method**: `GET`
- **URL**: `/api/intelligence/recommendations`
- **Query Params**:
  - `type`: `bonus_consideration` | `promotion_review` | `recognition` | `support_check_in`
  - `status`: `suggested` | `accepted` | `rejected`
  - `employee_id`: ObjectId string
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "674f401...",
        "employee_id": {
          "_id": "674efc1...",
          "full_name": "Nouran Mansour",
          "employee_code": "EMP0004",
          "department": "Engineering",
          "job_role": "Backend Engineer"
        },
        "type": "bonus_consideration",
        "title": "Bonus Consideration",
        "summary": "Employee meets configured criteria for bonus consideration based on excellent performance, punctuality, and clean anomaly history.",
        "rationale": [
          "Performance grade: A with final score of 95/100",
          "Punctuality rate: 98% across recent attendance records",
          "Tenure: 14 months (minimum 6 months required)",
          "Zero high-severity open operational anomalies"
        ],
        "supporting_data": {
          "tenure_months": 14,
          "performance_score": 95,
          "performance_grade": "A",
          "skill_score": 94,
          "attendance_score": 97,
          "punctuality_rate": 98,
          "late_days": 1,
          "total_late_minutes": 10,
          "unexcused_absences": 0,
          "open_anomalies": 0,
          "high_severity_anomalies": 0,
          "last_evaluation_id": "674f301...",
          "last_evaluation_period": "2026-Q1"
        },
        "rule_code": "PERFORMANCE_BONUS_CANDIDATE",
        "rule_version": "1.0",
        "status": "suggested",
        "reviewed_by": null,
        "reviewed_at": null,
        "review_notes": null,
        "createdAt": "2026-10-03T01:00:00.000Z"
      }
    ]
  }
  ```

### 11.2 Recommendation Summary Statistics
- **Method**: `GET`
- **URL**: `/api/intelligence/recommendations/stats`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalSuggested": 12,
      "totalAccepted": 5,
      "totalRejected": 2,
      "byType": {
        "bonus_consideration": 5,
        "promotion_review": 2,
        "recognition": 3,
        "support_check_in": 2
      }
    }
  }
  ```

### 11.3 Get Single Recommendation Details
- **Method**: `GET`
- **URL**: `/api/intelligence/recommendations/:id`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "674f401...",
      "employee_id": { ... },
      "type": "promotion_review",
      "title": "Promotion Review",
      "rationale": [ ... ],
      "supporting_data": { ... },
      "status": "suggested"
    }
  }
  ```

### 11.4 Trigger Recommendation Scan
- **Method**: `POST`
- **URL**: `/api/intelligence/recommendations/generate`
- **Allowed Roles**: `hr`, `admin`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Employee recommendations generated successfully",
    "data": {
      "scanned_employees": 20,
      "recommendations_created": 4,
      "recommendations_updated": 8,
      "generated_at": "2026-10-03T01:00:00.000Z"
    }
  }
  ```

### 11.5 Accept Recommendation
- **Method**: `POST` or `PATCH`
- **URL**: `/api/intelligence/recommendations/:id/accept`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**:
  ```json
  {
    "review_notes": "Approved for inclusion in upcoming executive review cycle."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Recommendation accepted successfully",
    "data": {
      "_id": "674f401...",
      "status": "accepted",
      "reviewed_by": "674efc1...",
      "reviewed_at": "2026-10-03T01:05:00.000Z",
      "review_notes": "Approved for inclusion in upcoming executive review cycle."
    }
  }
  ```

### 11.6 Reject Recommendation
- **Method**: `POST` or `PATCH`
- **URL**: `/api/intelligence/recommendations/:id/reject`
- **Allowed Roles**: `hr`, `admin`
- **Request Body**:
  ```json
  {
    "review_notes": "Employee recently transitioned into special R&D project with alternative career path."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Recommendation rejected",
    "data": {
      "_id": "674f401...",
      "status": "rejected",
      "reviewed_by": "674efc1...",
      "reviewed_at": "2026-10-03T01:05:00.000Z",
      "review_notes": "Employee recently transitioned into special R&D project with alternative career path."
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: `review_notes` is missing or empty.

---

## 12. HR Smart Assistant (`/api/intelligence/assistant`)

Governed, tool-backed conversational intelligence for HR managers and administrators. Queries operational workforce data (employees, attendance, leaves, payroll, performance, anomalies, recommendations) safely without permitting raw database queries or arbitrary code execution.

### 12.1 Ask Smart Assistant (Chat Query)
- **Method**: `POST`
- **URL**: `/api/intelligence/assistant/chat`
- **Auth**: Bearer Token
- **Allowed Roles**: `hr`, `admin` (Employees return `403 Forbidden`)
- **Request Body**:
  ```json
  {
    "message": "Who was late the most this month?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "answer": "Ahmed Mohamed had the highest number of late attendance records this month, with 7 late days (totaling 185 minutes late).",
      "intent": "getLateEmployees",
      "sources": [
        {
          "type": "attendance",
          "tool": "getLateEmployees"
        }
      ],
      "raw": [
        {
          "employee_id": "674efc1...",
          "employee_name": "Ahmed Mohamed",
          "employee_code": "EMP0001",
          "department": "Engineering",
          "late_days": 7,
          "total_late_minutes": 185
        }
      ]
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Message is empty or missing.
  - `401 Unauthorized`: Missing or invalid authentication token.
  - `403 Forbidden`: Authenticated user is an employee.
  - `500 Internal Server Error`: Unexpected runtime failure (returns safe sanitized message).

---

### 12.2 Get Assistant Audit Logs
- **Method**: `GET`
- **URL**: `/api/intelligence/assistant/logs`
- **Auth**: Bearer Token
- **Allowed Roles**: `hr`, `admin`
- **Query Parameters**:
  - `page` (optional, default: `1`)
  - `limit` (optional, default: `20`, max: `100`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "logs": [
        {
          "_id": "674f510...",
          "user_id": {
            "_id": "674efc1...",
            "email": "hr@hrm.com",
            "role": "hr"
          },
          "question": "Who was late the most this month?",
          "intent": "getLateEmployees",
          "tool_name": "getLateEmployees",
          "tool_arguments": {
            "period": "this_month"
          },
          "success": true,
          "response_summary": "Found 3 employees with late check-ins during this month. Most late: Ahmed (7 days, 185 min late).",
          "execution_time_ms": 15,
          "createdAt": "2026-10-02T22:20:00.000Z"
        }
      ]
    }
  }
  ```
- **Errors**:
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: Authenticated user is not HR or Admin.
