import { useEffect } from "react";
import { CheckCircle2, CircleAlert, Info, X, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const toastStyles: Record<
  ToastType,
  { container: string; icon: string; title: string }
> = {
  success: {
    container: "border-emerald-200",
    icon: "text-emerald-600",
    title: "Success",
  },
  error: {
    container: "border-red-200",
    icon: "text-red-600",
    title: "Something went wrong",
  },
  warning: {
    container: "border-amber-200",
    icon: "text-amber-600",
    title: "Warning",
  },
  info: {
    container: "border-blue-200",
    icon: "text-blue-600",
    title: "Information",
  },
};

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: CircleAlert,
  info: Info,
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const style = toastStyles[toast.type];
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        onDismiss(toast.id);
      },
      toast.type === "error" ? 6000 : 4000,
    );

    return () => window.clearTimeout(timeout);
  }, [toast.id, toast.type, onDismiss]);

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white p-4 shadow-lg ${style.container}`}
    >
      <Icon
        size={21}
        className={`mt-0.5 shrink-0 ${style.icon}`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{style.title}</p>
        <p className="mt-1 break-words text-sm leading-5 text-slate-600">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
