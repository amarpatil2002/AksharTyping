import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { startTypingAttempt } from "../services/typing.service";
import type { TypingPassage } from "../types/typing.types";

import { DEFAULT_EXAM_SETTINGS, EXAM_PRESETS } from "../types/typing-ui.types";

import type {
  ExamSettings,
  ExamPreset,
  FontFamily,
} from "../types/typing-ui.types";

// ============================================================
// TYPES
// ============================================================

interface SetupLocationState {
  passage: TypingPassage;
  examTitle?: string;
  examDuration?: number;
  targetWpm?: number;
  instructions?: string[];
}

const FONT_FAMILIES: Record<FontFamily, string> = {
  arial: "Arial, Helvetica, sans-serif",
  roboto: "Roboto, Arial, sans-serif",
  inter: "Inter, Arial, sans-serif",
  calibri: "Calibri, Arial, sans-serif",
  times: '"Times New Roman", Times, serif',
  mono: '"Courier New", Courier, monospace"',
};

// ============================================================
// MAIN PAGE
// ============================================================

const TypingExamSetupPage = () => {
  const { examId, passageId } = useParams<{
    examId: string;
    passageId: string;
  }>();

  const location = useLocation();
  const navigate = useNavigate();

  const routeState = location.state as SetupLocationState | null;
  const passage = routeState?.passage;

  const [settings, setSettings] = useState<ExamSettings>({
    ...DEFAULT_EXAM_SETTINGS,
  });

  // Custom passage text. Defaults to API passage content if available.

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const dark = settings.theme === "dark";

  // The selected passage is fixed; candidates only configure the workspace.
  // ==========================================================
  // PASSAGE VALUES
  // ==========================================================

  const passageWordCount = passage
    ? (passage.wordCount ??
      (passage.content ?? "").split(/\s+/).filter(Boolean).length)
    : 0;

  const passagePreview = passage?.content?.slice(0, 380) ?? "";

  // ==========================================================
  // THEME CLASSES
  // ==========================================================

  const theme = useMemo(
    () => ({
      page: dark
        ? "bg-[#0b1220] text-slate-100"
        : "bg-[#f4f7fc] text-slate-900",

      panel: dark
        ? "border-slate-800 bg-[#111c2e]"
        : "border-slate-200 bg-white",

      input: dark
        ? "border-slate-700 bg-[#0c1627] text-slate-100"
        : "border-slate-200 bg-slate-50 text-slate-800",

      muted: dark ? "text-slate-400" : "text-slate-500",

      border: dark ? "border-slate-800" : "border-slate-200",

      hover: dark
        ? "hover:border-blue-500 hover:bg-slate-800/70"
        : "hover:border-blue-300 hover:bg-blue-50/50",

      selected: dark
        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
        : "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10",

      preview: dark
        ? "border-slate-700 bg-[#0c1627]"
        : "border-slate-200 bg-white",
    }),
    [dark],
  );

  // ==========================================================
  // SETTINGS
  // ==========================================================

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
      ...EXAM_PRESETS[preset],
      examPreset: preset,
    }));
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_EXAM_SETTINGS });
  };

  // ==========================================================
  // START EXAMINATION
  // ==========================================================

  const handleStartExam = async () => {
    if (starting || !examId || !passageId) return;

    setStarting(true);
    setError("");

    let enteredFullscreen = false;

    try {
      // Must be requested directly from the Start Examination click.
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
          enteredFullscreen = Boolean(document.fullscreenElement);
        } catch (fullscreenError) {
          // Some browsers/devices do not allow fullscreen.
          // Continue the exam in normal browser mode.
          console.warn("Fullscreen unavailable:", fullscreenError);
        }
      }

      const response = await startTypingAttempt(examId, passageId);

      navigate(`/typing-exams/${examId}/passages/${passageId}/start`, {
        replace: false,
        state: {
          attempt: response.attempt,
          passage: response.passage,
          remainingSeconds: response.remainingSeconds,
          settings,
          fullscreen: enteredFullscreen,
        },
      });
    } catch (err) {
      console.error(err);

      // Do not leave the setup page in fullscreen if starting failed.
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (fullscreenError) {
          console.warn("Could not exit fullscreen:", fullscreenError);
        }
      }

      setError("Unable to start examination. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  // ==========================================================
  // INVALID ROUTE STATE
  // ==========================================================

  if (!examId || !passageId || !passage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            📄
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Passage details unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your selected passage could not be loaded. Return to the examination
            and select a passage again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/typing-exams")}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Back to examinations
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${theme.page}`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        {/* HEADER */}

        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-600/20">
              T
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                Examination Setup
              </h1>

              <p className={`mt-0.5 text-xs ${theme.muted}`}>
                Personalize your typing workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/typing-exams/${examId}`)}
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 ${theme.panel} ${theme.hover}`}
          >
            ← Back to passages
          </button>
        </header>

        {/* HERO */}

        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1745a5] via-[#2459c5] to-[#5946c9] p-5 text-white shadow-xl shadow-blue-900/10 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-indigo-400/10 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ready to configure
              </div>

              <h2 className="mt-4 break-words text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                {passage.title}
              </h2>

              <p className="mt-2 text-sm text-blue-100">
                {routeState?.examTitle || "Typing Examination"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <HeroTag>{passage.language}</HeroTag>
                <HeroTag>{passageWordCount} words</HeroTag>
                <HeroTag>{passage.difficulty} difficulty</HeroTag>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[230px]">
              <HeroMetric
                label="Passage length"
                value={String(passageWordCount)}
                suffix="words"
              />

              <HeroMetric
                label="Exam duration"
                value={
                  routeState?.examDuration
                    ? String(Math.floor(routeState.examDuration / 60))
                    : "—"
                }
                suffix="minutes"
              />

              <HeroMetric
                label="Target speed"
                value={String(routeState?.targetWpm ?? "—")}
                suffix="WPM"
              />

              <HeroMetric
                label="Difficulty"
                value={passage.difficulty}
                suffix=""
              />
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          {/* LEFT COLUMN */}

          <main className="min-w-0 space-y-5">
            {/* PRESETS */}

            <section
              className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${theme.panel}`}
            >
              <SectionTitle
                number="02"
                title="Choose your examination style"
                description="Select a preset or customize your own workspace."
                dark={dark}
              />

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <PresetCard
                  title="TCS iON"
                  subtitle="Standard typing layout"
                  details="Arial · Horizontal"
                  icon="⌨️"
                  selected={settings.examPreset === "tcs"}
                  onClick={() => applyPreset("tcs")}
                  dark={dark}
                />

                <PresetCard
                  title="SSC Typing"
                  subtitle="Government exam style"
                  details="Calibri · Vertical"
                  icon="📘"
                  selected={settings.examPreset === "ssc"}
                  onClick={() => applyPreset("ssc")}
                  dark={dark}
                />

                <PresetCard
                  title="IBPS Banking"
                  subtitle="Banking examination style"
                  details="Roboto · Horizontal"
                  icon="🏦"
                  selected={settings.examPreset === "ibps"}
                  onClick={() => applyPreset("ibps")}
                  dark={dark}
                />
              </div>

              <button
                type="button"
                onClick={() => applyPreset("custom")}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${
                  settings.examPreset === "custom"
                    ? theme.selected
                    : `${theme.border} ${theme.hover}`
                }`}
              >
                <span>⚙️</span>
                Customize my own settings
                {settings.examPreset === "custom" && (
                  <span className="text-blue-500">✓</span>
                )}
              </button>
            </section>

            {/* LAYOUT */}

            <section
              className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${theme.panel}`}
            >
              <SectionTitle
                number="03"
                title="Workspace layout"
                description="Choose how your passage and typing area are arranged."
                dark={dark}
              />

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LayoutCard
                  title="Side by side"
                  description="Passage and typing area displayed together."
                  selected={settings.layout === "horizontal"}
                  vertical={false}
                  dark={dark}
                  onClick={() => updateSetting("layout", "horizontal")}
                />

                <LayoutCard
                  title="Stacked layout"
                  description="Passage above the typing workspace."
                  selected={settings.layout === "vertical"}
                  vertical
                  dark={dark}
                  onClick={() => updateSetting("layout", "vertical")}
                />
              </div>
            </section>

            {/* APPEARANCE */}

            <section
              className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${theme.panel}`}
            >
              <SectionTitle
                number="04"
                title="Typography and appearance"
                description="Make the workspace comfortable for longer typing sessions."
                dark={dark}
              />

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
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
                  theme={theme}
                />

                <SelectField
                  label="Font size"
                  value={settings.fontSize}
                  onChange={(value) =>
                    updateSetting("fontSize", value as ExamSettings["fontSize"])
                  }
                  options={[
                    ["small", "Small"],
                    ["medium", "Medium"],
                    ["large", "Large"],
                  ]}
                  theme={theme}
                />
              </div>

              <div className="mt-5">
                <p className={`mb-3 text-xs font-bold ${theme.muted}`}>
                  COLOR THEME
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <ThemeCard
                    title="Light mode"
                    description="Bright and clean workspace"
                    selected={settings.theme === "light"}
                    dark={dark}
                    onClick={() => updateSetting("theme", "light")}
                    mode="light"
                  />

                  <ThemeCard
                    title="Dark mode"
                    description="Comfortable low-light workspace"
                    selected={settings.theme === "dark"}
                    dark={dark}
                    onClick={() => updateSetting("theme", "dark")}
                    mode="dark"
                  />
                </div>
              </div>
            </section>

            {/* TYPING BEHAVIOUR */}

            <section
              className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${theme.panel}`}
            >
              <SectionTitle
                number="05"
                title="Typing preferences"
                description="Configure how the examination behaves while you type."
                dark={dark}
              />

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    dark
                      ? "border-blue-500/30 bg-blue-500/10"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">
                    ⛶
                  </span>
                  <span>
                    <span
                      className={`block text-xs font-bold ${dark ? "text-slate-100" : "text-slate-800"}`}
                    >
                      Automatic fullscreen
                    </span>
                    <span
                      className={`mt-1 block text-[10px] leading-4 ${theme.muted}`}
                    >
                      The examination enters fullscreen automatically when you
                      start.
                    </span>
                  </span>
                </div>

                <PreferenceToggle
                  title="Show passage"
                  description="Display the reference passage."
                  checked={settings.showPassage}
                  onChange={(v) => updateSetting("showPassage", v)}
                  dark={dark}
                />

                <PreferenceToggle
                  title="Auto-scroll passage"
                  description="Keep the current passage position visible."
                  checked={settings.autoScroll}
                  onChange={(v) => updateSetting("autoScroll", v)}
                  dark={dark}
                />

                <PreferenceToggle
                  title="Highlight errors"
                  description="Visually identify typing mistakes."
                  checked={settings.highlightErrors}
                  onChange={(v) => updateSetting("highlightErrors", v)}
                  dark={dark}
                />

                <PreferenceToggle
                  title="Live statistics"
                  description="Display speed and accuracy."
                  checked={settings.showStatistics}
                  onChange={(v) => updateSetting("showStatistics", v)}
                  dark={dark}
                />

                <PreferenceToggle
                  title="Allow backspace"
                  description="Allow correction of typed characters."
                  checked={settings.allowBackspace}
                  onChange={(v) => updateSetting("allowBackspace", v)}
                  dark={dark}
                />

                <PreferenceToggle
                  title="Allow paste"
                  description="Allow pasted content in the typing area."
                  checked={settings.allowPaste}
                  onChange={(v) => updateSetting("allowPaste", v)}
                  dark={dark}
                />

                <PreferenceToggle
                  title="Auto-focus typing area"
                  description="Focus the typing field automatically."
                  checked={settings.autoFocus}
                  onChange={(v) => updateSetting("autoFocus", v)}
                  dark={dark}
                />
              </div>
            </section>

            {/* INSTRUCTIONS */}

            {routeState?.instructions && routeState.instructions.length > 0 && (
              <section
                className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${theme.panel}`}
              >
                <SectionTitle
                  number="06"
                  title="Examination instructions"
                  description="Review these instructions before beginning."
                  dark={dark}
                />

                <ul className="mt-4 space-y-3">
                  {routeState.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-500">
                        {index + 1}
                      </span>

                      <span className={theme.muted}>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>

          {/* RIGHT SIDEBAR */}

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-5">
            {/* LIVE PREVIEW */}

            <section
              className={`overflow-hidden rounded-2xl border shadow-sm ${theme.panel}`}
            >
              <div className={`border-b p-4 ${theme.border}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold">
                      Live workspace preview
                    </h3>

                    <p className={`mt-1 text-[10px] ${theme.muted}`}>
                      Updates with your settings and passage text
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500">
                    LIVE
                  </span>
                </div>
              </div>

              <div className={`p-3 ${dark ? "bg-[#0c1627]" : "bg-slate-50"}`}>
                <div
                  className={`mb-3 flex items-center justify-between rounded-lg border p-2 ${theme.preview}`}
                >
                  <div>
                    <p className="text-[9px] font-bold">TYPING EXAM</p>
                    <p className={`mt-0.5 text-[8px] ${theme.muted}`}>
                      {passage.title}
                    </p>
                  </div>

                  <div className="rounded-md bg-blue-600 px-2 py-1 text-[9px] font-bold text-white">
                    10:00
                  </div>
                </div>

                <div
                  className={`grid gap-2 ${
                    settings.layout === "horizontal"
                      ? "grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {settings.showPassage && (
                    <div
                      className={`min-w-0 rounded-lg border p-2 ${theme.preview}`}
                    >
                      <p className="mb-2 text-[9px] font-extrabold text-blue-500">
                        PASSAGE
                      </p>

                      <p
                        className={`whitespace-pre-wrap break-words leading-5 ${theme.muted}`}
                        style={{
                          fontFamily: FONT_FAMILIES[settings.fontFamily],
                          fontSize: "9px",
                        }}
                      >
                        {passagePreview}
                        {(passage.content ?? "").length > 380 ? "..." : ""}
                      </p>
                    </div>
                  )}

                  <div
                    className={`min-w-0 rounded-lg border p-2 ${theme.preview}`}
                  >
                    <p className="mb-2 text-[9px] font-extrabold text-indigo-500">
                      TYPE HERE
                    </p>

                    <div
                      className={`min-h-24 whitespace-pre-wrap break-words rounded-md border p-2 leading-5 ${theme.input}`}
                      style={{
                        fontFamily: FONT_FAMILIES[settings.fontFamily],
                        fontSize: "9px",
                      }}
                    >
                      {passagePreview.slice(0, 105)}
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-blue-500 align-middle" />
                    </div>

                    {settings.showStatistics && (
                      <div className="mt-2 grid grid-cols-3 gap-1">
                        <MiniMetric label="WPM" value="42" dark={dark} />
                        <MiniMetric label="Accuracy" value="98%" dark={dark} />
                        <MiniMetric label="Errors" value="2" dark={dark} />
                      </div>
                    )}
                  </div>
                </div>

                <p className={`mt-3 text-center text-[9px] ${theme.muted}`}>
                  Illustrative preview · Your actual exam starts after
                  confirmation
                </p>
              </div>
            </section>

            {/* SETTINGS SUMMARY */}

            <section
              className={`rounded-2xl border p-4 shadow-sm ${theme.panel}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold">
                    Configuration summary
                  </h3>

                  <p className={`mt-1 text-[10px] ${theme.muted}`}>
                    Your selected preferences
                  </p>
                </div>

                <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-500">
                  {settings.examPreset.toUpperCase()}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <SummaryRow
                  label="Passage words"
                  value={String(passageWordCount)}
                  dark={dark}
                />
                <SummaryRow
                  label="Layout"
                  value={settings.layout}
                  dark={dark}
                />
                <SummaryRow
                  label="Font"
                  value={settings.fontFamily}
                  dark={dark}
                />
                <SummaryRow
                  label="Font size"
                  value={settings.fontSize}
                  dark={dark}
                />
                <SummaryRow label="Theme" value={settings.theme} dark={dark} />
                <SummaryRow
                  label="Passage"
                  value={settings.showPassage ? "Visible" : "Hidden"}
                  dark={dark}
                />
                <SummaryRow
                  label="Auto-scroll"
                  value={settings.autoScroll ? "Enabled" : "Disabled"}
                  dark={dark}
                />
                <SummaryRow
                  label="Backspace"
                  value={settings.allowBackspace ? "Allowed" : "Disabled"}
                  dark={dark}
                />
                <SummaryRow
                  label="Paste"
                  value={settings.allowPaste ? "Allowed" : "Disabled"}
                  dark={dark}
                />
                <SummaryRow
                  label="Error highlighting"
                  value={settings.highlightErrors ? "Enabled" : "Disabled"}
                  dark={dark}
                />
              </div>

              <button
                type="button"
                onClick={resetSettings}
                className={`mt-5 w-full rounded-xl border px-3 py-2.5 text-xs font-bold transition ${theme.border} ${theme.hover}`}
              >
                ↺ Reset all settings
              </button>
            </section>

            {/* READY CARD */}

            <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 p-5 text-white shadow-xl shadow-blue-900/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
                  🚀
                </div>

                <div>
                  <h3 className="text-sm font-extrabold">Ready to begin?</h3>

                  <p className="mt-0.5 text-[10px] text-blue-100">
                    Your preferences are ready.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/15 bg-white/10 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-100">Selected passage</span>
                  <span className="font-bold">{passageWordCount} words</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-blue-100">Examination</span>
                  <span className="font-bold">Ready</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-300/30 bg-red-500/20 p-3 text-xs leading-5 text-white">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleStartExam()}
                disabled={starting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg transition hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
                    Preparing examination...
                  </>
                ) : (
                  <>
                    Start Examination
                    <span>→</span>
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[10px] leading-5 text-blue-100">
                Your examination attempt and timer begin when you start.
              </p>
            </section>
          </aside>
        </div>

        {/* MOBILE START BAR */}

        <div className="mt-5 xl:hidden">
          <button
            type="button"
            onClick={() => void handleStartExam()}
            disabled={starting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
          >
            {starting ? "Preparing examination..." : "Start Examination →"}
          </button>
        </div>

        <footer
          className={`mt-8 border-t py-5 text-center text-[10px] ${theme.border} ${theme.muted}`}
        >
          Review your settings carefully before starting. Good luck with your
          examination.
        </footer>
      </div>
    </div>
  );
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const HeroTag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold capitalize text-blue-50">
    {children}
  </span>
);

const HeroMetric = ({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) => (
  <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
    <p className="text-[9px] font-medium text-blue-100">{label}</p>
    <p className="mt-1 break-words text-lg font-extrabold capitalize">
      {value}
    </p>
    {suffix && <p className="text-[9px] text-blue-100">{suffix}</p>}
  </div>
);

const SectionTitle = ({
  number,
  title,
  description,
  dark,
}: {
  number: string;
  title: string;
  description: string;
  dark: boolean;
}) => (
  <div className="flex items-start gap-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-extrabold text-blue-500">
      {number}
    </span>

    <div className="min-w-0">
      <h3
        className={`text-sm font-extrabold ${dark ? "text-slate-100" : "text-slate-900"}`}
      >
        {title}
      </h3>

      <p
        className={`mt-1 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}
      >
        {description}
      </p>
    </div>
  </div>
);

const PresetCard = ({
  title,
  subtitle,
  details,
  icon,
  selected,
  onClick,
  dark,
}: {
  title: string;
  subtitle: string;
  details: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  dark: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`relative rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
      selected
        ? dark
          ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
          : "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
        : dark
          ? "border-slate-700 bg-slate-800/40 hover:border-blue-500"
          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
    }`}
  >
    {selected && (
      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
        ✓
      </span>
    )}

    <div className="text-2xl">{icon}</div>

    <h4
      className={`mt-3 text-sm font-extrabold ${dark ? "text-slate-100" : "text-slate-900"}`}
    >
      {title}
    </h4>

    <p
      className={`mt-1 text-[10px] leading-4 ${dark ? "text-slate-400" : "text-slate-500"}`}
    >
      {subtitle}
    </p>

    <p className="mt-3 text-[10px] font-bold text-blue-500">{details}</p>
  </button>
);

const LayoutCard = ({
  title,
  description,
  selected,
  vertical,
  dark,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  vertical: boolean;
  dark: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`rounded-2xl border p-4 text-left transition ${
      selected
        ? dark
          ? "border-blue-500 bg-blue-500/10"
          : "border-blue-500 bg-blue-50"
        : dark
          ? "border-slate-700 hover:border-blue-500"
          : "border-slate-200 hover:border-blue-300"
    }`}
  >
    <div className="mb-4 flex h-24 gap-2 rounded-xl border border-dashed border-slate-400/30 p-2">
      <div
        className={`rounded-lg bg-blue-500/20 ${vertical ? "h-1/2 w-full" : "h-full w-1/2"}`}
      />
      <div
        className={`rounded-lg bg-indigo-500/20 ${vertical ? "h-1/2 w-full" : "h-full w-1/2"}`}
      />
    </div>

    <div className="flex items-center justify-between gap-2">
      <h4
        className={`text-xs font-extrabold ${dark ? "text-slate-100" : "text-slate-900"}`}
      >
        {title}
      </h4>

      <span
        className={`h-4 w-4 rounded-full border-2 ${
          selected
            ? "border-blue-600 bg-blue-600 ring-2 ring-blue-200"
            : "border-slate-400"
        }`}
      />
    </div>

    <p
      className={`mt-1 text-[10px] leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}
    >
      {description}
    </p>
  </button>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  theme,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  theme: { input: string };
}) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-xs font-bold text-slate-500">{label}</span>

    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full min-w-0 rounded-xl border px-3 py-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ${theme.input}`}
    >
      {options.map(([key, optionLabel]) => (
        <option key={key} value={key}>
          {optionLabel}
        </option>
      ))}
    </select>
  </label>
);

const ThemeCard = ({
  title,
  description,
  selected,
  dark,
  mode,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  dark: boolean;
  mode: "light" | "dark";
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`rounded-xl border p-3 text-left transition ${
      selected
        ? "border-blue-500 ring-2 ring-blue-500/10"
        : dark
          ? "border-slate-700"
          : "border-slate-200"
    }`}
  >
    <div
      className={`mb-3 flex h-12 items-center gap-1 rounded-lg p-2 ${
        mode === "dark" ? "bg-slate-900" : "bg-slate-100"
      }`}
    >
      <div
        className={`h-full w-1/3 rounded ${mode === "dark" ? "bg-slate-700" : "bg-white"}`}
      />
      <div
        className={`h-full flex-1 rounded ${mode === "dark" ? "bg-slate-800" : "bg-white"}`}
      />
    </div>

    <div className="flex items-center justify-between gap-2">
      <span
        className={`text-xs font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}
      >
        {title}
      </span>

      {selected && <span className="text-xs font-bold text-blue-500">✓</span>}
    </div>

    <p
      className={`mt-1 text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}
    >
      {description}
    </p>
  </button>
);

const PreferenceToggle = ({
  title,
  description,
  checked,
  onChange,
  dark,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  dark: boolean;
}) => (
  <label
    className={`flex min-w-0 cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition ${
      dark
        ? "border-slate-700 bg-slate-800/30 hover:border-blue-500"
        : "border-slate-200 bg-slate-50/70 hover:border-blue-300"
    }`}
  >
    <span className="min-w-0">
      <span
        className={`block text-xs font-bold ${dark ? "text-slate-100" : "text-slate-800"}`}
      >
        {title}
      </span>

      <span
        className={`mt-1 block text-[10px] leading-4 ${dark ? "text-slate-400" : "text-slate-500"}`}
      >
        {description}
      </span>
    </span>

    <span className="relative mt-0.5 inline-flex shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        className={`h-5 w-9 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${
          checked ? "bg-blue-600" : dark ? "bg-slate-600" : "bg-slate-300"
        }`}
      />

      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </span>
  </label>
);

const SummaryRow = ({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
      {label}
    </span>

    <span
      className={`break-words text-right text-xs font-bold capitalize ${
        dark ? "text-slate-200" : "text-slate-800"
      }`}
    >
      {value}
    </span>
  </div>
);

const MiniMetric = ({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) => (
  <div
    className={`rounded-md p-1.5 text-center ${
      dark ? "bg-slate-800" : "bg-slate-100"
    }`}
  >
    <p className={`text-[8px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
      {label}
    </p>

    <p
      className={`mt-0.5 text-[10px] font-bold ${
        dark ? "text-slate-100" : "text-slate-800"
      }`}
    >
      {value}
    </p>
  </div>
);

export default TypingExamSetupPage;
