import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Public 
import LandingPage from './pages/LandingPage';
import Login  from './pages/auth/Login';

// HR + Admin 
import HRDashboard  from './pages/hr/HRDashboard';
import Employees   from './pages/hr/EmployeeList';
import AttendanceManagement from './pages/hr/AttendanceManagement';
import LeaveApprovals    from './pages/hr/LeaveApprovals';
import PayrollManagement from './pages/hr/PayrollManagement';

//   Admin only 
import AddHR from './pages/admin/AddHR';

//  Employee 
import EmployeeDashboard from './pages/employee/Dashboard';
import MyAttendance from './pages/employee/MyAttendance';
import MyLeaves from './pages/employee/MyLeaves';
import MySalary from './pages/employee/MySalary';
import Profile  from './pages/employee/Profile';

// PROTECTED ROUTE 
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// HR ROUTE — HR + Admin 
function HRRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'employee') return <Navigate to="/employee/dashboard" replace />;
  return children;
}

// ADMIN ROUTE — Admin 

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/hr/dashboard" replace />;
  return children;
}

// EMPLOYEE ROUTE — Employee 
function EmployeeRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'employee') return <Navigate to="/hr/dashboard" replace />;
  return children;
}

// APP ROUTES

function AppRoutes() {
  return (
    <Routes>

      {/*  Public  */}
      <Route path="/"      element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/*  HR + Admin  */}
      <Route path="/hr/dashboard" element={
        <HRRoute>
          <DashboardLayout title="Dashboard">
            <HRDashboard />
          </DashboardLayout>
        </HRRoute>
      }/>

      <Route path="/hr/employees" element={
        <HRRoute>
          <DashboardLayout title="Employee Management">
            <Employees />
          </DashboardLayout>
        </HRRoute>
      }/>

      <Route path="/hr/attendance" element={
        <HRRoute>
          <DashboardLayout title="Attendance Management">
            <AttendanceManagement />
          </DashboardLayout>
        </HRRoute>
      }/>

      <Route path="/hr/leaves" element={
        <HRRoute>
          <DashboardLayout title="Leave Approvals">
            <LeaveApprovals />
          </DashboardLayout>
        </HRRoute>
      }/>

      <Route path="/hr/payroll" element={
        <HRRoute>
          <DashboardLayout title="Payroll Management">
            <PayrollManagement />
          </DashboardLayout>
        </HRRoute>
      }/>

      {/*  Admin only  */}
      <Route path="/admin/add-hr" element={
        <AdminRoute>
          <DashboardLayout title="Add HR Manager">
            <AddHR />
          </DashboardLayout>
        </AdminRoute>
      }/>

      {/*  Employee  */}
      <Route path="/employee/dashboard" element={
        <EmployeeRoute>
          <DashboardLayout title="My Dashboard">
            <EmployeeDashboard />
          </DashboardLayout>
        </EmployeeRoute>
      }/>

      <Route path="/employee/attendance" element={
        <EmployeeRoute>
          <DashboardLayout title="My Attendance">
            <MyAttendance />
          </DashboardLayout>
        </EmployeeRoute>
      }/>

      <Route path="/employee/leaves" element={
        <EmployeeRoute>
          <DashboardLayout title="My Leaves">
            <MyLeaves />
          </DashboardLayout>
        </EmployeeRoute>
      }/>

      <Route path="/employee/salary" element={
        <EmployeeRoute>
          <DashboardLayout title="My Salary">
            <MySalary />
          </DashboardLayout>
        </EmployeeRoute>
      }/>

      <Route path="/employee/profile" element={
        <EmployeeRoute>
          <DashboardLayout title="My Profile">
            <Profile />
          </DashboardLayout>
        </EmployeeRoute>
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}


// MAIN APP
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}