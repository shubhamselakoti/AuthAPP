import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Redirects to /login if the user is not authenticated.
// Shows nothing while we're still rehydrating the session.
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // session check in progress — render nothing
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
