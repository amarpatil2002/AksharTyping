import { useNavigate } from "react-router-dom";
import type { TypingExam } from "../types/typing.types";

interface ExamCardProps {
  exam: TypingExam;
}

const ExamCard = ({ exam }: ExamCardProps) => {
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return remainingSeconds
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes} minutes`;
  };

  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>

          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            Published
          </span>
        </div>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
          {exam.description || "No description available."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="mt-1 font-semibold text-gray-800">
              {formatDuration(exam.durationSeconds)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Target WPM</p>
            <p className="mt-1 font-semibold text-gray-800">{exam.targetWpm}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Language</p>
            <p className="mt-1 font-semibold text-gray-800">
              {exam.language.toUpperCase()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Scoring</p>
            <p className="mt-1 font-semibold capitalize text-gray-800">
              {exam.scoring.method.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/typing-exams/${exam._id}`)}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        View Examination
      </button>
    </article>
  );
};

export default ExamCard;
