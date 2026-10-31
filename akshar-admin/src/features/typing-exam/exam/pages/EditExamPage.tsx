import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../../components/common/PageHeader";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import ExamForm from "../components/ExamForm";
import { useTypingExam } from "../hooks/useTypingExam";

import type { CreateTypingExamPayload } from "../types/typingExam.types";

const EditExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const { getExamById, updateExam } = useTypingExam();
  const { showToast } = useToast();

  const [initialValues, setInitialValues] =
    useState<CreateTypingExamPayload | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!examId) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchExam = async () => {
      try {
        setLoading(true);
        setInitialValues(null);

        const exam = await getExamById(examId);

        if (!active) return;

        setInitialValues({
          title: exam.title,
          slug: exam.slug,
          description: exam.description ?? "",
          language: exam.language,
          durationSeconds: exam.durationSeconds,
          targetWpm: exam.targetWpm,
          scoring: {
            ...exam.scoring,
          },
          instructions: Array.isArray(exam.instructions)
            ? exam.instructions
            : [],
          status: exam.status,
        });
      } catch (error) {
        if (active) {
          showToast(
            getErrorMessage(error, "Unable to load typing exam."),
            "error",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchExam();

    return () => {
      active = false;
    };
  }, [examId, getExamById, showToast]);

  const handleSubmit = async (values: CreateTypingExamPayload) => {
    if (!examId) return;

    try {
      setSubmitting(true);

      await updateExam(examId, values);

      showToast("Typing exam updated successfully.", "success");

      navigate("/typing-exams");
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to update typing exam."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!initialValues) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-600">Unable to load typing exam.</p>

        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Typing Exams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Typing Exam"
        description="Update your typing examination configuration."
      />

      <ExamForm
        key={examId}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitText="Update Exam"
        submitting={submitting}
      />
    </div>
  );
};

export default EditExamPage;
