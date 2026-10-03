# Enterprise Human Resource Management (HRM) Platform

An enterprise-grade, full-stack Human Resource Management and Payroll system equipped with an AI-powered HR Intelligence Suite and an authoritative bilingual (English & Egyptian Arabic) HR Smart Assistant. Built with a Node.js/Express REST backend and a modern React 19/Tailwind CSS frontend, the platform streamlines workforce operations, attendance, leaves, payroll processing, performance management, operational anomaly detection, and actionable employee recommendations.

---

## Key Features

### 1. Core HRM Operations
- **Role-Based Access Control (RBAC):** Strict server-side authorization separating Administrator, HR Manager, and Employee self-service capabilities.
- **Employee Directory:** Lifecycle employee profile management, departmental structuring, salary configurations, and canonical phone tracking.
- **Daily Attendance Tracking:** Daily check-in/check-out workflow with automatic late-minute calculations, working hour metrics, and calendar summaries.
- **Leave Management:** Multi-status leave requests (Annual, Sick, Casual, Unpaid) with an isolated annual leave balance deduction engine and HR approval workflows.
- **Automated Payroll Processing:** Monthly salary calculations with allowances, bonuses, overtime, tax/insurance deductions, net pay generation, and pay stub tracking.
- **Real-Time Notification Engine:** Event-driven Socket.IO architecture for instant alerts on leave approvals, attendance flags, and system announcements.

### 2. HR Intelligence Suite
- **Performance Evaluation System:** Multi-metric performance reviews combining server-calculated attendance scores, configurable skill assessments, automatic grade assignment, and evaluation immutability upon finalization.
- **Operational Anomaly Detection:** Real-time scanning engine detecting operational irregularities including attendance lateness spikes (`ATT_LATENESS_SPIKE`), unusual leave frequency (`LEV_FREQUENCY_SPIKE`), and excessive payroll deductions (`PAY_DEDUCTION_SPIKE`) with HR review/dismiss workflows.
- **Smart Employee Recommendations:** Explainable, rule-driven recommendation engine generating targeted workforce proposals for bonus considerations, promotion reviews, peer recognition, and support check-ins backed by verifiable evidence.

### 3. HR Smart Assistant
- **Bilingual Natural Language Processing:** Native conversational support for English, Standard Arabic, Egyptian Arabic, and mixed-language queries (e.g., *"مين اتأخر أكتر الشهر ده؟"*, *"Showلي Ahmed Mohamed attendance"*).
- **Tool-Governed Architecture:** Utilizes 16 read-only deterministic tools communicating strictly through existing backend service layers. **Zero arbitrary LLM-to-MongoDB queries or raw database executions.**
- **Enterprise Security & Injection Defense:** Automatic refusal of prompt-injection attempts, credential extraction, or unauthorized employee queries with an audit trail logging execution time and data sources.

---

## Architecture

### System Request Flow

```text
React 19 Frontend (Vite)
       │
       ▼
Axios Client (with Automatic JWT Refresh Interceptor)
       │
       ▼
Express 5 REST API Layer
       ├── Helmet HTTP Headers & Rate Limiting
       ├── JWT Authentication Middleware (Access + Refresh Rotation)
       └── Server-Side Authoritative Role Guards (Admin / HR / Employee)
       │
       ▼
Controllers & Business Services
       │
       ▼
Mongoose ODM / MongoDB (Optimized Indexes & Compound Lookups)
```

### HR Smart Assistant Architecture

```text
User Natural Language Input (English / Arabic / Mixed)
                 │
                 ▼
       Intent Classification & Entity Resolution
                 │
                 ▼
       Validated Tool Registry (16 Predefined Read-Only Tools)
                 │
                 ▼
       Authoritative Backend Service Layer
                 │
                 ▼
       MongoDB Aggregation & Structured Extraction
                 │
                 ▼
       Deterministic Response Formatter & Transparency Footnotes
                 │
                 ▼
       Assistant Audit Trail Logging (Latency, User ID, Tool Args)
```

---

## Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 5
- **Database & ODM:** MongoDB with Mongoose
- **Authentication & Security:** JSON Web Tokens (Access + Refresh Token Rotation), bcryptjs, Helmet, Express Rate Limit
- **Data Validation:** Joi schema validation
- **Real-Time Communication:** Socket.IO
- **HTTP Logging:** Morgan

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Routing:** React Router DOM 7
- **Data Visualization:** Recharts
- **Icons & UI:** React Icons, FontAwesome, React Hot Toast
- **HTTP Client:** Axios (configured with token refresh queue interceptor)
- **Real-Time Client:** Socket.IO Client

---

## Project Structure

```text
hrm-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection, environment variables
│   │   ├── controllers/     # Route controllers (Auth, Attendance, Payroll, Intelligence, Assistant)
│   │   ├── middlewares/     # Auth, role authorization, validation, error handler
│   │   ├── models/          # Mongoose schemas & compound indexes
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic, anomaly detection, recommendation workers
│   │   ├── utils/           # Assistant NLP, intent classification, entity resolver, calculations
│   │   └── server.js        # Server entrypoint and Socket.IO initialization
│   ├── seed_demo.js         # Comprehensive demo dataset seeder
│   ├── test_e2e.js          # Full end-to-end integration test suite
│   ├── test_assistant.js    # 58-test bilingual Smart Assistant QA suite
│   ├── test_performance.js  # Performance evaluation test suite
│   ├── test_anomaly.js      # Anomaly detection test suite
│   ├── test_recommendations.js # Smart recommendations test suite
│   └── package.json
│
├── frontend/
│   ├── public/              # Static assets and favicons
│   ├── src/
│   │   ├── api/             # Central Axios client and domain API modules
│   │   ├── assets/          # Application illustrations and UI icons
│   │   ├── components/      # Reusable UI components, tables, modals, charts, layout
│   │   ├── context/         # AuthContext and NotificationContext (Socket.io)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Employee, HR Manager, and Administrator views
│   │   ├── routes/          # Protected and role-guarded route definitions
│   │   ├── App.jsx          # Route configuration
│   │   └── main.jsx         # React application entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── API_CONTRACT.md            # Comprehensive REST API Contract
│   ├── HR_SMART_ASSISTANT.md      # Assistant Architecture & Tool Specification
│   ├── PERFORMANCE_EVALUATION.md  # Performance Review & Scoring Logic
│   ├── ANOMALY_DETECTION.md       # Operational Anomaly Engine Rules
│   └── SMART_RECOMMENDATIONS.md   # Recommendation Rules & Evidence Criteria
│
├── .gitignore
└── README.md
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB instance running locally on `mongodb://localhost:27017` or MongoDB Atlas

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend Configuration
Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hrm_system
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
CLIENT_URL=http://localhost:5173
```

#### Frontend Configuration
Create a `.env` file in the `frontend/` directory based on `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Demo Dataset & Seed Strategy

Populate the database with realistic multi-department employee records, 14-day attendance logs, payroll with tax/deductions, finalized evaluations, open anomalies, and candidate recommendations:

```bash
cd backend
npm run seed
```

### Safe Demo Accounts
> **Notice:** The credentials below are provided strictly for local development and demonstration purposes.

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@hrm.com` | `Password123!` | System administrator, HR management (`/admin/add-hr`) |
| **HR Manager** | `hr@hrm.com` | `Password123!` | Full HR portal, Intelligence, Recommendations, Bilingual Assistant |
| **Employee 1** | `employee@hrm.com` | `Password123!` | Alex Morgan (Engineering Lead, Grade A Performer) |
| **Employee 2** | `ahmed@hrm.com` | `Password123!` | Ahmed Mohamed (Customer Support, Lateness Anomaly, Score < 60) |
| **Employee 3** | `sara@hrm.com` | `Password123!` | Sara Connor (Senior Sales Executive, Bonus Candidate) |

---

## Running the Application

### Start Backend Development Server
```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
```

### Start Frontend Development Client
```bash
cd frontend
npm run dev
# Application running at http://localhost:5173
```

---

## Automated Testing & Quality Gate

The platform includes 5 independent test suites covering 105 automated assertions:

```bash
cd backend

# Run HR Smart Assistant QA Suite (58 tests: English, Arabic, Mixed, Injections)
node test_assistant.js

# Run Full End-to-End Regression Suite (14 tests)
node test_e2e.js

# Run Performance Evaluation Suite (11 tests)
node test_performance.js

# Run Operational Anomaly Detection Suite (8 tests)
node test_anomaly.js

# Run Smart Recommendations Suite (14 tests)
node test_recommendations.js
```

### Frontend Code Quality & Build Verification
```bash
cd frontend

# Run ESLint validation (0 errors)
npm run lint

# Run Vite production bundle build
npm run build
```

### Verified Test Summary

| Test Suite | Assertions | Status |
| :--- | :---: | :---: |
| **HR Smart Assistant QA** | 58 / 58 | **PASS** |
| **Full HRM End-to-End** | 14 / 14 | **PASS** |
| **Performance Evaluation** | 11 / 11 | **PASS** |
| **Anomaly Detection** | 8 / 8 | **PASS** |
| **Smart Recommendations** | 14 / 14 | **PASS** |
| **Total Automated Assertions** | **105 / 105** | **100% PASS** |
| **Frontend Lint** | 0 errors | **PASS** |
| **Production Build** | Exit code 0 | **PASS** |

---

## Security Specifications

- **Token Rotation:** Stateless short-lived JWT access tokens (15m expiry) paired with database-backed refresh tokens stored in `httpOnly` secure cookies.
- **Authoritative Authorization:** Server-side `roleMiddleware` guards endpoints independently of client routing. Employees attempting HR operations receive immediate `403 Forbidden`.
- **Privilege Escalation Protection:** Public registration strictly forces the `employee` role; requests providing `role=admin` or `role=hr` are overridden server-side.
- **Zero Raw Query Execution:** The HR Smart Assistant is architected exclusively around 16 validated tools communicating via existing service layers. Prompt injections and arbitrary queries (e.g., `$where`, password dumps) are automatically rejected.
- **Sensitive Data Filtering:** Password hashes and refresh tokens are excluded from response bodies using Mongoose projections (`-password`). Global error handling sanitizes internal stack traces in production.

---

## Technical Documentation

Detailed architectural and API specifications are available in the [`docs/`](./docs) directory:

- [API Contract Specification](./docs/API_CONTRACT.md)
- [HR Smart Assistant Specification](./docs/HR_SMART_ASSISTANT.md)
- [Performance Evaluation Specification](./docs/PERFORMANCE_EVALUATION.md)
- [Anomaly Detection Specification](./docs/ANOMALY_DETECTION.md)
- [Smart Recommendations Specification](./docs/SMART_RECOMMENDATIONS.md)

---

## Author

**Mohamed Elshahat Ibrahim**  
- GitHub: [@mohamedfakhar](https://github.com/mohamedfakhar)  
- LinkedIn: [Mohamed Fakhr](https://www.linkedin.com/in/mohamed-fakhr)
