import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Clock3, FastForward, Keyboard, AlertCircle } from "lucide-react";

import { useExams } from "../../features/exams/ExamContext";
import type { ExamPassage } from "../../features/exams/types";
import ExamStepIndicator from "../../features/exams/components/ExamStepIndicator";

const BREAK_SECONDS = 30;

interface ExamBreakState {
  examId: string;
  passage: ExamPassage;
  durationSeconds: number;
}

export default function ExamBreakPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId } = useParams();
  const { exams, passages } = useExams();

  const [remainingSeconds, setRemainingSeconds] = useState(BREAK_SECONDS);
  const transitionedRef = useRef(false);

  const incomingState = location.state as ExamBreakState | null;

  const exam = exams.find(
    (item) => item.id === examId && item.status === "published",
  );

  // Always return to the top when the break page opens.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  const startFinalTest = useCallback(() => {
    if (!exam || transitionedRef.current) return;

    const assignedPassages = passages.filter(
      (passage) =>
        exam.passageIds.includes(passage.id) &&
        passage.language === exam.language,
    );

    if (assignedPassages.length === 0) {
      transitionedRef.current = true;
      navigate("/exam", { replace: true });
      return;
    }

    const incomingPassageIsValid =
      incomingState?.examId === exam.id &&
      incomingState.durationSeconds === exam.durationSeconds &&
      incomingState.passage != null &&
      assignedPassages.some(
        (passage) => passage.id === incomingState.passage.id,
      );

    const selectedPassage = incomingPassageIsValid
      ? assignedPassages.find(
          (passage) => passage.id === incomingState.passage.id,
        )!
      : assignedPassages[Math.floor(Math.random() * assignedPassages.length)];

    transitionedRef.current = true;

    navigate(`/exam/${exam.id}/test`, {
      replace: true,
      state: {
        passage: selectedPassage,
        durationSeconds: exam.durationSeconds,
        examId: exam.id,
      },
    });
  }, [exam, passages, navigate, incomingState]);

  // Redirect if the exam is unavailable.
  useEffect(() => {
    if (!exam) {
      navigate("/exam", { replace: true });
    }
  }, [exam, navigate]);

  // Countdown and automatic transition.
  useEffect(() => {
    if (!exam || transitionedRef.current) return;

    if (remainingSeconds <= 0) {
      startFinalTest();
      return;
    }

    const timer = window.setTimeout(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [remainingSeconds, startFinalTest, exam]);

  if (!exam) return null;

  const progress = ((BREAK_SECONDS - remainingSeconds) / BREAK_SECONDS) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Step 3: Preparation break */}
      <ExamStepIndicator currentStep={2} />

      <main className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Clock3 size={28} />
          </div>

          <p className="mt-6 text-xs font-bold tracking-[0.18em] text-slate-500">
            PREPARATION BREAK
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            Get ready for your final test
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Take a short break. Your selected typing passage is ready. The final
            test starts automatically when the countdown reaches zero.
          </p>

          {/* Countdown */}
          <div
            className="my-8 text-6xl font-bold tabular-nums text-slate-950 sm:text-7xl"
            role="timer"
            aria-label={`${remainingSeconds} seconds remaining`}
            aria-live="off"
          >
            00:{String(remainingSeconds).padStart(2, "0")}
          </div>

          {/* Progress bar */}
          <div
            className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Preparation break progress"
            aria-valuemin={0}
            aria-valuemax={BREAK_SECONDS}
            aria-valuenow={BREAK_SECONDS - remainingSeconds}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Next phase information */}
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={startFinalTest}
              disabled={transitionedRef.current}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FastForward size={18} />
              Skip and continue
            </button>

            <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600">
              <Keyboard size={18} />
              Final test · {exam.language}
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            The next phase starts automatically when the timer reaches zero.
          </p>
        </section>
      </main>
    </div>
  );
}
