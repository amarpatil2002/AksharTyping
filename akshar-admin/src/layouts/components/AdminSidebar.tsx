import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  ChartNoAxesCombined,
  X,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AdminSidebarProps {
  admin: {
    name?: string;
    email?: string;
  } | null;
  sidebarOpen: boolean;
  isLoggingOut: boolean;
  logoutError: string;
  onClose: () => void;
  onLogout: () => void;
}

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Typing Exams",
    path: "/typing-exams",
    icon: Users,
    end: false,
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

const AdminSidebar = ({
  admin,
  sidebarOpen,
  isLoggingOut,
  logoutError,
  onClose,
  onLogout,
}: AdminSidebarProps) => {
  const location = useLocation();

  const isTypingExamActive = location.pathname.startsWith("/typing-exam");

  const [typingExamOpen, setTypingExamOpen] = useState(isTypingExamActive);

  useEffect(() => {
    if (isTypingExamActive) {
      setTypingExamOpen(true);
    }
  }, [isTypingExamActive]);

  const adminInitial = admin?.name?.trim().charAt(0).toUpperCase() || "A";

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <NavLink
            to="/dashboard"
            onClick={onClose}
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
            onClick={onClose}
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

          {/* Dashboard */}
          {navigation.slice(0, 1).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
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

          {/* Remaining navigation */}
          {navigation.slice(1).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
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

        {/* Admin information and logout */}
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
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} aria-hidden="true" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
