import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../../components/common/PageHeader";
import Pagination from "../../../../components/common/Pagination";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import ExamFilters from "../components/ExamFilters";
import ExamTable from "../components/ExamTable";
import { useTypingExam } from "../hooks/useTypingExam";

import type { TypingExamStatus } from "../types/typingExam.types";

const ExamListPage = () => {
  const navigate = useNavigate();

  const {
    exams,
    pagination,
    setFilters,
    deleteExam,
    updateExamStatus,
    refreshExams,
    error,
  } = useTypingExam();

  const { showToast } = useToast();

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleDeleteRequest = (examId: string) => {
    setSelectedExamId(examId);
  };

  const handleDelete = async () => {
    if (!selectedExamId) return;

    try {
      setDeleting(true);

      await deleteExam(selectedExamId);

      setSelectedExamId(null);

      showToast("Typing exam deleted successfully.", "success");
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to delete typing exam."),
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (
    examId: string,
    status: TypingExamStatus,
  ) => {
    try {
      setUpdatingStatus(examId);

      await updateExamStatus(examId, status);
      await refreshExams();

      showToast("Exam status updated successfully.", "success");
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to update exam status."),
        "error",
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const totalExams = pagination?.total ?? exams.length;

  // These three counts represent the currently loaded page.
  const publishedExams = exams.filter(
    (exam) => exam.status === "published",
  ).length;

  const draftExams = exams.filter((exam) => exam.status === "draft").length;

  const archivedExams = exams.filter(
    (exam) => exam.status === "archived",
  ).length;

  const stats = [
    {
      label: "Total Exams",
      value: totalExams,
      description: "All examinations",
      iconClass: "bg-blue-50 text-blue-600",
      icon: (
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
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
          />
        </svg>
      ),
    },
    {
      label: "Published",
      value: publishedExams,
      description: "Live examinations",
      iconClass: "bg-emerald-50 text-emerald-600",
      icon: (
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
            d="M5 12l4 4L19 6"
          />
        </svg>
      ),
    },
    {
      label: "Draft",
      value: draftExams,
      description: "Not yet published",
      iconClass: "bg-amber-50 text-amber-600",
      icon: (
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
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Archived",
      value: archivedExams,
      description: "Archived examinations",
      iconClass: "bg-gray-100 text-gray-600",
      icon: (
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
            d="M3 5h18v4H3zM5 9v11h14V9M10 13h4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-full space-y-2">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <PageHeader
          title="Typing Examinations"
          description="Manage examinations, passages and evaluation settings."
        />
      </div>

      {/* Statistics and Create Action */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm transition hover:border-gray-300"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconClass}`}
            >
              {stat.icon}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-500">
                {stat.label}
              </p>
              <p className="mt-0.5 text-xl font-bold leading-6 text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        ))}

        {/* Create Examination */}
        <button
          type="button"
          onClick={() => navigate("/typing-exams/create")}
          className="flex min-h-[68px] items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v14m-7-7h14"
              />
            </svg>
          </span>
          <span className="text-left">
            <span className="block">Create Exam</span>
            <span className="block text-[10px] font-normal text-blue-500">
              Add new examination
            </span>
          </span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 9v4m0 4h.01M10.3 3.9L2.5 17.5A2 2 0 004.2 20h15.6a2 2 0 001.7-2.5L13.7 3.9a2 2 0 00-3.4 0z"
            />
          </svg>

          <div>
            <p className="text-sm font-semibold text-red-800">
              Unable to load examinations
            </p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <ExamFilters />

      {/* Examination Table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Manage Examinations
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              View details, manage passages and update examination status.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span>
              {exams.length} {exams.length === 1 ? "result" : "results"} on this
              page
            </span>
          </div>
        </div>

        <ExamTable
          exams={exams}
          onViewPassages={(id) => navigate(`/typing-exams/${id}/passages`)}
          onEdit={(id) => navigate(`/typing-exams/${id}/edit`)}
          onDelete={handleDeleteRequest}
          onStatusChange={handleStatusChange}
          updatingStatus={updatingStatus}
        />

        {/* Pagination */}
        <div className="border-t border-gray-100 px-3 py-3 sm:px-4">
          <Pagination
            pagination={pagination}
            onPageChange={(page) => setFilters({ page })}
          />
        </div>
      </section>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(selectedExamId)}
        title="Delete typing examination?"
        message="Are you sure you want to delete this examination? Its associated passages may also be deleted. This action cannot be undone."
        confirmText="Delete Examination"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setSelectedExamId(null);
          }
        }}
      />
    </div>
  );
};

export default ExamListPage;
