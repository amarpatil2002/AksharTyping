import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Command } from "lucide-react";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { loginUser } from "../services/authService";
import type { LoginPayload } from "../types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const registrationMessage = (location.state as { message?: string } | null)
    ?.message;

  function validate(): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Please enter your password.";
    }

    return nextErrors;
  }

  const handleSubmit: NonNullable<
    React.ComponentProps<"form">["onSubmit"]
  > = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setServerError("");

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      const payload: LoginPayload = {
        email: email.trim(),
        password,
      };

      await loginUser(payload);

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2.5"
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
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Log in to continue your typing journey with Akshar AI.
          </p>
        </div>

        {registrationMessage && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {registrationMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            required
          />

          {serverError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            rightIcon={!loading ? <ArrowRight size={17} /> : undefined}
          >
            Log in
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
