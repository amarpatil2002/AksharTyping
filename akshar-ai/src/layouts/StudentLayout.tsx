import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../modules/auth/hooks/useAuth";

const links = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/typing/practice", label: "Typing practice" },
  { to: "/typing/exams", label: "Typing exams" },
  { to: "/state-exams", label: "State-wise exams" },
  { to: "/profile", label: "Profile" },
];

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="border-b border-slate-200 bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-5 text-xl font-bold text-blue-700">Akshar AI</div>
        <nav className="flex flex-wrap gap-2 md:flex-col">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="truncate text-sm font-semibold">{user?.name ?? "Student"}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button onClick={handleLogout} className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700">Log out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
