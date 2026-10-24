import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Mail, X } from "lucide-react";

interface OtpVerificationModalProps {
  open: boolean;
  email: string;
  resendIn: number;
  isVerifying?: boolean;
  isResending?: boolean;
  error?: string;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void> | void;
  onResend: () => Promise<void> | void;
}

export default function OtpVerificationModal({
  open,
  email,
  resendIn,
  isVerifying = false,
  isResending = false,
  error,
  onClose,
  onVerify,
  onResend,
}: OtpVerificationModalProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) {
      setOtp(Array(6).fill(""));
      return;
    }

    const timer = window.setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isVerifying) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isVerifying, onClose]);

  if (!open) return null;

  const code = otp.join("");
  const isComplete = code.length === 6;

  const updateOtp = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      setOtp((previous) =>
        previous.map((digit, i) => (i === index ? "" : digit)),
      );
      return;
    }

    // Support pasting the entire six-digit code.
    if (digits.length > 1) {
      const pasted = digits.slice(0, 6).split("");
      const next = Array(6).fill("");
      pasted.forEach((digit, i) => {
        next[i] = digit;
      });

      setOtp(next);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    setOtp((previous) =>
      previous.map((digit, i) => (i === index ? digits : digit)),
    );

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isComplete || isVerifying) return;

    await onVerify(code);
  };

  const handleResend = async () => {
    if (resendIn > 0 || isResending || isVerifying) return;

    setOtp(Array(6).fill(""));
    await onResend();

    inputRefs.current[0]?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center
        overflow-y-auto bg-slate-950/45 px-4 py-6
        backdrop-blur-[5px] sm:px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isVerifying) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-modal-title"
        className="relative my-auto w-full max-w-[440px]
          overflow-hidden rounded-3xl border border-white/80
          bg-white p-6 shadow-[0_24px_80px_-16px_rgba(15,23,42,0.35)]
          animate-in fade-in zoom-in-95 duration-200
          sm:p-8"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isVerifying}
          aria-label="Close verification dialog"
          className="absolute right-5 top-5 flex h-9 w-9
            items-center justify-center rounded-full
            text-slate-400 transition hover:bg-slate-100
            hover:text-slate-700 disabled:opacity-50"
        >
          <X size={21} />
        </button>

        {/* Email icon */}
        <div
          className="mb-6 flex h-14 w-14 items-center justify-center
            rounded-2xl border border-blue-100 bg-blue-50
            text-blue-600 shadow-sm shadow-blue-100/60"
        >
          <Mail size={27} strokeWidth={1.8} />
        </div>

        <h2
          id="otp-modal-title"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Verify your email
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter the six-digit verification code we sent to{" "}
          <span className="break-all font-semibold text-slate-700">
            {email}
          </span>
          .
        </p>

        <form onSubmit={handleSubmit} className="mt-7">
          {/* Six-digit OTP inputs */}
          <div
            className="grid grid-cols-6 gap-2 sm:gap-3"
            aria-label="Six-digit verification code"
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                disabled={isVerifying}
                aria-label={`Verification digit ${index + 1}`}
                onChange={(event) => updateOtp(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onFocus={(event) => event.target.select()}
                onPaste={(event) => {
                  event.preventDefault();
                  updateOtp(index, event.clipboardData.getData("text"));
                }}
                className={`h-[58px] min-w-0 rounded-xl border
                  bg-white text-center text-xl font-semibold
                  text-slate-900 outline-none transition-all
                  duration-150
                  ${
                    digit ? "border-blue-300 bg-blue-50/40" : "border-slate-200"
                  }
                  focus:border-blue-500 focus:ring-4
                  focus:ring-blue-100
                  disabled:cursor-not-allowed disabled:bg-slate-50`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-100
                bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          )}

          {/* Verify button */}
          <button
            type="submit"
            disabled={!isComplete || isVerifying}
            className="mt-6 flex min-h-[54px] w-full items-center
              justify-center gap-2 rounded-xl bg-blue-600 px-4
              py-3 text-sm font-semibold text-white
              shadow-md shadow-blue-600/20 transition
              hover:bg-blue-700 active:scale-[0.99]
              focus:outline-none focus:ring-4 focus:ring-blue-100
              disabled:cursor-not-allowed disabled:bg-slate-300
              disabled:shadow-none"
          >
            {isVerifying ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Verifying email...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Verify email address
              </>
            )}
          </button>
        </form>

        {/* Resend code */}
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">Didn't receive the code? </span>

          {resendIn > 0 ? (
            <span className="font-semibold tabular-nums text-slate-400">
              Resend in {resendIn}s
            </span>
          ) : (
            <button
              type="button"
              disabled={isResending || isVerifying}
              onClick={handleResend}
              className="font-semibold text-blue-600 transition
                hover:text-blue-800 hover:underline
                disabled:opacity-50"
            >
              {isResending ? "Sending code..." : "Resend code"}
            </button>
          )}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Check your inbox and spam folder if you can't find the email.
        </p>
      </section>
    </div>
  );
}
