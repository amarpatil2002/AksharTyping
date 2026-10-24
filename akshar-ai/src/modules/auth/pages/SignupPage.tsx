import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import OtpVerificationModal from "../components/OtpVerificationModal";
import { useResendCountdown } from "../utils/useResendCountdown";

export default function SignupPage() {
  const { requestOtp, verifyOtp, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [busy, setBusy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const {
    seconds: resendCountdown,
    start: startResendCountdown,
    reset: resetResendCountdown,
  } = useResendCountdown(60);

  const normalizedEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  async function handleVerifyEmail() {
    if (!isValidEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (sendingOtp || emailVerified) return;

    setSendingOtp(true);

    try {
      await requestOtp({
        email: normalizedEmail,
        purpose: "verify_email",
      });

      setOtp("");
      startResendCountdown();
      setShowOtpModal(true);

      toast.success("If eligible, a verification code will be sent.");

      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to send OTP."));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    if (code.length !== 6) {
      toast.error("Please enter all six digits.");
      return;
    }

    setVerifyingOtp(true);

    try {
      await verifyOtp({
        email: normalizedEmail,
        otp: code,
      });

      setEmailVerified(true);
      setShowOtpModal(false);
      resetResendCountdown();

      toast.success("Email verified successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid or expired OTP."));
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (sendingOtp || verifyingOtp || resendCountdown > 0) return;

    setSendingOtp(true);

    try {
      await requestOtp({
        email: normalizedEmail,
        purpose: "verify_email",
      });

      setOtp("");
      startResendCountdown();
      otpRefs.current[0]?.focus();

      toast.success("If eligible, a new verification code will be sent.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to resend OTP."));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!emailVerified) {
      toast.error("Please verify your email before creating an account.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      await register({
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

      toast.success("Account created successfully!");

      navigate("/login", {
        replace: true,
        state: {
          message: "Account created successfully. Please log in.",
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to create your account."));
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
          Create your account
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Start preparing with Akshar AI.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              className="form-input mt-1.5"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              disabled={busy}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
            />
          </label>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="signup-email"
              className="form-input mt-1.5"
              type="email"
              autoComplete="email"
              required
              disabled={emailVerified || busy}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailVerified(false);
              }}
              placeholder="you@example.com"
            />

            {emailVerified ? (
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 size={14} />
                Email verified
              </p>
            ) : (
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={sendingOtp || busy || !isValidEmail}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingOtp ? "Sending OTP..." : "Verify email"}
              </button>
            )}
          </div>

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

          <button
            type="submit"
            disabled={busy || !emailVerified}
            className="primary-button w-full"
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Log in
          </Link>
        </p>
      </div>

      <OtpVerificationModal
        open={showOtpModal}
        email={normalizedEmail}
        resendIn={resendCountdown}
        isVerifying={verifyingOtp}
        isResending={sendingOtp}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </div>
  );
}
