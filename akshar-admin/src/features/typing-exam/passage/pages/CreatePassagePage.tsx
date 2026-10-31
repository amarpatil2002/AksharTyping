import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PassageForm, { type PassageFormValues } from "../components/PassageForm";

import { useTypingPassages } from "../hooks/useTypingPassages";
import { useToast } from "../../../../components/common/ToastContext";
import PageHeader from "../../../../components/common/PageHeader";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

const CreatePassagePage = () => {
  const { examId } = useParams<{ examId: string }>();

  const navigate = useNavigate();

  const { createPassage } = useTypingPassages();
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: PassageFormValues) => {
    if (!examId) {
      showToast("Exam ID is missing.", "error");
      return;
    }

    try {
      setSubmitting(true);

      await createPassage(examId, values);

      showToast("Passage created successfully.", "success");

      navigate(`/typing-exams/${examId}/passages`);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Passage"
        description="Add a new typing passage to this examination."
      />

      <PassageForm
        onSubmit={handleSubmit}
        submitText="Create Passage"
        submitting={submitting}
      />
    </>
  );
};

export default CreatePassagePage;
