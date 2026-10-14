import { Link, Outlet } from "react-router-dom";
import { Command, ArrowRight } from "lucide-react";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Command size={21} />
            </span>
            <span className="text-lg font-bold">
              Akshar<span className="text-blue-600"> AI</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              to="/#features"
              className="text-sm text-slate-600 hover:text-blue-600"
            >
              Features
            </Link>
            <Link
              to="/#how-it-works"
              className="text-sm text-slate-600 hover:text-blue-600"
            >
              How it works
            </Link>
            <Link
              to="/#languages"
              className="text-sm text-slate-600 hover:text-blue-600"
            >
              Languages
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden px-3 py-2 text-sm font-semibold sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Akshar AI. Practice with purpose.
      </footer>
    </div>
  );
}
