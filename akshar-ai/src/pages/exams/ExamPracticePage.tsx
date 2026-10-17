import {
  ClipboardCheck,
  Clock3,
  Languages,
  Target,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useExams } from "../../features/exams/ExamContext";
import type { ExamProfile } from "../../features/exams/types";
import { useNavigate } from "react-router-dom";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export default function ExamPracticePage() {
  const { exams, passages } = useExams();
  const navigate = useNavigate();

  const publishedExams = exams.filter((exam) => exam.status === "published");

  const getPassageCount = (exam: ExamProfile) =>
    exam.passageIds.filter((id) =>
      passages.some((passage) => passage.id === id),
    ).length;

  const handleReviewExam = (examId: string) => {
    navigate(`/exam/${examId}/instructions`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-100">
              <ClipboardCheck size={18} />
              EXAM PREPARATION
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Exam Practice
            </h1>

            <p className="mt-3 text-sm leading-6 text-blue-50 sm:text-base">
              Prepare for typing examinations with structured mock tests, timed
              sessions, and performance evaluation.
            </p>
          </div>

          <div className="hidden rounded-2xl bg-white/15 p-5 sm:block">
            <ClipboardCheck size={54} strokeWidth={1.4} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Available exams</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {publishedExams.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Practice passages</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {passages.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Supported languages</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {new Set(publishedExams.map((exam) => exam.language)).size}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Available mock exams
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select an exam to review its instructions before starting.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {publishedExams.length} published
          </span>
        </div>

        {publishedExams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ClipboardCheck className="mx-auto text-slate-400" size={42} />

            <h3 className="mt-4 font-semibold text-slate-900">
              No exams available yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Published exams will appear here when they are ready.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {publishedExams.map((exam) => (
              <article
                key={exam.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ClipboardCheck size={25} />
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Published
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {exam.title}
                </h3>

                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                  {exam.description}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock3 size={16} />
                      <span className="text-xs">Duration</span>
                    </div>
                    <p className="mt-2 font-semibold text-slate-800">
                      {formatDuration(exam.durationSeconds)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Target size={16} />
                      <span className="text-xs">Target speed</span>
                    </div>
                    <p className="mt-2 font-semibold text-slate-800">
                      {exam.targetWpm} WPM
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Languages size={16} />
                      <span className="text-xs">Language</span>
                    </div>
                    <p className="mt-2 font-semibold text-slate-800">
                      {exam.language}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <FileText size={16} />
                      <span className="text-xs">Passages</span>
                    </div>
                    <p className="mt-2 font-semibold text-slate-800">
                      {getPassageCount(exam)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleReviewExam(exam.id)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start exam
                  <ChevronRight size={18} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
