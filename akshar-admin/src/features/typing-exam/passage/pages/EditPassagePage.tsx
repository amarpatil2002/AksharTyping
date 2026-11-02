import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../../components/common/PageHeader";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import { useTypingPassages } from "../hooks/useTypingPassages";
import PassageForm, { type PassageFormValues } from "../components/PassageForm";

import type { TypingPassage } from "../types/passage.types";

const EditPassagePage = () => {
  const { examId, passageId } = useParams<{
    examId: string;
    passageId: string;
  }>();

  const navigate = useNavigate();

  const { getPassageById, updatePassage, updatePassageStatus } =
    useTypingPassages();

  const { showToast } = useToast();

  const [passage, setPassage] = useState<TypingPassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load passage details.
  const loadPassage = useCallback(async () => {
    if (!examId || !passageId) {
      setError("Invalid examination or passage ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getPassageById(examId, passageId);

      setPassage(result);
    } catch (err) {
      setPassage(null);
      setError(getErrorMessage(err, "Unable to load passage details."));
    } finally {
      setLoading(false);
    }
  }, [examId, passageId, getPassageById]);

  useEffect(() => {
    void loadPassage();
  }, [loadPassage]);

  // Update passage.
  const handleSubmit = async (values: PassageFormValues) => {
    if (!examId || !passageId || submitting || !passage) return;

    try {
      setSubmitting(true);

      // Update passage content and difficulty.
      await updatePassage(examId, passageId, {
        title: values.title.trim(),
        content: values.content.trim(),
        difficulty: values.difficulty,
      });

      // Update publication status through its dedicated endpoint.
      if (values.status !== passage.status) {
        await updatePassageStatus(examId, passageId, values.status);
      }

      showToast("Passage updated successfully.", "success");

      navigate(`/typing-exams/${examId}/passages`);
    } catch (err) {
      showToast(getErrorMessage(err, "Unable to update passage."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
            role="status"
            aria-label="Loading passage"
          />

          <p className="mt-3 text-sm text-gray-500">Loading passage...</p>
        </div>
      </div>
    );
  }

  // Error or passage not found.
  if (error || !passage) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Unable to load passage
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {error || "Passage not found."}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              examId ? `/typing-exams/${examId}/passages` : "/typing-exams",
            )
          }
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Back to Passages
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => navigate(`/typing-exams/${examId}/passages`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
      >
        <span aria-hidden="true">←</span>
        Back to Passages
      </button>

      {/* Page Header */}
      <PageHeader
        title="Edit Passage"
        description="Update passage content, difficulty and publication status."
      />

      {/* Passage Information */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Passage ID
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {passage._id}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Word Count
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-800">
              {passage.wordCount.toLocaleString()} words
            </p>
          </div>
        </div>
      </div>

      {/* Passage Form */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <PassageForm
          initialValues={{
            title: passage.title,
            language: passage.language,
            content: passage.content,
            difficulty: passage.difficulty,
            status: passage.status,
          }}
          onSubmit={handleSubmit}
          submitText="Update Passage"
          submitting={submitting}
          isEdit
        />
      </section>
    </div>
  );
};

export default EditPassagePage;
