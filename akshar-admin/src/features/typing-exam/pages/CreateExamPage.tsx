import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, LoaderCircle, Save } from "lucide-react";

import { createExam } from "../api/examApi";
import { getConfigurations } from "../api/configApi";
import type { TypingExamConfig } from "../types/config.types";
import { toast } from "sonner";

const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function CreateExamPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [passageText, setPassageText] = useState("");
  const [configId, setConfigId] = useState("");

  const [configurations, setConfigurations] = useState<TypingExamConfig[]>([]);
  const [loadingConfigurations, setLoadingConfigurations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConfigurations() {
      setLoadingConfigurations(true);
      setLoadError("");

      try {
        const response = await getConfigurations({
          page: 1,
          limit: 100,
          status: "active",
        });

        if (!response?.success) {
          throw new Error("Unable to load exam configurations.");
        }

        const items = response.data?.items;

        if (!Array.isArray(items)) {
          throw new Error("Unexpected configuration response from the server.");
        }

        if (!cancelled) {
          const activeConfigurations = items.filter(
            (config) => config.status === "active",
          );

          setConfigurations(activeConfigurations);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load configurations.";

          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingConfigurations(false);
        }
      }
    }

    void loadConfigurations();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    const trimmedPassage = passageText.trim();

    if (!trimmedTitle) {
      setError("Enter an exam title.");
      toast.error("Enter an exam title.");
      return;
    }

    if (trimmedTitle.length > 200) {
      setError("Exam title cannot exceed 200 characters.");
      toast.error("Exam title cannot exceed 200 characters.");
      return;
    }

    if (!trimmedPassage) {
      setError("Enter the typing passage.");
      toast.error("Enter the typing passage.");
      return;
    }

    if (trimmedPassage.length > 50000) {
      setError("The passage cannot exceed 50,000 characters.");
      toast.error("The passage cannot exceed 50,000 characters.");
      return;
    }

    if (!configId) {
      setError("Select an exam configuration.");
      toast.error("Select an exam configuration.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await createExam({
        title: trimmedTitle,
        passageText: trimmedPassage,
        configId,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Unable to create the exam.");
      }

      toast.success(response.message || "Exam created successfully.");

      navigate("/typing-exam", {
        replace: true,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create the exam. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create Exam
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure a typing exam using an existing configuration and passage.
          </p>
        </div>

        <Link
          to="/typing-exam"
          className="inline-flex items-center gap-2 self-start rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:self-auto"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          All Exams
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {loadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Exam details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the title and select the configuration for this exam.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label htmlFor="exam-title" className={labelClass}>
                Exam title <span className="text-red-600">*</span>
              </label>

              <input
                id="exam-title"
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. English Typing Examination"
                className={fieldClass}
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {title.length}/200
              </p>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="exam-configuration" className={labelClass}>
                Exam configuration <span className="text-red-600">*</span>
              </label>

              <select
                id="exam-configuration"
                required
                value={configId}
                onChange={(event) => setConfigId(event.target.value)}
                disabled={loadingConfigurations || !!loadError}
                className={fieldClass}
              >
                <option value="">
                  {loadingConfigurations
                    ? "Loading configurations..."
                    : "Select a configuration"}
                </option>

                {configurations.map((config) => (
                  <option key={config._id} value={config._id}>
                    {config.name} ({config.language.toUpperCase()})
                  </option>
                ))}
              </select>

              {!loadingConfigurations &&
                !loadError &&
                configurations.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    No active configurations found. Create or activate a
                    configuration before creating an exam.
                  </p>
                )}

              <p className="mt-1 text-xs text-slate-500">
                The selected configuration determines the exam settings.
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <FileText size={18} aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Typing passage
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the text candidates will type during the exam.
              </p>
            </div>
          </div>

          <div className="p-5">
            <label htmlFor="passage-text" className={labelClass}>
              Passage text <span className="text-red-600">*</span>
            </label>

            <textarea
              id="passage-text"
              required
              rows={12}
              maxLength={50000}
              value={passageText}
              onChange={(event) => setPassageText(event.target.value)}
              placeholder="Paste or type the examination passage here..."
              className={`${fieldClass} min-h-64 resize-y leading-7`}
            />

            <div className="mt-2 flex flex-col justify-between gap-1 text-xs text-slate-500 sm:flex-row">
              <span>
                Preserve punctuation, spaces, and paragraph breaks as required.
              </span>
              <span className="tabular-nums">
                {passageText.length.toLocaleString()} / 50,000 characters
              </span>
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/typing-exam"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting ||
              loadingConfigurations ||
              !!loadError ||
              configurations.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Save size={17} aria-hidden="true" />
            )}
            {submitting ? "Creating exam..." : "Create Exam"}
          </button>
        </div>
      </form>
    </div>
  );
}
