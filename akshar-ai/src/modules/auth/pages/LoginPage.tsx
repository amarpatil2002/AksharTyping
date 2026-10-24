import { useState, type SyntheticEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success("Logged in successfully!");

      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;

      navigate(from ?? "/dashboard", { replace: true });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to log in."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="mt-4">
        <Link to="/" className="text-lg font-bold text-slate-900">
          Akshar <span className="text-blue-600">AI</span>
        </Link>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Log in to continue your practice.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              className="form-input mt-1.5"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <div className="relative mt-1.5">
              <input
                className="form-input pr-11"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                disabled={busy}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                disabled={busy}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="primary-button w-full"
            disabled={busy}
          >
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          New to Akshar AI?{" "}
          <Link
            to="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
