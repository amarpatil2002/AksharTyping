import { useCallback, useState } from "react";
import { Toast } from "./Toast";
import type { ToastMessage, ToastType } from "./Toast";

export interface ToastInput {
  type: ToastType;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ type, message }: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setToasts((current) => [...current, { id, type, message }]);
  }, []);

  const toastContainer = (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );

  return { showToast, toastContainer };
}
