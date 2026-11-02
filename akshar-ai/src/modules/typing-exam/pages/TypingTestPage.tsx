import { useCallback, useEffect, useRef, useState } from "react";

import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";

import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowDown,
  Check,
  Clock3,
  Columns2,
  FileText,
  Highlighter,
  Keyboard,
  Maximize,
  Minimize,
  Moon,
  RotateCcw,
  Rows2,
  Send,
  Sun,
  Type,
  UserRound,
  X,
} from "lucide-react";

import {
  submitTypingAttempt,
  updateTypingProgress,
} from "../services/typing.service";

import { useAuth } from "../../auth/hooks/useAuth";

// ============================================================
// TYPES
// ============================================================

type ThemeMode = "light" | "dark";
type FontSize = "small" | "medium" | "large";
type FontFamily = "arial" | "roboto" | "inter" | "calibri" | "times" | "mono";

type WorkspaceLayout = "horizontal" | "vertical";

interface PassageData {
  _id: string;
  title: string;
  content: string;
  language: string;
  wordCount?: number;
  difficulty?: string;
}

interface AttemptData {
  _id: string;
  typedText?: string;
  progressVersion: number;
  configSnapshot?: {
    durationSeconds?: number;
  };
}

interface ExamSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  fontFamily: FontFamily;
  showPassage: boolean;
  highlightErrors: boolean;
  allowBackspace: boolean;
  allowPaste: boolean;
  showStatistics: boolean;
  autoScroll: boolean;
}

interface TypingTestLocationState {
  attempt: AttemptData;
  passage: PassageData;
  remainingSeconds: number;
  settings?: Partial<ExamSettings>;
}

const DEFAULT_SETTINGS: ExamSettings = {
  theme: "light",
  fontSize: "medium",
  fontFamily: "arial",
  showPassage: true,
  highlightErrors: true,
  allowBackspace: true,
  allowPaste: false,
  showStatistics: true,
  autoScroll: true,
};

const FONT_FAMILIES: Record<FontFamily, string> = {
  arial: "Arial, Helvetica, sans-serif",
  roboto: "Roboto, Arial, sans-serif",
  inter: "Inter, Arial, sans-serif",
  calibri: "Calibri, Arial, sans-serif",
  times: '"Times New Roman", Times, serif',
  mono: '"Courier New", Courier, monospace',
};

const FONT_SIZES: Record<FontSize, string> = {
  small: "15px",
  medium: "17px",
  large: "20px",
};

// ============================================================
// WORD-BASED EVALUATION HELPERS
// ============================================================

const getWords = (value: string): string[] =>
  value.trim() ? value.normalize("NFC").trim().split(/\s+/) : [];

interface WordEvaluation {
  totalWords: number;
  wordsTyped: number;
  correctWords: number;
  incorrectWords: number;
  omissions: number;
  extraWords: number;
  totalErrors: number;
  referenceWordStates: Array<"correct" | "incorrect" | "omitted" | "pending">;
}

/**
 * Aligns typed words with reference words using word-level edit distance.
 * This is a live UI estimate; the backend remains authoritative at submission.
 */
const evaluateWords = (
  referenceText: string,
  typedText: string,
): WordEvaluation => {
  const referenceWords = getWords(referenceText);
  const typedWords = getWords(typedText);
  const rows = referenceWords.length + 1;
  const columns = typedWords.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () =>
    Array(columns).fill(0),
  );

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < columns; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      const same = referenceWords[i - 1] === typedWords[j - 1];
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (same ? 0 : 1),
      );
    }
  }

  const states: WordEvaluation["referenceWordStates"] = Array(
    referenceWords.length,
  ).fill("pending");
  let correctWords = 0;
  let incorrectWords = 0;
  let omissions = 0;
  let extraWords = 0;
  let i = referenceWords.length;
  let j = typedWords.length;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] ===
        dp[i - 1][j - 1] + (referenceWords[i - 1] === typedWords[j - 1] ? 0 : 1)
    ) {
      if (referenceWords[i - 1] === typedWords[j - 1]) {
        states[i - 1] = "correct";
        correctWords += 1;
      } else {
        states[i - 1] = "incorrect";
        incorrectWords += 1;
      }
      i -= 1;
      j -= 1;
    } else if (j === 0 && i > 0) {
      // Words after the current typing position are not omissions yet.
      states[i - 1] = "pending";
      i -= 1;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      states[i - 1] = "omitted";
      omissions += 1;
      i -= 1;
    } else {
      extraWords += 1;
      j -= 1;
    }
  }

  const totalErrors = incorrectWords + omissions + extraWords;

  return {
    totalWords: referenceWords.length,
    wordsTyped: typedWords.length,
    correctWords,
    incorrectWords,
    omissions,
    extraWords,
    totalErrors,
    referenceWordStates: states,
  };
};

const tokenizePassage = (value: string): string[] =>
  value.match(/\s+|\S+/g) ?? [];

// ============================================================
// MAIN COMPONENT
// ============================================================

const TypingTestPage = () => {
  const { examId, passageId } = useParams<{
    examId: string;
    passageId: string;
  }>();

  const location = useLocation();
  const navigate = useNavigate();

  // Authenticated candidate
  const { user } = useAuth();
  const candidateName = user?.name?.trim() || "Candidate";

  const routeState = location.state as TypingTestLocationState | null;

  const attempt = routeState?.attempt;
  const passage = routeState?.passage;

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [typedText, setTypedText] = useState(attempt?.typedText ?? "");

  const [remainingSeconds, setRemainingSeconds] = useState(
    routeState?.remainingSeconds ?? 0,
  );

  const [progressVersion, setProgressVersion] = useState(
    attempt?.progressVersion ?? 0,
  );

  const [isTypingStarted, setIsTypingStarted] = useState(
    Boolean(attempt?.typedText?.length),
  );

  const [settings, setSettings] = useState<ExamSettings>({
    ...DEFAULT_SETTINGS,
    ...(routeState?.settings ?? {}),
  });

  const [workspaceLayout, setWorkspaceLayout] =
    useState<WorkspaceLayout>("horizontal");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  const [saveError, setSaveError] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const latestText = useRef(typedText);
  const latestVersion = useRef(progressVersion);
  const savingRef = useRef(false);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  // ----------------------------------------------------------
  // THEME
  // ----------------------------------------------------------

  const dark = settings.theme === "dark";

  const ui = {
    page: dark ? "bg-[#101828] text-slate-100" : "bg-[#F8FAFC] text-[#101828]",

    panel: dark ? "border-slate-700 bg-[#1D2939]" : "border-[#E4E7EC] bg-white",

    muted: dark ? "text-slate-400" : "text-[#667085]",

    border: dark ? "border-slate-700" : "border-[#E4E7EC]",

    input: dark ? "bg-[#101828] text-slate-100" : "bg-white text-[#101828]",
  };

  const fontStyle = {
    fontFamily: FONT_FAMILIES[settings.fontFamily],
    fontSize: FONT_SIZES[settings.fontSize],
  };

  // ----------------------------------------------------------
  // LIFECYCLE
  // ----------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    latestText.current = typedText;
  }, [typedText]);

  useEffect(() => {
    latestVersion.current = progressVersion;
  }, [progressVersion]);

  // ----------------------------------------------------------
  // PASSAGE INFORMATION
  // ----------------------------------------------------------

  const targetText = passage?.content ?? "";

  const passageWordCount = passage?.wordCount ?? getWords(targetText).length;

  const wordEvaluation = evaluateWords(targetText, typedText);
  const typedWordCount = wordEvaluation.wordsTyped;
  const correctWords = wordEvaluation.correctWords;
  const incorrectWords = wordEvaluation.incorrectWords;
  const totalWordErrors = wordEvaluation.totalErrors;

  // Live accuracy uses correct words divided by words entered.
  const accuracy =
    typedWordCount > 0 ? (correctWords / typedWordCount) * 100 : 100;

  const elapsedSeconds = Math.max(
    0,
    (routeState?.remainingSeconds ?? 0) - remainingSeconds,
  );

  const grossWpm =
    elapsedSeconds > 0 ? typedWordCount / (elapsedSeconds / 60) : 0;

  const progress = passageWordCount
    ? Math.min(100, (typedWordCount / passageWordCount) * 100)
    : 0;

  const timer = `${String(Math.floor(remainingSeconds / 60)).padStart(
    2,
    "0",
  )}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  const updateSetting = <K extends keyof ExamSettings>(
    key: K,
    value: ExamSettings[K],
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const increaseFont = () => {
    const sizes: FontSize[] = ["small", "medium", "large"];

    const index = sizes.indexOf(settings.fontSize);

    updateSetting("fontSize", sizes[Math.min(index + 1, 2)]);
  };

  const decreaseFont = () => {
    const sizes: FontSize[] = ["small", "medium", "large"];

    const index = sizes.indexOf(settings.fontSize);

    updateSetting("fontSize", sizes[Math.max(index - 1, 0)]);
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setWorkspaceLayout("horizontal");
  };

  // ----------------------------------------------------------
  // FULLSCREEN
  // ----------------------------------------------------------

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // ----------------------------------------------------------
  // TYPING HANDLER
  // ----------------------------------------------------------

  const handleTyping = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (submitted || submitting || remainingSeconds <= 0) {
      return;
    }

    const value = event.target.value;

    if (value.length > 0 && !isTypingStarted) {
      setIsTypingStarted(true);
    }

    setTypedText(value);
    latestText.current = value;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      !settings.allowBackspace &&
      (event.key === "Backspace" || event.key === "Delete")
    ) {
      event.preventDefault();
    }

    if (
      !settings.allowPaste &&
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "v"
    ) {
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!settings.allowPaste) {
      event.preventDefault();
    }
  };

  // ----------------------------------------------------------
  // PASSAGE AUTO-SCROLL
  // ----------------------------------------------------------

  useEffect(() => {
    if (!settings.showPassage || !settings.autoScroll) {
      return;
    }

    const container = passageRef.current;

    if (!container) return;

    const currentCharacter = container.querySelector(
      `[data-character-index="${typedText.length}"]`,
    );

    if (!currentCharacter) return;

    const containerRect = container.getBoundingClientRect();

    const characterRect = currentCharacter.getBoundingClientRect();

    if (characterRect.bottom > containerRect.bottom - 35) {
      container.scrollTop += characterRect.bottom - containerRect.bottom + 35;
    } else if (characterRect.top < containerRect.top + 20) {
      container.scrollTop -= containerRect.top + 20 - characterRect.top;
    }
  }, [typedText.length, settings.showPassage, settings.autoScroll]);

  // ----------------------------------------------------------
  // SAVE PROGRESS
  // ----------------------------------------------------------

  const saveProgress = useCallback(async () => {
    if (
      !attempt?._id ||
      !isTypingStarted ||
      submitted ||
      submittingRef.current ||
      savingRef.current
    ) {
      return;
    }

    savingRef.current = true;

    if (mountedRef.current) {
      setSaving(true);
      setSaveError("");
    }

    try {
      const response = await updateTypingProgress(attempt._id, {
        typedText: latestText.current,
        progressVersion: latestVersion.current,
      });

      latestVersion.current = response.progressVersion;

      if (mountedRef.current) {
        setProgressVersion(response.progressVersion);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Unable to save typing progress:", error);

      if (mountedRef.current) {
        setSaveError("Unable to save progress. Please retry.");
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }, [attempt?._id, isTypingStarted, submitted]);

  // Autosave every 10 seconds.

  useEffect(() => {
    if (!isTypingStarted || submitted || !attempt?._id) {
      return;
    }

    const interval = window.setInterval(() => {
      void saveProgress();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [isTypingStarted, submitted, attempt?._id, saveProgress]);

  // ----------------------------------------------------------
  // SUBMIT EXAM
  // ----------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (
      !attempt?._id ||
      submitted ||
      submittingRef.current ||
      savingRef.current
    ) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSaveError("");

    try {
      const response = await submitTypingAttempt(attempt._id, {
        typedText: latestText.current,
        progressVersion: latestVersion.current,
      });

      setSubmitted(true);

      navigate(`/typing-exams/attempts/${attempt._id}/result`, {
        replace: true,
        state: { result: response },
      });
    } catch (error) {
      console.error("Unable to submit examination:", error);

      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to submit examination. Please try again.",
      );

      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [attempt?._id, submitted, navigate]);

  // ----------------------------------------------------------
  // TIMER
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isTypingStarted || submitted || submitting || remainingSeconds <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [isTypingStarted, submitted, submitting, remainingSeconds]);

  useEffect(() => {
    if (isTypingStarted && remainingSeconds <= 0 && !submitted && !submitting) {
      void handleSubmit();
    }
  }, [isTypingStarted, remainingSeconds, submitted, submitting, handleSubmit]);

  // ----------------------------------------------------------
  // PASSAGE RENDERING
  // ----------------------------------------------------------

  const renderPassage = () => {
    const tokens = tokenizePassage(targetText);
    let wordIndex = -1;
    let characterIndex = 0;

    return tokens.map((token, tokenIndex) => {
      const isWord = /\S/.test(token);
      if (isWord) wordIndex += 1;

      const state = isWord
        ? wordEvaluation.referenceWordStates[wordIndex]
        : undefined;
      const className =
        state === "correct"
          ? dark
            ? "text-emerald-400"
            : "text-emerald-700"
          : state === "incorrect"
            ? settings.highlightErrors
              ? dark
                ? "bg-red-900/50 text-red-300"
                : "bg-red-100 text-red-700"
              : ""
            : state === "omitted"
              ? settings.highlightErrors
                ? dark
                  ? "bg-amber-900/40 text-amber-300"
                  : "bg-amber-100 text-amber-800"
                : ""
              : "";

      const startIndex = characterIndex;
      characterIndex += token.length;

      return (
        <span
          key={tokenIndex}
          data-character-index={startIndex}
          className={className}
        >
          {token}
        </span>
      );
    });
  };

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (!examId || !passageId || !attempt || !passage) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F8FAFC] p-4">
        <section className="w-full max-w-md rounded-xl border border-[#E4E7EC] bg-white p-7 text-center">
          <FileText size={30} className="mx-auto text-[#155EEF]" />

          <h1 className="mt-4 text-lg font-semibold text-[#101828]">
            Examination session unavailable
          </h1>

          <p className="mt-2 text-sm text-[#667085]">
            Please return to the examination and start a new attempt.
          </p>

          <Link
            to="/typing-exams"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#155EEF] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft size={16} />
            Back to examinations
          </Link>
        </section>
      </main>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <main
      ref={containerRef}
      className={`flex h-dvh w-full flex-col overflow-hidden ${ui.page}`}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className={`z-40 shrink-0 border-b shadow-sm ${ui.panel} ${ui.border}`}
      >
        <div className="flex min-h-[64px] w-full flex-wrap items-center justify-between gap-x-5 gap-y-2 px-4 py-2">
          {/* LEFT: EXAM TITLE */}

          <div className="flex min-w-[190px] flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                dark
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold">{passage.title}</h1>

              <p className={`truncate text-[10px] ${ui.muted}`}>
                {passage.language} · {passageWordCount} words
              </p>
            </div>
          </div>

          {/* CENTER: STATISTICS */}

          {settings.showStatistics && (
            <div className="flex shrink-0 items-center justify-center gap-4 border-l border-r border-[#E4E7EC] px-4 dark:border-slate-700">
              <HeaderStat
                label="Gross WPM"
                value={grossWpm.toFixed(0)}
                color="blue"
                dark={dark}
              />

              <HeaderStat
                label="Words"
                value={typedWordCount}
                color="blue"
                dark={dark}
              />

              <HeaderStat
                label="Accuracy"
                value={`${accuracy.toFixed(1)}%`}
                color="green"
                dark={dark}
              />

              <HeaderStat
                label="Errors"
                value={totalWordErrors}
                color="red"
                dark={dark}
              />

              <HeaderStat
                label="Progress"
                value={`${progress.toFixed(0)}%`}
                color="blue"
                dark={dark}
              />
            </div>
          )}

          {/* RIGHT: SETTINGS AND CANDIDATE */}

          <div className="flex shrink-0 items-center justify-end gap-4">
            {/* SETTINGS TOOLBAR */}

            <div className="flex shrink-0 items-center gap-2">
              {/* FONT FAMILY */}
              <div className="group relative">
                <div
                  className={`flex h-9 items-center gap-1.5 rounded-lg border px-2 ${ui.border}`}
                >
                  <Type size={16} className="text-[#155EEF]" />

                  <select
                    value={settings.fontFamily}
                    onChange={(event) =>
                      updateSetting(
                        "fontFamily",
                        event.target.value as FontFamily,
                      )
                    }
                    aria-label="Font family"
                    className={`w-[75px] border-0 bg-transparent text-xs outline-none ${ui.input}`}
                  >
                    <option value="arial">Arial</option>
                    <option value="roboto">Roboto</option>
                    <option value="inter">Inter</option>
                    <option value="calibri">Calibri</option>
                    <option value="times">Times New Roman</option>
                    <option value="mono">Courier New</option>
                  </select>
                </div>
                <SettingTooltip>Font family</SettingTooltip>
              </div>

              {/* FONT SIZE */}
              <div className="flex h-9 items-center gap-1 rounded-lg border p-0.5 border-transparent">
                <TooltipIcon
                  label="Decrease font size"
                  onClick={decreaseFont}
                  disabled={settings.fontSize === "small"}
                  dark={dark}
                >
                  <span className="text-xs font-bold">A−</span>
                </TooltipIcon>

                <TooltipIcon
                  label="Increase font size"
                  onClick={increaseFont}
                  disabled={settings.fontSize === "large"}
                  dark={dark}
                >
                  <span className="text-sm font-bold">A+</span>
                </TooltipIcon>
              </div>

              {/* LAYOUT */}
              <div className="flex h-9 items-center rounded-lg border p-0.5 border-transparent">
                <TooltipIcon
                  label="Horizontal layout"
                  active={workspaceLayout === "horizontal"}
                  onClick={() => setWorkspaceLayout("horizontal")}
                  dark={dark}
                >
                  <Columns2 size={16} />
                </TooltipIcon>

                <TooltipIcon
                  label="Vertical layout"
                  active={workspaceLayout === "vertical"}
                  onClick={() => setWorkspaceLayout("vertical")}
                  dark={dark}
                >
                  <Rows2 size={16} />
                </TooltipIcon>
              </div>

              {/* THEME */}
              <TooltipIcon
                label={dark ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => updateSetting("theme", dark ? "light" : "dark")}
                dark={dark}
              >
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </TooltipIcon>

              {/* ERROR HIGHLIGHTING */}
              <TooltipIcon
                label={
                  settings.highlightErrors
                    ? "Disable error highlighting"
                    : "Enable error highlighting"
                }
                active={settings.highlightErrors}
                onClick={() =>
                  updateSetting("highlightErrors", !settings.highlightErrors)
                }
                dark={dark}
              >
                <Highlighter size={17} />
              </TooltipIcon>

              {/* AUTO SCROLL */}
              <TooltipIcon
                label={
                  settings.autoScroll
                    ? "Turn auto-scroll off"
                    : "Turn auto-scroll on"
                }
                active={settings.autoScroll}
                onClick={() =>
                  updateSetting("autoScroll", !settings.autoScroll)
                }
                dark={dark}
              >
                <ArrowDown size={17} />
              </TooltipIcon>

              {/* FULLSCREEN */}
              <TooltipIcon
                label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={() => void toggleFullscreen()}
                dark={dark}
              >
                {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              </TooltipIcon>

              {/* RESET */}
              <TooltipIcon
                label="Reset settings"
                onClick={resetSettings}
                dark={dark}
              >
                <RotateCcw size={16} />
              </TooltipIcon>

              {/* TIMER */}
              <div
                title="Examination time remaining"
                className={`ml-1 flex h-10 items-center gap-2 rounded-lg px-3 ${
                  remainingSeconds <= 60 && isTypingStarted
                    ? "bg-red-50 text-red-600"
                    : dark
                      ? "bg-blue-500/15 text-blue-300"
                      : "bg-blue-50 text-[#155EEF]"
                }`}
              >
                <Clock3 size={17} />
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
                    {isTypingStarted ? "Time left" : "Ready"}
                  </p>
                  <p className="text-sm font-bold tabular-nums">{timer}</p>
                </div>
              </div>
            </div>

            {/* CANDIDATE PROFILE */}

            <div className="flex w-[165px] shrink-0 items-center gap-2 border-l border-[#E4E7EC] pl-4 dark:border-slate-700">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#155EEF] dark:bg-blue-500/15 dark:text-blue-300">
                <UserRound size={17} />
              </div>

              <div className="group relative min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                  Candidate
                </p>

                <p className="max-w-[115px] truncate text-xs font-bold text-[#101828] dark:text-white">
                  {candidateName}
                </p>

                <SettingTooltip>{candidateName}</SettingTooltip>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          PROGRESS BAR
      ====================================================== */}

      <div
        className={`h-1 w-full shrink-0 ${
          dark ? "bg-slate-800" : "bg-slate-200"
        }`}
      >
        <div
          className="h-full bg-[#155EEF] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ======================================================
          WORKSPACE
      ====================================================== */}

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden p-3">
        {/* TIMER INSTRUCTION */}

        {!isTypingStarted && (
          <p className={`shrink-0 text-center text-xs ${ui.muted}`}>
            Your timer starts automatically when you type the first character.
          </p>
        )}

        {/* PASSAGE AND TYPING PANELS */}

        <div
          className={`grid min-h-0 flex-1 gap-3 overflow-hidden ${
            workspaceLayout === "horizontal"
              ? settings.showPassage
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
              : settings.showPassage
                ? "grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
                : "grid-cols-1"
          }`}
        >
          {/* REFERENCE PASSAGE */}

          {settings.showPassage && (
            <section
              className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border ${ui.panel} ${ui.border}`}
            >
              <div
                className={`flex shrink-0 items-center justify-between border-b px-3 py-2 ${ui.border}`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#155EEF]" />

                  <h2 className="text-xs font-semibold">Reference passage</h2>
                </div>

                <span className={`text-[10px] ${ui.muted}`}>
                  {passageWordCount} words
                </span>
              </div>

              <div
                ref={passageRef}
                className={`min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words p-4 leading-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  dark ? "text-slate-300" : "text-slate-800"
                }`}
                style={fontStyle}
              >
                {renderPassage()}
              </div>
            </section>
          )}

          {/* TYPING AREA */}

          <section
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border ${ui.panel} ${ui.border}`}
          >
            <div
              className={`flex shrink-0 items-center justify-between border-b px-3 py-2 ${ui.border}`}
            >
              <div className="flex items-center gap-2">
                <Keyboard size={15} className="text-[#155EEF]" />

                <h2 className="text-xs font-semibold">Typing area</h2>
              </div>

              <span className={`text-[10px] ${ui.muted}`}>
                {typedWordCount} / {passageWordCount} words
              </span>
            </div>

            <textarea
              ref={inputRef}
              value={typedText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Start typing the passage here..."
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              disabled={submitted || submitting || remainingSeconds <= 0}
              className={`min-h-0 w-full flex-1 resize-none overflow-y-auto border-0 p-4 leading-8 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                ui.input
              } ${
                dark
                  ? "placeholder:text-slate-500"
                  : "placeholder:text-slate-400"
              }`}
              style={fontStyle}
            />

            <div
              className={`flex shrink-0 items-center justify-between border-t px-3 py-2 ${ui.border}`}
            >
              <span className={`text-[10px] ${ui.muted}`}>
                {typedWordCount} words typed
              </span>

              <span className={`text-[10px] ${ui.muted}`}>
                Backspace {settings.allowBackspace ? "On" : "Off"}
              </span>
            </div>
          </section>
        </div>

        {/* ====================================================
            BOTTOM ACTION STRIP
        ==================================================== */}

        <footer
          className={`flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${ui.panel} ${ui.border}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {saving ? (
              <span className="text-xs text-blue-600">Saving progress...</span>
            ) : saveError ? (
              <span className="text-xs text-red-600">{saveError}</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <Check size={13} />
                Saved at {lastSaved.toLocaleTimeString()}
              </span>
            ) : (
              <span className={`text-xs ${ui.muted}`}>
                {isTypingStarted
                  ? "Autosave enabled"
                  : "Waiting for typing to begin"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isTypingStarted || saving || submitting || submitted}
              onClick={() => void saveProgress()}
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${ui.border} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Save
            </button>

            <button
              type="button"
              disabled={submitting || submitted}
              onClick={() => setShowSubmitConfirmation(true)}
              className="flex items-center gap-2 rounded-md bg-[#155EEF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004EEB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={13} />
              Submit examination
            </button>
          </div>
        </footer>
      </div>

      {/* ======================================================
          SUBMISSION CONFIRMATION
      ====================================================== */}

      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <section
            className={`w-full max-w-md rounded-xl border p-5 shadow-xl ${ui.panel} ${ui.border}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Submit examination?</h2>

              <button
                type="button"
                onClick={() => setShowSubmitConfirmation(false)}
                className={`rounded-md p-1.5 ${ui.muted}`}
                aria-label="Close confirmation"
              >
                <X size={18} />
              </button>
            </div>

            <p className={`mt-2 text-sm leading-6 ${ui.muted}`}>
              Are you sure you want to submit your examination? You cannot
              continue typing after submission.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryItem
                label="Words typed"
                value={String(typedWordCount)}
                dark={dark}
              />

              <SummaryItem
                label="Accuracy"
                value={`${accuracy.toFixed(1)}%`}
                dark={dark}
              />

              <SummaryItem
                label="Gross WPM"
                value={grossWpm.toFixed(0)}
                dark={dark}
              />

              <SummaryItem
                label="Errors"
                value={String(totalWordErrors)}
                dark={dark}
              />
            </div>

            {saveError && (
              <p className="mt-3 text-xs text-red-600">{saveError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitConfirmation(false)}
                className={`rounded-md border px-4 py-2 text-xs font-semibold ${ui.border}`}
              >
                Continue typing
              </button>

              <button
                type="button"
                disabled={submitting || saving || submitted}
                onClick={() => void handleSubmit()}
                className="rounded-md bg-[#155EEF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004EEB] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm submit"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

// ============================================================
// TOOLTIP COMPONENTS
// ============================================================

function SettingTooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full z-[100] mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#101828] px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
      {children}
    </span>
  );
}

function TooltipIcon({
  children,
  label,
  onClick,
  active = false,
  disabled = false,
  dark,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  dark: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-150 ${
          disabled
            ? "cursor-not-allowed opacity-35"
            : active
              ? "border-blue-200 bg-blue-50 text-[#155EEF] dark:border-blue-800 dark:bg-blue-500/15 dark:text-blue-300"
              : dark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-[#E4E7EC] text-slate-600 hover:bg-slate-100"
        }`}
      >
        {children}
      </button>

      <SettingTooltip>{label}</SettingTooltip>
    </div>
  );
}

// ============================================================
// SUMMARY ITEM
// ============================================================

function SummaryItem({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p
        className={`text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}
      >
        {label}
      </p>

      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

// ============================================================
// HEADER STAT
// ============================================================

function HeaderStat({
  label,
  value,
  color,
  dark,
}: {
  label: string;
  value: string | number;
  color: "blue" | "green" | "red";
  dark: boolean;
}) {
  const colors = {
    blue: "text-[#155EEF]",
    green: "text-emerald-600",
    red: "text-red-600",
  };

  return (
    <div className="flex min-w-[48px] shrink-0 flex-col items-center justify-center">
      <span
        className={`text-sm font-bold leading-tight tabular-nums sm:text-base ${colors[color]}`}
      >
        {value}
      </span>

      <span
        className={`mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide ${
          dark ? "text-slate-400" : "text-[#667085]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default TypingTestPage;
