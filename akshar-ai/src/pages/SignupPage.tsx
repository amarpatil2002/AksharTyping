import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Command } from "lucide-react";

import Input from "../components/ui/Input";
import { registerUser } from "../services/authService";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Enter your name (at least 2 characters).";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }

    return nextErrors;
  }

  const navigate = useNavigate();

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setServerError("");

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        replace: true,
        state: {
          message: result.message ?? "Account created. Please log in.",
        },
      });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Link
        to="/"
        className="mb-2 inline-flex items-center gap-2"
        aria-label="Akshar AI home"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Command size={22} />
        </span>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Akshar<span className="text-blue-600"> AI</span>
        </span>
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Create your account
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Start improving your typing skills with Akshar AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Full name"
            type="text"
            placeholder="Enter your name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
            required
          />

          <Input
            id="email"
            name="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            required
          />

          <Input
            id="password"
            name="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            hint="Use at least 8 characters."
            required
          />

          {serverError && (
            <p role="alert" className="text-sm text-red-600">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={17} />}
          </button>

          <p className="text-xs leading-4 text-slate-500">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy. Add links to these documents before launch.
          </p>
        </form>

        <div className="mt-2 border-t border-slate-100 pt-2 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
