import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Welcome        from './pages/Welcome';
import SignUp         from './pages/SignUp';
import Register       from './pages/Register';
import SignIn         from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail    from './pages/VerifyEmail';
import ResetPassword  from './pages/ResetPassword';

import StudentDashboard    from './pages/student/StudentDashboard';
import StudentSubmissions  from './pages/student/StudentSubmissions';
import StudentReports      from './pages/student/Studentreports';
import StudentAnalytics    from './pages/student/Studentanalytics';
import StudentSubscription from './pages/student/StudentSubscription';
import StudentLeaderboard  from './pages/student/StudentLeaderboard';
import { StudentNotifications, StudentProfile } from './pages/student/Studentextras';

import LecturerDashboard     from './pages/lecturer/Lecturerdashboard';
import LecturerSubmissions   from './pages/lecturer/LecturerSubmissions';
import LecturerRequests      from './pages/lecturer/LecturerRequests';
import LecturerReports       from './pages/lecturer/Lecturerreports';
import LecturerAnalytics     from './pages/lecturer/Lectureranalytics';
import LecturerMarking       from './pages/lecturer/Lecturermarking';
import LecturerNotifications from './pages/lecturer/LecturerNotification';
import { LecturerProfile }   from './pages/lecturer/Lecturerextras';

// ─── Admin imports ────────────────────────────────────────────────────────────
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminLecturers     from './pages/admin/AdminLecturers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminManagement    from './pages/admin/AdminManagement';

// ─── Protected Route (Admin, Student, Lecturer) ──────────────────────────────
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Poppins,sans-serif', color:'#6b7280' }}>
      Loading...
    </div>
  );

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (role && user.role !== role) {
    // Redirect to their own dashboard if they try to access wrong role path
    if (user.role === 'admin')    return <Navigate to="/admin/dashboard"    replace />;
    if (user.role === 'lecturer') return <Navigate to="/lecturer/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                element={<Welcome />} />
      <Route path="/signup"          element={<SignUp />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/signin"          element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email"    element={<VerifyEmail />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Student */}
      <Route path="/student/dashboard"     element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/submissions"   element={<ProtectedRoute role="student"><StudentSubmissions /></ProtectedRoute>} />
      <Route path="/student/reports"       element={<ProtectedRoute role="student"><StudentReports /></ProtectedRoute>} />
      <Route path="/student/analytics"     element={<ProtectedRoute role="student"><StudentAnalytics /></ProtectedRoute>} />
      <Route path="/student/subscription"  element={<ProtectedRoute role="student"><StudentSubscription /></ProtectedRoute>} />
      <Route path="/student/leaderboard"   element={<ProtectedRoute role="student"><StudentLeaderboard /></ProtectedRoute>} />
      <Route path="/student/notifications" element={<ProtectedRoute role="student"><StudentNotifications /></ProtectedRoute>} />
      <Route path="/student/profile"       element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />

      {/* Lecturer */}
      <Route path="/lecturer/dashboard"     element={<ProtectedRoute role="lecturer"><LecturerDashboard /></ProtectedRoute>} />
      <Route path="/lecturer/submissions"   element={<ProtectedRoute role="lecturer"><LecturerSubmissions /></ProtectedRoute>} />
      <Route path="/lecturer/requests"      element={<ProtectedRoute role="lecturer"><LecturerRequests /></ProtectedRoute>} />
      <Route path="/lecturer/reports"       element={<ProtectedRoute role="lecturer"><LecturerReports /></ProtectedRoute>} />
      <Route path="/lecturer/analytics"     element={<ProtectedRoute role="lecturer"><LecturerAnalytics /></ProtectedRoute>} />
      <Route path="/lecturer/marking"       element={<ProtectedRoute role="lecturer"><LecturerMarking /></ProtectedRoute>} />
      <Route path="/lecturer/notifications" element={<ProtectedRoute role="lecturer"><LecturerNotifications /></ProtectedRoute>} />
      <Route path="/lecturer/profile"       element={<ProtectedRoute role="lecturer"><LecturerProfile /></ProtectedRoute>} />

      {/* ─── Admin (Protected) ─── */}
      <Route path="/admin"                  element={<Navigate to="/signin" replace />} />
      <Route path="/admin/dashboard"        element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"            element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/lecturers"        element={<ProtectedRoute role="admin"><AdminLecturers /></ProtectedRoute>} />
      <Route path="/admin/subscriptions"    element={<ProtectedRoute role="admin"><AdminSubscriptions /></ProtectedRoute>} />
      <Route path="/admin/admins"           element={<ProtectedRoute role="admin"><AdminManagement /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}