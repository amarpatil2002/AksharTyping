import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/useAdminAuth";

export default function ProtectedAdminRoute() {
  const { status, refreshSession } = useAuth();
  const location = useLocation();

  // Never render protected content while authentication
  // is still being checked.
  if (status === "checking") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-50"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm text-slate-600">
            Verifying your admin session...
          </p>
        </div>
      </main>
    );
  }

  // Fail closed: do not render protected pages when the
  // backend could not verify the session.
  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
          role="alert"
        >
          <h1 className="text-lg font-semibold text-slate-900">
            Unable to verify your session
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            We couldn't verify your admin session. Check your connection and try
            again.
          </p>

          <button
            type="button"
            onClick={() => void refreshSession()}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  // No valid session: redirect to login and preserve the
  // destination so it can be restored after authentication.
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Only an authenticated admin reaches this point.
  return <Outlet />;
}
