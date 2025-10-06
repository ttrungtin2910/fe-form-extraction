import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import ProtectedRoute from "components/ProtectedRoute";
import { useAuth } from "contexts/AuthContext";
import { ActivityLoggerProvider } from "components/ActivityLogger";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <ActivityLoggerProvider>
      <Routes>
      <Route path="auth/*" element={<AuthLayout />} />
      <Route
        path="admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="rtl/*"
        element={
          <ProtectedRoute>
            <RtlLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated() ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/auth/sign-in" replace />
          )
        }
      />
    </Routes>
    </ActivityLoggerProvider>
  );
};

export default App;
