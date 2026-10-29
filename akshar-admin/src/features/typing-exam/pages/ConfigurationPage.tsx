import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { archiveConfiguration, getConfigurations } from "../api/configApi";

import type {
  ConfigStatus,
  ExamLanguage,
  TypingExamConfig,
} from "../types/config.types";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: {
  label: string;
  value: "" | ConfigStatus;
}[] = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

const LANGUAGE_OPTIONS: {
  label: string;
  value: "" | ExamLanguage;
}[] = [
  { label: "All languages", value: "" },
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Marathi", value: "mr" },
];

const inputClasses =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const primaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes} min`;
  if (minutes === 0) return `${remainingSeconds} sec`;

  return `${minutes}m ${remainingSeconds}s`;
}

function getLanguageLabel(language: ExamLanguage): string {
  const labels: Record<ExamLanguage, string> = {
    en: "English",
    hi: "Hindi",
    mr: "Marathi",
  };

  return labels[language] ?? language;
}

function getStatusClasses(status: ConfigStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "archived":
      return "bg-slate-100 text-slate-600";
    case "draft":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function ConfigurationsPage() {
  const location = useLocation();

  const [items, setItems] = useState<TypingExamConfig[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ConfigStatus>("");
  const [language, setLanguage] = useState<"" | ExamLanguage>("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [configToArchive, setConfigToArchive] =
    useState<TypingExamConfig | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    (location.state as { successMessage?: string } | null)?.successMessage ??
      "",
  );

  const loadConfigurations = useCallback(
    async (isRefresh = false) => {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await getConfigurations({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: status || undefined,
          language: language || undefined,
        });

        if (!response?.success) {
          throw new Error(
            response?.message || "Unable to load configurations.",
          );
        }

        const configurations = response.data?.items;

        if (!Array.isArray(configurations)) {
          throw new Error(
            "Invalid configurations response. Expected data.items to be an array.",
          );
        }

        const pagination = response.data.pagination;

        setItems(configurations);
        setTotal(pagination?.total ?? configurations.length);
        setTotalPages(
          Math.max(
            pagination?.totalPages ??
              Math.ceil(configurations.length / PAGE_SIZE),
            1,
          ),
        );
      } catch (err: unknown) {
        const message = getErrorMessage(
          err,
          "Unable to load configurations. Please try again.",
        );
        setError(message);
        toast.error(message);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status, language],
  );

  useEffect(() => {
    void loadConfigurations();
  }, [loadConfigurations]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setSuccess("");
  }

  function handleStatusChange(value: string) {
    setStatus(value as "" | ConfigStatus);
    setPage(1);
    setSuccess("");
  }

  function handleLanguageChange(value: string) {
    setLanguage(value as "" | ExamLanguage);
    setPage(1);
    setSuccess("");
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setLanguage("");
    setPage(1);
    setSuccess("");
  }

  function handleArchive(config: TypingExamConfig) {
    if (config.status === "archived" || archivingId !== null) {
      return;
    }

    setError("");
    setSuccess("");
    setConfigToArchive(config);
  }

  async function confirmArchive() {
    if (!configToArchive || archivingId !== null) {
      return;
    }

    const config = configToArchive;
    setArchivingId(config._id);
    setError("");
    setSuccess("");

    try {
      const response = await archiveConfiguration(config._id);

      if (response?.success === false) {
        throw new Error(
          response.message || "Unable to archive this configuration.",
        );
      }

      const successMessage =
        response?.message || `"${config.name}" was archived successfully.`;

      setSuccess(successMessage);
      toast.success(successMessage);
      setConfigToArchive(null);

      await loadConfigurations(true);
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        "Unable to archive this configuration.",
      );
      setError(message);
      toast.error(message);
      // Keep the modal open so the user can review the failure or cancel.
    } finally {
      setArchivingId(null);
    }
  }

  const startRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="w-full min-w-0 space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Configurations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, view, edit, and manage typing exam configurations.
          </p>
        </div>

        <Link
          to="/typing-exam/configurations/create"
          className={primaryButtonClasses}
        >
          <Plus size={17} aria-hidden="true" />
          Create Configuration
        </Link>
      </header>

      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="font-medium hover:text-emerald-950"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => void loadConfigurations(true)}
            className="inline-flex shrink-0 items-center gap-2 font-medium hover:text-red-900 disabled:opacity-50"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      <section className="w-full rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
        >
          <div className="min-w-0">
            <label
              htmlFor="config-search"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="config-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name or description"
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="config-status"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Status
            </label>
            <select
              id="config-status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className={inputClasses}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="config-language"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Language
            </label>
            <select
              id="config-language"
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className={inputClasses}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <button type="submit" className={`${primaryButtonClasses} flex-1`}>
              <Search size={16} aria-hidden="true" />
              Search
            </button>

            <button
              type="button"
              title="Refresh configurations"
              aria-label="Refresh configurations"
              disabled={loading || refreshing}
              onClick={() => void loadConfigurations(true)}
              className={secondaryButtonClasses}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
                aria-hidden="true"
              />
            </button>
          </div>
        </form>

        {(search || status || language) && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear search and filters
            </button>
          </div>
        )}
      </section>

      <section className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-900">
            All configurations
          </h2>
          <span className="text-sm text-slate-500">
            {total} {total === 1 ? "result" : "results"}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading configurations...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Search size={21} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No configurations found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters, or create a new
              configuration.
            </p>
            <Link
              to="/typing-exam/configurations/create"
              className={`${primaryButtonClasses} mt-4`}
            >
              <Plus size={16} aria-hidden="true" />
              Create Configuration
            </Link>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[950px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-500"
                    >
                      Configuration
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                    >
                      Language
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                    >
                      Duration
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                    >
                      Target WPM
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                    >
                      Version
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right text-xs font-semibold text-slate-500"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((config) => (
                    <tr
                      key={config._id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="max-w-[400px] px-5 py-4">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {config.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {config.description || "No description provided"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                        {getLanguageLabel(config.language)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                        {formatDuration(config.durationSeconds)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                        {config.targetWpm ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                        v{config.version ?? 1}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ${getStatusClasses(config.status)}`}
                        >
                          {config.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/typing-exam/configurations/${config._id}`}
                            aria-label={`View ${config.name}`}
                            title="View configuration"
                            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                          >
                            <Eye size={15} aria-hidden="true" />
                            View
                          </Link>

                          <Link
                            to={`/typing-exam/configurations/${config._id}/edit`}
                            aria-label={`Edit ${config.name}`}
                            title="Edit configuration"
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            <Pencil size={15} aria-hidden="true" />
                            Edit
                          </Link>

                          {config.status !== "archived" && (
                            <button
                              type="button"
                              disabled={archivingId !== null}
                              onClick={() => handleArchive(config)}
                              title={`Archive ${config.name}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Archive size={15} aria-hidden="true" />
                              {archivingId === config._id
                                ? "Archiving..."
                                : "Archive"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">{startRow}</span>
                {"–"}
                <span className="font-medium text-slate-700">{endRow}</span>
                {" of "}
                <span className="font-medium text-slate-700">{total}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className={secondaryButtonClasses}
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  Previous
                </button>

                <span className="min-w-20 text-center text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className={secondaryButtonClasses}
                >
                  Next
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {configToArchive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && archivingId === null) {
              setConfigToArchive(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="archive-modal-title"
            aria-describedby="archive-modal-description"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Archive size={21} aria-hidden="true" />
              </div>

              <button
                type="button"
                disabled={archivingId !== null}
                onClick={() => setConfigToArchive(null)}
                aria-label="Close confirmation"
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <h2
              id="archive-modal-title"
              className="mt-4 text-lg font-semibold text-slate-900"
            >
              Archive configuration?
            </h2>

            <p
              id="archive-modal-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              Are you sure you want to archive{" "}
              <strong className="font-semibold text-slate-900">
                {configToArchive.name}
              </strong>
              ? This configuration will be archived and may no longer be
              available for active exams.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={archivingId !== null}
                onClick={() => setConfigToArchive(null)}
                className={secondaryButtonClasses}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={archivingId !== null}
                onClick={() => void confirmArchive()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {archivingId !== null ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Archiving...
                  </>
                ) : (
                  <>
                    <Archive size={16} aria-hidden="true" />
                    Confirm archive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
