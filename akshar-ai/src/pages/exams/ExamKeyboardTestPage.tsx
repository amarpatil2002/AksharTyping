import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Clock3, SkipForward, X, AlertCircle } from "lucide-react";

import { useExams } from "../../features/exams/ExamContext";
import type { ExamPassage } from "../../features/exams/types";
import ExamStepIndicator from "../../features/exams/components/ExamStepIndicator";

const TEST_DURATION = 180;

const KEY_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

interface KeyboardTestState {
  examId: string;
  passage: ExamPassage;
  durationSeconds: number;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(
    2,
    "0",
  )}`;
}

export default function ExamKeyboardTestPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { exams, passages } = useExams();

  const exam = exams.find(
    (item) => item.id === examId && item.status === "published",
  );

  const [typedText, setTypedText] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(TEST_DURATION);
  const [hasStarted, setHasStarted] = useState(false);
  const [testedKeys, setTestedKeys] = useState<string[]>([]);
  const [lastKey, setLastKey] = useState("");
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transitionedRef = useRef(false);

  const wordsTyped = typedText.trim()
    ? typedText.trim().split(/\s+/).length
    : 0;

  const totalKeys = 37;

  // Start at the top of the page and focus the typing area.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    textareaRef.current?.focus();
  }, []);

  const goToBreak = useCallback(() => {
    if (!exam || transitionedRef.current) return;

    const eligiblePassages = passages.filter(
      (passage) =>
        exam.passageIds.includes(passage.id) &&
        passage.language === exam.language,
    );

    if (eligiblePassages.length === 0) {
      transitionedRef.current = true;
      navigate("/exam", { replace: true });
      return;
    }

    transitionedRef.current = true;

    const randomIndex = Math.floor(Math.random() * eligiblePassages.length);

    const state: KeyboardTestState = {
      examId: exam.id,
      passage: eligiblePassages[randomIndex],
      durationSeconds: exam.durationSeconds,
    };

    navigate(`/exam/${exam.id}/break`, {
      replace: true,
      state,
    });
  }, [exam, passages, navigate]);

  useEffect(() => {
    if (!exam) {
      navigate("/exam", { replace: true });
    }
  }, [exam, navigate]);

  // Keyboard test countdown.
  useEffect(() => {
    if (!hasStarted || remainingSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [hasStarted, remainingSeconds]);

  // Automatically proceed when the timer finishes.
  useEffect(() => {
    if (hasStarted && remainingSeconds === 0) {
      goToBreak();
    }
  }, [hasStarted, remainingSeconds, goToBreak]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (transitionedRef.current) return;

    // Start the timer on the first actual key press.
    if (!hasStarted) {
      setHasStarted(true);
    }

    const key = event.key;
    const normalizedKey = key === " " ? "SPACE" : key.toUpperCase();

    setLastKey(normalizedKey);

    if (
      key.length === 1 ||
      key === "Backspace" ||
      key === "Enter" ||
      key === "Tab" ||
      key.startsWith("Arrow")
    ) {
      setTestedKeys((previous) => {
        return previous.includes(normalizedKey)
          ? previous
          : [...previous, normalizedKey];
      });
    }
  };

  const handleExit = () => {
    transitionedRef.current = true;
    navigate("/exam");
  };

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Exam progress: keyboard test is step 2 of 5 */}
      <ExamStepIndicator currentStep={1} />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowExitConfirmation(true)}
              aria-label="Exit keyboard test"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={22} />
            </button>

            <div>
              <h1 className="font-bold text-slate-900">{exam.title}</h1>

              <p className="text-sm text-slate-500">
                Phase 2 · Keyboard Test · Unscored
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full bg-blue-50 px-4 py-2 text-blue-700 sm:self-auto">
            <Clock3 size={18} />

            <span className="font-bold tabular-nums">
              {formatTime(remainingSeconds)}
            </span>

            <span className="text-xs text-blue-600">LEFT</span>
          </div>
        </header>

        {/* Instructions and statistics */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-700">
              KEYBOARD CHECK
            </p>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Type anything to check that your keyboard is working. The timer
              starts on your first keystroke. This phase is not scored and does
              not affect your final result.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="Words" value={wordsTyped} />
            <Metric label="Keystrokes" value={typedText.length} />
            <Metric
              label="Keys tested"
              value={`${testedKeys.length}/${totalKeys}`}
            />
          </div>
        </section>

        {/* Typing area */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <label htmlFor="keyboard-check-input" className="sr-only">
            Type here to test your keyboard
          </label>

          <textarea
            ref={textareaRef}
            id="keyboard-check-input"
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Start typing here..."
            className="min-h-48 w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-lg leading-8 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:min-h-56 sm:p-6"
          />

          {/* Visual keyboard */}
          <div className="mt-6 flex flex-col items-center gap-2">
            {KEY_ROWS.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex flex-wrap justify-center gap-1.5"
              >
                {row.map((key) => {
                  const isActive = lastKey === key;
                  const wasTested = testedKeys.includes(key);

                  return (
                    <div
                      key={key}
                      className={`flex h-9 w-8 items-center justify-center rounded-md border text-xs font-medium transition sm:h-10 sm:w-10 ${
                        isActive
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : wasTested
                            ? "border-blue-200 bg-blue-50 text-blue-800"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {key}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Space bar */}
            <div
              className={`mt-1 flex h-8 w-56 items-center justify-center rounded-md border text-xs transition ${
                lastKey === "SPACE"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : testedKeys.includes("SPACE")
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              Space
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Keys you press will be highlighted on the keyboard above.
          </p>
        </section>

        {/* Footer */}
        <footer className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:px-6">
          <p className="text-sm text-slate-500">
            {hasStarted
              ? "Your keyboard check is in progress. Skip whenever you're ready."
              : "Press any key to start the timer. You may also skip this phase."}
          </p>

          <button
            type="button"
            onClick={goToBreak}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <SkipForward size={18} />
            Skip keyboard test
            <ArrowRight size={17} />
          </button>
        </footer>

        {/* Exit confirmation dialog */}
        {showExitConfirmation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-dialog-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <AlertCircle size={22} />
                </div>

                <h2
                  id="exit-dialog-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Exit keyboard test?
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Leaving now returns you to the Exam Practice page. Your current
                keyboard-check input will not be saved.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirmation(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Continue test
                </button>

                <button
                  type="button"
                  onClick={handleExit}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:min-w-24 sm:p-4">
      <p className="truncate text-2xl font-bold tabular-nums text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}
