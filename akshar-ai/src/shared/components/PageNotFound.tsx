import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Home, SearchX } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl text-center">
        {/* Brand */}
        <Link
          to="/"
          className="mb-12 inline-flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Akshar AI home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/20">
            अ
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Akshar <span className="text-indigo-600">AI</span>
          </span>
        </Link>

        {/* 404 illustration */}
        <div className="relative mx-auto mb-8 flex h-44 w-44 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-indigo-200 bg-indigo-100/60" />
          <div className="absolute inset-4 rounded-full border border-dashed border-indigo-300" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl shadow-indigo-900/10">
            <SearchX className="h-12 w-12 text-indigo-600" strokeWidth={1.5} />
          </div>

          <span className="absolute right-1 top-5 rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700 shadow-sm">
            404
          </span>
          <span className="absolute bottom-3 left-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            Page missing
          </span>
        </div>

        {/* Message */}
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
          Error 404
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Oops! Lost your way?
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-600">
          The page you’re looking for doesn’t exist or may have been moved.
          Let’s get you back to your typing journey.
        </p>

        {/* Actions */}
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-slate-500">
          Need help?{" "}
          <Link
            to="/"
            className="font-semibold text-indigo-600 underline-offset-4 hover:underline"
          >
            Visit Akshar AI
          </Link>
        </p>
      </section>
    </main>
  );
}
