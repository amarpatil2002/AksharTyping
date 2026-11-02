import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PassageForm, { type PassageFormValues } from "../components/PassageForm";

import { useTypingPassages } from "../hooks/useTypingPassages";
import { useToast } from "../../../../components/common/ToastContext";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

const CreatePassagePage = () => {
  const { examId } = useParams<{ examId: string }>();

  const navigate = useNavigate();

  const { createPassage } = useTypingPassages();
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: PassageFormValues) => {
    if (!examId || submitting) return;

    try {
      setSubmitting(true);

      await createPassage(examId, {
        title: values.title.trim(),
        language: values.language,
        content: values.content.trim(),
        difficulty: values.difficulty,
        status: values.status,
      });

      showToast("Passage created successfully.", "success");

      navigate(`/typing-exams/${examId}/passages`);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to create passage."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!examId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-semibold text-gray-900">Invalid examination URL</h2>

        <p className="mt-1 text-sm text-gray-500">Examination ID is missing.</p>

        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="mt-4 text-sm font-medium text-blue-600 transition hover:text-blue-800"
        >
          Back to Examinations
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

      {/* Page Heading */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Create Passage</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a new typing passage to this examination.
        </p>
      </div>

      {/* Passage Form */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <PassageForm
          onSubmit={handleSubmit}
          submitText="Create Passage"
          submitting={submitting}
          isEdit={false}
        />
      </section>
    </div>
  );
};

export default CreatePassagePage;
