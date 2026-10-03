import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import DashboardLayout from "./components/layout/DashboardLayout";

// Public
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";

// HR + Admin
import HRDashboard from "./pages/hr/HRDashboard/HRDashboard";
import Employees from "./pages/hr/EmployeeList";
import AddEmployee from "./pages/hr/AddEmployee";
import AttendanceManagement from "./pages/hr/AttendanceManagement";
import LeaveApprovals from "./pages/hr/LeaveApprovals";
import PayrollManagement from "./pages/hr/PayrollManagement";
import PerformanceManagement from "./pages/hr/PerformanceManagement";
import HRIntelligence from "./pages/hr/HRIntelligence";
import Recommendations from "./pages/hr/Recommendations";
import HRAssistant from "./pages/hr/HRAssistant";

// Admin only
import AddHR from "./pages/admin/AddHR";

// Employee
import EmployeeDashboard from "./pages/employee/Dashboard/Dashboard";
import MyAttendance from "./pages/employee/Dashboard/MyAttendance/MyAttendance";
import MyLeaves from "./pages/employee/MyLeaves";
import MySalary from "./pages/employee/MySalary";
import MyPerformance from "./pages/employee/MyPerformance";
import Profile from "./pages/employee/Profile";

// Notifications
import Notifications from "./pages/Notifications";

// Loading fallback for route guards
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

// GENERAL PROTECTED ROUTE — Any authenticated role
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// HR ROUTE — HR + Admin
function HRRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "employee")
    return <Navigate to="/employee/dashboard" replace />;
  return children;
}

// ADMIN ROUTE — Admin
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/hr/dashboard" replace />;
  return children;
}

// EMPLOYEE ROUTE — Employee
function EmployeeRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "employee") return <Navigate to="/hr/dashboard" replace />;
  return children;
}

// APP ROUTES
export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* HR + Admin */}
      <Route
        path="/hr/dashboard"
        element={
          <HRRoute>
            <DashboardLayout title="Dashboard">
              <HRDashboard />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/employees"
        element={
          <HRRoute>
            <DashboardLayout title="Employee Management">
              <Employees />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/employees/add"
        element={
          <HRRoute>
            <DashboardLayout title="Add Employee">
              <AddEmployee />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/attendance"
        element={
          <HRRoute>
            <DashboardLayout title="Attendance Management">
              <AttendanceManagement />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/leaves"
        element={
          <HRRoute>
            <DashboardLayout title="Leave Approvals">
              <LeaveApprovals />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/payroll"
        element={
          <HRRoute>
            <DashboardLayout title="Payroll Management">
              <PayrollManagement />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/performance"
        element={
          <HRRoute>
            <DashboardLayout title="Performance Evaluations">
              <PerformanceManagement />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/intelligence"
        element={
          <HRRoute>
            <DashboardLayout title="HR Intelligence">
              <HRIntelligence />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/recommendations"
        element={
          <HRRoute>
            <DashboardLayout title="Smart Recommendations">
              <Recommendations />
            </DashboardLayout>
          </HRRoute>
        }
      />

      <Route
        path="/hr/assistant"
        element={
          <HRRoute>
            <DashboardLayout title="HR Smart Assistant">
              <HRAssistant />
            </DashboardLayout>
          </HRRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/admin/add-hr"
        element={
          <AdminRoute>
            <DashboardLayout title="Add HR Manager">
              <AddHR />
            </DashboardLayout>
          </AdminRoute>
        }
      />

      {/* Employee */}
      <Route
        path="/employee/dashboard"
        element={
          <EmployeeRoute>
            <DashboardLayout title="My Dashboard">
              <EmployeeDashboard />
            </DashboardLayout>
          </EmployeeRoute>
        }
      />

      <Route
        path="/employee/attendance"
        element={
          <EmployeeRoute>
            <DashboardLayout title="My Attendance">
              <MyAttendance />
            </DashboardLayout>
          </EmployeeRoute>
        }
      />

      <Route
        path="/employee/leaves"
        element={
          <EmployeeRoute>
            <DashboardLayout title="My Leaves">
              <MyLeaves />
            </DashboardLayout>
          </EmployeeRoute>
        }
      />

      <Route
        path="/employee/salary"
        element={
          <EmployeeRoute>
            <DashboardLayout title="My Salary">
              <MySalary />
            </DashboardLayout>
          </EmployeeRoute>
        }
      />

      <Route
        path="/employee/performance"
        element={
          <EmployeeRoute>
            <DashboardLayout title="My Performance">
              <MyPerformance />
            </DashboardLayout>
          </EmployeeRoute>
        }
      />

      <Route
        path="/employee/profile"
        element={
          <EmployeeRoute>
            <DashboardLayout title="My Profile">
              <Profile />
            </DashboardLayout>
          </EmployeeRoute>
        }
      />

      {/* Notifications — All Authenticated Users */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <DashboardLayout title="Notifications">
              <Notifications />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// MAIN APP
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
