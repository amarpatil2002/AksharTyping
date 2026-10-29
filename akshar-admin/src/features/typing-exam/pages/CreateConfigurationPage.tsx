import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createConfiguration,
  getConfigurationById,
  updateConfiguration,
} from "../api/configApi";
import { toast } from "sonner";
import { DEFAULT_CONFIG_VALUES } from "../utils/configDefault";
import type {
  CreateTypingExamConfigPayload,
  TypingExamConfigForm,
} from "../types/config.types";

const sections = [
  { id: "basic", label: "Basic details" },
  { id: "metadata", label: "Exam metadata" },
  { id: "passage", label: "Passage settings" },
  { id: "instructions", label: "Instructions" },
  { id: "evaluation", label: "Evaluation rules" },
  { id: "interface", label: "Exam interface" },
  { id: "workflow", label: "Workflow" },
  { id: "analytics", label: "Analytics" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </Field>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      <input
        className={inputClass}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          if (event.target.value === "") return;
          onChange(Number(event.target.value));
        }}
        required
      />
    </Field>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-blue-600"
      />
    </label>
  );
}

export default function CreateConfigurationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [loadingConfig, setLoadingConfig] = useState(Boolean(id));
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const initialFormRef = useRef<TypingExamConfigForm>(
    structuredClone(DEFAULT_CONFIG_VALUES) as TypingExamConfigForm,
  );

  const [form, setForm] = useState<TypingExamConfigForm>(
    () => structuredClone(DEFAULT_CONFIG_VALUES) as TypingExamConfigForm,
  );
  const [activeSection, setActiveSection] = useState<SectionId>("basic");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(initialFormRef.current);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty || submitting) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty, submitting]);

  function handleCancel() {
    if (submitting) return;
    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    navigate("/typing-exam/configurations");
  }

  function discardChanges() {
    setDiscardDialogOpen(false);
    navigate("/typing-exam/configurations");
  }

  // In edit mode, fetch the existing configuration and hydrate every form section.
  useEffect(() => {
    if (!id) {
      setLoadingConfig(false);
      return;
    }

    let cancelled = false;

    async function loadConfiguration() {
      setLoadingConfig(true);
      setError("");

      try {
        // TypeScript now knows id is a string.

        if (!id) {
          throw new Error("Configuration ID is missing.");
        }

        const config = await getConfigurationById(id);

        if (!config || typeof config !== "object") {
          throw new Error("Configuration data was not returned by the server.");
        }

        if (!cancelled) {
          setForm((previous) => ({
            ...previous,
            ...config,
            name: config.name ?? previous.name,
            description: config.description ?? previous.description,
          }));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load configuration.";

          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingConfig(false);
        }
      }
    }

    void loadConfiguration();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function updateForm<K extends keyof CreateTypingExamConfigPayload>(
    key: K,
    value: CreateTypingExamConfigPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMetadata(
    key: keyof NonNullable<CreateTypingExamConfigPayload["examMetadata"]>,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      examMetadata: {
        ...DEFAULT_CONFIG_VALUES.examMetadata!,
        ...current.examMetadata,
        [key]: value,
      },
    }));
  }

  function updatePassage(
    key: keyof NonNullable<CreateTypingExamConfigPayload["passageSettings"]>,
    value: string | number | boolean | null,
  ) {
    setForm((current) => ({
      ...current,
      passageSettings: {
        ...DEFAULT_CONFIG_VALUES.passageSettings!,
        ...current.passageSettings,
        [key]: value,
      },
    }));
  }

  function updateEvaluation(
    key: keyof NonNullable<CreateTypingExamConfigPayload["evaluationRules"]>,
    value: string | number | boolean | null,
  ) {
    setForm((current) => ({
      ...current,
      evaluationRules: {
        ...DEFAULT_CONFIG_VALUES.evaluationRules!,
        ...current.evaluationRules,
        [key]: value,
      },
    }));
  }

  function updateInterface(
    key: keyof NonNullable<CreateTypingExamConfigPayload["examInterface"]>,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      examInterface: {
        ...DEFAULT_CONFIG_VALUES.examInterface!,
        ...current.examInterface,
        [key]: value,
      },
    }));
  }

  function updateAnalytics(
    key: keyof NonNullable<CreateTypingExamConfigPayload["analyticsSettings"]>,
    value: number | boolean,
  ) {
    setForm((current) => ({
      ...current,
      analyticsSettings: {
        ...DEFAULT_CONFIG_VALUES.analyticsSettings!,
        ...current.analyticsSettings,
        [key]: value,
      },
    }));
  }

  function updateInstruction(index: number, value: string) {
    const instructions = [...(form.instructions ?? [])];
    instructions[index] = value;
    updateForm("instructions", instructions);
  }

  function addInstruction() {
    updateForm("instructions", [...(form.instructions ?? []), ""]);
  }

  function removeInstruction(index: number) {
    updateForm(
      "instructions",
      (form.instructions ?? []).filter((_, i) => i !== index),
    );
  }

  function updateWorkflowStage(
    index: number,
    key: "key" | "type" | "enabled" | "required" | "durationSeconds",
    value: string | boolean | number | undefined,
  ) {
    setForm((current) => {
      const workflow =
        current.examWorkflow ?? DEFAULT_CONFIG_VALUES.examWorkflow!;
      const stages = workflow.stages.map((stage, i) =>
        i === index ? { ...stage, [key]: value } : stage,
      );

      return { ...current, examWorkflow: { ...workflow, stages } };
    });
  }

  function addWorkflowStage() {
    setForm((current) => {
      const workflow =
        current.examWorkflow ?? DEFAULT_CONFIG_VALUES.examWorkflow!;

      return {
        ...current,
        examWorkflow: {
          ...workflow,
          stages: [
            ...workflow.stages,
            {
              key: `stage_${workflow.stages.length + 1}`,
              type: "typing_test",
              enabled: true,
              required: true,
            },
          ],
        },
      };
    });
  }

  function removeWorkflowStage(index: number) {
    setForm((current) => {
      const workflow =
        current.examWorkflow ?? DEFAULT_CONFIG_VALUES.examWorkflow!;

      return {
        ...current,
        examWorkflow: {
          ...workflow,
          stages: workflow.stages.filter((_, i) => i !== index),
        },
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || loadingConfig) return;
    setError("");
    setSuccessMessage("");

    if (!form.name.trim()) {
      setError("Configuration name is required.");
      setActiveSection("basic");
      return;
    }

    if (!form.examWorkflow?.stages.length) {
      setError("Add at least one workflow stage.");
      setActiveSection("workflow");
      return;
    }

    if (
      form.passageSettings?.minimumWordCount != null &&
      form.passageSettings.maximumWordCount != null &&
      form.passageSettings.minimumWordCount >
        form.passageSettings.maximumWordCount
    ) {
      setError("Minimum word count cannot exceed maximum word count.");
      setActiveSection("passage");
      return;
    }

    if (
      form.evaluationRules?.passingMarks != null &&
      form.evaluationRules.maximumMarks != null &&
      form.evaluationRules.passingMarks > form.evaluationRules.maximumMarks
    ) {
      setError("Passing marks cannot exceed maximum marks.");
      setActiveSection("evaluation");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() ?? "",
        instructions: (form.instructions ?? [])
          .map((instruction) => instruction.trim())
          .filter(Boolean),
      };

      const toastId = toast.loading(
        isEditMode
          ? "Saving configuration changes..."
          : "Creating configuration...",
      );

      const result = isEditMode
        ? await updateConfiguration(id!, payload)
        : await createConfiguration(payload);

      const message =
        result?.message ||
        (isEditMode
          ? "Configuration updated successfully."
          : "Configuration created successfully.");

      setSuccessMessage(message);
      initialFormRef.current = structuredClone(form);
      toast.success(message, { id: toastId });

      navigate("/typing-exam/configurations", {
        replace: true,
        state: { successMessage: message },
      });
    } catch (err) {
      const responseError = err as {
        response?: {
          data?: {
            message?: string;
            errors?: { message?: string }[];
          };
        };
      };

      const validationErrors = responseError.response?.data?.errors
        ?.map((item) => item.message)
        .filter(Boolean);

      const message = validationErrors?.length
        ? validationErrors.join(" ")
        : (responseError.response?.data?.message ??
          (isEditMode
            ? "Unable to update configuration. Check the fields and try again."
            : "Unable to create configuration. Check the fields and try again."));
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const metadata = form.examMetadata!;
  const passage = form.passageSettings!;
  const evaluation = form.evaluationRules!;
  const examInterface = form.examInterface!;
  const analytics = form.analyticsSettings!;
  const workflow = form.examWorkflow!;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/typing-exam/configurations"
            onClick={(event) => {
              if (isDirty) {
                event.preventDefault();
                setDiscardDialogOpen(true);
              }
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Configurations
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {isEditMode ? "Edit configuration" : "Create configuration"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Review and update the existing typing exam configuration."
              : "Configure the typing exam, evaluation criteria, and candidate experience."}
          </p>
        </div>
      </div>

      {loadingConfig && (
        <div
          className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700"
          role="status"
        >
          <span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          Loading configuration data...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Horizontal configuration stepper */}
          <nav
            aria-label="Configuration steps"
            className="overflow-x-auto rounded-xl border border-blue-100 bg-white p-3 shadow-sm"
          >
            <ol className="flex min-w-max items-center gap-2">
              {sections.map((section, index) => {
                const activeIndex = sections.findIndex(
                  (item) => item.id === activeSection,
                );
                const isActive = activeSection === section.id;
                const isCompleted = index < activeIndex;

                return (
                  <li key={section.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      aria-current={isActive ? "step" : undefined}
                      className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : isCompleted
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isActive
                            ? "bg-white text-blue-700"
                            : isCompleted
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </span>
                      <span className="whitespace-nowrap">{section.label}</span>
                    </button>

                    {index < sections.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`h-px w-5 shrink-0 ${
                          isCompleted ? "bg-blue-300" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {activeSection === "basic" && (
              <section>
                <SectionHeading
                  title="Basic details"
                  description="Set the configuration name, language, and exam duration."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <TextInput
                      label="Configuration name"
                      value={form.name}
                      onChange={(value) => updateForm("name", value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Field label="Description">
                      <textarea
                        className={inputClass}
                        rows={3}
                        maxLength={2000}
                        value={form.description ?? ""}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
                        }
                      />
                    </Field>
                  </div>

                  <SelectInput
                    label="Language"
                    value={form.language}
                    options={[
                      { label: "English", value: "en" },
                      { label: "Hindi", value: "hi" },
                      { label: "Marathi", value: "mr" },
                    ]}
                    onChange={(value) =>
                      updateForm(
                        "language",
                        value as CreateTypingExamConfigPayload["language"],
                      )
                    }
                  />

                  <NumberInput
                    label="Duration (seconds)"
                    value={form.durationSeconds}
                    min={10}
                    max={7200}
                    onChange={(value) => updateForm("durationSeconds", value)}
                  />

                  <NumberInput
                    label="Target WPM"
                    value={form.targetWpm ?? 40}
                    min={0}
                    max={500}
                    onChange={(value) => updateForm("targetWpm", value)}
                  />
                </div>
              </section>
            )}

            {activeSection === "metadata" && (
              <section>
                <SectionHeading
                  title="Exam metadata"
                  description="Identify the jurisdiction, recruiting authority, and official rules."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {(
                    [
                      ["country", "Country"],
                      ["state", "State"],
                      ["jurisdiction", "Jurisdiction"],
                      ["recruitmentAuthority", "Recruitment authority"],
                      ["courtName", "Court name"],
                      ["postName", "Post name"],
                      ["examCategory", "Exam category"],
                      ["examStage", "Exam stage"],
                      ["notificationNumber", "Notification number"],
                      ["ruleVersion", "Rule version"],
                      ["officialSourceUrl", "Official source URL"],
                    ] as const
                  ).map(([key, label]) => (
                    <TextInput
                      key={key}
                      label={label}
                      value={metadata[key]}
                      onChange={(value) => updateMetadata(key, value)}
                    />
                  ))}

                  <Field label="Notification date">
                    <input
                      type="date"
                      className={inputClass}
                      value={
                        metadata.notificationDate
                          ? metadata.notificationDate.slice(0, 10)
                          : ""
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          examMetadata: {
                            ...current.examMetadata!,
                            notificationDate: event.target.value || null,
                          },
                        }))
                      }
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Notes">
                      <textarea
                        className={inputClass}
                        rows={3}
                        maxLength={2000}
                        value={metadata.notes}
                        onChange={(event) =>
                          updateMetadata("notes", event.target.value)
                        }
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-2">
                    <Toggle
                      label="Official rules verified"
                      checked={metadata.officialRulesVerified}
                      onChange={(value) =>
                        updateMetadata("officialRulesVerified", value)
                      }
                    />
                  </div>
                </div>
              </section>
            )}

            {activeSection === "passage" && (
              <section>
                <SectionHeading
                  title="Passage settings"
                  description="Define the source and text formatting rules."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <SelectInput
                    label="Passage source"
                    value={passage.sourceType}
                    options={[
                      { label: "Fixed passage", value: "fixed" },
                      { label: "Random passage", value: "random" },
                      { label: "Admin selected", value: "admin_selected" },
                    ]}
                    onChange={(value) => updatePassage("sourceType", value)}
                  />

                  <NumberInput
                    label="Expected line count"
                    value={passage.expectedLineCount ?? 10}
                    min={1}
                    onChange={(value) =>
                      updatePassage("expectedLineCount", value)
                    }
                  />

                  <NumberInput
                    label="Expected word count (optional)"
                    value={passage.expectedWordCount ?? 0}
                    min={0}
                    onChange={(value) =>
                      updatePassage(
                        "expectedWordCount",
                        value === 0 ? null : value,
                      )
                    }
                  />

                  <NumberInput
                    label="Minimum word count (optional)"
                    value={passage.minimumWordCount ?? 0}
                    min={0}
                    onChange={(value) =>
                      updatePassage(
                        "minimumWordCount",
                        value === 0 ? null : value,
                      )
                    }
                  />

                  <NumberInput
                    label="Maximum word count (optional)"
                    value={passage.maximumWordCount ?? 0}
                    min={0}
                    onChange={(value) =>
                      updatePassage(
                        "maximumWordCount",
                        value === 0 ? null : value,
                      )
                    }
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Toggle
                    label="Preserve line breaks"
                    checked={passage.preserveLineBreaks}
                    onChange={(value) =>
                      updatePassage("preserveLineBreaks", value)
                    }
                  />
                  <Toggle
                    label="Allow paragraphs"
                    checked={passage.allowParagraphs}
                    onChange={(value) =>
                      updatePassage("allowParagraphs", value)
                    }
                  />
                  <Toggle
                    label="Allow numbers"
                    checked={passage.allowNumbers}
                    onChange={(value) => updatePassage("allowNumbers", value)}
                  />
                  <Toggle
                    label="Allow punctuation"
                    checked={passage.allowPunctuation}
                    onChange={(value) =>
                      updatePassage("allowPunctuation", value)
                    }
                  />
                </div>
              </section>
            )}

            {activeSection === "instructions" && (
              <section>
                <SectionHeading
                  title="Candidate instructions"
                  description="Add the instructions candidates see before typing."
                />

                <div className="space-y-3">
                  {(form.instructions ?? []).map((instruction, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="mt-3 text-sm text-slate-400">
                        {index + 1}.
                      </span>
                      <textarea
                        className={inputClass}
                        rows={2}
                        maxLength={500}
                        value={instruction}
                        onChange={(event) =>
                          updateInstruction(index, event.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        aria-label={`Remove instruction ${index + 1}`}
                        className="mt-2 rounded-md px-2 py-1 text-lg text-red-600 hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={(form.instructions ?? []).length >= 30}
                  onClick={addInstruction}
                  className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  + Add instruction
                </button>
              </section>
            )}

            {activeSection === "evaluation" && (
              <section>
                <SectionHeading
                  title="Evaluation rules"
                  description="Configure speed, accuracy, qualification, and scoring."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <SelectInput
                    label="Evaluation strategy"
                    value={evaluation.strategy ?? "gross_net_wpm"}
                    options={[
                      { label: "Gross / Net WPM", value: "gross_net_wpm" },
                      { label: "Correct words", value: "correct_words" },
                      { label: "Error penalty", value: "error_penalty" },
                      {
                        label: "Qualification only",
                        value: "qualification_only",
                      },
                      { label: "Custom", value: "custom" },
                    ]}
                    onChange={(value) => updateEvaluation("strategy", value)}
                  />

                  <SelectInput
                    label="WPM method"
                    value={evaluation.wpmMethod ?? "net"}
                    options={[
                      { label: "Net WPM", value: "net" },
                      { label: "Gross WPM", value: "gross" },
                    ]}
                    onChange={(value) => updateEvaluation("wpmMethod", value)}
                  />

                  <SelectInput
                    label="Accuracy method"
                    value={evaluation.accuracyMethod ?? "allCharacters"}
                    options={[
                      { label: "All characters", value: "allCharacters" },
                      {
                        label: "Typed characters",
                        value: "typedCharacters",
                      },
                    ]}
                    onChange={(value) =>
                      updateEvaluation("accuracyMethod", value)
                    }
                  />

                  <SelectInput
                    label="Passing mode"
                    value={evaluation.passingMode ?? "all"}
                    options={[
                      { label: "All criteria", value: "all" },
                      { label: "Any criterion", value: "any" },
                    ]}
                    onChange={(value) => updateEvaluation("passingMode", value)}
                  />

                  <NumberInput
                    label="Word length"
                    value={evaluation.wordLength ?? 5}
                    min={1}
                    max={20}
                    onChange={(value) => updateEvaluation("wordLength", value)}
                  />

                  <NumberInput
                    label="Minimum WPM"
                    value={evaluation.minimumWpm ?? 0}
                    min={0}
                    onChange={(value) => updateEvaluation("minimumWpm", value)}
                  />

                  <NumberInput
                    label="Minimum accuracy (%)"
                    value={evaluation.minimumAccuracy ?? 0}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateEvaluation("minimumAccuracy", value)
                    }
                  />

                  <NumberInput
                    label="Error penalty per error"
                    value={evaluation.errorPenaltyPerError ?? 0}
                    min={0}
                    onChange={(value) =>
                      updateEvaluation("errorPenaltyPerError", value)
                    }
                  />

                  <NumberInput
                    label="Maximum errors (0 = no limit)"
                    value={evaluation.maximumErrors ?? 0}
                    min={0}
                    onChange={(value) =>
                      updateEvaluation(
                        "maximumErrors",
                        value === 0 ? null : value,
                      )
                    }
                  />

                  <NumberInput
                    label="Maximum error percentage (0 = unset)"
                    value={evaluation.maximumErrorPercentage ?? 0}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateEvaluation(
                        "maximumErrorPercentage",
                        value === 0 ? null : value,
                      )
                    }
                  />

                  <NumberInput
                    label="Maximum marks (0 = unset)"
                    value={evaluation.maximumMarks ?? 0}
                    min={0}
                    onChange={(value) =>
                      updateEvaluation(
                        "maximumMarks",
                        value === 0 ? null : value,
                      )
                    }
                  />

                  <NumberInput
                    label="Passing marks (0 = unset)"
                    value={evaluation.passingMarks ?? 0}
                    min={0}
                    onChange={(value) =>
                      updateEvaluation(
                        "passingMarks",
                        value === 0 ? null : value,
                      )
                    }
                  />

                  <NumberInput
                    label="Minimum correct words (0 = unset)"
                    value={evaluation.minimumCorrectWords ?? 0}
                    min={0}
                    onChange={(value) =>
                      updateEvaluation(
                        "minimumCorrectWords",
                        value === 0 ? null : value,
                      )
                    }
                  />

                  <NumberInput
                    label="Minimum correct characters (0 = unset)"
                    value={evaluation.minimumCorrectCharacters ?? 0}
                    min={0}
                    onChange={(value) =>
                      updateEvaluation(
                        "minimumCorrectCharacters",
                        value === 0 ? null : value,
                      )
                    }
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Toggle
                    label="Count punctuation"
                    checked={evaluation.countPunctuation ?? true}
                    onChange={(value) =>
                      updateEvaluation("countPunctuation", value)
                    }
                  />
                  <Toggle
                    label="Ignore repeated spaces"
                    checked={evaluation.ignoreRepeatedSpaces ?? false}
                    onChange={(value) =>
                      updateEvaluation("ignoreRepeatedSpaces", value)
                    }
                  />
                  <Toggle
                    label="Ignore case"
                    checked={evaluation.ignoreCase ?? false}
                    onChange={(value) => updateEvaluation("ignoreCase", value)}
                  />
                  <Toggle
                    label="Qualification only"
                    checked={evaluation.qualificationOnly ?? false}
                    onChange={(value) =>
                      updateEvaluation("qualificationOnly", value)
                    }
                  />
                  <Toggle
                    label="Allow incomplete passage"
                    checked={evaluation.allowIncompletePassage ?? true}
                    onChange={(value) =>
                      updateEvaluation("allowIncompletePassage", value)
                    }
                  />
                </div>
              </section>
            )}

            {activeSection === "interface" && (
              <section>
                <SectionHeading
                  title="Exam interface"
                  description="Set candidate typing permissions and live exam indicators."
                />

                <Field label="Input mode">
                  <SelectInput
                    label="Input mode"
                    value={examInterface.inputMode}
                    options={[
                      { label: "Normal", value: "normal" },
                      { label: "Restricted", value: "restricted" },
                      { label: "Exam", value: "exam" },
                    ]}
                    onChange={(value) => updateInterface("inputMode", value)}
                  />
                </Field>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["allowBackspace", "Allow Backspace"],
                      ["allowDelete", "Allow Delete"],
                      ["allowArrowKeys", "Allow arrow keys"],
                      ["allowNavigationKeys", "Allow navigation keys"],
                      ["allowHomeEnd", "Allow Home / End"],
                      ["allowPaste", "Allow paste"],
                      ["allowCopy", "Allow copy"],
                      ["allowCut", "Allow cut"],
                      ["allowContextMenu", "Allow context menu"],
                      ["allowUndo", "Allow undo"],
                      ["showReferencePassage", "Show reference passage"],
                      ["autoSubmitOnTimeout", "Auto-submit on timeout"],
                      ["showTimer", "Show timer"],
                      ["showLiveWpm", "Show live WPM"],
                      ["showLiveAccuracy", "Show live accuracy"],
                      ["showErrorCount", "Show error count"],
                      ["enableSpellcheck", "Enable spellcheck"],
                      ["requireFullscreen", "Require fullscreen"],
                      ["preventTextSelection", "Prevent text selection"],
                    ] as const
                  ).map(([key, label]) => (
                    <Toggle
                      key={key}
                      label={label}
                      checked={examInterface[key]}
                      onChange={(value) => updateInterface(key, value)}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeSection === "workflow" && (
              <section>
                <SectionHeading
                  title="Exam workflow"
                  description="Configure the stages candidates go through during the exam."
                />

                <div className="space-y-4">
                  {workflow.stages.map((stage, index) => (
                    <div
                      key={`${stage.key ?? "stage"}-${index}`}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">
                          Stage {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeWorkflowStage(index)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextInput
                          label="Stage key"
                          value={stage.key ?? ""}
                          onChange={(value) =>
                            updateWorkflowStage(index, "key", value)
                          }
                          required
                        />

                        <SelectInput
                          label="Stage type"
                          value={stage.type}
                          options={[
                            { label: "Instructions", value: "instructions" },
                            {
                              label: "Keyboard test",
                              value: "keyboard_test",
                            },
                            { label: "Typing test", value: "typing_test" },
                            { label: "Submission", value: "submission" },
                            { label: "Result", value: "result" },
                          ]}
                          onChange={(value) =>
                            updateWorkflowStage(index, "type", value)
                          }
                        />

                        <NumberInput
                          label="Duration in seconds (0 = unset)"
                          value={stage.durationSeconds ?? 0}
                          min={0}
                          onChange={(value) =>
                            updateWorkflowStage(
                              index,
                              "durationSeconds",
                              value === 0 ? undefined : value,
                            )
                          }
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Toggle
                          label="Stage enabled"
                          checked={stage.enabled ?? true}
                          onChange={(value) =>
                            updateWorkflowStage(index, "enabled", value)
                          }
                        />
                        <Toggle
                          label="Stage required"
                          checked={stage.required}
                          onChange={(value) =>
                            updateWorkflowStage(index, "required", value)
                          }
                        />
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            setForm((current) => {
                              const stages = [...current.examWorkflow!.stages];
                              [stages[index - 1], stages[index]] = [
                                stages[index],
                                stages[index - 1],
                              ];
                              return {
                                ...current,
                                examWorkflow: { stages },
                              };
                            });
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
                        >
                          Move up
                        </button>

                        <button
                          type="button"
                          disabled={index === workflow.stages.length - 1}
                          onClick={() => {
                            setForm((current) => {
                              const stages = [...current.examWorkflow!.stages];
                              [stages[index], stages[index + 1]] = [
                                stages[index + 1],
                                stages[index],
                              ];
                              return {
                                ...current,
                                examWorkflow: { stages },
                              };
                            });
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
                        >
                          Move down
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addWorkflowStage}
                  className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  + Add workflow stage
                </button>
              </section>
            )}

            {activeSection === "analytics" && (
              <section>
                <SectionHeading
                  title="Analytics settings"
                  description="Control how typing performance is recorded and presented."
                />

                <div className="max-w-sm">
                  <NumberInput
                    label="Recording interval (seconds)"
                    value={analytics.recordIntervalSeconds}
                    min={1}
                    max={60}
                    onChange={(value) =>
                      updateAnalytics("recordIntervalSeconds", value)
                    }
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Toggle
                    label="Show speed timeline"
                    checked={analytics.showSpeedTimeline}
                    onChange={(value) =>
                      updateAnalytics("showSpeedTimeline", value)
                    }
                  />
                  <Toggle
                    label="Show accuracy timeline"
                    checked={analytics.showAccuracyTimeline}
                    onChange={(value) =>
                      updateAnalytics("showAccuracyTimeline", value)
                    }
                  />
                  <Toggle
                    label="Show error analysis"
                    checked={analytics.showErrorAnalysis}
                    onChange={(value) =>
                      updateAnalytics("showErrorAnalysis", value)
                    }
                  />
                  <Toggle
                    label="Show improvement plan"
                    checked={analytics.showImprovementPlan}
                    onChange={(value) =>
                      updateAnalytics("showImprovementPlan", value)
                    }
                  />
                  <Toggle
                    label="Store keystroke timeline"
                    checked={analytics.storeKeystrokeTimeline}
                    onChange={(value) =>
                      updateAnalytics("storeKeystrokeTimeline", value)
                    }
                  />
                </div>
              </section>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={activeSection === "basic"}
                  onClick={() => {
                    const index = sections.findIndex(
                      (section) => section.id === activeSection,
                    );
                    setActiveSection(sections[index - 1].id);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Previous section
                </button>

                {activeSection !== "analytics" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const index = sections.findIndex(
                        (section) => section.id === activeSection,
                      );
                      setActiveSection(sections[index + 1].id);
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Next section
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || loadingConfig}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? isEditMode
                        ? "Saving changes..."
                        : "Creating configuration..."
                      : isEditMode
                        ? "Save changes"
                        : "Create configuration"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {discardDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-dialog-title"
            aria-describedby="discard-dialog-description"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2
              id="discard-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              Discard unsaved changes?
            </h2>
            <p
              id="discard-dialog-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              Your changes have not been saved. If you leave this page, they
              will be lost.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDiscardDialogOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={discardChanges}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Discard changes
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
