import { Link, Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-blue-700">Akshar AI</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link className="text-slate-600 hover:text-blue-700" to="/typing/practice">Typing practice</Link>
            <Link className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700" to="/login">Login</Link>
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
