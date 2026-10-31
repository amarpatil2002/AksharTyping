import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const showToast = (message: string, type: ToastType = "success") => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    const id = ++nextId.current;

    setToast({ id, message, type });

    timer.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      timer.current = null;
    }, 3000);
  };

  const closeToast = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setToast(null);
  };

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live={toast.type === "error" ? "assertive" : "polite"}
          className={`fixed right-5 top-5 z-[100] w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-md shadow-lg animate-toast-in ${
            toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
                ? "bg-red-600"
                : toast.type === "warning"
                  ? "bg-amber-400"
                  : "bg-blue-600"
          }`}
        >
          <div className="flex min-h-14 items-center gap-3 px-4 py-3 text-white">
            {/* Status icon */}
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "!"}
              {toast.type === "warning" && "⚠"}
              {toast.type === "info" && "i"}
            </div>

            {/* Message */}
            <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm font-medium">
              {toast.message}
            </p>

            {/* Close button */}
            <button
              type="button"
              onClick={closeToast}
              aria-label="Close notification"
              className="flex size-6 shrink-0 items-center justify-center rounded text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              ×
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-black/15">
            <div key={toast.id} className="toast-progress h-full bg-white/80" />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};
