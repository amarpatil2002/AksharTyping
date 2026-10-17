import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Languages,
  ShieldCheck,
  Target,
  AlertCircle,
} from "lucide-react";
import { useExams } from "../../features/exams/ExamContext";
import ExamStepIndicator from "../../features/exams/components/ExamStepIndicator";
import type { ExamPassage } from "../../features/exams/types";

export default function ExamInstructionsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { exams, passages } = useExams();
  const [confirmed, setConfirmed] = useState(false);

  const exam = exams.find(
    (item) => item.id === examId && item.status === "published",
  );

  const assignedPassages = useMemo(
    () =>
      (exam?.passageIds ?? [])
        .map((id) => passages.find((p) => p.id === id))
        .filter(
          (passage): passage is ExamPassage =>
            passage !== undefined && passage.language === exam?.language,
        ),
    [exam, passages],
  );

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ExamStepIndicator currentStep={0} />

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto text-amber-500" size={40} />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Exam unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This exam may have been unpublished or does not exist.
          </p>

          <button
            type="button"
            onClick={() => navigate("exam")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to exams
          </button>
        </div>
      </div>
    );
  }

  const durationMinutes = Math.floor(exam.durationSeconds / 60);
  const durationSeconds = exam.durationSeconds % 60;

  const formattedDuration =
    durationSeconds === 0
      ? `${durationMinutes} minutes`
      : `${durationMinutes} min ${durationSeconds} sec`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Persistent exam progress indicator */}
      <ExamStepIndicator currentStep={0} />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-10 sm:px-6 sm:py-8">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => navigate("/exam")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Exam Practice
        </button>

        {/* Exam summary */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white sm:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <ShieldCheck size={19} />
            EXAM INSTRUCTIONS
          </div>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{exam.title}</h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
            {exam.description}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric
              icon={<Clock3 size={19} />}
              label="Duration"
              value={formattedDuration}
            />

            <Metric
              icon={<Target size={19} />}
              label="Target speed"
              value={`${exam.targetWpm} WPM`}
            />

            <Metric
              icon={<Languages size={19} />}
              label="Language"
              value={exam.language}
            />
          </div>
        </section>

        {/* Instructions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900">Before you begin</h2>

          <div className="mt-5 space-y-4">
            <Instruction
              number="01"
              title="Check your keyboard and language"
              description={`Make sure your keyboard is ready for ${exam.language} typing before starting.`}
            />

            <Instruction
              number="02"
              title="Manage your time"
              description={`You will have ${formattedDuration} for this mock examination. The timer starts when you begin typing.`}
            />

            <Instruction
              number="03"
              title="Type the displayed passage"
              description="Follow the passage shown on the test screen. Avoid switching tabs or refreshing the page during your attempt."
            />

            <Instruction
              number="04"
              title="Review your results"
              description={`Your mock results will show typing speed, accuracy, errors, and whether you reached the configured target of ${exam.targetWpm} WPM.`}
            />
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Practice simulation</p>

            <p className="mt-1 text-sm leading-5 text-amber-800">
              These are sample exam settings. Actual recruitment examination
              rules, marking schemes, and qualifying criteria may differ.
            </p>
          </div>
        </section>

        {/* Assigned passages */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <BookOpen className="text-blue-600" size={22} />

            <div>
              <h2 className="font-bold text-slate-900">Included passages</h2>

              <p className="mt-1 text-sm text-slate-500">
                {assignedPassages.length} assigned to this mock exam
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {assignedPassages.map((passage, index) => (
              <div
                key={passage.id}
                className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-medium">
                  {index + 1}
                </span>

                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">
                    {passage.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {passage.language} · {passage.difficulty} ·{" "}
                    {passage.text.length} characters
                  </p>
                </div>
              </div>
            ))}

            {assignedPassages.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No compatible passages are assigned to this exam yet. Please
                choose another exam.
              </p>
            )}
          </div>
        </section>

        {/* Confirmation and start */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 size-4 accent-blue-600"
            />

            <span className="text-sm leading-6 text-slate-700">
              I have read the instructions and understand that this is a mock
              examination using sample settings.
            </span>
          </label>

          <button
            type="button"
            disabled={!confirmed || assignedPassages.length === 0}
            onClick={() =>
              navigate(`/exam/${exam.id}/keyboard-test`, {
                state: { examId: exam.id },
              })
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <CheckCircle2 size={19} />I Agree — Start Exam
          </button>
        </section>
      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/15 p-4">
      <div className="flex items-center gap-2 text-sm text-blue-100">
        {icon}
        {label}
      </div>

      <p className="mt-2 font-bold">{value}</p>
    </div>
  );
}

function Instruction({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
        {number}
      </span>

      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
