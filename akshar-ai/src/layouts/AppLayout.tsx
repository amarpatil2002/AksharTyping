import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Keyboard,
  Sparkles,
  BookOpen,
  ChartNoAxesColumn,
  Trophy,
  UserRound,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Command,
  Menu,
  X,
  ClipboardCheck,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Typing Test", path: "/typing", icon: Keyboard },
  { label: "Passages", path: "/passages", icon: BookOpen },
  { label: "Exams", path: "/exam", icon: ClipboardCheck },
  { label: "AI Coach", path: "/ai-coach", icon: Sparkles },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesColumn },
  { label: "Achievements", path: "/achievements", icon: Trophy },
  { label: "Profile", path: "/profile", icon: UserRound },
];

export default function AppLayout() {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide the app sidebar and header only during active exam stages.
  const isActiveExamStage = /^\/exam\/[^/]+\/(keyboard-test|break|test)$/.test(
    location.pathname,
  );

  const sidebarWidth = collapsed ? "w-[76px]" : "w-64";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile navigation backdrop */}
      {!isActiveExamStage && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      )}

      {/* Sidebar: hidden during the active mock exam */}
      {!isActiveExamStage && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex ${sidebarWidth} flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-3">
            <NavLink
              to="/dashboard"
              title="Akshar AI"
              className="flex min-w-0 items-center gap-3 overflow-hidden"
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Command size={22} />
              </span>

              {!collapsed && (
                <span className="whitespace-nowrap text-lg font-bold tracking-tight">
                  Akshar <span className="text-blue-600">AI</span>
                </span>
              )}
            </NavLink>

            <div className="flex shrink-0 items-center">
              {/* Desktop: collapse or expand sidebar */}
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:inline-flex"
              >
                {collapsed ? (
                  <PanelLeftOpen size={19} />
                ) : (
                  <PanelLeftClose size={19} />
                )}
              </button>

              {/* Mobile: close navigation */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close mobile navigation"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto px-3 py-5">
            {!collapsed && (
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Workspace
              </p>
            )}

            <nav className="space-y-1">
              {navigation.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } ${collapsed ? "justify-center" : ""}`
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-slate-100 p-3">
            <NavLink
              to="/profile"
              title={collapsed ? "Settings" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <Settings size={19} />
              {!collapsed && <span>Settings</span>}
            </NavLink>

            {/* Optional extra collapse control */}
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`mt-1 hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50 md:flex ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
              {!collapsed && <span>Collapse sidebar</span>}
            </button>

            {!collapsed && (
              <div className="mt-2 flex items-center gap-3 border-t border-slate-100 px-2 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  A
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    Akshar Learner
                  </p>
                  <p className="text-xs text-slate-500">Free plan</p>
                </div>

                <LogOut size={17} className="text-slate-400" />
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main content */}
      <div
        className={
          isActiveExamStage
            ? "h-dvh min-h-0"
            : `min-h-screen transition-[padding] duration-200 ${
                collapsed ? "md:pl-[76px]" : "md:pl-64"
              }`
        }
      >
        {/* Normal application header: hidden during active exam */}
        {!isActiveExamStage && (
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              >
                <Menu size={21} />
              </button>

              <span className="text-sm text-slate-500">
                Workspace <span className="mx-1">/</span>
              </span>

              <span className="text-sm font-semibold text-slate-900">
                Dashboard
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:block">
                Your typing journey starts here
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                A
              </div>
            </div>
          </header>
        )}

        <main
          className={
            isActiveExamStage
              ? "h-full min-h-0"
              : "mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
