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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Typing Exams"
        description="Create and manage your typing examinations."
      >
        <button
          type="button"
          onClick={() => navigate("/typing-exams/create")}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Create Exam
        </button>
      </PageHeader>

      <ExamFilters />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <ExamTable
        exams={exams}
        onViewPassages={(id) => navigate(`/typing-exams/${id}/passages`)}
        onEdit={(id) => navigate(`/typing-exams/${id}/edit`)}
        onDelete={handleDeleteRequest}
        onStatusChange={handleStatusChange}
        updatingStatus={updatingStatus}
      />

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setFilters({ page })}
      />

      <ConfirmDialog
        isOpen={Boolean(selectedExamId)}
        title="Delete typing exam?"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete Exam"
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
