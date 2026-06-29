import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    <p className="text-slate-400 text-sm">Loading…</p>
  </div>
);

// Public Pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Student / Leader Pages
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const BrowseHackathons = lazy(() => import('./pages/BrowseHackathons'));
const TeamSearch = lazy(() => import('./pages/TeamSearch'));
const MyTeam = lazy(() => import('./pages/MyTeam'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Submissions = lazy(() => import('./pages/Submissions'));

// Judge Pages
const JudgeDashboard = lazy(() => import('./pages/JudgeDashboard'));

// Manager Pages
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminApprovals = lazy(() => import('./pages/AdminApprovals'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminHackathons = lazy(() => import('./pages/AdminHackathons'));

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public Routes ── */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Student & Leader Routes ── */}
            <Route element={<ProtectedRoute allowedRoles={['Student', 'Leader']} />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/hackathons" element={<BrowseHackathons />} />
              <Route path="/team-search" element={<TeamSearch />} />
              <Route path="/my-team" element={<MyTeam />} />
              <Route path="/my-submission" element={<Submissions />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* ── Judge Routes ── */}
            <Route element={<ProtectedRoute allowedRoles={['Judge']} />}>
              <Route path="/judge" element={<JudgeDashboard />} />
              <Route path="/judge/assignments" element={<JudgeDashboard />} />
              <Route path="/judge/evaluations" element={<JudgeDashboard />} />
              <Route path="/judge/leaderboard" element={<JudgeDashboard />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* ── Manager Routes ── */}
            <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/hackathons" element={<ManagerDashboard />} />
              <Route path="/manager/registrations" element={<ManagerDashboard />} />
              <Route path="/manager/judges" element={<ManagerDashboard />} />
              <Route path="/manager/announcements" element={<ManagerDashboard />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* ── Admin Routes ── */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/approvals" element={<AdminApprovals />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/hackathons" element={<AdminHackathons />} />
              <Route path="/admin/analytics" element={<AdminDashboard />} />
              <Route path="/admin/logs" element={<AdminDashboard />} />
              <Route path="/admin/roles" element={<AdminDashboard />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
