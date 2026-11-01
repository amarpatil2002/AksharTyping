import type { TypingPassage } from "../types/typing.types";

interface PassageCardProps {
  passage: TypingPassage;
  onStart: (passageId: string) => void;
  loading?: boolean;
}

const difficultyStyles = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const PassageCard = ({
  passage,
  onStart,
  loading = false,
}: PassageCardProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {passage.title}
          </h3>

          <p className="mt-1 text-sm text-gray-500">{passage.language}</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            difficultyStyles[passage.difficulty]
          }`}
        >
          {passage.difficulty}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5 text-sm text-gray-600">
        <span>{passage.wordCount} words</span>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => onStart(passage._id)}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Starting..." : "Start Examination"}
      </button>
    </div>
  );
};

export default PassageCard;
