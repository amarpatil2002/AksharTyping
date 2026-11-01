import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../../components/common/PageHeader";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import ExamForm from "../components/ExamForm";
import { useTypingExam } from "../hooks/useTypingExam";

import type { CreateTypingExamPayload } from "../types/typingExam.types";

const CreateExamPage = () => {
  const navigate = useNavigate();

  const { createExam } = useTypingExam();
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: CreateTypingExamPayload) => {
    if (submitting) return;

    try {
      setSubmitting(true);

      await createExam(values);

      showToast("Typing exam created successfully.", "success");

      navigate("/typing-exams");
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to create typing exam."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="inline-flex w-fit items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-gray-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
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
              d="M19 12H5m7 7-7-7 7-7"
            />
          </svg>
          Back to Typing Examinations
        </button>

        <PageHeader
          title="Create Typing Examination"
          description="Configure a new typing examination and its evaluation criteria."
        />
      </div>

      {/* Examination Form */}
      <ExamForm
        onSubmit={handleSubmit}
        submitText="Create Examination"
        submitting={submitting}
      />
    </div>
  );
};

export default CreateExamPage;
