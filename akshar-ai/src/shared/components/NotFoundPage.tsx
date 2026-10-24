import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center">
      <div>
        <p className="text-sm font-semibold text-blue-700">404 ERROR</p>
        <h1 className="mt-3 text-4xl font-bold">Page not found</h1>
        <p className="mt-3 text-slate-600">
          The page may have moved or does not exist.
        </p>
        <Link to="/" className="primary-button mt-6 inline-flex">
          Go home
        </Link>
      </div>
    </main>
  );
}
