import { useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
} from "lucide-react";

import { startTypingAttempt } from "../services/typing.service";
import type {
  StartTypingAttemptResponse,
  TypingPassage,
} from "../types/typing.types";
import { DEFAULT_EXAM_SETTINGS } from "../types/typing-ui.types";
import type { ExamSettings, FontFamily } from "../types/typing-ui.types";

interface SetupLocationState {
  passage: TypingPassage;
  exam?: StartTypingAttemptResponse["exam"];
  examTitle?: string;
  examDuration?: number;
  targetWpm?: number;
  instructions?: string[];
}

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

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const dark = settings.theme === "dark";

  const wordCount = passage
    ? (passage.wordCount ??
      (passage.content ?? "").trim().split(/\s+/).filter(Boolean).length)
    : 0;

  const pageClass = dark
    ? "bg-[#101828] text-[#F9FAFB]"
    : "bg-[#F8FAFC] text-[#101828]";

  const panelClass = dark
    ? "border-[#344054] bg-[#1D2939]"
    : "border-[#E4E7EC] bg-white";

  const mutedClass = dark ? "text-[#98A2B3]" : "text-[#667085]";

  const labelClass = dark ? "text-[#EAECF0]" : "text-[#344054]";

  const fieldClass = dark
    ? "border-[#475467] bg-[#101828] text-[#F9FAFB]"
    : "border-[#D0D5DD] bg-white text-[#101828]";

  const dividerClass = dark ? "divide-[#344054]" : "divide-[#EAECF0]";

  const updateSetting = <K extends keyof ExamSettings>(
    key: K,
    value: ExamSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
      examPreset: "custom",
    }));
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_EXAM_SETTINGS });
    setError("");
  };

  const handleStartExam = async () => {
    if (starting || !examId || !passageId) return;

    setStarting(true);
    setError("");

    const wasAlreadyFullscreen = Boolean(document.fullscreenElement);
    let enteredFullscreen = wasAlreadyFullscreen;

    try {
      if (!wasAlreadyFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
          enteredFullscreen = Boolean(document.fullscreenElement);
        } catch (fullscreenError) {
          console.warn("Fullscreen unavailable:", fullscreenError);
        }
      }

      const response: StartTypingAttemptResponse = await startTypingAttempt(
        examId,
        passageId,
      );

      navigate(`/typing-exams/${examId}/passages/${passageId}/start`, {
        state: {
          attempt: response.attempt,
          exam: response.exam,
          passage: response.passage,
          remainingSeconds: response.remainingSeconds,
          settings,
          fullscreen: enteredFullscreen,
        },
      });
    } catch (err) {
      console.error("Failed to start typing examination:", err);

      if (!wasAlreadyFullscreen && document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (fullscreenError) {
          console.warn("Could not exit fullscreen:", fullscreenError);
        }
      }

      setError("Unable to start the examination. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  if (!examId || !passageId || !passage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <section className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#155EEF]">
            <Monitor size={23} />
          </div>

          <h1 className="mt-4 text-lg font-semibold text-[#101828]">
            Passage details unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Return to the examination and select a passage again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/typing-exams")}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-4 text-sm font-semibold text-white transition hover:bg-[#004EEB]"
          >
            <ArrowLeft size={15} />
            Back to examinations
          </button>
        </section>
      </main>
    );
  }

  const inputClass = `mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-[#155EEF] focus:ring-2 focus:ring-[#155EEF]/15 ${fieldClass}`;

  return (
    <main className={`min-h-screen ${pageClass}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-30 border-b ${
          dark ? "border-[#344054] bg-[#1D2939]" : "border-[#E4E7EC] bg-white"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(`/typing-exams/${examId}`)}
            aria-label="Back to examination"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
              dark
                ? "border-[#475467] text-[#D0D5DD] hover:border-[#155EEF] hover:text-white"
                : "border-[#E4E7EC] text-[#475467] hover:border-[#155EEF] hover:text-[#155EEF]"
            }`}
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0 flex-1">
            <div className={`flex items-center gap-1.5 text-xs ${mutedClass}`}>
              <span>Examinations</span>
              <ChevronRight size={12} />
              <span className="truncate">
                {routeState?.examTitle || "Typing examination"}
              </span>
            </div>

            <h1 className="mt-0.5 truncate text-base font-semibold sm:text-lg">
              Examination setup
            </h1>
          </div>

          <div
            className={`hidden items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium sm:flex ${
              dark
                ? "border-[#475467] text-[#D0D5DD]"
                : "border-[#E4E7EC] text-[#475467]"
            }`}
          >
            <Monitor size={15} className="text-[#155EEF]" />
            Workspace settings
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* Page heading */}
        <section className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#155EEF]">
            Akshar AI · Preparation
          </p>

          <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">
            Prepare your typing workspace
          </h2>

          <p className={`mt-1.5 max-w-2xl text-sm leading-6 ${mutedClass}`}>
            Customize your typing environment before starting the examination.
          </p>
        </section>

        {/* Selected passage */}
        <section className={`mb-6 rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#155EEF]">
                <Monitor size={21} />
              </div>

              <div className="min-w-0">
                <p className={`text-xs font-medium ${mutedClass}`}>
                  Selected passage
                </p>

                <h3 className="mt-1 break-words text-lg font-semibold">
                  {passage.title}
                </h3>

                <div
                  className={`mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs ${mutedClass}`}
                >
                  <span className="capitalize">{passage.language}</span>
                  <span>{wordCount.toLocaleString()} words</span>

                  {passage.difficulty && (
                    <span className="capitalize">
                      {passage.difficulty} difficulty
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              {routeState?.examDuration ? (
                <InfoPill
                  label="Duration"
                  value={`${Math.ceil(routeState.examDuration / 60)} min`}
                  dark={dark}
                />
              ) : null}

              {routeState?.targetWpm ? (
                <InfoPill
                  label="Target speed"
                  value={`${routeState.targetWpm} WPM`}
                  dark={dark}
                />
              ) : null}
            </div>
          </div>
        </section>

        {/* Settings layout */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          <div className="min-w-0 space-y-5 xl:col-span-8">
            {/* Workspace layout */}
            <section className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
              <SectionHeading
                number="01"
                title="Workspace layout"
                description="Choose how the passage and typing area are arranged."
                mutedClass={mutedClass}
              />

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChoiceButton
                  selected={settings.layout === "horizontal"}
                  title="Side by side"
                  description="Display the passage beside the typing area."
                  onClick={() => updateSetting("layout", "horizontal")}
                  dark={dark}
                />

                <ChoiceButton
                  selected={settings.layout === "vertical"}
                  title="Stacked"
                  description="Display the passage above the typing area."
                  onClick={() => updateSetting("layout", "vertical")}
                  dark={dark}
                />
              </div>
            </section>

            {/* Text appearance */}
            <section className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
              <SectionHeading
                number="02"
                title="Text appearance"
                description="Set your preferred font and display theme."
                mutedClass={mutedClass}
              />

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={`text-sm font-medium ${labelClass}`}>
                  Font family
                  <select
                    value={settings.fontFamily}
                    onChange={(event) =>
                      updateSetting(
                        "fontFamily",
                        event.target.value as FontFamily,
                      )
                    }
                    className={inputClass}
                  >
                    <option value="arial">Arial</option>
                    <option value="roboto">Roboto</option>
                    <option value="inter">Inter</option>
                    <option value="calibri">Calibri</option>
                    <option value="times">Times New Roman</option>
                    <option value="mono">Courier New</option>
                  </select>
                </label>

                <label className={`text-sm font-medium ${labelClass}`}>
                  Font size
                  <select
                    value={settings.fontSize}
                    onChange={(event) =>
                      updateSetting(
                        "fontSize",
                        event.target.value as ExamSettings["fontSize"],
                      )
                    }
                    className={inputClass}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </label>
              </div>

              <div className="mt-5">
                <p className={`mb-3 text-sm font-medium ${labelClass}`}>
                  Workspace theme
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <ThemeButton
                    selected={settings.theme === "light"}
                    title="Light"
                    icon={<Sun size={17} />}
                    onClick={() => updateSetting("theme", "light")}
                    dark={dark}
                  />

                  <ThemeButton
                    selected={settings.theme === "dark"}
                    title="Dark"
                    icon={<Moon size={17} />}
                    onClick={() => updateSetting("theme", "dark")}
                    dark={dark}
                  />
                </div>
              </div>
            </section>

            {/* Typing preferences */}
            <section className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
              <SectionHeading
                number="03"
                title="Typing preferences"
                description="Configure the tools available during your examination."
                mutedClass={mutedClass}
              />

              <div className={`mt-3 divide-y ${dividerClass}`}>
                <PreferenceRow
                  title="Show passage"
                  description="Keep the reference passage visible."
                  checked={settings.showPassage}
                  onChange={(value) => updateSetting("showPassage", value)}
                  dark={dark}
                />

                <PreferenceRow
                  title="Auto-scroll passage"
                  description="Keep the current passage position in view."
                  checked={settings.autoScroll}
                  onChange={(value) => updateSetting("autoScroll", value)}
                  dark={dark}
                />

                <PreferenceRow
                  title="Highlight errors"
                  description="Highlight incorrect characters while typing."
                  checked={settings.highlightErrors}
                  onChange={(value) => updateSetting("highlightErrors", value)}
                  dark={dark}
                />

                <PreferenceRow
                  title="Live statistics"
                  description="Display typing speed and accuracy during the test."
                  checked={settings.showStatistics}
                  onChange={(value) => updateSetting("showStatistics", value)}
                  dark={dark}
                />

                <PreferenceRow
                  title="Allow backspace"
                  description="Allow corrections in the typing area."
                  checked={settings.allowBackspace}
                  onChange={(value) => updateSetting("allowBackspace", value)}
                  dark={dark}
                />

                <PreferenceRow
                  title="Allow paste"
                  description="Allow pasted text in the typing area."
                  checked={settings.allowPaste}
                  onChange={(value) => updateSetting("allowPaste", value)}
                  dark={dark}
                />

                <PreferenceRow
                  title="Auto-focus typing area"
                  description="Focus the typing field when the test opens."
                  checked={settings.autoFocus}
                  onChange={(value) => updateSetting("autoFocus", value)}
                  dark={dark}
                />
              </div>
            </section>

            {/* Instructions */}
            {routeState?.instructions?.length ? (
              <section
                className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}
              >
                <SectionHeading
                  number="04"
                  title="Examination instructions"
                  description="Review these instructions before starting."
                  mutedClass={mutedClass}
                />

                <ol className={`mt-4 space-y-3 ${mutedClass}`}>
                  {routeState.instructions.map((instruction, index) => (
                    <li
                      key={`${index}-${instruction}`}
                      className="flex items-start gap-3 text-sm leading-6"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-[#155EEF]">
                        {index + 1}
                      </span>

                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-5 xl:sticky xl:top-24 xl:col-span-4">
            {/* Settings overview */}
            <section className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Settings overview</h3>
                  <p className={`mt-1 text-xs ${mutedClass}`}>
                    Your current configuration
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#155EEF] transition hover:bg-blue-50"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>

              <dl className={`mt-5 space-y-3 text-sm ${mutedClass}`}>
                <OverviewRow
                  label="Layout"
                  value={
                    settings.layout === "horizontal"
                      ? "Side by side"
                      : "Stacked"
                  }
                  dark={dark}
                />

                <OverviewRow
                  label="Font family"
                  value={settings.fontFamily}
                  dark={dark}
                />

                <OverviewRow
                  label="Font size"
                  value={settings.fontSize}
                  dark={dark}
                />

                <OverviewRow label="Theme" value={settings.theme} dark={dark} />

                <OverviewRow
                  label="Passage"
                  value={settings.showPassage ? "Visible" : "Hidden"}
                  dark={dark}
                />

                <OverviewRow
                  label="Error highlighting"
                  value={settings.highlightErrors ? "Enabled" : "Disabled"}
                  dark={dark}
                />

                <OverviewRow
                  label="Live statistics"
                  value={settings.showStatistics ? "Enabled" : "Disabled"}
                  dark={dark}
                />
              </dl>
            </section>

            {/* Start examination */}
            <section className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
              <div className="flex items-center gap-2">
                <Monitor size={17} className="text-[#155EEF]" />
                <h3 className="text-sm font-semibold">Ready to begin?</h3>
              </div>

              <p className={`mt-2 text-xs leading-5 ${mutedClass}`}>
                Your selected preferences will be applied to the typing
                workspace.
              </p>

              <div
                className={`mt-4 space-y-3 border-t pt-4 text-xs leading-5 ${
                  dark
                    ? "border-[#344054] text-[#98A2B3]"
                    : "border-[#EAECF0] text-[#667085]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#155EEF]" />
                  The attempt begins when you start the examination.
                </div>

                <div className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#155EEF]" />
                  The examination timer is controlled by the server.
                </div>

                <div className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-[#155EEF]" />
                  Fullscreen is requested where supported by your browser.
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleStartExam()}
                disabled={starting}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004EEB] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Starting examination...
                  </>
                ) : (
                  <>
                    Start examination
                    <ChevronRight size={17} />
                  </>
                )}
              </button>

              <p className={`mt-3 text-center text-[11px] ${mutedClass}`}>
                Review your settings before continuing.
              </p>
            </section>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#E4E7EC] pt-5 text-center">
          <p className={`text-xs ${mutedClass}`}>
            © {new Date().getFullYear()} Akshar AI. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
};

/* Section heading */
function SectionHeading({
  number,
  title,
  description,
  mutedClass,
}: {
  number: string;
  title: string;
  description: string;
  mutedClass: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-[#155EEF]">
        {number}
      </span>

      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className={`mt-1 text-xs leading-5 ${mutedClass}`}>{description}</p>
      </div>
    </div>
  );
}

/* Exam information */
function InfoPill({
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
      className={`min-w-[105px] rounded-lg border px-3 py-2.5 ${
        dark ? "border-[#475467] bg-[#101828]" : "border-[#E4E7EC] bg-[#F9FAFB]"
      }`}
    >
      <p
        className={`text-[11px] ${dark ? "text-[#98A2B3]" : "text-[#667085]"}`}
      >
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

/* Workspace layout option */
function ChoiceButton({
  selected,
  title,
  description,
  onClick,
  dark,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  dark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#155EEF] bg-[#155EEF]/5 ring-2 ring-[#155EEF]/10"
          : dark
            ? "border-[#475467] hover:border-[#667085]"
            : "border-[#E4E7EC] hover:border-[#98A2B3]"
      }`}
    >
      <span className="flex items-center justify-between gap-2 text-sm font-semibold">
        {title}
        {selected && <Check size={16} className="text-[#155EEF]" />}
      </span>

      <span
        className={`mt-1.5 block text-xs leading-5 ${
          dark ? "text-[#98A2B3]" : "text-[#667085]"
        }`}
      >
        {description}
      </span>
    </button>
  );
}

/* Theme selection */
function ThemeButton({
  selected,
  title,
  icon,
  onClick,
  dark,
}: {
  selected: boolean;
  title: string;
  icon: ReactNode;
  onClick: () => void;
  dark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
        selected
          ? "border-[#155EEF] bg-[#155EEF]/5 text-[#155EEF] ring-2 ring-[#155EEF]/10"
          : dark
            ? "border-[#475467] text-[#D0D5DD] hover:border-[#667085]"
            : "border-[#E4E7EC] text-[#475467] hover:border-[#98A2B3]"
      }`}
    >
      {icon}
      {title}
      {selected && <Check size={15} />}
    </button>
  );
}

/* Typing preference row */
function PreferenceRow({
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
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>

        <span
          className={`mt-1 block text-xs leading-5 ${
            dark ? "text-[#98A2B3]" : "text-[#667085]"
          }`}
        >
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer accent-[#155EEF]"
      />
    </label>
  );
}

/* Settings overview row */
function OverviewRow({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>

      <dd
        className={`max-w-[55%] truncate text-right font-medium capitalize ${
          dark ? "text-[#EAECF0]" : "text-[#344054]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default TypingExamSetupPage;
