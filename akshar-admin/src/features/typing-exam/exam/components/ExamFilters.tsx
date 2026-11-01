import SearchInput from "../../../../components/common/SearchInput";
import { useTypingExam } from "../hooks/useTypingExam";
import {
  LANGUAGES,
  type TypingExamStatus,
  type TypingExamLanguage,
} from "../types/typingExam.types";

const ExamFilters = () => {
  const { filters, setFilters } = useTypingExam();

  const handleStatusChange = (status: string) => {
    setFilters({
      status: status ? (status as TypingExamStatus) : undefined,
      page: 1,
    });
  };

  const handleLanguageChange = (language: string) => {
    setFilters({
      language: language ? (language as TypingExamLanguage) : undefined,
      page: 1,
    });
  };

  const handleLimitChange = (limit: string) => {
    setFilters({
      limit: Number(limit),
      page: 1,
    });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.language);

  const clearFilters = () => {
    setFilters({
      search: "",
      status: undefined,
      language: undefined,
      page: 1,
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      {/* Filter heading */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 5h16M7 12h10m-7 7h4"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            <p className="text-xs text-gray-500">
              Find and manage examinations.
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear filters
          </button>
        )}
      </div>

      {/* Filter controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Search examination
          </label>

          <SearchInput
            value={filters.search ?? ""}
            onChange={(search) => setFilters({ search, page: 1 })}
            placeholder="Search by title or slug..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Examination status
          </label>

          <select
            value={filters.status ?? ""}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Examination language
          </label>

          <select
            value={filters.language ?? ""}
            onChange={(event) => handleLanguageChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All languages</option>

            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language.charAt(0).toUpperCase() + language.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Pagination limit */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Records per page
          </label>

          <select
            value={filters.limit ?? 10}
            onChange={(event) => handleLimitChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Active filter indicators */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs font-medium text-gray-500">
            Active filters:
          </span>

          {filters.search && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              Search: {filters.search}
            </span>
          )}

          {filters.status && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
              Status: {filters.status}
            </span>
          )}

          {filters.language && (
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium capitalize text-violet-700">
              Language: {filters.language}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamFilters;
