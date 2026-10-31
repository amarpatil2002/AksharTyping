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

  const handleSubmit = async (values: CreateTypingExamPayload) => {
    try {
      await createExam(values);

      showToast("Typing exam created successfully.", "success");
      navigate("/typing-exams");
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to create typing exam."),
        "error",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Typing Exam"
        description="Configure a new typing examination."
      />

      <ExamForm onSubmit={handleSubmit} submitText="Create Exam" />
    </div>
  );
};

export default CreateExamPage;
