import { Link } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50/60 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-xl shadow-blue-900/5 sm:p-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <SearchX size={32} aria-hidden="true" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-600">
          Error 404
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Page not found
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
          The page you're looking for doesn't exist or may have been moved.
          Check the URL or return to your dashboard.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            Go back
          </Link>
        </div>
      </section>
    </main>
  );
}
