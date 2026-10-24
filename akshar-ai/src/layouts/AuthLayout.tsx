import { Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isSignup = pathname === "/signup";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-6 sm:py-10">
      <div
        className={`w-full rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 ${
          isSignup ? "my-auto max-w-lg p-5 sm:p-7" : "max-w-md p-6 sm:p-8"
        }`}
      >
        <Outlet />
      </div>
    </main>
  );
}
