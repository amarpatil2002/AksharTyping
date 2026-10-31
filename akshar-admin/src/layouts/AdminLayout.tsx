import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, ShieldCheck } from "lucide-react";

import { useAuth } from "../features/auth/useAdminAuth";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError(
        "Unable to log out securely. Check your connection and try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Separate sidebar component */}
      <AdminSidebar
        admin={admin}
        sidebarOpen={sidebarOpen}
        isLoggingOut={isLoggingOut}
        logoutError={logoutError}
        onClose={closeSidebar}
        onLogout={() => void handleLogout()}
      />

      {/* Main content */}
      <div className="min-h-screen lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                Admin Workspace
              </p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Manage typing exams and candidates
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
            <ShieldCheck
              size={16}
              className="text-blue-600"
              aria-hidden="true"
            />

            <span className="hidden text-xs font-medium text-blue-700 sm:inline">
              Administrator
            </span>
          </div>
        </header>

        {/* Routed page content */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
