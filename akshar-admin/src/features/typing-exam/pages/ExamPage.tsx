import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { archiveExam, deleteExam, getExams, publishExam } from "../api/examApi";

import type { ExamPagination, TypingExam } from "../api/examApi";

const PAGE_SIZE = 10;

type ActionType = "publish" | "archive" | "delete";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const actionMessages: Record<
  ActionType,
  { loading: string; success: string; error: string }
> = {
  publish: {
    loading: "Publishing exam...",
    success: "Exam published successfully.",
    error: "Unable to publish exam.",
  },
  archive: {
    loading: "Archiving exam...",
    success: "Exam archived successfully.",
    error: "Unable to archive exam.",
  },
  delete: {
    loading: "Deleting exam...",
    success: "Exam deleted successfully.",
    error: "Unable to delete exam.",
  },
};

function getExamName(exam: TypingExam): string {
  return exam.title || exam.name || "Untitled exam";
}

function getExamStatus(exam: TypingExam): string {
  return String(exam.status || "draft").toLowerCase();
}

function getExamConfiguration(exam: TypingExam): string {
  if (typeof exam.configuration === "string") {
    return exam.configuration;
  }

  return (
    exam.configuration?.name || exam.configId || exam.configurationId || "—"
  );
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    published: "bg-blue-50 text-blue-700",
    active: "bg-emerald-50 text-emerald-700",
    archived: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ExamsPage() {
  const [exams, setExams] = useState<TypingExam[]>([]);

  const [pagination, setPagination] = useState<ExamPagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // One confirmation popup handles all three actions.
  const [confirmTarget, setConfirmTarget] = useState<{
    exam: TypingExam;
    action: ActionType;
  } | null>(null);

  const [error, setError] = useState("");

  // Load exams
  const loadExams = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await getExams({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: status || undefined,
        });

        if (response?.success === false) {
          throw new Error(response.message || "Unable to load exams.");
        }

        const result = response.data;

        const items = Array.isArray(result)
          ? result
          : result?.items || result?.exams || [];

        setExams(items);

        if (!Array.isArray(result) && result?.pagination) {
          setPagination({
            page: result.pagination.page ?? page,
            limit: result.pagination.limit ?? PAGE_SIZE,
            total: result.pagination.total ?? items.length,
            totalPages: result.pagination.totalPages ?? 1,
          });
        } else {
          setPagination({
            page,
            limit: PAGE_SIZE,
            total: items.length,
            totalPages: 1,
          });
        }
      } catch (err: unknown) {
        const message = getErrorMessage(
          err,
          "Unable to load exams. Please try again.",
        );

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status],
  );

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  // Debounced search
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Open the confirmation popup
  function handleAction(exam: TypingExam, action: ActionType) {
    if (actionId) return;

    setConfirmTarget({ exam, action });
  }

  // Run the selected API action after confirmation
  async function handleConfirmAction() {
    if (!confirmTarget || actionId) return;

    const { exam, action } = confirmTarget;

    setActionId(exam._id);

    const toastId = toast.loading(actionMessages[action].loading);

    try {
      const response =
        action === "publish"
          ? await publishExam(exam._id)
          : action === "archive"
            ? await archiveExam(exam._id)
            : await deleteExam(exam._id);

      if (response?.success === false) {
        throw new Error(response.message || actionMessages[action].error);
      }

      toast.success(response?.message || actionMessages[action].success, {
        id: toastId,
      });

      setConfirmTarget(null);

      // Refresh the table after the action succeeds.
      await loadExams(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, actionMessages[action].error), {
        id: toastId,
      });
    } finally {
      setActionId(null);
    }
  }

  function applyStatusFilter(value: string) {
    setStatus(value);
    setPage(1);
  }

  const confirming = Boolean(
    confirmTarget && actionId === confirmTarget.exam._id,
  );

  const confirmAction = confirmTarget?.action;

  const confirmTitle =
    confirmAction === "publish"
      ? "Publish this exam?"
      : confirmAction === "archive"
        ? "Archive this exam?"
        : "Delete this exam?";

  const confirmDescription =
    confirmTarget && confirmAction === "publish"
      ? `Are you sure you want to publish "${getExamName(confirmTarget.exam)}"? Verify the exam content and configuration before continuing.`
      : confirmTarget && confirmAction === "archive"
        ? `Are you sure you want to archive "${getExamName(confirmTarget.exam)}"?`
        : confirmTarget
          ? `Are you sure you want to permanently delete "${getExamName(confirmTarget.exam)}"? This action cannot be undone.`
          : "";

  const confirmLabel =
    confirmAction === "publish"
      ? "Confirm publish"
      : confirmAction === "archive"
        ? "Confirm archive"
        : "Confirm delete";

  const confirmButtonClass =
    confirmAction === "delete"
      ? "bg-red-600 hover:bg-red-700"
      : confirmAction === "archive"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            All Exams
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create, manage, and publish typing examinations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadExams(true)}
            disabled={loading || refreshing}
            className={buttonSecondary}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link to="/typing-exam/create" className={buttonPrimary}>
            <Plus size={17} />
            Create Exam
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search exams..."
            aria-label="Search exams"
            className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={status}
          onChange={(event) => applyStatusFilter(event.target.value)}
          aria-label="Filter exams by status"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Exams table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-900">Examination records</h2>

          <p className="text-sm text-slate-500">
            {pagination.total} total exam(s)
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin text-blue-600" />
            Loading exams...
          </div>
        ) : error && exams.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => void loadExams(true)}
              className={`${buttonSecondary} mt-4`}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : exams.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Eye size={22} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No exams found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search || status
                ? "Try changing your search or status filter."
                : "Create your first typing exam to get started."}
            </p>

            {!search && !status && (
              <Link
                to="/typing-exam/create"
                className={`${buttonPrimary} mt-4`}
              >
                <Plus size={16} />
                Create Exam
              </Link>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Exam</th>
                  <th className="px-5 py-3.5 font-medium">Configuration</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Created</th>
                  <th className="px-5 py-3.5 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => {
                  const currentStatus = getExamStatus(exam);
                  const isBusy = actionId === exam._id;

                  return (
                    <tr
                      key={exam._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="max-w-xs truncate font-medium text-slate-900">
                          {getExamName(exam)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          ID: {exam._id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {getExamConfiguration(exam)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={currentStatus} />
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(exam.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {currentStatus === "draft" && (
                            <button
                              type="button"
                              onClick={() => handleAction(exam, "publish")}
                              disabled={Boolean(actionId)}
                              title="Publish exam"
                              aria-label={`Publish ${getExamName(exam)}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              <Upload size={14} />
                              Publish
                            </button>
                          )}

                          {currentStatus !== "archived" && (
                            <button
                              type="button"
                              onClick={() => handleAction(exam, "archive")}
                              disabled={Boolean(actionId)}
                              title="Archive exam"
                              aria-label={`Archive ${getExamName(exam)}`}
                              className="rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                            >
                              {isBusy ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Archive size={16} />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAction(exam, "delete")}
                            disabled={Boolean(actionId)}
                            title="Delete exam"
                            aria-label={`Delete ${getExamName(exam)}`}
                            className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            {isBusy ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && exams.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing page {pagination.page} of{" "}
              {Math.max(1, pagination.totalPages)}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || Boolean(actionId)}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className={buttonSecondary}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages || Boolean(actionId)}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
                className={buttonSecondary}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Confirmation popup for Publish, Archive and Delete */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirming) {
              setConfirmTarget(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start gap-4 p-6">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                  confirmAction === "delete"
                    ? "bg-red-50 text-red-600"
                    : confirmAction === "archive"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-blue-50 text-blue-600"
                }`}
              >
                {confirmAction === "publish" ? (
                  <Upload size={21} />
                ) : confirmAction === "archive" ? (
                  <Archive size={21} />
                ) : (
                  <AlertTriangle size={21} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {confirmTitle}
                </h2>

                <p
                  id="confirm-description"
                  className="mt-2 break-words text-sm leading-6 text-slate-600"
                >
                  {confirmDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={confirming}
                aria-label="Close confirmation"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={confirming}
                className={buttonSecondary}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleConfirmAction()}
                disabled={confirming}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
              >
                {confirming ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : confirmAction === "publish" ? (
                  <Upload size={16} />
                ) : confirmAction === "archive" ? (
                  <Archive size={16} />
                ) : (
                  <Trash2 size={16} />
                )}

                {confirming ? "Please wait..." : confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
