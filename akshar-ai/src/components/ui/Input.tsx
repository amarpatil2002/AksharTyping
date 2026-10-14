import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    error,
    hint,
    className = "",
    wrapperClassName = "",
    required,
    type = "text",
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);

  const generatedId = id ?? props.name;
  const errorId = generatedId ? `${generatedId}-error` : undefined;
  const hintId = generatedId ? `${generatedId}-hint` : undefined;
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const describedBy =
    [
      hint && !error ? hintId : undefined,
      error ? errorId : undefined,
      props["aria-describedby"],
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div
      className={["w-full space-y-2", wrapperClassName]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <label
          htmlFor={generatedId}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          {...props}
          ref={ref}
          id={generatedId}
          type={inputType}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "min-h-11 w-full rounded-xl border bg-white px-4 py-3",
            "text-sm text-slate-900 outline-none transition",
            "placeholder:text-slate-400",
            "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            error ? "border-red-400" : "border-slate-200",
            isPassword ? "pr-12" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            disabled={props.disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed"
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
