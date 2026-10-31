import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useTyping from "../hooks/useTyping";

const TypingExamDetailPage = () => {
  const { examId } = useParams<{ examId: string }>();

  const { selectedExam, examDetailLoading, error, fetchExamById } = useTyping();

  useEffect(() => {
    if (examId) {
      fetchExamById(examId).catch(() => {});
    }
  }, [examId, fetchExamById]);

  if (examDetailLoading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-10">
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="mt-5 h-40 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error || !selectedExam) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error || "Examination not found."}</p>

          <Link
            to="/typing-exam"
            className="mt-4 inline-block text-sm font-semibold text-blue-600"
          >
            Back to examinations
          </Link>
        </div>
      </div>
    );
  }

  const { exam, passageCount, isAvailable } = selectedExam;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return remainingSeconds
      ? `${minutes} minutes ${remainingSeconds} seconds`
      : `${minutes} minutes`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/typing-exam"
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Back to examinations
      </Link>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>

        <p className="mt-3 leading-7 text-gray-600">
          {exam.description || "No description available."}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Duration</p>
            <p className="mt-2 font-semibold text-gray-900">
              {formatDuration(exam.durationSeconds)}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Target WPM</p>
            <p className="mt-2 font-semibold text-gray-900">{exam.targetWpm}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Passages</p>
            <p className="mt-2 font-semibold text-gray-900">{passageCount}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Language</p>
            <p className="mt-2 font-semibold text-gray-900">
              {exam.language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Scoring requirements
          </h2>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              Minimum WPM: <strong>{exam.scoring.minimumWpm}</strong>
            </p>

            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              Minimum accuracy: <strong>{exam.scoring.minimumAccuracy}%</strong>
            </p>

            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              Scoring method:{" "}
              <strong className="capitalize">
                {exam.scoring.method.replace("_", " ")}
              </strong>
            </p>

            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              Error penalty: <strong>{exam.scoring.errorPenalty}</strong>
            </p>
          </div>
        </div>

        {exam.instructions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Examination instructions
            </h2>

            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-600">
              {exam.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-8">
          {isAvailable ? (
            <Link
              to={`/typing-exam/${exam._id}/passages`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              Choose a Passage
            </Link>
          ) : (
            <p className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              No published passages are currently available for this
              examination.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingExamDetailPage;
