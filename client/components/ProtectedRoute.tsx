import { Link, Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canAccess, useAdminProfile, type Permission } from "@/lib/admin-access";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "student";
  permission?: Permission;
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function AdminGate({ children, permission }: { children: React.ReactNode; permission?: Permission }) {
  const { admin, loading } = useAdminProfile();

  if (loading) return <Spinner />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  if (!canAccess(admin, permission)) {
    return (
      <AdminLayout>
        <Card className="mx-auto mt-10 max-w-lg border border-border p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold text-foreground">No access to this page</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask a super admin to give you access to this area.
          </p>
          <Button asChild className="mt-6">
            <Link to="/admin/dashboard">Back to dashboard</Link>
          </Button>
        </Card>
      </AdminLayout>
    );
  }
  return <>{children}</>;
}

export function ProtectedRoute({ children, requiredRole, permission }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    const loginPath = requiredRole === "admin" ? "/admin/login" : "/student/login";
    return <Navigate to={loginPath} replace />;
  }

  if (requiredRole === "admin") {
    return <AdminGate permission={permission}>{children}</AdminGate>;
  }

  if (requiredRole && user.user_metadata?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
