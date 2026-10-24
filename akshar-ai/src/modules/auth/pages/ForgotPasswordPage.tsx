import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "../../../shared/api/axios";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { useAuth } from "../hooks/useAuth";
import OtpVerificationModal from "../components/OtpVerificationModal";
import { useResendCountdown } from "../utils/useResendCountdown";

export default function ForgotPasswordPage() {
  const { requestOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    seconds: resendCountdown,
    start: startResendCountdown,
    reset: resetResendCountdown,
  } = useResendCountdown(60);

  const normalizedEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (isSendingOtp) return;

    setIsSendingOtp(true);
    setOtpError("");

    try {
      await requestOtp({
        email: normalizedEmail,
        purpose: "password_reset",
      });

      startResendCountdown();
      setShowOtpModal(true);

      toast.success(
        "If your account is eligible, a password-reset code will be sent.",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to request a reset code."));
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtp(otp: string) {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Please enter all six digits.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const response = await api.post("/api/v1/auth/verify-otp", {
        email: normalizedEmail,
        purpose: "password_reset",
        otp,
      });

      const token = response.data?.data?.resetToken;

      if (typeof token !== "string" || !token) {
        throw new Error(
          "The server did not return password-reset authorization.",
        );
      }

      setResetToken(token);
      setShowOtpModal(false);
      resetResendCountdown();

      toast.success("Email verified. You can now reset your password.");
    } catch (error) {
      setOtpError(
        getApiErrorMessage(error, "Invalid or expired verification code."),
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (isSendingOtp || isVerifyingOtp || resendCountdown > 0) return;

    setIsSendingOtp(true);
    setOtpError("");

    try {
      await requestOtp({
        email: normalizedEmail,
        purpose: "password_reset",
      });

      startResendCountdown();

      toast.success(
        "If your account is eligible, a new reset code will be sent.",
      );
    } catch (error) {
      setOtpError(
        getApiErrorMessage(error, "Unable to resend the reset code."),
      );
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resetToken) {
      toast.error("Please verify your email first.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsResetting(true);

    try {
      await resetPassword({
        resetToken,
        newPassword,
      });

      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password reset successfully. Please log in.");

      navigate("/login", {
        replace: true,
        state: {
          message: "Password reset successfully. Please log in.",
        },
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reset your password."));
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <div className="w-full">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="mt-4">
          <Link to="/" className="text-lg font-bold text-slate-900">
            Akshar <span className="text-blue-600">AI</span>
          </Link>

          {!resetToken ? (
            <>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Forgot your password?
              </h1>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Enter your registered email address to receive a password-reset
                code.
              </p>

              <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email address
                  <input
                    id="reset-email"
                    className="form-input mt-1.5"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isSendingOtp}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSendingOtp || !isValidEmail}
                  className="primary-button w-full"
                >
                  {isSendingOtp && (
                    <LoaderCircle size={18} className="mr-2 animate-spin" />
                  )}
                  {isSendingOtp ? "Sending code..." : "Send reset code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Create a new password
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Resetting password for{" "}
                <span className="font-medium text-slate-800">
                  {normalizedEmail}
                </span>
              </p>

              <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  New password
                  <div className="relative mt-1.5">
                    <input
                      id="new-password"
                      className="form-input pr-11"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={isResetting}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="At least 8 characters"
                    />

                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-3 text-slate-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm new password
                  <div className="relative mt-1.5">
                    <input
                      id="confirm-password"
                      className="form-input pr-11"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={isResetting}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Enter your password again"
                    />

                    <button
                      type="button"
                      aria-label="Toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute inset-y-0 right-3 text-slate-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isResetting || !newPassword || !confirmPassword}
                  className="primary-button w-full"
                >
                  {isResetting && (
                    <LoaderCircle size={18} className="mr-2 animate-spin" />
                  )}
                  {isResetting ? "Resetting password..." : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <OtpVerificationModal
        open={showOtpModal}
        email={normalizedEmail}
        resendIn={resendCountdown}
        isVerifying={isVerifyingOtp}
        isResending={isSendingOtp}
        error={otpError}
        onClose={() => {
          if (!isVerifyingOtp) setShowOtpModal(false);
        }}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </>
  );
}
