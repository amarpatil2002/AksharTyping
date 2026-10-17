import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  Columns2,
  Layers,
  Highlighter,
  Keyboard,
} from "lucide-react";

import { useExams } from "../../features/exams/ExamContext";
import type { ExamPassage } from "../../features/exams/types";
import ExamStepIndicator from "../../features/exams/components/ExamStepIndicator";

interface ExamTestState {
  examId: string;
  passage: ExamPassage;
  durationSeconds: number;
}

interface ExamResultState {
  examId: string;
  examTitle: string;
  passageTitle: string;
  originalText: string;
  typedText: string;
  wpm: number;
  accuracy: number;
  errors: number;
  correctCharacters: number;
  incorrectCharacters: number;
  missedCharacters: number;
  extraCharacters: number;
  durationSeconds: number;
  elapsedSeconds: number;
  targetWpm: number;
  passed: boolean;
  performanceHistory: PerformancePoint[];
}

interface PerformancePoint {
  elapsedSeconds: number;
  wpm: number;
  accuracy: number;
  errors: number;
}

type LayoutMode = "stacked" | "horizontal";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(
    2,
    "0",
  )}`;
}

export default function ExamTestPage() {
  const { examId } = useParams<{ examId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { exams, passages } = useExams();

  const exam = exams.find(
    (item) => item.id === examId && item.status === "published",
  );

  const routeState = location.state as ExamTestState | null;

  const assignedPassages = useMemo(
    () =>
      exam?.passageIds
        .map((id) => passages.find((p) => p.id === id))
        .filter(
          (item): item is ExamPassage =>
            item !== undefined && item.language === exam?.language,
        ) ?? [],
    [exam, passages],
  );

  const validPassage =
    exam &&
    routeState?.examId === exam.id &&
    routeState.durationSeconds === exam.durationSeconds &&
    routeState.passage &&
    exam.passageIds.includes(routeState.passage.id) &&
    assignedPassages.some((item) => item.id === routeState.passage.id);

  const passage = validPassage ? routeState.passage : null;

  const [typedText, setTypedText] = useState("");
  const [timeLeft, setTimeLeft] = useState(
    validPassage && exam ? exam.durationSeconds : 0,
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [layout, setLayout] = useState<LayoutMode>("horizontal");
  const [textHighlight, setTextHighlight] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<
    PerformancePoint[]
  >([]);

  const lastSampledSecondRef = useRef(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const finishedRef = useRef(false);

  const reference = useMemo(
    () => (passage ? Array.from(passage.text) : []),
    [passage],
  );

  const typed = useMemo(() => Array.from(typedText), [typedText]);

  const correctCharacters = typed.filter(
    (character, index) => character === reference[index],
  ).length;

  const errors = typed.length - correctCharacters;

  const wordsTyped = typedText.trim()
    ? typedText.trim().split(/\s+/).length
    : 0;

  const accuracy =
    typed.length > 0
      ? Math.round((correctCharacters / typed.length) * 100)
      : 100;

  const elapsedSeconds = exam ? exam.durationSeconds - timeLeft : 0;

  const wpm =
    elapsedSeconds > 0
      ? Math.round(correctCharacters / 5 / (elapsedSeconds / 60))
      : 0;

  // Record cumulative performance every five seconds after typing starts.
  useEffect(() => {
    if (!exam || !passage || !hasStarted || finishedRef.current) return;
    if (elapsedSeconds <= 0 || elapsedSeconds % 5 !== 0) return;
    if (lastSampledSecondRef.current === elapsedSeconds) return;

    lastSampledSecondRef.current = elapsedSeconds;
    setPerformanceHistory((previous) => [
      ...previous,
      { elapsedSeconds, wpm, accuracy, errors },
    ]);
  }, [exam, passage, hasStarted, elapsedSeconds, wpm, accuracy, errors]);

  // Scroll to the top and focus the typing area when the exam opens.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    if (validPassage) {
      textareaRef.current?.focus();
    }
  }, [validPassage]);

  // Return to instructions if the exam session is invalid.
  useEffect(() => {
    if (!exam || !passage) {
      navigate(exam ? `/exam/${exam.id}/instructions` : "/exam", {
        replace: true,
      });
    }
  }, [exam, passage, navigate]);

  const finishExam = useCallback(
    (finalText = typedText) => {
      if (finishedRef.current || !exam || !passage) return;

      finishedRef.current = true;
      setShowSubmitConfirm(false);

      const finalCharacters = Array.from(finalText);
      const referenceCharacters = Array.from(passage.text);

      // Actual time spent typing
      const elapsedSeconds = Math.max(0, exam.durationSeconds - timeLeft);

      let correctCharacters = 0;
      let incorrectCharacters = 0;
      let extraCharacters = 0;

      finalCharacters.forEach((character, index) => {
        if (index >= referenceCharacters.length) {
          extraCharacters++;
        } else if (character === referenceCharacters[index]) {
          correctCharacters++;
        } else {
          incorrectCharacters++;
        }
      });

      const missedCharacters = Math.max(
        0,
        referenceCharacters.length - finalCharacters.length,
      );

      const errors = incorrectCharacters + extraCharacters;

      const accuracy =
        finalCharacters.length > 0
          ? Math.round((correctCharacters / finalCharacters.length) * 100)
          : 100;

      // Avoid division by zero for very fast submissions.
      const calculationSeconds = Math.max(1, elapsedSeconds);

      const wpm = Math.round(correctCharacters / 5 / (calculationSeconds / 60));

      const finalTimeline: PerformancePoint[] = [
        ...performanceHistory.filter(
          (point) => point.elapsedSeconds < elapsedSeconds,
        ),
        {
          elapsedSeconds,
          wpm,
          accuracy,
          errors,
        },
      ];

      const result: ExamResultState = {
        examId: exam.id,
        examTitle: exam.title,
        passageTitle: passage.title,
        originalText: passage.text,
        typedText: finalText,
        wpm,
        accuracy,
        errors,
        correctCharacters,
        incorrectCharacters,
        missedCharacters,
        extraCharacters,
        durationSeconds: exam.durationSeconds,
        elapsedSeconds,
        targetWpm: exam.targetWpm,
        passed: wpm >= exam.targetWpm,
        performanceHistory: finalTimeline,
      };

      // Pass the complete result to the dedicated results page.
      navigate(`/exam/${exam.id}/result`, {
        replace: true,
        state: { result },
      });
    },
    [exam, passage, timeLeft, typedText, navigate, performanceHistory],
  );

  // Countdown starts when the user begins typing.
  useEffect(() => {
    if (!exam || !passage || !hasStarted || finishedRef.current) {
      return;
    }

    if (timeLeft <= 0) {
      finishExam();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [exam, passage, hasStarted, timeLeft, finishExam]);

  const handleTyping = (value: string) => {
    if (finishedRef.current || !passage) return;

    const nextText = value.replace(/[\r\n]/g, "").slice(0, reference.length);

    if (nextText.length > 0 && !hasStarted) {
      setHasStarted(true);
    }

    setTypedText(nextText);

    if (nextText.length >= reference.length) {
      finishExam(nextText);
    }
  };

  const renderPassage = () =>
    reference.map((character, index) => {
      const isTyped = index < typed.length;
      const isCorrect = typed[index] === character;
      const isCursor = index === typed.length;

      let color = "text-slate-500";

      if (textHighlight && isTyped) {
        color = isCorrect
          ? "text-emerald-600"
          : "rounded-sm bg-red-100 text-red-600";
      } else if (isTyped) {
        color = "text-slate-900";
      }

      return (
        <span
          key={index}
          className={`${color} ${isCursor ? "border-l-2 border-blue-600" : ""}`}
        >
          {character === " " ? "\u00A0" : character}
        </span>
      );
    });

  if (!exam || !passage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Keyboard className="mx-auto mb-3 h-10 w-10 text-blue-600" />

          <h1 className="text-xl font-bold text-slate-900">
            {!exam ? "Exam unavailable" : "Exam session unavailable"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Return to the exam instructions and start a valid session.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(exam ? `/exam/${exam.id}/instructions` : "/exam", {
                replace: true,
              })
            }
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Return to exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-slate-50 text-slate-900">
      {/* Progress stepper: step 4 of 5 */}
      <div className="shrink-0">
        <ExamStepIndicator currentStep={3} />
      </div>

      {/* Top toolbar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/exam/${exam.id}/instructions`)}
            aria-label="Return to exam instructions"
            title="Return to instructions"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-semibold text-slate-900">
              {exam.title}
            </h1>

            <p className="truncate text-xs text-slate-500">
              {passage.title} · {passage.language}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <ToggleButton
              active={layout === "stacked"}
              onClick={() => setLayout("stacked")}
              icon={<Layers size={16} />}
            >
              Stacked
            </ToggleButton>

            <ToggleButton
              active={layout === "horizontal"}
              onClick={() => setLayout("horizontal")}
              icon={<Columns2 size={16} />}
            >
              Side by side
            </ToggleButton>
          </div>

          <ToggleButton
            active={textHighlight}
            onClick={() => setTextHighlight((value) => !value)}
            icon={<Highlighter size={16} />}
          >
            Text highlight
          </ToggleButton>

          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${
              timeLeft <= 30
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-100 bg-blue-50 text-blue-700"
            }`}
          >
            <Clock3 size={18} />

            <span className="font-bold tabular-nums">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* Statistics */}
      <section className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white sm:grid-cols-6">
        <Metric label="WORDS TYPED" value={`${wordsTyped}`} />
        <Metric label="ACCURACY" value={typed.length ? `${accuracy}%` : "—"} />
        <Metric label="GROSS WPM" value={`${wpm}`} />
        <Metric label="NET WPM" value={`${Math.max(0, wpm)}`} />
        <Metric label="MISTAKES" value={`${errors}`} />
        <Metric label="KEYSTROKES" value={`${typed.length}`} />
      </section>

      {/* Typing area */}
      <main className="min-h-0 flex-1 p-3 sm:p-5">
        <div
          className={`grid h-full min-h-0 gap-4 ${
            layout === "horizontal"
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1 grid-rows-2"
          }`}
        >
          {/* Reference passage */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Reference passage
              </h2>

              <span className="text-xs text-slate-400">
                {reference.length} characters
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words p-5 font-mono text-base leading-8 sm:text-lg">
              {renderPassage()}
            </div>
          </section>

          {/* User typing input */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Your typing
              </h2>

              <span className="text-xs text-slate-400">
                {hasStarted ? "Exam in progress" : "Ready to start"}
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={typedText}
              onChange={(event) => handleTyping(event.target.value)}
              onPaste={(event) => event.preventDefault()}
              onDrop={(event) => event.preventDefault()}
              disabled={finishedRef.current}
              autoFocus
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="Exam typing input"
              placeholder="Start typing the passage here..."
              className="min-h-0 w-full flex-1 resize-none bg-white p-5 font-mono text-base leading-8 text-slate-900 caret-blue-600 outline-none placeholder:font-sans placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-100 sm:text-lg"
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 flex-col items-start justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <p className="text-xs text-slate-500">
          {hasStarted
            ? "Your exam timer is running. Pasting is disabled."
            : "The timer starts when you type your first character."}
        </p>

        <button
          type="button"
          onClick={() => setShowSubmitConfirm(true)}
          disabled={!hasStarted || finishedRef.current}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check size={18} />
          Finish &amp; see result
        </button>
      </footer>

      {/* Submission confirmation with remaining-word summary */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="confirm-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Submit with {formatTime(timeLeft)} left?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Submitting is final. You cannot return to this passage, and
                  words you have not reached will be counted as omissions.
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Clock3 size={22} />
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-4">
              <div className="flex items-center justify-between gap-4 py-3.5">
                <span className="text-sm text-slate-600">Words typed</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                  {wordsTyped} /{" "}
                  {passage.text.trim()
                    ? passage.text.trim().split(/\s+/).length
                    : 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3.5">
                <span className="text-sm text-slate-600">Mistakes so far</span>
                <span
                  className={`text-sm font-semibold tabular-nums ${errors > 0 ? "text-red-700" : "text-emerald-700"}`}
                >
                  {errors}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3.5">
                <span className="text-sm text-slate-600">Unreached words</span>
                <span
                  className={`text-sm font-bold tabular-nums ${Math.max(0, (passage.text.trim() ? passage.text.trim().split(/\s+/).length : 0) - wordsTyped) > 0 ? "text-red-700" : "text-emerald-700"}`}
                >
                  {Math.max(
                    0,
                    (passage.text.trim()
                      ? passage.text.trim().split(/\s+/).length
                      : 0) - wordsTyped,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Keep typing
              </button>

              <button
                type="button"
                onClick={() => finishExam()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Check size={17} />
                Submit &amp; finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-slate-100 px-3 py-3 last:border-r-0 sm:px-4">
      <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-semibold tracking-wide text-slate-500 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}
