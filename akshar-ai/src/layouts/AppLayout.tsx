import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
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
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Typing Test", path: "/typing", icon: Keyboard },
  { label: "Passages", path: "/passages", icon: BookOpen },
  { label: "AI Coach", path: "/ai-coach", icon: Sparkles },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesColumn },
  { label: "Achievements", path: "/achievements", icon: Trophy },
  { label: "Profile", path: "/profile", icon: UserRound },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = collapsed ? "w-[76px]" : "w-64";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex ${sidebarWidth} flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
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

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X size={19} />
          </button>
        </div>

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

          {/* {!collapsed && (
            <div className="mt-8 rounded-2xl bg-blue-50 p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600">
                <Sparkles size={19} />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                Improve with AI
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Get personalized tips to improve your typing.
              </p>
              <NavLink
                to="/ai-coach"
                onClick={() => setMobileOpen(false)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700"
              >
                Meet your AI Coach
              </NavLink>
            </div>
          )} */}
        </div>

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

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-1 hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50 md:flex"
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
                <p className="truncate text-sm font-semibold">Akshar Learner</p>
                <p className="text-xs text-slate-500">Free plan</p>
              </div>
              <LogOut size={17} className="text-slate-400" />
            </div>
          )}
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-200 ${
          collapsed ? "md:pl-[76px]" : "md:pl-64"
        }`}
      >
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

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
