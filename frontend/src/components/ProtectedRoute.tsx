// src/components/ProtectedRoute.tsx
//
// A route guard that sits in front of every dashboard page.
// If the user is not authenticated → redirect to login.
// If we're still checking localStorage on startup → show a spinner.
// If a requiredRole is set and the user doesn't match → redirect to dashboard.
// If authenticated → render the page normally.

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When set, only users with this role may access the route. */
  requiredRole?: "owner" | "worker";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Still restoring session from localStorage — show spinner to avoid
  // a flash of the login page when the user is already logged in
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
