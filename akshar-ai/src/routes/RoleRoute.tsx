import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../modules/auth/hooks/useAuth";

export function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user || !user.roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
