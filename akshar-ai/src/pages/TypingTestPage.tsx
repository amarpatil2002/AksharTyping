import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Keyboard,
  RotateCcw,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { Passage } from "../features/passages/passageData";
import { ADMIN_PASSAGES } from "../features/passages/passageData";

type TypingMode = "separate" | "overlay";
type TestStatus = "idle" | "running" | "completed";

interface TypingNavigationState {
  passage?: Passage;
  durationSeconds?: number;
}

const DEFAULT_DURATION = 60;
const DEFAULT_PASSAGE = ADMIN_PASSAGES[0];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds} seconds`;
  if (seconds === 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;

  return `${minutes} min ${seconds} sec`;
}

export default function TypingTestPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationState = location.state as TypingNavigationState | null;

  const passage = navigationState?.passage ?? DEFAULT_PASSAGE;

  const requestedDuration = Number(navigationState?.durationSeconds);
  const initialDuration =
    Number.isFinite(requestedDuration) &&
    requestedDuration >= 10 &&
    requestedDuration <= 3600
      ? Math.floor(requestedDuration)
      : DEFAULT_DURATION;

  const [typedText, setTypedText] = useState("");
  const [remainingTime, setRemainingTime] = useState(initialDuration);
  const [status, setStatus] = useState<TestStatus>("idle");
  const [typingMode, setTypingMode] = useState<TypingMode>("overlay");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);

  const elapsedSeconds = initialDuration - remainingTime;

  const correctCharacters = useMemo(() => {
    let correct = 0;

    for (let index = 0; index < typedText.length; index += 1) {
      if (typedText[index] === passage.text[index]) {
        correct += 1;
      }
    }

    return correct;
  }, [typedText, passage.text]);

  const errors = typedText.length - correctCharacters;

  const accuracy =
    typedText.length > 0
      ? Math.round((correctCharacters / typedText.length) * 100)
      : 100;

  const wpm =
    elapsedSeconds > 0
      ? Math.round(correctCharacters / 5 / (elapsedSeconds / 60))
      : 0;

  const progress =
    passage.text.length > 0
      ? Math.min((typedText.length / passage.text.length) * 100, 100)
      : 0;

  const finishTest = useCallback(() => {
    setStatus("completed");
  }, []);

  // Countdown begins with the first typed character.
  useEffect(() => {
    if (status !== "running") return;

    const intervalId = window.setInterval(() => {
      setRemainingTime((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setStatus("completed");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [status]);

  const handleTyping = (value: string) => {
    if (status === "completed") return;

    // Keep typing input on one line to match normalized passages.
    const nextValue = value
      .replace(/[\r\n]/g, "")
      .slice(0, passage.text.length);

    if (status === "idle" && nextValue.length > 0) {
      startTimeRef.current = Date.now();
      setStatus("running");
    }

    setTypedText(nextValue);

    if (nextValue.length >= passage.text.length) {
      finishTest();
    }
  };

  const resetTest = () => {
    setTypedText("");
    setRemainingTime(initialDuration);
    setStatus("idle");
    startTimeRef.current = null;

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const tryAnotherPassage = () => {
    navigate("/passages");
  };

  const characterStatus = (index: number) => {
    if (index >= typedText.length) return "remaining";

    return typedText[index] === passage.text[index] ? "correct" : "incorrect";
  };

  const renderCharacters = () =>
    passage.text.split("").map((character, index) => {
      const state = characterStatus(index);

      const colorClass =
        state === "correct"
          ? "text-emerald-600"
          : state === "incorrect"
            ? "rounded-sm bg-red-100 text-red-600 underline decoration-red-400"
            : "text-slate-400";

      const isCursor = index === typedText.length && status !== "completed";

      return (
        <span
          key={index}
          className={`${colorClass} ${isCursor ? "border-l-2 border-blue-500" : ""}`}
        >
          {character === " " ? "\u00A0" : character}
        </span>
      );
    });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={tryAnotherPassage}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to passages
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Typing test
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {passage.title} · {passage.difficulty} ·{" "}
            {formatDuration(initialDuration)}
          </p>
        </div>

        <button
          type="button"
          onClick={resetTest}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw size={16} />
          Restart test
        </button>
      </div>

      {/* Live statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Words per minute"
          value={String(wpm)}
          icon={<Zap size={18} />}
          accent="blue"
        />
        <MetricCard
          label="Accuracy"
          value={`${accuracy}%`}
          icon={<Target size={18} />}
          accent="green"
        />
        <MetricCard
          label="Errors"
          value={String(errors)}
          icon={<Keyboard size={18} />}
          accent="red"
        />
        <MetricCard
          label="Time remaining"
          value={formatTime(remainingTime)}
          icon={<Clock3 size={18} />}
          accent={remainingTime <= 10 ? "red" : "blue"}
        />
      </div>

      {/* Progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-700">
            Passage progress
          </span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <Legend color="bg-emerald-500" label="Correct" />
          <Legend color="bg-red-500" label="Incorrect" />
          <Legend color="bg-slate-300" label="Remaining" />
        </div>
      </section>

      {/* Typing workspace */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">{passage.title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {passage.text.length.toLocaleString()} characters
            </p>
          </div>

          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
            <ModeButton
              active={typingMode === "separate"}
              onClick={() => setTypingMode("separate")}
            >
              Separate
            </ModeButton>
            <ModeButton
              active={typingMode === "overlay"}
              onClick={() => setTypingMode("overlay")}
            >
              Overlay
            </ModeButton>
          </div>
        </div>

        {status === "completed" ? (
          <div className="px-5 py-12 text-center sm:px-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Trophy size={30} />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Practice complete!
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              You practiced “{passage.title}” for{" "}
              {formatDuration(initialDuration - remainingTime)}.
            </p>

            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3">
              <ResultMetric label="WPM" value={String(wpm)} />
              <ResultMetric label="Accuracy" value={`${accuracy}%`} />
              <ResultMetric label="Errors" value={String(errors)} />
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={resetTest}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <RotateCcw size={16} />
                Try again
              </button>

              <button
                type="button"
                onClick={tryAnotherPassage}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Choose another passage
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-4 sm:p-6">
            {typingMode === "separate" ? (
              <>
                <div className="rounded-xl bg-slate-50 p-4 font-mono text-base leading-8 sm:p-6 sm:text-lg sm:leading-9">
                  {renderCharacters()}
                </div>

                <label
                  htmlFor="typing-input"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Type the passage here
                </label>

                <textarea
                  id="typing-input"
                  ref={inputRef}
                  value={typedText}
                  onChange={(event) => handleTyping(event.target.value)}
                  onPaste={(event) => event.preventDefault()}
                  rows={5}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder={
                    status === "idle"
                      ? "Start typing to begin the timer..."
                      : "Keep typing..."
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-4 font-mono text-base leading-8 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </>
            ) : (
              <div className="relative">
                <div className="pointer-events-none min-h-56 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-base leading-8 sm:p-6 sm:text-lg sm:leading-9">
                  {renderCharacters()}
                </div>

                <textarea
                  ref={inputRef}
                  value={typedText}
                  onChange={(event) => handleTyping(event.target.value)}
                  onPaste={(event) => event.preventDefault()}
                  aria-label="Type the displayed passage"
                  rows={7}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="absolute inset-0 h-full min-h-56 w-full resize-none rounded-xl bg-transparent p-4 font-mono text-base leading-8 text-transparent caret-blue-600 outline-none selection:bg-blue-200/50 sm:p-6 sm:text-lg sm:leading-9"
                />
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                {status === "idle"
                  ? "The timer starts automatically with your first character."
                  : `${typedText.length} of ${passage.text.length} characters typed.`}
              </p>

              <button
                type="button"
                onClick={resetTest}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={15} />
                Restart
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Quick tips */}
      <section className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">
            Tip for better results
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Aim for accuracy before speed. Keep your hands relaxed, look at the
            passage, and maintain a steady typing rhythm.
          </p>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "blue" | "green" | "red";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 flex size-9 items-center justify-center rounded-xl ${styles[accent]}`}
      >
        {icon}
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-white text-blue-700 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
