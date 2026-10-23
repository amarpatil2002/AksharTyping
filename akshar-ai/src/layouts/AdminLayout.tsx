import { Link, Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
        <Link to="/admin" className="text-xl font-bold">Akshar AI Admin</Link>
        <p className="mt-2 text-sm text-slate-300">Content management</p>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8"><Outlet /></main>
    </div>
  );
}
