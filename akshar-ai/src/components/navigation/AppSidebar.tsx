import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Keyboard,
  Bot,
  BookOpen,
  ChartNoAxesCombined,
  Trophy,
  UserRound,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Languages,
} from "lucide-react";

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Typing Test", path: "/typing", icon: Keyboard },
  { label: "AI Coach", path: "/ai-coach", icon: Bot },
  { label: "Courses", path: "/courses", icon: BookOpen },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { label: "Achievements", path: "/achievements", icon: Trophy },
  { label: "Profile", path: "/profile", icon: UserRound },
];

export default function AppSidebar({
  collapsed = false,
  onToggle,
}: AppSidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-200 md:flex md:flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
          अ
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Akshar AI
            </h1>
            <p className="text-xs text-slate-500">Typing & Learning</p>
          </div>
        )}

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}
      </div>

      {/* Language */}
      {!collapsed && (
        <div className="px-4 pt-5">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            <Languages size={18} />
            <span className="flex-1 text-left">English</span>
            <span className="text-xs text-slate-400">EN</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
      >
        {!collapsed && (
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
        )}

        {navigationItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className="shrink-0"
                />
                {!collapsed && <span>{label}</span>}
                {!collapsed && label === "AI Coach" && (
                  <Sparkles size={14} className="ml-auto text-blue-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade card */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={18} />
              <span className="text-sm font-semibold">Akshar Pro</span>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-blue-100">
              Unlock advanced practice and personalized AI coaching.
            </p>

            <button
              type="button"
              className="w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              onClick={() => {
                window.location.href = "/subscription";
              }}
            >
              Explore plans
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-4">
        <p className="text-center text-xs text-slate-400">
          {!collapsed ? "Akshar AI · Learn every day" : "AI"}
        </p>
      </div>
    </aside>
  );
}
