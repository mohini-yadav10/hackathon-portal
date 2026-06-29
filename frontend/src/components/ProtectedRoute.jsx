import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';

// Maps each role to its home dashboard
const getRoleHome = (role) => ROLE_HOME[role] || '/dashboard';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-slate-400 text-sm">Authenticating…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own role dashboard
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
