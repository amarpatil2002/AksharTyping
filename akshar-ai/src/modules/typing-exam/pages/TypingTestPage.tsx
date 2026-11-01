import { useCallback, useEffect, useRef, useState } from "react";

import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";

import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  submitTypingAttempt,
  updateTypingProgress,
} from "../services/typing.service";

import type {
  StartTypingAttemptResponse,
  UpdateTypingProgressResponse,
} from "../types/typing.types";

// ============================================================
// TYPES
// ============================================================

type ExamPreset = "tcs" | "ssc" | "ibps" | "custom";
type LayoutMode = "horizontal" | "vertical";
type FontSize = "small" | "medium" | "large";
type ThemeMode = "light" | "dark";

type FontFamily = "arial" | "roboto" | "inter" | "calibri" | "times" | "mono";

interface TypingTestLocationState {
  attempt: StartTypingAttemptResponse["attempt"];
  passage: StartTypingAttemptResponse["passage"];
  remainingSeconds: number;
  settings?: ExamSettings;
}

interface ExamSettings {
  examPreset: ExamPreset;
  layout: LayoutMode;
  fontSize: FontSize;
  fontFamily: FontFamily;
  theme: ThemeMode;
  allowBackspace: boolean;
  allowPaste: boolean;
  showPassage: boolean;
  highlightErrors: boolean;
  showStatistics: boolean;
  autoFocus: boolean;
  autoScroll: boolean;
}

const DEFAULT_SETTINGS: ExamSettings = {
  examPreset: "tcs",
  layout: "horizontal",
  fontSize: "medium",
  fontFamily: "arial",
  theme: "light",
  allowBackspace: true,
  allowPaste: false,
  showPassage: true,
  highlightErrors: true,
  showStatistics: true,
  autoFocus: true,
  autoScroll: true,
};

const PRESETS: Record<Exclude<ExamPreset, "custom">, Partial<ExamSettings>> = {
  tcs: {
    layout: "horizontal",
    fontSize: "medium",
    fontFamily: "arial",
    showPassage: true,
    highlightErrors: true,
    showStatistics: true,
    autoScroll: true,
  },
  ssc: {
    layout: "vertical",
    fontSize: "medium",
    fontFamily: "calibri",
    showPassage: true,
    highlightErrors: false,
    showStatistics: true,
    autoScroll: true,
  },
  ibps: {
    layout: "horizontal",
    fontSize: "medium",
    fontFamily: "roboto",
    showPassage: true,
    highlightErrors: true,
    showStatistics: true,
    autoScroll: true,
  },
};

const FONTS: Record<FontFamily, string> = {
  arial: "Arial, Helvetica, sans-serif",
  roboto: "Roboto, Arial, sans-serif",
  inter: "Inter, Arial, sans-serif",
  calibri: "Calibri, Arial, sans-serif",
  times: '"Times New Roman", Times, serif',
  mono: '"Courier New", Courier, monospace',
};

const FONT_SIZES: Record<FontSize, string> = {
  small: "text-sm leading-7",
  medium: "text-base leading-8",
  large: "text-lg leading-9",
};

// ============================================================
// COMPONENT
// ============================================================

const TypingTestPage = () => {
  const { examId, passageId } = useParams<{
    examId: string;
    passageId: string;
  }>();

  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as TypingTestLocationState | null;

  const attempt = state?.attempt;
  const passage = state?.passage;

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [typedText, setTypedText] = useState(attempt?.typedText ?? "");

  const [remainingSeconds, setRemainingSeconds] = useState(
    state?.remainingSeconds ?? 0,
  );

  const [progressVersion, setProgressVersion] = useState(
    attempt?.progressVersion ?? 0,
  );

  const [settings, setSettings] = useState<ExamSettings>({
    ...DEFAULT_SETTINGS,
    ...(state?.settings ?? {}),
  });

  const examStarted = true;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const [saveError, setSaveError] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fullscreenError, setFullscreenError] = useState("");

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);

  const characterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const latestText = useRef(typedText);
  const latestVersion = useRef(progressVersion);

  const savingRef = useRef(false);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  // ----------------------------------------------------------
  // KEEP LATEST VALUES
  // ----------------------------------------------------------

  useEffect(() => {
    latestText.current = typedText;
  }, [typedText]);

  useEffect(() => {
    latestVersion.current = progressVersion;
  }, [progressVersion]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ----------------------------------------------------------
  // THEME
  // ----------------------------------------------------------

  const dark = settings.theme === "dark";

  const ui = {
    page: dark ? "bg-[#0b1120] text-slate-100" : "bg-[#f5f7fb] text-slate-900",

    panel: dark ? "border-slate-800 bg-[#111a2b]" : "border-slate-200 bg-white",

    muted: dark ? "text-slate-400" : "text-slate-500",

    secondary: dark
      ? "bg-slate-800 text-slate-200"
      : "bg-slate-50 text-slate-700",

    border: dark ? "border-slate-800" : "border-slate-200",

    input: dark
      ? "border-slate-700 bg-[#0b1120] text-slate-100 placeholder-slate-500"
      : "border-slate-200 bg-white text-slate-900 placeholder-slate-400",
  };

  const fontStyle = {
    fontFamily: FONTS[settings.fontFamily],
  };

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
      ...(key === "examPreset" ? {} : { examPreset: "custom" as ExamPreset }),
    }));
  };

  const applyPreset = (preset: ExamPreset) => {
    if (preset === "custom") {
      setSettings((previous) => ({
        ...previous,
        examPreset: "custom",
      }));
      return;
    }

    setSettings((previous) => ({
      ...previous,
      ...PRESETS[preset],
      examPreset: preset,
    }));
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
  };

  // ----------------------------------------------------------
  // FULLSCREEN
  // ----------------------------------------------------------

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
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
      setFullscreenError("Unable to change fullscreen mode.");
    }
  };

  // ----------------------------------------------------------
  // LIVE METRICS
  // ----------------------------------------------------------

  const targetText = passage?.content ?? "";
  const remainingCharacters = Math.max(targetText.length - typedText.length, 0);
  const remainingWords = targetText.slice(typedText.length).trim()
    ? targetText.slice(typedText.length).trim().split(/\s+/).length
    : 0;
  const passageWordCount = targetText.trim()
    ? targetText.trim().split(/\s+/).length
    : 0;

  const correctCharacters = targetText.split("").filter((character, index) => {
    return character === typedText[index];
  }).length;

  const incorrectCharacters = typedText.length - correctCharacters;

  const accuracy =
    typedText.length > 0 ? (correctCharacters / typedText.length) * 100 : 100;

  const elapsedSeconds = Math.max(
    0,
    (attempt?.configSnapshot.durationSeconds ?? 0) - remainingSeconds,
  );

  const grossWpm =
    elapsedSeconds > 0 ? typedText.length / 5 / (elapsedSeconds / 60) : 0;

  const progress = targetText.length
    ? Math.min(100, (typedText.length / targetText.length) * 100)
    : 0;

  const wordCount = typedText.trim() ? typedText.trim().split(/\s+/).length : 0;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const timer = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;

  const timeLow = remainingSeconds <= 60;

  // ----------------------------------------------------------
  // AUTO FOCUS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!examStarted || !settings.autoFocus || submitted) return;

    inputRef.current?.focus();
  }, [examStarted, settings.autoFocus, submitted]);

  // ----------------------------------------------------------
  // AUTO SCROLL
  // ----------------------------------------------------------

  useEffect(() => {
    if (!settings.autoScroll || !settings.showPassage) return;

    const container = passageRef.current;
    const activeCharacter = characterRefs.current[typedText.length];

    if (!container || !activeCharacter) return;

    const containerRect = container.getBoundingClientRect();
    const characterRect = activeCharacter.getBoundingClientRect();

    if (characterRect.bottom > containerRect.bottom - 35) {
      container.scrollTop += characterRect.bottom - containerRect.bottom + 35;
    }

    if (characterRect.top < containerRect.top + 20) {
      container.scrollTop -= containerRect.top + 20 - characterRect.top;
    }
  }, [typedText.length, settings.autoScroll, settings.showPassage]);

  // ----------------------------------------------------------
  // SAVE PROGRESS
  // ----------------------------------------------------------

  const saveProgress = useCallback(async () => {
    if (
      !attempt?._id ||
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
      const response: UpdateTypingProgressResponse = await updateTypingProgress(
        attempt._id,
        {
          typedText: latestText.current,
          progressVersion: latestVersion.current,
        },
      );

      latestVersion.current = response.progressVersion;

      if (mountedRef.current) {
        setProgressVersion(response.progressVersion);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Save progress failed:", error);

      if (mountedRef.current) {
        setSaveError("Unable to save progress. Please retry.");
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }, [attempt?._id, submitted]);

  // ----------------------------------------------------------
  // AUTOSAVE
  // ----------------------------------------------------------

  useEffect(() => {
    if (!examStarted || !attempt?._id || submitted) return;

    const interval = window.setInterval(() => {
      void saveProgress();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [examStarted, attempt?._id, saveProgress, submitted]);

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!attempt?._id || submitted || submittingRef.current) {
      return;
    }

    if (savingRef.current) {
      setSaveError("Saving is in progress. Please try again.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitModalOpen(true);
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
      console.error("Submit failed:", error);

      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to submit examination. Please retry.",
      );

      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [attempt?._id, navigate, submitted]);

  // ----------------------------------------------------------
  // COUNTDOWN
  // ----------------------------------------------------------

  useEffect(() => {
    if (!examStarted || !attempt?._id || submitted) return;

    if (remainingSeconds <= 0) {
      void handleSubmit();
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [examStarted, attempt?._id, remainingSeconds, submitted, handleSubmit]);

  // ----------------------------------------------------------
  // TYPING EVENTS
  // ----------------------------------------------------------

  const handleTyping = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!examStarted || remainingSeconds <= 0 || submitted || submitting) {
      return;
    }

    const value = event.target.value;

    if (value.length > targetText.length) return;

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
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "v" &&
      !settings.allowPaste
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
  // PASSAGE RENDERER
  // ----------------------------------------------------------

  const renderPassage = () => {
    if (!passage) return null;

    return passage.content.split("").map((character, index) => {
      const typedCharacter = typedText[index];

      let color = "";

      if (index < typedText.length) {
        if (typedCharacter === character) {
          color = dark
            ? "bg-emerald-900/40 text-emerald-300"
            : "bg-emerald-100 text-emerald-800";
        } else if (settings.highlightErrors) {
          color = dark
            ? "bg-red-900/50 text-red-300"
            : "bg-red-100 text-red-700";
        }
      }

      if (index === typedText.length) {
        color = dark
          ? "rounded-sm bg-blue-900/60 text-blue-200 ring-1 ring-blue-400"
          : "rounded-sm bg-blue-100 text-blue-800 ring-1 ring-blue-400";
      }

      return (
        <span
          key={index}
          ref={(element) => {
            characterRefs.current[index] = element;
          }}
          className={color}
        >
          {character}
        </span>
      );
    });
  };

  // ----------------------------------------------------------
  // SESSION VALIDATION
  // ----------------------------------------------------------

  if (!examId || !passageId || !attempt || !passage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
            !
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Examination session not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your examination session may have expired or the page was refreshed.
            Please start a new examination.
          </p>

          <Link
            to="/typing-exams"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to examinations
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // MAIN UI
  // ----------------------------------------------------------

  return (
    <div ref={containerRef} className={`min-h-screen ${ui.page}`}>
      <div className="flex min-h-screen w-full min-w-0 flex-col p-2 sm:p-3 lg:p-4">
        {/* ================================================ */}
        {/* TOP HEADER */}
        {/* ================================================ */}

        <header
          className={`sticky top-0 z-30 mb-3 rounded-xl border shadow-sm ${ui.panel}`}
        >
          <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white sm:flex">
                T
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold sm:text-base">
                  {passage.title}
                </h1>

                <p className={`truncate text-[10px] sm:text-xs ${ui.muted}`}>
                  {passage.language} <span className="px-1">·</span>
                  {passageWordCount} words
                  <span className="px-1">·</span>
                  {settings.examPreset.toUpperCase()} interface
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* TIMER */}

              <div
                className={`rounded-lg border px-3 py-1.5 text-center ${
                  timeLow
                    ? "border-red-200 bg-red-50 text-red-700"
                    : dark
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
                  Time left
                </p>

                <p className="text-base font-bold tabular-nums sm:text-lg">
                  {timer}
                </p>
              </div>

              {/* SETTINGS */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((value) => !value)}
                  aria-label="Open examination settings"
                  aria-expanded={settingsOpen}
                  title="Preferences"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition hover:border-blue-400 hover:text-blue-600 ${ui.panel}`}
                >
                  <SettingsIcon />
                </button>

                {settingsOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close settings"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setSettingsOpen(false)}
                    />

                    <div
                      className={`absolute right-0 top-11 z-50 max-h-[80vh] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-2xl border p-4 shadow-2xl ${ui.panel}`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold">
                            Exam preferences
                          </h3>
                          <p className={`text-[10px] ${ui.muted}`}>
                            Personalize your workspace
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSettingsOpen(false)}
                          className={`rounded-lg p-2 ${ui.secondary}`}
                        >
                          ✕
                        </button>
                      </div>

                      <SettingSelect
                        label="Exam interface"
                        value={settings.examPreset}
                        onChange={(value) => applyPreset(value as ExamPreset)}
                        options={[
                          ["tcs", "TCS iON Style"],
                          ["ssc", "SSC Typing Style"],
                          ["ibps", "IBPS / Banking Style"],
                          ["custom", "Custom"],
                        ]}
                        dark={dark}
                      />

                      <SettingSelect
                        label="Layout"
                        value={settings.layout}
                        onChange={(value) =>
                          updateSetting("layout", value as LayoutMode)
                        }
                        options={[
                          ["horizontal", "Horizontal"],
                          ["vertical", "Vertical"],
                        ]}
                        dark={dark}
                      />

                      <SettingSelect
                        label="Font family"
                        value={settings.fontFamily}
                        onChange={(value) =>
                          updateSetting("fontFamily", value as FontFamily)
                        }
                        options={[
                          ["arial", "Arial"],
                          ["roboto", "Roboto"],
                          ["inter", "Inter"],
                          ["calibri", "Calibri"],
                          ["times", "Times New Roman"],
                          ["mono", "Courier New"],
                        ]}
                        dark={dark}
                      />

                      <SettingSelect
                        label="Font size"
                        value={settings.fontSize}
                        onChange={(value) =>
                          updateSetting("fontSize", value as FontSize)
                        }
                        options={[
                          ["small", "Small"],
                          ["medium", "Medium"],
                          ["large", "Large"],
                        ]}
                        dark={dark}
                      />

                      <SettingSelect
                        label="Appearance"
                        value={settings.theme}
                        onChange={(value) =>
                          updateSetting("theme", value as ThemeMode)
                        }
                        options={[
                          ["light", "Light"],
                          ["dark", "Dark"],
                        ]}
                        dark={dark}
                      />

                      <div className={`my-4 border-t ${ui.border}`} />

                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Display and behaviour
                      </p>

                      <div className="space-y-1">
                        <SettingToggle
                          label="Show passage"
                          checked={settings.showPassage}
                          onChange={(value) =>
                            updateSetting("showPassage", value)
                          }
                          dark={dark}
                        />

                        <SettingToggle
                          label="Automatic passage scroll"
                          checked={settings.autoScroll}
                          onChange={(value) =>
                            updateSetting("autoScroll", value)
                          }
                          dark={dark}
                        />

                        <SettingToggle
                          label="Highlight typing errors"
                          checked={settings.highlightErrors}
                          onChange={(value) =>
                            updateSetting("highlightErrors", value)
                          }
                          dark={dark}
                        />

                        <SettingToggle
                          label="Show live statistics"
                          checked={settings.showStatistics}
                          onChange={(value) =>
                            updateSetting("showStatistics", value)
                          }
                          dark={dark}
                        />

                        <SettingToggle
                          label="Allow backspace"
                          checked={settings.allowBackspace}
                          onChange={(value) =>
                            updateSetting("allowBackspace", value)
                          }
                          dark={dark}
                        />

                        <SettingToggle
                          label="Allow paste"
                          checked={settings.allowPaste}
                          onChange={(value) =>
                            updateSetting("allowPaste", value)
                          }
                          dark={dark}
                        />

                        <SettingToggle
                          label="Automatic input focus"
                          checked={settings.autoFocus}
                          onChange={(value) =>
                            updateSetting("autoFocus", value)
                          }
                          dark={dark}
                        />
                      </div>

                      <div className={`my-4 border-t ${ui.border}`} />

                      <button
                        type="button"
                        onClick={resetSettings}
                        className={`w-full rounded-xl border px-3 py-2.5 text-xs font-semibold transition hover:border-blue-400 hover:text-blue-600 ${ui.panel}`}
                      >
                        Reset all preferences
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* FULLSCREEN */}

              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                aria-label="Toggle fullscreen"
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition hover:border-blue-400 hover:text-blue-600 ${ui.panel}`}
              >
                <FullscreenIcon />
              </button>
            </div>
          </div>
        </header>

        {/* ================================================ */}
        {/* STATISTICS */}
        {/* ================================================ */}

        {settings.showStatistics && (
          <section className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard
              label="Typing speed"
              value={grossWpm.toFixed(0)}
              suffix="WPM"
              color="blue"
              dark={dark}
            />

            <MetricCard
              label="Accuracy"
              value={accuracy.toFixed(1)}
              suffix="%"
              color="green"
              dark={dark}
            />

            <MetricCard
              label="Correct characters"
              value={correctCharacters.toString()}
              color="purple"
              dark={dark}
            />

            <MetricCard
              label="Errors"
              value={incorrectCharacters.toString()}
              color="red"
              dark={dark}
            />
          </section>
        )}

        {/* ================================================ */}
        {/* PROGRESS */}
        {/* ================================================ */}

        <section className={`mb-3 rounded-xl border p-3 shadow-sm ${ui.panel}`}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold">Examination progress</p>
              <p className={`mt-0.5 text-[10px] ${ui.muted}`}>
                {wordCount} words typed
              </p>
            </div>

            <span className="text-sm font-bold text-blue-600">
              {progress.toFixed(1)}%
            </span>
          </div>

          <div
            className={`h-2 overflow-hidden rounded-full ${
              dark ? "bg-slate-800" : "bg-slate-100"
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* ================================================ */}
        {/* PASSAGE + TYPING WORKSPACE */}
        {/* ================================================ */}

        <main
          className={
            settings.layout === "horizontal"
              ? "grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2"
              : "flex flex-1 flex-col gap-3"
          }
        >
          {/* PASSAGE PANEL */}

          {settings.showPassage && (
            <section
              className={`flex min-h-[300px] min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm ${
                ui.panel
              } ${
                settings.layout === "horizontal"
                  ? "lg:min-h-[500px]"
                  : "min-h-[300px]"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-4 py-3 ${ui.border}`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                    <DocumentIcon />
                  </div>

                  <div>
                    <h2 className="text-xs font-bold">Reading passage</h2>
                    <p className={`text-[10px] ${ui.muted}`}>
                      Type the passage shown below
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${ui.secondary}`}
                >
                  {passageWordCount} words
                </span>
              </div>

              <div
                ref={passageRef}
                className={`max-h-[65vh] min-h-[250px] flex-1 overflow-y-auto whitespace-pre-wrap break-words p-4 sm:p-5 ${FONT_SIZES[settings.fontSize]} ${
                  dark ? "text-slate-300" : "text-slate-700"
                }`}
                style={fontStyle}
              >
                {renderPassage()}
              </div>

              <div
                className={`flex flex-wrap items-center gap-3 border-t px-4 py-2.5 ${ui.border}`}
              >
                <Legend color="bg-emerald-500" label="Correct" />
                <Legend color="bg-red-500" label="Incorrect" />
                <Legend color="bg-blue-500" label="Current position" />
              </div>
            </section>
          )}

          {/* TYPING PANEL */}

          <section
            className={`flex min-h-[300px] min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm ${
              ui.panel
            } ${
              settings.layout === "horizontal"
                ? "lg:min-h-[500px]"
                : "min-h-[350px]"
            }`}
          >
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${ui.border}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                  <KeyboardIcon />
                </div>

                <div>
                  <h2 className="text-xs font-bold">Typing workspace</h2>
                  <p className={`text-[10px] ${ui.muted}`}>
                    Type carefully and maintain your accuracy
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-medium ${ui.muted}`}>
                {typedText.length}/{targetText.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-3 sm:p-4">
              <textarea
                ref={inputRef}
                value={typedText}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={
                  !examStarted ||
                  remainingSeconds <= 0 ||
                  submitted ||
                  submitting
                }
                placeholder={
                  examStarted
                    ? "Start typing the passage here..."
                    : "Enter the examination to begin typing..."
                }
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                className={`min-h-[250px] w-full flex-1 resize-y rounded-xl border p-4 outline-none transition placeholder:text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 sm:min-h-[350px] ${ui.input} ${FONT_SIZES[settings.fontSize]}`}
                style={fontStyle}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className={`flex flex-wrap gap-3 text-[10px] ${ui.muted}`}>
                  <span>
                    Backspace: {settings.allowBackspace ? "On" : "Off"}
                  </span>
                  <span>Paste: {settings.allowPaste ? "On" : "Off"}</span>
                  <span>{settings.fontFamily.toUpperCase()}</span>
                </div>

                <button
                  type="button"
                  disabled={!examStarted || submitting || submitted}
                  onClick={() => inputRef.current?.focus()}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  Focus typing area
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ================================================ */}
        {/* SUBMIT CONFIRMATION MODAL */}
        {/* ================================================ */}

        {submitModalOpen && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-confirmation-title"
          >
            <div
              className={`my-auto w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl ${ui.panel}`}
            >
              <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-5 text-white sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                      Final review
                    </p>
                    <h2
                      id="submit-confirmation-title"
                      className="mt-1 text-xl font-extrabold"
                    >
                      Submit examination?
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-blue-100">
                      Review your progress before submitting. You cannot edit
                      your answers afterward.
                    </p>
                  </div>
                  <span className="rounded-xl bg-white/15 px-3 py-2 text-xs font-bold tabular-nums">
                    {timer} left
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <SubmitSummaryCard
                    label="Words typed"
                    value={String(wordCount)}
                    dark={dark}
                  />
                  <SubmitSummaryCard
                    label="Characters typed"
                    value={String(typedText.length)}
                    dark={dark}
                  />
                  <SubmitSummaryCard
                    label="Characters remaining"
                    value={String(remainingCharacters)}
                    dark={dark}
                  />
                  <SubmitSummaryCard
                    label="Words remaining"
                    value={String(remainingWords)}
                    dark={dark}
                  />
                  <SubmitSummaryCard
                    label="Accuracy"
                    value={`${accuracy.toFixed(1)}%`}
                    dark={dark}
                  />
                  <SubmitSummaryCard
                    label="Typing errors"
                    value={String(incorrectCharacters)}
                    dark={dark}
                  />
                </div>

                <div className={`mt-4 rounded-xl border p-3 ${ui.border}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className={ui.muted}>Passage completion</span>
                    <strong className="text-blue-600">
                      {progress.toFixed(1)}%
                    </strong>
                  </div>
                  <div
                    className={`h-2 overflow-hidden rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px]">
                    <span className={ui.muted}>
                      {typedText.length} of {targetText.length} characters
                    </span>
                    <span className={ui.muted}>
                      {remainingSeconds <= 60
                        ? "Time is running low"
                        : "Time remaining"}
                    </span>
                  </div>
                </div>

                {saveError && (
                  <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-600">
                    {saveError}
                  </p>
                )}

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setSubmitModalOpen(false)}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold transition hover:border-blue-400 disabled:opacity-50 ${ui.panel}`}
                  >
                    Continue typing
                  </button>
                  <button
                    type="button"
                    disabled={submitting || saving || submitted}
                    onClick={() => void handleSubmit()}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Confirm submission"}
                  </button>
                </div>
                {saving && (
                  <p className={`mt-3 text-center text-[10px] ${ui.muted}`}>
                    Progress is currently being saved. Wait for saving to finish
                    before submitting.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================ */}
        {/* FOOTER ACTIONS */}
        {/* ================================================ */}

        <footer
          className={`mt-3 rounded-xl border px-3 py-3 shadow-sm sm:px-4 ${ui.panel}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {saving ? (
                <p className="flex items-center gap-2 text-xs font-medium text-blue-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                  Saving your progress...
                </p>
              ) : saveError ? (
                <p className="text-xs font-medium text-red-600">{saveError}</p>
              ) : lastSaved ? (
                <p className="text-xs font-medium text-emerald-600">
                  ✓ Progress saved at {lastSaved.toLocaleTimeString()}
                </p>
              ) : (
                <p className={`text-xs ${ui.muted}`}>
                  Autosave enabled · Every 10 seconds
                </p>
              )}

              {fullscreenError && (
                <p className="mt-1 text-[10px] text-amber-600">
                  {fullscreenError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                disabled={!examStarted || saving || submitting || submitted}
                onClick={() => void saveProgress()}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:border-blue-400 disabled:opacity-50 ${ui.panel}`}
              >
                {saving ? "Saving..." : "Save progress"}
              </button>

              <button
                type="button"
                disabled={!examStarted || submitting || submitted}
                onClick={() => setSubmitModalOpen(true)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit examination
              </button>
            </div>
          </div>
        </footer>

        <p className={`py-3 text-center text-[10px] ${ui.muted}`}>
          Your progress is automatically saved. Do not close this examination
          before submitting.
        </p>
      </div>
    </div>
  );
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const SubmitSummaryCard = ({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) => (
  <div
    className={`rounded-xl border p-3 ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}
  >
    <p
      className={`text-[10px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}
    >
      {label}
    </p>
    <p className="mt-1 text-lg font-extrabold tabular-nums">{value}</p>
  </div>
);

const MetricCard = ({
  label,
  value,
  suffix,
  color,
  dark,
}: {
  label: string;
  value: string;
  suffix?: string;
  color: "blue" | "green" | "purple" | "red";
  dark: boolean;
}) => {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    purple: "bg-violet-500",
    red: "bg-red-500",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3 shadow-sm sm:p-4 ${
        dark ? "border-slate-800 bg-[#111a2b]" : "border-slate-200 bg-white"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${colors[color]}`} />

      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-bold tabular-nums sm:text-2xl">
          {value}
        </span>

        {suffix && (
          <span className="text-[10px] font-semibold text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const SettingSelect = ({
  label,
  value,
  onChange,
  options,
  dark,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  dark: boolean;
}) => {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${
          dark
            ? "border-slate-700 bg-slate-900 text-white"
            : "border-slate-200 bg-slate-50 text-slate-800"
        }`}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
};

const SettingToggle = ({
  label,
  checked,
  onChange,
  dark,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  dark: boolean;
}) => {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition ${
        dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
      }`}
    >
      <span className="text-xs font-medium">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-blue-600"
      />
    </label>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
    <span className={`h-2 w-2 rounded-full ${color}`} />
    {label}
  </span>
);

// ============================================================
// ICONS
// ============================================================

const SettingsIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.02a1.7 1.7 0 0 0-1.78.5l-.06.07h-3.4l-.06-.08a1.7 1.7 0 0 0-1.78-.49l-.08.02-1.7-2.94.06-.06A1.7 1.7 0 0 0 9.6 15l-.1-.04v-3.4l.1-.04a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-2.94.08.02a1.7 1.7 0 0 0 1.78-.5l.06-.07h3.4l.06.08a1.7 1.7 0 0 0 1.78.49l.08-.02 1.7 2.94-.06.06A1.7 1.7 0 0 0 19.6 11l.1.04v3.4z" />
  </svg>
);

const FullscreenIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const KeyboardIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 16h8" />
  </svg>
);

const DocumentIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h8" />
  </svg>
);

export default TypingTestPage;
