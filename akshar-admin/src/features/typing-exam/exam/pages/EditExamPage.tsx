import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../../components/common/PageHeader";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import ExamForm from "../components/ExamForm";
import { useTypingExam } from "../hooks/useTypingExam";

import type {
  CreateTypingExamPayload,
  UpdateTypingExamPayload,
} from "../types/typingExam.types";

const EditExamPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const { getExamById, updateExam, updateExamStatus } = useTypingExam();

  const { showToast } = useToast();

  const [initialValues, setInitialValues] =
    useState<CreateTypingExamPayload | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // FETCH EXAMINATION
  // ==========================================================

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
          maximumMarks: exam.maximumMarks,
          passingPercentage: exam.passingPercentage,

          scoring: {
            ...exam.scoring,
            errorPenalties: {
              ...exam.scoring.errorPenalties,
            },
            qualification: {
              ...exam.scoring.qualification,
            },
          },

          instructions: Array.isArray(exam.instructions)
            ? [...exam.instructions]
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

    void fetchExam();

    return () => {
      active = false;
    };
  }, [examId, getExamById, showToast]);

  // ==========================================================
  // SUBMIT EXAMINATION
  // ==========================================================

  const handleSubmit = async (values: CreateTypingExamPayload) => {
    if (!examId || !initialValues || submitting) return;

    const payload: UpdateTypingExamPayload = {
      title: values.title.trim(),
      description: values.description?.trim() ?? "",
      instructions: values.instructions,
    };

    try {
      setSubmitting(true);

      await updateExam(examId, payload);

      if (values.status && values.status !== initialValues.status) {
        await updateExamStatus(examId, values.status);
      }

      showToast("Typing examination updated successfully.", "success");

      navigate("/typing-exams");
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to update typing examination."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return <LoadingSpinner />;
  }

  // ==========================================================
  // EXAMINATION NOT FOUND
  // ==========================================================

  if (!initialValues) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="inline-flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-gray-500 transition hover:text-blue-600"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 12H5m7 7-7-7 7-7"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Typing Examinations
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.3 3.9L2.5 17.5A2 2 0 004.2 20h15.6a2 2 0 001.7-2.5L13.7 3.9a2 2 0 00-3.4 0z"
              />
            </svg>
          </div>

          <h2 className="mt-4 text-base font-semibold text-gray-900">
            Unable to load typing examination
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            The examination could not be found or an error occurred while
            loading it.
          </p>

          <button
            type="button"
            onClick={() => navigate("/typing-exams")}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Typing Exams
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div className="space-y-5">
      {/* BACK NAVIGATION AND HEADER */}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="inline-flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-gray-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 12H5m7 7-7-7 7-7"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Typing Examinations
        </button>

        <PageHeader
          title="Edit Typing Examination"
          description="Update examination details, instructions and publication status."
        />
      </div>

      {/* LOCKED CONFIGURATION NOTICE */}

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.3 3.9L2.5 17.5A2 2 0 004.2 20h15.6a2 2 0 001.7-2.5L13.7 3.9a2 2 0 00-3.4 0z"
            />
          </svg>

          <div>
            <p className="text-sm font-semibold text-amber-800">
              Examination configuration is locked
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Language, duration, target WPM, maximum marks, passing percentage
              and scoring configuration cannot be changed after creation. You
              can update the examination title, description, instructions and
              publication status.
            </p>
          </div>
        </div>
      </div>

      {/* EXAMINATION FORM */}

      <ExamForm
        key={examId}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitText="Update Examination"
        submitting={submitting}
      />
    </div>
  );
};

export default EditExamPage;
