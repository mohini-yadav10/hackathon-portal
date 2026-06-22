import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import Profile from './pages/Profile';
import BrowseHackathons from './pages/BrowseHackathons';
import TeamSearch from './pages/TeamSearch';
import MyTeam from './pages/MyTeam';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminApprovals from './pages/AdminApprovals';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Secured Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/hackathons" element={<BrowseHackathons />} />
            <Route path="/team-search" element={<TeamSearch />} />
            <Route path="/my-team" element={<MyTeam />} />
          </Route>

          {/* Admin Secured Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/approvals" element={<AdminApprovals />} />
            {/* Mock paths for users & events manager redirects if needed */}
            <Route path="/admin/hackathons" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/users" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
