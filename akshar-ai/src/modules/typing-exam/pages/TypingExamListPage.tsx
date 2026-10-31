import { useEffect } from "react";
import ExamList from "../components/ExamList";
import useTyping from "../hooks/useTyping";

const TypingExamListPage = () => {
  const {
    exams,
    examPagination,
    examFilters,
    examListLoading,
    error,
    fetchExams,
    updateExamFilters,
  } = useTyping();

  useEffect(() => {
    fetchExams().catch(() => {});
  }, [fetchExams]);

  const handleSearch = (value: string) => {
    updateExamFilters({ search: value || undefined });
  };

  const handleLanguageChange = (value: string) => {
    updateExamFilters({ language: value || undefined });
  };

  const handlePageChange = (page: number) => {
    fetchExams({ ...examFilters, page }).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Typing Examinations
        </h1>

        <p className="mt-2 text-gray-600">
          Improve your typing speed and accuracy with our examinations.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search examinations..."
          defaultValue={examFilters.search ?? ""}
          onChange={(event) => handleSearch(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 sm:max-w-md"
        />

        <select
          value={examFilters.language ?? ""}
          onChange={(event) => handleLanguageChange(event.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
        </select>
      </div>

      <ExamList exams={exams} loading={examListLoading} error={error} />

      {examPagination && examPagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={!examPagination.hasPreviousPage || examListLoading}
            onClick={() => handlePageChange(examPagination.page - 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {examPagination.page} of {examPagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!examPagination.hasNextPage || examListLoading}
            onClick={() => handlePageChange(examPagination.page + 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingExamListPage;
