import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "./useAdminAuth";
import type { ApiErrorResponse } from "./auth.types";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);

      const state = location.state as { from?: { pathname?: string } } | null;

      const requestedPath = state?.from?.pathname;

      // Only restore internal admin routes.
      const destination =
        requestedPath?.startsWith("/dashboard") &&
        !requestedPath.startsWith("//")
          ? requestedPath
          : "/dashboard";

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setError("Invalid email or password.");
        } else if (status === 429) {
          setError("Too many login attempts. Please try again later.");
        } else if (!err.response) {
          setError("Cannot connect to the server. Please try again.");
        } else {
          setError(
            err.response.data?.message || "Login failed. Please try again.",
          );
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50/60 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Branding */}
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-600/20">
            अ
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Akshar AI
          </h1>

          <p className="mt-2 text-sm text-slate-500">Administration Portal</p>
        </header>

        {/* Login card */}
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-900/5 sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-slate-900">
              Admin sign in
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage exams and candidates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                maxLength={254}
                disabled={isLoading}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  disabled={isLoading}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-3 flex items-center justify-center rounded-md text-slate-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* API error */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && (
                <span
                  aria-hidden="true"
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}

              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Authorized administrators only.
        </p>
      </div>
    </main>
  );
}
