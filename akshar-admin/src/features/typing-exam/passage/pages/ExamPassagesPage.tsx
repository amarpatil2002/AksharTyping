import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Pagination from "../../../../components/common/Pagination";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import { useTypingExam } from "../../exam/hooks/useTypingExam";
import { useTypingPassages } from "../hooks/useTypingPassages";

import PassageTable from "../components/PassageTable";
import PassageFilters from "../components/PassageFilters";

import type { TypingExam } from "../../exam/types/typingExam.types";
import type {
  TypingPassage,
  TypingPassageStatus,
} from "../types/passage.types";
import ExamDetailsCard from "../components/ExamDetailsCard";

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds} sec`;
  if (!remainingSeconds) return `${minutes} min`;

  return `${minutes} min ${remainingSeconds} sec`;
};

const formatLanguage = (language: string) =>
  language.charAt(0).toUpperCase() + language.slice(1);

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: StatCardProps) => (
  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      {icon}
    </div>

    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-gray-500">{title}</p>
      <p className="mt-0.5 text-2xl font-bold leading-tight text-gray-900">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-gray-400">{subtitle}</p>
    </div>
  </div>
);

const ExamPassagesPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const { getExamById } = useTypingExam();

  const {
    passages,
    pagination,
    filters,
    loading,
    error,
    fetchPassages,
    setFilters,
    deletePassage,
    updatePassageStatus,
  } = useTypingPassages();

  const { showToast } = useToast();

  const [exam, setExam] = useState<TypingExam | null>(null);
  const [examLoading, setExamLoading] = useState(true);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(
    null,
  );
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch examination details
  useEffect(() => {
    if (!examId) {
      setExamLoading(false);
      return;
    }

    let cancelled = false;

    const loadExam = async () => {
      try {
        setExamLoading(true);
        setExam(null);

        const result = await getExamById(examId);

        if (!cancelled) setExam(result);
      } catch (error) {
        if (!cancelled) {
          showToast(
            getErrorMessage(error, "Unable to load examination details."),
            "error",
          );
        }
      } finally {
        if (!cancelled) setExamLoading(false);
      }
    };

    void loadExam();

    return () => {
      cancelled = true;
    };
  }, [examId]);

  // Fetch passages
  useEffect(() => {
    if (!examId) return;

    void fetchPassages(examId, filters).catch(() => {
      // Error is managed by TypingPassageContext.
    });
  }, [
    examId,
    filters.page,
    filters.limit,
    filters.search,
    filters.status,
    filters.difficulty,
    filters.language,
  ]);

  // Current-page status counts
  const statusCounts = useMemo(() => {
    return passages.reduce(
      (counts, passage) => {
        counts[passage.status] += 1;
        return counts;
      },
      {
        published: 0,
        draft: 0,
        archived: 0,
      } as Record<TypingPassageStatus, number>,
    );
  }, [passages]);

  const totalPassages = pagination?.total ?? passages.length;

  // Delete passage
  const handleDelete = async () => {
    if (!examId || !selectedPassageId) return;

    try {
      setDeleting(true);

      await deletePassage(examId, selectedPassageId);

      setSelectedPassageId(null);
      showToast("Passage deleted successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete passage."), "error");
    } finally {
      setDeleting(false);
    }
  };

  // Update passage status
  const handleStatusChange = async (
    passageId: string,
    status: TypingPassageStatus,
  ) => {
    if (!examId) return;

    try {
      setUpdatingStatusId(passageId);

      await updatePassageStatus(examId, passageId, status);

      showToast("Passage status updated successfully.", "success");
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to update passage status."),
        "error",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Loading
  if (examLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Loading examination...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!examId || !exam) {
    return (
      <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Examination not found
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          The examination may have been deleted or is no longer available.
        </p>
        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Examinations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Back Navigation and Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <button
            type="button"
            onClick={() => navigate("/typing-exams")}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600"
          >
            <span>←</span>
            Back to Examinations
          </button>
        </div>
      </div>

      {/* Examination Details */}
      {/* <section className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {exam.title}
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                  exam.status === "published"
                    ? "bg-green-50 text-green-700"
                    : exam.status === "archived"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {exam.status}
              </span>
            </div>

            {exam.description && (
              <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                {exam.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/typing-exams/${examId}/edit`)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            Edit Exam
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <p className="text-[11px] text-gray-400">Language</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {formatLanguage(exam.language)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Duration</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {formatDuration(exam.durationSeconds)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Target Speed</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {exam.targetWpm} WPM
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Maximum Marks</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {exam.maximumMarks}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Passing Percentage</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {exam.passingPercentage}%
            </p>
          </div>
        </div>
      </section> */}

      <ExamDetailsCard exam={exam} passageCount={totalPassages} />

      {/* Statistics and Create Passage */}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Passages"
          value={totalPassages}
          subtitle="All pages"
          icon={<span className="text-base">☷</span>}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Published"
          value={statusCounts.published}
          subtitle="Current page"
          icon={<span className="text-base">✓</span>}
          iconClass="bg-green-50 text-green-600"
        />

        <StatCard
          title="Draft"
          value={statusCounts.draft}
          subtitle="Current page"
          icon={<span className="text-base">◷</span>}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Archived"
          value={statusCounts.archived}
          subtitle="Current page"
          icon={<span className="text-base">▣</span>}
          iconClass="bg-gray-100 text-gray-600"
        />

        <button
          type="button"
          onClick={() => navigate(`/typing-exams/${examId}/passages/create`)}
          className="flex min-h-[64px] items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 px-2.5 py-2 text-left transition hover:border-blue-500 hover:bg-blue-50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl text-white">
            +
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-blue-700">
              Create Passage
            </span>
            <span className="block text-[10px] text-blue-500">
              Add new passage
            </span>
          </span>
        </button>
      </div>

      {/* Filters */}
      <PassageFilters filters={filters} setFilters={setFilters} />

      {/* Passage Table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Manage Passages
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              View details, edit content and update passage status.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {passages.length} results on this page
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5"
          >
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => {
                void fetchPassages(examId, filters).catch(() => {});
              }}
              className="shrink-0 text-xs font-semibold text-red-700 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        <PassageTable
          passages={passages}
          loading={loading}
          onEdit={(id) =>
            navigate(`/typing-exams/${examId}/passages/${id}/edit`)
          }
          onDelete={setSelectedPassageId}
          onStatusChange={handleStatusChange}
          updatingStatusId={updatingStatusId}
        />

        {pagination && pagination.total > 0 && (
          <div className="px-4 py-3">
            <Pagination
              pagination={pagination}
              onPageChange={(page) => setFilters({ page })}
            />
          </div>
        )}
      </section>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(selectedPassageId)}
        title="Delete passage?"
        message="Are you sure you want to delete this passage? Passages associated with existing typing attempts may not be eligible for deletion."
        confirmText="Delete Passage"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setSelectedPassageId(null);
        }}
      />
    </div>
  );
};

export default ExamPassagesPage;
