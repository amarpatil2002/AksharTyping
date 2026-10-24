import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../modules/auth/hooks/useAuth";

export default function GuestRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Checking session...
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
