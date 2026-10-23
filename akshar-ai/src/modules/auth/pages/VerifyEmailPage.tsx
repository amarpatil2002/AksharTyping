import { Link, useLocation } from "react-router-dom";

export function VerifyEmailPage() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Verify your email</h1>
      <p className="mt-3 text-sm text-slate-600">
        {email ? `If verification is available, follow the instructions sent to ${email}.` : "Follow the verification link sent to your email address."}
      </p>
      <p className="mt-5 text-xs text-slate-500">Email verification UI is ready; connect it to your backend verification endpoint.</p>
      <Link className="mt-6 inline-block font-semibold text-blue-700" to="/login">Back to login</Link>
    </div>
  );
}
