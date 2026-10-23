import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await register({ name, email, password });
      setMessage("Account created. Check your email to verify your address.");
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create account.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Start preparing with Akshar AI.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Full name
          <input
            className="form-input mt-1"
            autoComplete="name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            className="form-input mt-1"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="form-input mt-1"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="mt-1 block text-xs text-slate-500">
            Use at least 8 characters.
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-green-700">
            {message}
          </p>
        )}
        <button className="primary-button w-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-blue-700">
          Log in
        </Link>
      </p>
    </>
  );
}
