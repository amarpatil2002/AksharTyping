import { useNavigate } from "react-router-dom";
import type { TypingExam, TypingExamStatus } from "../types/typingExam.types";

interface ExamTableProps {
  exams: TypingExam[];
  onViewPassages: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TypingExamStatus) => void;
  updatingStatus: string | null;
}

const ExamTable = ({
  exams,
  onViewPassages,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatus,
}: ExamTableProps) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return remainingSeconds
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes} min`;
  };

  const navigate = useNavigate();

  const formatLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const getStatusStyle = (status: TypingExamStatus) => {
    switch (status) {
      case "published":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "archived":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      default:
        return "bg-slate-100 text-slate-600 ring-slate-500/20";
    }
  };

  const getScoringStyle = (method: string) => {
    switch (method) {
      case "weighted":
        return "bg-violet-50 text-violet-700";
      case "accuracy":
        return "bg-sky-50 text-sky-700";
      case "net_wpm":
        return "bg-orange-50 text-orange-700";
      case "custom":
        return "bg-pink-50 text-pink-700";
      case "fixed_error_penalty":
        return "bg-red-50 text-red-700";
      case "grouped_error_penalty":
        return "bg-amber-50 text-amber-700";
      case "correct_words_ratio":
        return "bg-cyan-50 text-cyan-700";
      case "qualifying_only":
        return "bg-indigo-50 text-indigo-700";
      case "speed_based":
        return "bg-emerald-50 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (!exams.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-900">
          No examinations found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          There are no typing examinations available to display.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Examination
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Language
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Duration
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Target speed
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Marks
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Passing
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Scoring
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {exams.map((exam) => (
              <tr
                key={exam._id}
                onClick={() => onViewPassages(exam._id)}
                className="group cursor-pointer transition-colors hover:bg-blue-50/40"
              >
                {/* Examination */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 transition-colors group-hover:bg-blue-100">
                      {exam.title.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate font-semibold text-gray-900">
                        {exam.title}
                      </p>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-gray-400">
                        {exam.slug}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Language */}
                <td className="px-5 py-4">
                  <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                    {exam.language}
                  </span>
                </td>

                {/* Duration */}
                <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="9" strokeWidth="1.7" />
                      <path
                        strokeLinecap="round"
                        strokeWidth="1.7"
                        d="M12 7v5l3 2"
                      />
                    </svg>
                    {formatDuration(exam.durationSeconds)}
                  </div>
                </td>

                {/* Target WPM */}
                <td className="whitespace-nowrap px-5 py-4">
                  <span className="font-semibold text-gray-800">
                    {exam.targetWpm}
                  </span>
                  <span className="ml-1 text-xs text-gray-400">WPM</span>
                </td>

                {/* Maximum marks */}
                <td className="whitespace-nowrap px-5 py-4">
                  <span className="font-semibold text-gray-900">
                    {exam.maximumMarks}
                  </span>
                  <span className="ml-1 text-xs text-gray-400">Marks</span>
                </td>

                {/* Passing percentage */}
                <td className="whitespace-nowrap px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-800">
                      {exam.passingPercentage}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {(
                        (exam.maximumMarks * exam.passingPercentage) /
                        100
                      ).toFixed(2)}{" "}
                      marks required
                    </span>
                  </div>
                </td>

                {/* Scoring configuration */}
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold ${getScoringStyle(
                        exam.scoring.method,
                      )}`}
                    >
                      {formatLabel(exam.scoring.method)}
                    </span>

                    <details
                      className="max-w-[240px] text-xs"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <summary
                        className="cursor-pointer font-medium text-blue-600 hover:text-blue-800"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Scoring details
                      </summary>

                      <div className="mt-2 min-w-[220px] space-y-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                        <div>
                          <p className="font-semibold text-gray-700">
                            Calculation
                          </p>
                          <p className="mt-1 text-gray-500">
                            Speed:{" "}
                            {exam.scoring.speedCalculation
                              ? formatLabel(exam.scoring.speedCalculation)
                              : "Not configured"}
                          </p>
                          <p className="text-gray-500">
                            Accuracy:{" "}
                            {exam.scoring.accuracyCalculation
                              ? formatLabel(exam.scoring.accuracyCalculation)
                              : "Not configured"}
                          </p>
                        </div>

                        <div className="border-t border-gray-100 pt-2">
                          <p className="font-semibold text-gray-700">
                            Error configuration
                          </p>
                          <p className="mt-1 text-gray-500">
                            General penalty: {exam.scoring.errorPenalty}
                          </p>
                          <p className="text-gray-500">
                            Errors per group:{" "}
                            {exam.scoring.errorsPerGroup ?? "Not configured"}
                          </p>
                          <p className="text-gray-500">
                            Group penalty:{" "}
                            {exam.scoring.groupPenalty ?? "Not configured"}
                          </p>
                        </div>

                        {exam.scoring.errorPenalties && (
                          <div className="border-t border-gray-100 pt-2">
                            <p className="font-semibold text-gray-700">
                              Individual error penalties
                            </p>

                            {Object.entries(exam.scoring.errorPenalties).map(
                              ([key, value]) => (
                                <p key={key} className="text-gray-500">
                                  {formatLabel(key)}: {value}
                                </p>
                              ),
                            )}
                          </div>
                        )}

                        <div className="border-t border-gray-100 pt-2">
                          <p className="font-semibold text-gray-700">
                            Evaluation settings
                          </p>
                          <p className="mt-1 text-gray-500">
                            Minimum WPM: {exam.scoring.minimumWpm}
                          </p>
                          <p className="text-gray-500">
                            Minimum accuracy: {exam.scoring.minimumAccuracy}%
                          </p>
                          <p className="text-gray-500">
                            Rounding:{" "}
                            {exam.scoring.rounding
                              ? formatLabel(exam.scoring.rounding)
                              : "Not configured"}
                          </p>
                          <p className="text-gray-500">
                            Not reached:{" "}
                            {exam.scoring.notReachedPolicy
                              ? formatLabel(exam.scoring.notReachedPolicy)
                              : "Not configured"}
                          </p>
                          <p className="text-gray-500">
                            Policy version:{" "}
                            {exam.scoring.policyVersion ?? "Not configured"}
                          </p>
                        </div>

                        {exam.scoring.qualification && (
                          <div className="border-t border-gray-100 pt-2">
                            <p className="font-semibold text-gray-700">
                              Qualification
                            </p>
                            <p className="mt-1 text-gray-500">
                              Minimum marks:{" "}
                              {exam.scoring.qualification.minimumMarks ?? 0}
                            </p>
                            <p className="text-gray-500">
                              Minimum WPM:{" "}
                              {exam.scoring.qualification.minimumWpm ?? 0}
                            </p>
                            <p className="text-gray-500">
                              Minimum accuracy:{" "}
                              {exam.scoring.qualification.minimumAccuracy ?? 0}%
                            </p>
                            <p className="text-gray-500">
                              Maximum errors:{" "}
                              {exam.scoring.qualification.maximumErrors ??
                                "No limit"}
                            </p>
                            <p className="text-gray-500">
                              Maximum error percentage:{" "}
                              {exam.scoring.qualification
                                .maximumErrorPercentage ?? "No limit"}
                              {exam.scoring.qualification
                                .maximumErrorPercentage != null && "%"}
                            </p>
                            <p className="text-gray-500">
                              Require all conditions:{" "}
                              {exam.scoring.qualification.requireAll
                                ? "Yes"
                                : "No"}
                            </p>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <select
                      value={exam.status}
                      disabled={updatingStatus === exam._id}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        onStatusChange(
                          exam._id,
                          event.target.value as TypingExamStatus,
                        )
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${getStatusStyle(
                        exam.status,
                      )}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>

                    {updatingStatus === exam._id && (
                      <span className="text-[10px] font-medium text-blue-600">
                        Updating...
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/typing-exams/${exam._id}/details`);
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(exam._id);
                      }}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(exam._id);
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">{exams.length}</span>{" "}
          {exams.length === 1 ? "examination" : "examinations"}
        </p>

        <p className="text-xs text-gray-400">
          Select an examination to manage its passages.
        </p>
      </div>
    </div>
  );
};

export default ExamTable;
