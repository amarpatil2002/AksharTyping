import {
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, X, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

const RESEND_COOLDOWN_SECONDS = 60;

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
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  // Countdown for the resend button.
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  // Send the first signup verification OTP.
  async function handleVerifyEmail() {
    if (!isValidEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (sendingOtp) return;

    setSendingOtp(true);

    try {
      await requestOtp({
        email: normalizedEmail,
        purpose: "verify_email",
      });

      setOtp("");
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setShowOtpModal(true);

      toast.success("If eligible, a verification code will be sent.");

      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to send OTP."));
    } finally {
      setSendingOtp(false);
    }
  }

  // Update one OTP digit and focus the next box.
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtp((previous) => {
      const updated = previous.split("");
      updated[index] = digit;
      return updated.join("").slice(0, 6);
    });

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  // Backspace and arrow-key navigation.
  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  }

  // Paste a six-digit OTP.
  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    event.preventDefault();
    setOtp(pasted);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  // Verify the OTP.
  async function handleVerifyOtp(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter all six digits.");
      return;
    }

    setVerifyingOtp(true);

    try {
      await verifyOtp({
        email: normalizedEmail,
        otp,
      });

      setEmailVerified(true);
      setShowOtpModal(false);
      setOtp("");
      setResendCountdown(0);

      toast.success("Email verified successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid or expired OTP."));
    } finally {
      setVerifyingOtp(false);
    }
  }

  // Resend OTP after the countdown finishes.
  async function handleResendOtp() {
    if (sendingOtp || verifyingOtp || resendCountdown > 0) return;

    setSendingOtp(true);

    try {
      await requestOtp({
        email: normalizedEmail,
        purpose: "verify_email",
      });

      setOtp("");
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      otpRefs.current[0]?.focus();

      toast.success("If eligible, a new verification code will be sent.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to resend OTP."));
    } finally {
      setSendingOtp(false);
    }
  }

  // Create account after email verification.
  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailVerified) {
      toast.error("Please verify your email before creating an account.");
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
    <main className="min-h-screen bg-white px-4 py-3 sm:px-6">
      <div className="mx-auto w-full max-w-md">
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

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                className="form-input mt-1"
                type="text"
                autoComplete="name"
                minLength={2}
                required
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
                className="form-input mt-1"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  const nextEmail = event.target.value;
                  const nextNormalizedEmail = nextEmail.trim().toLowerCase();

                  setEmail(nextEmail);

                  if (nextNormalizedEmail !== normalizedEmail) {
                    setEmailVerified(false);
                  }
                }}
                placeholder="you@example.com"
              />

              {emailVerified ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600">
                  <CheckCircle2 size={14} />
                  Email verified
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={sendingOtp || !isValidEmail}
                  className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingOtp ? "Sending OTP..." : "Verify email"}
                </button>
              )}
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                className="form-input mt-1"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="primary-button w-full"
            >
              {busy ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="otp-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              disabled={verifyingOtp}
              aria-label="Close popup"
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Mail size={24} />
            </div>

            <h2 id="otp-title" className="text-xl font-bold text-slate-900">
              Verify your email
            </h2>

            <p className="mt-2 text-sm leading-5 text-slate-500">
              Enter the six-digit code sent to{" "}
              <span className="font-medium text-slate-700">
                {normalizedEmail}
              </span>
              .
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-5">
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    required
                    disabled={verifyingOtp}
                    value={otp[index] || ""}
                    onChange={(event) =>
                      handleOtpChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    aria-label={`OTP digit ${index + 1}`}
                    className="h-12 w-full rounded-lg border border-slate-300 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otp.length !== 6}
                className="primary-button mt-5 w-full"
              >
                {verifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={sendingOtp || verifyingOtp || resendCountdown > 0}
                className="font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {sendingOtp
                  ? "Sending..."
                  : resendCountdown > 0
                    ? `Resend OTP in ${resendCountdown}s`
                    : "Resend OTP"}
              </button>
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
