import { Outlet } from "react-router-dom";
import Sidebar from "../modules/dashboard/components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <main className="min-h-screen pt-16 lg:ml-72 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
