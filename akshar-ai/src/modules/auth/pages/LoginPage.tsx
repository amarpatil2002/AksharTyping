import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login({ email, password });
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-600">Log in to continue your practice.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Email
          <input className="form-input mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">Password
          <input className="form-input mt-1" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-blue-700">Forgot password?</Link></div>
        <button className="primary-button w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">New to Akshar AI? <Link to="/signup" className="font-semibold text-blue-700">Create an account</Link></p>
    </>
  );
}
