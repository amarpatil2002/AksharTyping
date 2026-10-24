import { useState, type SyntheticEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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
    <div>
      <Link to="/" className="text-lg font-bold text-slate-900">
        Akshar <span className="text-blue-600">AI</span>
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Welcome back
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        Log in to continue your practice.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Email address
          <input
            className="form-input mt-1"
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
          <input
            className="form-input mt-1"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
        </label>

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="primary-button w-full" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        New to Akshar AI?{" "}
        <Link
          to="/signup"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
