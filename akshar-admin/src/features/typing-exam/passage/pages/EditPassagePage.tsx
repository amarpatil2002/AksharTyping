import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PassageForm, { type PassageFormValues } from "../components/PassageForm";

import { useTypingPassages } from "../hooks/useTypingPassages";
import { useToast } from "../../../../components/common/ToastContext";
import PageHeader from "../../../../components/common/PageHeader";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

const EditPassagePage = () => {
  const { examId, passageId } = useParams<{
    examId: string;
    passageId: string;
  }>();

  const navigate = useNavigate();

  const { getPassageById, updatePassage } = useTypingPassages();
  const { showToast } = useToast();

  const [initialValues, setInitialValues] = useState<PassageFormValues>({
    title: "",
    language: "en",
    content: "",
    difficulty: "easy",
    status: "draft",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPassage = async () => {
      console.log("Exam ID:", examId);
      console.log("Passage ID:", passageId);

      if (!examId || !passageId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const passage = await getPassageById(examId, passageId);

        setInitialValues({
          title: passage.title,
          language: passage.language,
          content: passage.content,
          difficulty: passage.difficulty,
          status: passage.status,
        });
      } catch (error) {
        console.error("LOAD PASSAGE ERROR:", error);
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    };

    void loadPassage();
  }, [examId, passageId]);

  const handleSubmit = async (values: PassageFormValues) => {
    if (!examId || !passageId) return;

    try {
      setSubmitting(true);

      await updatePassage(examId, passageId, values);

      showToast("Passage updated successfully.", "success");

      navigate(`/typing-exams/${examId}/passages`);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update passage."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading passage...
      </div>
    );
  }

  if (!examId || !passageId) {
    return <p className="p-6 text-red-600">Invalid passage URL.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Passage"
        description="Update the typing passage details."
      />

      <PassageForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitText="Update Passage"
        submitting={submitting}
      />
    </div>
  );
};

export default EditPassagePage;
