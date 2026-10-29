import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  ChartNoAxesCombined,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../features/auth/useAdminAuth";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Candidates",
    path: "/candidates",
    icon: Users,
    end: false,
  },
  {
    label: "Attempts & Results",
    path: "/results",
    icon: ClipboardList,
    end: false,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: ChartNoAxesCombined,
    end: false,
  },
];

const typingExamLinks = [
  {
    label: "All Exams",
    path: "/typing-exam",
    end: true,
  },
  {
    label: "Create Exam",
    path: "/typing-exam/create",
    end: true,
  },
  {
    label: "All Configurations",
    path: "/typing-exam/configurations",
    end: true,
  },
  {
    label: "Create Configuration",
    path: "/typing-exam/configurations/create",
    end: true,
  },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typingExamOpen, setTypingExamOpen] = useState(
    location.pathname.startsWith("/typing-exam"),
  );
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isTypingExamActive = location.pathname.startsWith("/typing-exam");

  useEffect(() => {
    if (isTypingExamActive) {
      setTypingExamOpen(true);
    }
  }, [isTypingExamActive]);

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

  const adminInitial = admin?.name?.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <NavLink
            to="/dashboard"
            onClick={closeSidebar}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm shadow-blue-200">
              अ
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-slate-900">
                Akshar Admin
              </p>
              <p className="text-xs text-slate-500">Administration Portal</p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          {/* Dashboard, candidates, results, analytics */}
          {navigation.slice(0, 1).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      aria-hidden="true"
                      className={isActive ? "text-blue-600" : "text-slate-500"}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Typing Exam expandable menu */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setTypingExamOpen((open) => !open)}
              aria-expanded={typingExamOpen}
              aria-controls="typing-exam-submenu"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                isTypingExamActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <FileText size={19} aria-hidden="true" />

              <span className="flex-1 text-left">Typing Exam</span>

              {typingExamOpen ? (
                <ChevronDown size={17} aria-hidden="true" />
              ) : (
                <ChevronRight size={17} aria-hidden="true" />
              )}
            </button>

            {typingExamOpen && (
              <div
                id="typing-exam-submenu"
                className="ml-4 space-y-1 border-l border-blue-200 pl-3"
              >
                {typingExamLinks.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${
                            isActive ? "bg-blue-600" : "bg-slate-300"
                          }`}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Remaining workspace links */}
          {navigation.slice(1).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      aria-hidden="true"
                      className={isActive ? "text-blue-600" : "text-slate-500"}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin identity and logout */}
        <div className="shrink-0 border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {adminInitial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {admin?.name || "Administrator"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {admin?.email || "Admin account"}
              </p>
            </div>

            <ShieldCheck
              size={17}
              className="shrink-0 text-blue-600"
              aria-label="Administrator account"
            />
          </div>

          {logoutError && (
            <p
              role="alert"
              className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700"
            >
              {logoutError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} aria-hidden="true" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

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
