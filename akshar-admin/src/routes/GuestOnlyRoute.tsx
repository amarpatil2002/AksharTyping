import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAdminAuth";

export default function GuestOnlyRoute() {
  const { status } = useAuth();

  // Prevent the login page from flashing during session verification.
  if (status === "checking") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-blue-50/60"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div
            className="mx-auto size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm text-slate-600">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  // An authenticated admin should never see the login page.
  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  // If unauthenticated, show login.
  // If verification failed, allow login instead of blocking access.
  return <Outlet />;
}
