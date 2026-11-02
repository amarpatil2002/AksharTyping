import { useNavigate } from "react-router-dom";
import type { TypingExam } from "../../exam/types/typingExam.types";

interface ExamDetailsCardProps {
  exam: TypingExam;
  passageCount: number;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${remainingSeconds} sec`;
  if (remainingSeconds === 0) return `${minutes} min`;

  return `${minutes} min ${remainingSeconds} sec`;
};

const formatLanguage = (language: string): string =>
  language.charAt(0).toUpperCase() + language.slice(1);

const ExamDetailsCard = ({ exam, passageCount }: ExamDetailsCardProps) => {
  const navigate = useNavigate();

  return (
    <section className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">
              {exam.title}
            </h2>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                exam.status === "published"
                  ? "bg-green-50 text-green-700"
                  : exam.status === "archived"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {exam.status}
            </span>
          </div>

          {exam.description && (
            <p className="mt-1 line-clamp-1 text-xs text-gray-500">
              {exam.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/typing-exams/${exam._id}/edit`)}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          Edit Exam
        </button>
      </div>

      {/* Important Examination Information */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-gray-400">Language</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {formatLanguage(exam.language)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-gray-400">Duration</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {formatDuration(exam.durationSeconds)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-gray-400">Target Speed</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {exam.targetWpm} WPM
          </p>
        </div>

        <div>
          <p className="text-[11px] text-gray-400">Total Passages</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {passageCount}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExamDetailsCard;
