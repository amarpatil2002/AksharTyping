import type {
  TypingPassage,
  TypingPassageStatus,
  TypingPassageLanguage,
} from "../types/passage.types";

interface PassageTableProps {
  passages: TypingPassage[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TypingPassageStatus) => void;
  updatingStatusId: string | null;
}

const formatLanguage = (language: TypingPassageLanguage) =>
  language.charAt(0).toUpperCase() + language.slice(1);

const PassageTable = ({
  passages,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatusId,
}: PassageTableProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Loading passages...
      </div>
    );
  }

  if (!passages.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="font-medium text-gray-800">No passages added yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Add your first passage to this examination.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-5 py-4">Title</th>
            <th className="px-5 py-4">Language</th>
            <th className="px-5 py-4">Difficulty</th>
            <th className="px-5 py-4">Words</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {passages.map((passage) => (
            <tr key={passage._id} className="hover:bg-gray-50">
              <td className="px-5 py-4 font-medium text-gray-900">
                {passage.title}
              </td>

              <td className="px-5 py-4 text-gray-600">
                {formatLanguage(passage.language)}
              </td>

              <td className="px-5 py-4 capitalize text-gray-600">
                {passage.difficulty}
              </td>

              <td className="px-5 py-4 text-gray-600">{passage.wordCount}</td>

              <td className="px-5 py-4">
                <select
                  value={passage.status}
                  disabled={updatingStatusId === passage._id}
                  onChange={(event) =>
                    onStatusChange(
                      passage._id,
                      event.target.value as TypingPassageStatus,
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize outline-none transition disabled:opacity-50 ${
                    passage.status === "published"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : passage.status === "archived"
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
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(passage._id)}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(passage._id)}
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

export default PassageTable;
