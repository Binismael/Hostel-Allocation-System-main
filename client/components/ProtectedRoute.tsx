import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "student";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login based on required role
    const loginPath =
      requiredRole === "admin" ? "/admin/login" : "/student/login";
    return <Navigate to={loginPath} replace />;
  }

  // Check user role if required
  if (requiredRole) {
    const userRole = user.user_metadata?.role;
    if (userRole !== requiredRole) {
      // Redirect to home if user doesn't have required role
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
