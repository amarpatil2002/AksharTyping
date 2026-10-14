import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
        Error 404
      </p>

      <h1 className="mt-4 text-4xl font-bold text-slate-900">Page not found</h1>

      <p className="mt-3 max-w-md text-slate-600">
        The page you're looking for doesn't exist or may have moved.
      </p>

      <Link
        to="/"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <ArrowLeft size={17} />
        Back to home
      </Link>
    </main>
  );
}
