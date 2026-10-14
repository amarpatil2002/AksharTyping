import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* We'll add the authenticated sidebar and topbar here. */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
