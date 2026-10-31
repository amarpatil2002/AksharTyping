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

  if (!exams.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No typing exams found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-5 py-4">Exam</th>
            <th className="px-5 py-4">Language</th>
            <th className="px-5 py-4">Duration</th>
            <th className="px-5 py-4">Target WPM</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {exams.map((exam) => (
            <tr
              key={exam._id}
              onClick={() => onViewPassages(exam._id)}
              className="cursor-pointer transition hover:bg-gray-50"
            >
              <td className="px-5 py-4">
                <p className="font-medium text-gray-900">{exam.title}</p>
                <p className="mt-1 text-xs text-gray-500">{exam.slug}</p>
              </td>

              <td className="px-5 py-4 uppercase text-gray-600">
                {exam.language}
              </td>

              <td className="px-5 py-4 text-gray-600">
                {formatDuration(exam.durationSeconds)}
              </td>

              <td className="px-5 py-4 text-gray-600">{exam.targetWpm} WPM</td>

              <td className="px-5 py-4">
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
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize outline-none transition disabled:opacity-50 ${
                    exam.status === "published"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : exam.status === "archived"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-gray-200 bg-gray-100 text-gray-600"
                  }`}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(exam._id);
                    }}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(exam._id);
                    }}
                    className="font-medium text-red-600 hover:text-red-800"
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
  );
};

export default ExamTable;
