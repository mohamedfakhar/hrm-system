import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, HRRoute } from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import AddEmployee from './pages/hr/AddEmployee';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* HR Routes */}
          <Route
            path="/hr/add-employee"
            element={
              <HRRoute>
                <AddEmployee />
              </HRRoute>
            }
          />
          <Route
            path="/hr/dashboard"
            element={
              <HRRoute>
                <div>
                  HR Dashboard
                  <br />
                  <button
                    onClick={() => window.location.href = '/hr/add-employee'}
                    className="text-blue-600 underline"
                  >
                    Add Employee
                  </button>
                </div>
              </HRRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute>
                <div>Employee Dashboard</div>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}