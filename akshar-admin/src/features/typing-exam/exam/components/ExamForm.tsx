import { useEffect, useState, type FormEvent, type FocusEvent } from "react";

import {
  LANGUAGES,
  type CreateTypingExamPayload,
  type TypingExamScoringMethod,
} from "../types/typingExam.types";

import { examSchema, type ExamFormErrors } from "../schemas/exam.schema";

interface ExamFormProps {
  initialValues?: CreateTypingExamPayload;
  onSubmit: (values: CreateTypingExamPayload) => Promise<void>;
  submitText?: string;
  submitting?: boolean;
}

const defaultValues: CreateTypingExamPayload = {
  title: "",
  slug: "",
  description: "",
  language: "english",
  durationSeconds: 600,
  targetWpm: 30,
  maximumMarks: 100,
  passingPercentage: 40,
  scoring: {
    method: "standard",
    wordLength: 5,
    minimumWpm: 0,
    minimumAccuracy: 0,
    errorPenalty: 0,
    speedWeight: 50,
    accuracyWeight: 50,
  },
  instructions: [],
  status: "draft",
};

const getFormValues = (
  initialValues?: CreateTypingExamPayload,
): CreateTypingExamPayload => ({
  ...defaultValues,
  ...initialValues,
  scoring: {
    ...defaultValues.scoring,
    ...(initialValues?.scoring ?? {}),
  },
  instructions: Array.isArray(initialValues?.instructions)
    ? initialValues.instructions
    : [],
});

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-80";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

const sectionClass =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6";

// Accept only non-negative numeric values and decimals.
const handleNumericChange = (
  rawValue: string,
  onValueChange: (value: number) => void,
) => {
  if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
    onValueChange(rawValue === "" || rawValue === "." ? 0 : Number(rawValue));
  }
};

// Remove leading zeros when the input loses focus.
const normalizeNumberOnBlur = (
  event: FocusEvent<HTMLInputElement>,
  onValueChange: (value: number) => void,
) => {
  const input = event.currentTarget;

  if (input.value.trim() === "") return;

  const normalizedValue = Number(input.value);

  if (!Number.isFinite(normalizedValue)) return;

  input.value = String(normalizedValue);
  onValueChange(normalizedValue);
};

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;

  return <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>;
};

const ExamForm = ({
  initialValues,
  onSubmit,
  submitText = "Save Exam",
  submitting = false,
}: ExamFormProps) => {
  const isEditing = Boolean(initialValues);

  const [values, setValues] = useState<CreateTypingExamPayload>(() =>
    getFormValues(initialValues),
  );

  const [instructionsText, setInstructionsText] = useState(() =>
    (initialValues?.instructions ?? []).join("\n"),
  );

  const [errors, setErrors] = useState<ExamFormErrors>({});

  useEffect(() => {
    const safeValues = getFormValues(initialValues);

    setValues(safeValues);
    setInstructionsText(safeValues.instructions.join("\n"));
    setErrors({});
  }, [initialValues]);

  const getFieldClass = (field: string) => {
    return `${inputClass} ${
      errors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : ""
    }`;
  };

  const updateField = <K extends keyof CreateTypingExamPayload>(
    field: K,
    value: CreateTypingExamPayload[K],
  ) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const updateScoring = (
    field: keyof CreateTypingExamPayload["scoring"],
    value: number | TypingExamScoringMethod,
  ) => {
    setValues((previous) => ({
      ...previous,
      scoring: {
        ...previous.scoring,
        [field]: value,
      },
    }));

    setErrors((previous) => ({
      ...previous,
      [`scoring.${field}`]: "",
      "scoring.speedWeight": "",
      "scoring.accuracyWeight": "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    const payload: CreateTypingExamPayload = {
      ...values,
      title: values.title.trim(),
      slug: values.slug.trim(),
      language: values.language,
      description: values.description?.trim() ?? "",
      instructions: instructionsText
        .split("\n")
        .map((instruction) => instruction.trim())
        .filter(Boolean),
    };

    const result = examSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: ExamFormErrors = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path.join(".");

        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    await onSubmit(result.data);
  };

  const passingMarks = Number(
    ((values.maximumMarks * values.passingPercentage) / 100).toFixed(2),
  );

  const weightsTotal =
    values.scoring.speedWeight + values.scoring.accuracyWeight;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Basic Information */}
      <section className={sectionClass}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Basic Information
            </h2>
            <p className="text-xs text-gray-500">
              Enter the examination title and general details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Exam Title *</label>
            <input
              maxLength={200}
              className={getFieldClass("title")}
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Enter exam title"
            />
            <FieldError message={errors.title} />
          </div>

          <div>
            <label className={labelClass}>
              Slug
              {isEditing && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  (Cannot be changed)
                </span>
              )}
              {!isEditing && " *"}
            </label>

            <input
              disabled={isEditing}
              className={getFieldClass("slug")}
              value={values.slug}
              onChange={(event) => updateField("slug", event.target.value)}
              placeholder="typing-exam"
            />
            <FieldError message={errors.slug} />
            <p className="mt-1 text-xs text-gray-400">
              Use lowercase letters, numbers and hyphens.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Language *
              {isEditing && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  (Locked)
                </span>
              )}
            </label>

            <select
              disabled={isEditing}
              className={getFieldClass("language")}
              value={values.language}
              onChange={(event) =>
                updateField(
                  "language",
                  event.target.value as CreateTypingExamPayload["language"],
                )
              }
            >
              <option value="">Select language</option>
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language.charAt(0).toUpperCase() + language.slice(1)}
                </option>
              ))}
            </select>
            <FieldError message={errors.language} />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={values.status ?? "draft"}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as CreateTypingExamPayload["status"],
                )
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              className={inputClass}
              value={values.description ?? ""}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Enter exam description"
            />
          </div>
        </div>
      </section>

      {/* Exam Configuration */}
      <section className={sectionClass}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Exam Configuration
            </h2>
            <p className="text-xs text-gray-500">
              Configure duration, speed and examination marks.
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium text-amber-800">
              Examination configuration is locked after creation. These settings
              cannot be changed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Duration (seconds) *</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="numeric"
              className={getFieldClass("durationSeconds")}
              value={values.durationSeconds}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateField("durationSeconds", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateField("durationSeconds", value),
                )
              }
            />
            <FieldError message={errors.durationSeconds} />
            <p className="mt-1 text-xs text-gray-400">
              Example: 600 seconds = 10 minutes.
            </p>
          </div>

          <div>
            <label className={labelClass}>Target WPM *</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="numeric"
              className={getFieldClass("targetWpm")}
              value={values.targetWpm}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateField("targetWpm", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateField("targetWpm", value),
                )
              }
            />
            <FieldError message={errors.targetWpm} />
          </div>

          <div>
            <label className={labelClass}>Maximum Marks *</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="numeric"
              className={getFieldClass("maximumMarks")}
              value={values.maximumMarks}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateField("maximumMarks", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateField("maximumMarks", value),
                )
              }
            />
            <FieldError message={errors.maximumMarks} />
          </div>

          <div>
            <label className={labelClass}>Passing Percentage (%) *</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="decimal"
              className={getFieldClass("passingPercentage")}
              value={values.passingPercentage}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateField("passingPercentage", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateField("passingPercentage", value),
                )
              }
            />
            <FieldError message={errors.passingPercentage} />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Passing marks requirement
            </p>
            <p className="mt-0.5 text-xs text-blue-700">
              Automatically calculated from maximum marks and passing
              percentage.
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-2xl font-bold tabular-nums text-blue-700">
              {passingMarks}
            </p>
            <p className="text-xs text-blue-600">
              out of {values.maximumMarks} marks
            </p>
          </div>
        </div>
      </section>

      {/* Scoring Configuration */}
      <section className={sectionClass}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6m4 6V4"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Scoring Configuration
            </h2>
            <p className="text-xs text-gray-500">
              Define how typing performance will be evaluated.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Scoring Method *</label>
            <select
              disabled={isEditing}
              className={getFieldClass("scoring.method")}
              value={values.scoring.method}
              onChange={(event) =>
                updateScoring(
                  "method",
                  event.target.value as TypingExamScoringMethod,
                )
              }
            >
              <option value="standard">Standard</option>
              <option value="net_wpm">Net WPM</option>
              <option value="accuracy">Accuracy</option>
              <option value="weighted">Weighted</option>
              <option value="custom">Custom</option>
            </select>
            <FieldError message={errors["scoring.method"]} />
          </div>

          <div>
            <label className={labelClass}>Word Length</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="numeric"
              className={getFieldClass("scoring.wordLength")}
              value={values.scoring.wordLength}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateScoring("wordLength", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateScoring("wordLength", value),
                )
              }
            />
            <FieldError message={errors["scoring.wordLength"]} />
          </div>

          <div>
            <label className={labelClass}>Minimum WPM</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="decimal"
              className={getFieldClass("scoring.minimumWpm")}
              value={values.scoring.minimumWpm}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateScoring("minimumWpm", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateScoring("minimumWpm", value),
                )
              }
            />
            <FieldError message={errors["scoring.minimumWpm"]} />
          </div>

          <div>
            <label className={labelClass}>Minimum Accuracy (%)</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="decimal"
              className={getFieldClass("scoring.minimumAccuracy")}
              value={values.scoring.minimumAccuracy}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateScoring("minimumAccuracy", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateScoring("minimumAccuracy", value),
                )
              }
            />
            <FieldError message={errors["scoring.minimumAccuracy"]} />
          </div>

          <div>
            <label className={labelClass}>Error Penalty</label>
            <input
              disabled={isEditing}
              type="text"
              inputMode="decimal"
              className={getFieldClass("scoring.errorPenalty")}
              value={values.scoring.errorPenalty}
              onChange={(event) =>
                handleNumericChange(event.target.value, (value) =>
                  updateScoring("errorPenalty", value),
                )
              }
              onBlur={(event) =>
                normalizeNumberOnBlur(event, (value) =>
                  updateScoring("errorPenalty", value),
                )
              }
            />
            <FieldError message={errors["scoring.errorPenalty"]} />
          </div>
        </div>

        {/* Weighted Scoring */}
        {values.scoring.method === "weighted" && (
          <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-violet-900">
                Weighted Scoring Configuration
              </h3>
              <p className="mt-1 text-xs text-violet-700">
                Configure the contribution of typing speed and accuracy. Both
                weights must total 100%.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Speed Weight (%)</label>
                <input
                  disabled={isEditing}
                  type="text"
                  inputMode="decimal"
                  className={getFieldClass("scoring.speedWeight")}
                  value={values.scoring.speedWeight}
                  onChange={(event) =>
                    handleNumericChange(event.target.value, (value) =>
                      updateScoring("speedWeight", value),
                    )
                  }
                  onBlur={(event) =>
                    normalizeNumberOnBlur(event, (value) =>
                      updateScoring("speedWeight", value),
                    )
                  }
                />
                <FieldError message={errors["scoring.speedWeight"]} />
              </div>

              <div>
                <label className={labelClass}>Accuracy Weight (%)</label>
                <input
                  disabled={isEditing}
                  type="text"
                  inputMode="decimal"
                  className={getFieldClass("scoring.accuracyWeight")}
                  value={values.scoring.accuracyWeight}
                  onChange={(event) =>
                    handleNumericChange(event.target.value, (value) =>
                      updateScoring("accuracyWeight", value),
                    )
                  }
                  onBlur={(event) =>
                    normalizeNumberOnBlur(event, (value) =>
                      updateScoring("accuracyWeight", value),
                    )
                  }
                />
                <FieldError message={errors["scoring.accuracyWeight"]} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-4 py-3">
              <span className="text-xs font-medium text-gray-600">
                Combined weight
              </span>

              <span
                className={`text-sm font-bold ${
                  Math.abs(weightsTotal - 100) <= 0.001
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {weightsTotal}% / 100%
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Instructions */}
      <section className={sectionClass}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Examination Instructions
            </h2>
            <p className="text-xs text-gray-500">
              Provide instructions that candidates must follow.
            </p>
          </div>
        </div>

        <label className={labelClass}>Instructions</label>
        <textarea
          rows={5}
          className={inputClass}
          value={instructionsText}
          onChange={(event) => setInstructionsText(event.target.value)}
          placeholder={
            "Read the passage carefully.\nType as accurately as possible.\nComplete the examination within the given time."
          }
        />

        <p className="mt-1.5 text-xs text-gray-400">
          Enter one instruction per line.
        </p>
      </section>

      {/* Submit */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}

          {submitting ? "Saving Examination..." : submitText}
        </button>
      </div>
    </form>
  );
};

export default ExamForm;
