import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../modules/auth/hooks/useAuth";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring your session…</div>;
  }
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
