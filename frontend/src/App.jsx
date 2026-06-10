import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default: redirect to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth pages */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboards  */}
          <Route path="/employee/dashboard" element={<div>Employee Dashboard - Coming Soon</div>} />
          <Route path="/hr/dashboard" element={<div>HR Dashboard - Coming Soon</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}