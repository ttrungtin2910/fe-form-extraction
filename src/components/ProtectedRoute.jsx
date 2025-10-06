import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/admin/default" replace />;
  }

  return children;
};

export default ProtectedRoute;

