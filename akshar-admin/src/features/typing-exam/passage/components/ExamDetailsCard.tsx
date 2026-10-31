import type { TypingExam } from "../../exam/types/typingExam.types";

interface ExamDetailsCardProps {
  exam: TypingExam;
  passageCount: number;
}

const ExamDetailsCard = ({ exam, passageCount }: ExamDetailsCardProps) => {
  const duration = `${Math.floor(exam.durationSeconds / 60)} min`;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{exam.title}</h2>

          <p className="mt-1 text-sm text-gray-500">
            {exam.description || "No description provided."}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            exam.status === "published"
              ? "bg-green-50 text-green-700"
              : exam.status === "archived"
                ? "bg-red-50 text-red-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {exam.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Detail label="Language" value={exam.language.toUpperCase()} />
        <Detail label="Duration" value={duration} />
        <Detail label="Target WPM" value={`${exam.targetWpm} WPM`} />
        <Detail label="Total Passages" value={String(passageCount)} />
      </div>
    </section>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-gray-50 p-3">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="mt-1 font-semibold text-gray-900">{value}</p>
  </div>
);

export default ExamDetailsCard;
