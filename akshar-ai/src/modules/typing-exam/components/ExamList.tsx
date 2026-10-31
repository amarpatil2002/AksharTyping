import ExamCard from "./ExamCard";
import type { TypingExam } from "../types/typing.types";

interface ExamListProps {
  exams: TypingExam[];
  loading: boolean;
  error?: string | null;
}

const ExamList = ({ exams, loading, error }: ExamListProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-64 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">{error}</p>
      </div>
    );
  }

  if (!exams.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <h3 className="text-lg font-semibold text-gray-800">
          No examinations available
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          There are currently no published typing examinations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <ExamCard key={exam._id} exam={exam} />
      ))}
    </div>
  );
};

export default ExamList;
