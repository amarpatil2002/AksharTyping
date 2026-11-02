import type {
  TypingPassage,
  TypingPassageStatus,
  TypingPassageLanguage,
} from "../types/passage.types";

// ============================================================
// PROPS
// ============================================================

interface PassageTableProps {
  passages: TypingPassage[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TypingPassageStatus) => void;
  updatingStatusId: string | null;
}

// ============================================================
// HELPERS
// ============================================================

const formatLanguage = (language: TypingPassageLanguage): string =>
  language.charAt(0).toUpperCase() + language.slice(1);

const formatDifficulty = (difficulty: string): string =>
  difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

const getStatusStyles = (status: TypingPassageStatus): string => {
  const styles: Record<TypingPassageStatus, string> = {
    published: "border-green-200 bg-green-50 text-green-700",
    draft: "border-gray-200 bg-gray-100 text-gray-600",
    archived: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return styles[status];
};

const getDifficultyStyles = (difficulty: string): string => {
  const styles: Record<string, string> = {
    easy: "bg-green-50 text-green-700",
    medium: "bg-blue-50 text-blue-700",
    hard: "bg-red-50 text-red-700",
  };

  return styles[difficulty] ?? "bg-gray-100 text-gray-600";
};

// ============================================================
// COMPONENT
// ============================================================

const PassageTable = ({
  passages,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatusId,
}: PassageTableProps) => {
  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

        <p className="mt-3 text-sm text-gray-500">Loading passages...</p>
      </div>
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (!passages.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="mt-3 font-semibold text-gray-800">No passages found</p>

        <p className="mt-1 text-sm text-gray-500">
          Add a passage or adjust your filters to see results.
        </p>
      </div>
    );
  }

  // ==========================================================
  // TABLE
  // ==========================================================

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[850px] text-left text-sm">
        {/* TABLE HEADER */}

        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-5 py-4 font-semibold">Title</th>

            <th className="px-5 py-4 font-semibold">Language</th>

            <th className="px-5 py-4 font-semibold">Difficulty</th>

            <th className="px-5 py-4 font-semibold">Words</th>

            <th className="px-5 py-4 font-semibold">Status</th>

            <th className="px-5 py-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>

        {/* TABLE BODY */}

        <tbody className="divide-y divide-gray-100">
          {passages.map((passage) => {
            const isUpdating = updatingStatusId === passage._id;

            return (
              <tr key={passage._id} className="transition hover:bg-gray-50">
                {/* TITLE */}

                <td className="px-5 py-4">
                  <div className="max-w-xs">
                    <p className="truncate font-medium text-gray-900">
                      {passage.title || "Untitled Passage"}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      ID: {passage._id.slice(-8)}
                    </p>
                  </div>
                </td>

                {/* LANGUAGE */}

                <td className="px-5 py-4 text-gray-600">
                  {formatLanguage(passage.language)}
                </td>

                {/* DIFFICULTY */}

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getDifficultyStyles(
                      passage.difficulty,
                    )}`}
                  >
                    {formatDifficulty(passage.difficulty)}
                  </span>
                </td>

                {/* WORD COUNT */}

                <td className="px-5 py-4 tabular-nums text-gray-600">
                  {passage.wordCount.toLocaleString()}
                </td>

                {/* STATUS */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Change status for ${passage.title || "passage"}`}
                      value={passage.status}
                      disabled={isUpdating}
                      onChange={(event) => {
                        const status = event.target
                          .value as TypingPassageStatus;

                        if (status !== passage.status) {
                          onStatusChange(passage._id, status);
                        }
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${getStatusStyles(
                        passage.status,
                      )}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>

                    {isUpdating && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    )}
                  </div>
                </td>

                {/* ACTIONS */}

                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(passage._id)}
                      className="font-medium text-blue-600 transition hover:text-blue-800"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(passage._id)}
                      className="font-medium text-red-600 transition hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PassageTable;
