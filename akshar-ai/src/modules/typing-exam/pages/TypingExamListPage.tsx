import { useEffect, useRef } from "react";

import ExamList from "../components/ExamList";
import useTyping from "../hooks/useTyping";

const TypingExamListPage = () => {
  const { exams, examPagination, examListLoading, error, fetchExams } =
    useTyping();

  // Prevent duplicate initial requests during the mounted lifetime.
  const initialFetchDone = useRef(false);

  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {
    if (initialFetchDone.current) return;

    initialFetchDone.current = true;

    fetchExams({
      page: 1,
      limit: 100,
      sort: "asc",
    }).catch((error) => {
      console.error("Failed to fetch typing exams:", error);
    });
  }, [fetchExams]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const handlePageChange = (page: number) => {
    fetchExams({
      page,
      limit: 100,
      sort: "asc",
    }).catch((error) => {
      console.error("Failed to fetch typing exams:", error);
    });
  };

  // ==========================================
  // UI
  // ==========================================

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
