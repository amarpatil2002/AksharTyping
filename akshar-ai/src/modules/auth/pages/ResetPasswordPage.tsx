import { Link } from "react-router-dom";

export function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-sm text-slate-600">The reset form must validate a single-use token from your backend. This screen is a placeholder until that API contract is finalized.</p>
      <Link className="mt-6 block text-center font-semibold text-blue-700" to="/forgot-password">Request a reset link</Link>
    </>
  );
}
