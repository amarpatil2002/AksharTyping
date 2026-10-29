import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";

interface ConfirmPublishModalProps {
  open: boolean;
  examTitle: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmPublishModal({
  open,
  examTitle,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmPublishModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="publish-modal-title"
        aria-describedby="publish-modal-description"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start gap-4 p-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="publish-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              Publish this exam?
            </h2>

            <p
              id="publish-modal-description"
              className="mt-2 break-words text-sm leading-6 text-slate-600"
            >
              You are about to publish{" "}
              <span className="font-semibold text-slate-900">{examTitle}</span>.
              Confirm that the exam content and configuration are ready.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              This action will send a publish request to the server.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close confirmation"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <LoaderCircle
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
            )}
            {loading ? "Publishing..." : "Confirm publish"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
