import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  Globe2,
  Keyboard,
  LoaderCircle,
  ShieldCheck,
  Target,
} from "lucide-react";

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

  useEffect(() => {
    if (!examId) return;

    fetchExamById(examId).catch((err) => {
      console.error("Failed to fetch examination:", err);
    });
  }, [examId, fetchExamById]);

  useEffect(() => {
    if (!examId) return;

    fetchPassages(examId, {
      page: 1,
      limit: 100,
    }).catch((err) => {
      console.error("Failed to fetch passages:", err);
    });
  }, [examId, fetchPassages]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes && remainingSeconds) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    if (minutes) return `${minutes} min`;

    return `${remainingSeconds}s`;
  };

  const handleConfigureExam = (passage: (typeof passages)[number]) => {
    if (!examId || !selectedExam) return;

    navigate(`/typing-exams/${examId}/passages/${passage._id}/setup`, {
      state: {
        passage,
        examTitle: selectedExam.exam.title,
        examDuration: selectedExam.exam.durationSeconds,
        targetWpm: selectedExam.exam.targetWpm,
        instructions: selectedExam.exam.instructions,
        marksConfiguration: selectedExam.marksConfiguration,
      },
    });
  };

  if (examDetailLoading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="h-10 w-36 animate-pulse rounded-lg bg-white" />

          <div className="mt-6 h-52 animate-pulse rounded-2xl bg-white" />

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-white"
              />
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !selectedExam) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <section className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <BookOpen size={23} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-[#101828]">
            Unable to load examination
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            {error || "The requested examination could not be found."}
          </p>

          <Link
            to="/typing-exams"
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-4 text-sm font-semibold text-white transition hover:bg-[#004EEB]"
          >
            <ArrowLeft size={16} />
            Back to examinations
          </Link>
        </section>
      </main>
    );
  }

  const { exam, passageCount, isAvailable, marksConfiguration } = selectedExam;

  const examDetails = [
    {
      label: "Language",
      value: exam.language,
      icon: Globe2,
    },
    {
      label: "Duration",
      value: formatDuration(exam.durationSeconds),
      icon: Clock3,
    },
    {
      label: "Target speed",
      value: `${exam.targetWpm} WPM`,
      icon: Gauge,
    },
    {
      label: "Available passages",
      value: String(passageCount),
      icon: FileText,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        {/* Navigation */}
        <Link
          to="/typing-exams"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2 text-sm font-medium text-[#475467] shadow-sm transition hover:border-[#155EEF] hover:text-[#155EEF]"
        >
          <ArrowLeft size={16} />
          All examinations
        </Link>

        {/* Exam overview */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#155EEF] to-[#2563EB] px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-white/[0.06]" />
            <div className="pointer-events-none absolute -bottom-28 right-32 h-56 w-56 rounded-full border border-white/10" />

            <div className="relative flex items-center gap-4 sm:gap-6">
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
                <Keyboard size={34} strokeWidth={1.5} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-50">
                  <ShieldCheck size={13} />
                  Typing examination
                </div>

                <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                  {exam.title}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  {exam.description ||
                    "Practice your typing skills and improve your speed, accuracy and overall performance."}
                </p>
              </div>

              <div className="hidden shrink-0 text-right md:block">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isAvailable ? "bg-green-300" : "bg-red-300"
                    }`}
                  />
                  {isAvailable ? "Available" : "Unavailable"}
                </div>
              </div>
            </div>
          </div>

          {/* Exam information */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {examDetails.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2 text-[#667085]">
                      <Icon size={15} className="text-[#155EEF]" />
                      <span className="text-xs">{item.label}</span>
                    </div>

                    <p className="mt-2 truncate text-base font-semibold capitalize text-[#101828] sm:text-lg">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Marks configuration */}
            {marksConfiguration && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-center gap-2">
                  <Award size={17} className="text-[#155EEF]" />
                  <h2 className="text-sm font-semibold text-[#101828]">
                    Marks and qualifying criteria
                  </h2>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-[#667085]">Maximum marks</p>
                    <p className="mt-1 text-xl font-bold text-[#101828]">
                      {marksConfiguration.maximumMarks}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#667085]">Passing percentage</p>
                    <p className="mt-1 text-xl font-bold text-[#101828]">
                      {marksConfiguration.passingPercentage}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#667085]">Passing marks</p>
                    <p className="mt-1 text-xl font-bold text-[#101828]">
                      {marksConfiguration.passingMarks}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {exam.instructions?.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#E4E7EC] p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-[#155EEF]" />
                  <h2 className="text-sm font-semibold text-[#101828]">
                    Examination instructions
                  </h2>
                </div>

                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {exam.instructions.map((instruction, index) => (
                    <li
                      key={`${index}-${instruction}`}
                      className="flex items-start gap-2.5 text-sm leading-5 text-[#475467]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-[#155EEF]">
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

        {/* Passage section */}
        <section className="mt-8">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#155EEF]">
                Examination preparation
              </p>

              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[#101828] sm:text-2xl">
                Select your passage
              </h2>

              <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#667085]">
                Choose a passage to configure your typing workspace and begin
                your examination.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E4E7EC] bg-white px-3 py-2 text-xs font-semibold text-[#475467]">
              <FileText size={14} className="text-[#155EEF]" />
              {passageCount} passages
            </span>
          </div>

          {/* Loading */}
          {passageListLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white"
                />
              ))}
            </div>
          ) : !isAvailable || passages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#155EEF]">
                <FileText size={25} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-[#101828]">
                No passages available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
                There are currently no passages available for this examination.
                Please check again later.
              </p>

              <Link
                to="/typing-exams"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#155EEF] hover:text-[#004EEB]"
              >
                <ArrowLeft size={15} />
                Browse other examinations
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {passages.map((passage, index) => {
                const difficulty =
                  passage.difficulty?.toLowerCase() || "standard";

                const difficultyClass =
                  difficulty === "easy"
                    ? "bg-green-50 text-green-700"
                    : difficulty === "medium"
                      ? "bg-amber-50 text-amber-700"
                      : difficulty === "hard"
                        ? "bg-red-50 text-red-700"
                        : "bg-blue-50 text-blue-700";

                const wordCount =
                  passage.wordCount ??
                  (passage.content || "").trim().split(/\s+/).filter(Boolean)
                    .length;

                return (
                  <article
                    key={passage._id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#B2CCFF] hover:shadow-[0_12px_28px_rgba(21,94,239,0.09)]"
                  >
                    <div className="h-1 w-full bg-gradient-to-r from-[#155EEF] to-[#60A5FA]" />

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#155EEF] transition group-hover:bg-[#155EEF] group-hover:text-white">
                            <FileText size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3]">
                              Passage {String(index + 1).padStart(2, "0")}
                            </p>

                            <h3 className="mt-1 break-words text-base font-semibold leading-5 text-[#101828] transition group-hover:text-[#155EEF]">
                              {passage.title}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${difficultyClass}`}
                        >
                          {difficulty}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-3">
                          <div className="flex items-center gap-2 text-xs text-[#667085]">
                            <Globe2 size={14} className="text-[#155EEF]" />
                            Language
                          </div>

                          <p className="mt-2 truncate text-sm font-semibold capitalize text-[#101828]">
                            {passage.language}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-3">
                          <div className="flex items-center gap-2 text-xs text-[#667085]">
                            <FileText size={14} className="text-[#155EEF]" />
                            Word count
                          </div>

                          <p className="mt-2 text-sm font-semibold text-[#101828]">
                            {wordCount.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F5F8FF] px-3 py-2.5 text-xs leading-5 text-[#475467]">
                        <Target size={15} className="shrink-0 text-[#155EEF]" />
                        Configure your workspace before starting.
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfigureExam(passage)}
                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004EEB] focus:outline-none focus:ring-4 focus:ring-blue-100"
                      >
                        Configure examination
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#E4E7EC] pt-5 text-center">
          <p className="text-xs text-[#98A2B3]">
            © {new Date().getFullYear()} Akshar AI. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default TypingExamDetailPage;
