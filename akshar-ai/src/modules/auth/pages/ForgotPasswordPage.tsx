import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { appConfig } from "../../../app/config";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (!appConfig.apiBaseUrl) throw new Error("Backend API is not configured.");
      const response = await fetch(`${appConfig.apiBaseUrl}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Could not submit the request. Try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-2 text-sm text-slate-600">We'll send recovery instructions if an account matches that address.</p>
      {sent ? <p role="status" className="mt-5 text-sm text-green-700">If an account matches, recovery instructions will be sent.</p> : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Email
            <input className="form-input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button className="primary-button w-full">Send recovery instructions</button>
        </form>
      )}
      <Link className="mt-6 block text-center text-sm font-semibold text-blue-700" to="/login">Back to login</Link>
    </>
  );
}
