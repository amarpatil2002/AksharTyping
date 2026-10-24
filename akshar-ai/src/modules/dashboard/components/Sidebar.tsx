import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Keyboard,
  GraduationCap,
  Map,
  ChartNoAxesColumnIncreasing,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/hooks/useAuth";

const links = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Typing Practice", path: "/typing-practice", icon: Keyboard },
  { label: "Typing Exams", path: "/typing-exams", icon: GraduationCap },
  { label: "State Exams", path: "/state-exams", icon: Map },
  {
    label: "My Progress",
    path: "/student-progress",
    icon: ChartNoAxesColumnIncreasing,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Student";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      toast.success("Logged out successfully.");
    } catch {
      toast.error("Server logout could not be confirmed.");
    }
    // finally {
    //   navigate("/login", { replace: true });
    //   setLoggingOut(false);
    // }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
      isActive
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
    }`;

  const content = (
    <>
      {/* Brand */}
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
        <NavLink
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20">
            अ
          </span>

          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Akshar <span className="text-blue-600">AI</span>
          </span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Learning
        </p>

        <div className="space-y-1.5">
          {links.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              <Icon className="h-[19px] w-[19px] shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Account
        </p>

        <div className="space-y-1.5">
          <NavLink
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <UserRound className="h-[19px] w-[19px]" />
            My Profile
          </NavLink>

          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <Settings className="h-[19px] w-[19px]" />
            Settings
          </NavLink>
        </div>
      </nav>

      {/* User panel */}
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.name || "Student"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-[19px] w-[19px]" />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        {content}
      </aside>

      {/* Mobile sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        {content}
      </aside>
    </>
  );
}
