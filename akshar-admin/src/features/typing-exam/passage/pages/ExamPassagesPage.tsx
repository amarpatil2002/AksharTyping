import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../../components/common/PageHeader";
import Pagination from "../../../../components/common/Pagination";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import { useTypingExam } from "../../exam/hooks/useTypingExam";
import { useTypingPassages } from "../hooks/useTypingPassages";

import ExamDetailsCard from "../components/ExamDetailsCard";
import PassageTable from "../components/PassageTable";

import type { TypingExam } from "../../exam/types/typingExam.types";
import type { TypingPassageStatus } from "../types/passage.types";

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

  // Fetch exam details
  useEffect(() => {
    if (!examId) {
      setExamLoading(false);
      return;
    }

    let cancelled = false;

    const loadExam = async () => {
      try {
        setExamLoading(true);

        const result = await getExamById(examId);

        if (!cancelled) {
          setExam(result);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(
            getErrorMessage(error, "Unable to load exam details."),
            "error",
          );
        }
      } finally {
        if (!cancelled) {
          setExamLoading(false);
        }
      }
    };

    void loadExam();

    return () => {
      cancelled = true;
    };
  }, [examId]);

  // Fetch passages whenever exam or filters change
  useEffect(() => {
    if (!examId) return;

    void fetchPassages(examId, filters).catch(() => {
      // Error is already stored in TypingPassageContext.
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

  if (examLoading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading exam details...
      </div>
    );
  }

  if (!examId || !exam) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="font-medium text-gray-800">Exam not found.</p>

        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="mt-4 text-sm font-medium text-blue-600"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Passage Management"
        description="Manage passages for this typing examination."
      >
        <button
          type="button"
          onClick={() => navigate(`/typing-exams/${examId}/passages/create`)}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Passage
        </button>
      </PageHeader>

      <ExamDetailsCard
        exam={exam}
        passageCount={pagination?.total ?? passages.length}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Passages</h2>

          <p className="mt-1 text-sm text-gray-500">
            All passages associated with this examination.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <PassageTable
          passages={passages}
          loading={loading}
          onEdit={(id) =>
            navigate(`/typing-exams/${examId}/passages/${id}/edit`)
          }
          onDelete={(id) => setSelectedPassageId(id)}
          onStatusChange={handleStatusChange}
          updatingStatusId={updatingStatusId}
        />

        <Pagination
          pagination={pagination}
          onPageChange={(page) => setFilters({ page })}
        />
      </section>

      <ConfirmDialog
        isOpen={Boolean(selectedPassageId)}
        title="Delete passage?"
        message="Are you sure you want to delete this passage? This action cannot be undone."
        confirmText="Delete Passage"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setSelectedPassageId(null);
          }
        }}
      />
    </div>
  );
};

export default ExamPassagesPage;
