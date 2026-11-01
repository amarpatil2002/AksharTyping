import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useTyping from "../hooks/useTyping";

const TypingExamDetailPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const {
    selectedExam,
    examDetailLoading,
    passages,
    passageListLoading,
    error,
    fetchExamById,
    fetchPassages,
  } = useTyping();

  // Fetch examination details
  useEffect(() => {
    if (!examId) return;

    fetchExamById(examId).catch((err) => {
      console.error("Failed to fetch examination:", err);
    });
  }, [examId, fetchExamById]);

  // Fetch examination passages
  useEffect(() => {
    if (!examId) return;

    fetchPassages(examId, {
      page: 1,
      limit: 100,
    }).catch((err) => {
      console.error("Failed to fetch passages:", err);
    });
  }, [examId, fetchPassages]);

  // Navigate directly to the setup page.
  // Do not create an attempt on this page.
  const handleConfigureExam = (passage: (typeof passages)[number]) => {
    if (!examId || !selectedExam) return;

    navigate(`/typing-exams/${examId}/passages/${passage._id}/setup`, {
      state: {
        passage,
        examTitle: selectedExam.exam.title,
        examDuration: selectedExam.exam.durationSeconds,
        targetWpm: selectedExam.exam.targetWpm,
        instructions: selectedExam.exam.instructions,
      },
    });
  };

  // Loading state
  if (examDetailLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-6 h-52 animate-pulse rounded-2xl bg-white" />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !selectedExam) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load examination
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error || "Examination not found."}
            </p>

            <Link
              to="/typing-exam"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              ← Back to examinations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { exam, passageCount, isAvailable } = selectedExam;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {/* Back navigation */}
        <Link
          to="/typing-exam"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
        >
          <span>←</span>
          Back to examinations
        </Link>

        {/* Examination information */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 px-5 py-8 text-white sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Typing Examination
                </span>

                <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                  {exam.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                  {exam.description ||
                    "Improve your typing speed, accuracy and overall performance with this examination."}
                </p>
              </div>

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-4xl shadow-lg backdrop-blur-sm">
                ⌨️
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {/* Examination statistics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ExamInfoCard icon="🌐" label="Language" value={exam.language} />

              <ExamInfoCard
                icon="⏱️"
                label="Duration"
                value={`${Math.floor(exam.durationSeconds / 60)} minutes`}
              />

              <ExamInfoCard
                icon="🎯"
                label="Target speed"
                value={`${exam.targetWpm} WPM`}
              />

              <ExamInfoCard
                icon="📄"
                label="Available passages"
                value={String(passageCount)}
              />
            </div>

            {/* Examination instructions */}
            {exam.instructions?.length > 0 && (
              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">
                    📋
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Examination Instructions
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Please read before proceeding.
                    </p>
                  </div>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {exam.instructions.map((instruction, index) => (
                    <li
                      key={`${index}-${instruction}`}
                      className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {index + 1}
                      </span>

                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Passage selection */}
        <section className="mt-10">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-7 rounded-full bg-blue-600" />

                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Step 01 · Select passage
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Choose Your Passage
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Select a typing passage. On the next screen, you can configure
                your font, layout, theme and typing preferences before starting
                the examination.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
              <span className="text-lg">📄</span>

              <span className="text-sm font-bold text-blue-700">
                {passages.length} Passages
              </span>
            </div>
          </div>

          {/* Passage loading */}
          {passageListLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : !isAvailable || passages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                📄
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No passages available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no typing passages available for this
                examination. Please check again later.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {passages.map((passage, index) => (
                <article
                  key={passage._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
                >
                  <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-70 transition group-hover:opacity-100" />

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {/* Card heading */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Passage {String(index + 1).padStart(2, "0")}
                        </span>

                        <h3 className="mt-2 break-words text-lg font-bold text-slate-900 transition group-hover:text-blue-700">
                          {passage.title}
                        </h3>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold capitalize ${
                          passage.difficulty === "easy"
                            ? "bg-green-100 text-green-700"
                            : passage.difficulty === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {passage.difficulty}
                      </span>
                    </div>

                    {/* Passage metadata */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Language
                        </p>

                        <p className="mt-1.5 text-sm font-bold text-slate-800">
                          {passage.language}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Word count
                        </p>

                        <p className="mt-1.5 text-sm font-bold text-slate-800">
                          {passage.wordCount}
                        </p>
                      </div>
                    </div>

                    {/* Configuration information */}
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
                      <span className="text-lg">⚙️</span>

                      <p className="text-xs leading-5 text-blue-800">
                        Customize your examination settings on the next screen
                        before the timer begins.
                      </p>
                    </div>

                    {/* Configure button */}
                    <button
                      type="button"
                      onClick={() => handleConfigureExam(passage)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
                    >
                      Configure Examination
                      <span className="text-base transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Examination information card
const ExamInfoCard = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-100 hover:bg-blue-50/50">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
      {icon}
    </div>

    <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>

    <p className="mt-1 break-words text-base font-extrabold text-slate-900">
      {value}
    </p>
  </div>
);

export default TypingExamDetailPage;
