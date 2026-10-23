import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-blue-700">STUDENT DASHBOARD</p>
      <h1 className="mt-2 text-3xl font-bold">Welcome{user?.name ? `, ${user.name}` : ""}</h1>
      <p className="mt-2 text-slate-600">Choose what you want to practise today.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link to="/typing/practice" className="dashboard-card"><h2 className="font-bold">Typing practice</h2><p className="mt-2 text-sm text-slate-600">Build speed and accuracy.</p></Link>
        <Link to="/typing/exams" className="dashboard-card"><h2 className="font-bold">Typing exams</h2><p className="mt-2 text-sm text-slate-600">Practise timed typing assessments.</p></Link>
        <Link to="/state-exams" className="dashboard-card"><h2 className="font-bold">State-wise exams</h2><p className="mt-2 text-sm text-slate-600">Explore exam preparation.</p></Link>
      </div>
    </div>
  );
}
