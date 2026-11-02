import { useEffect, useState, type FormEvent, type FocusEvent } from "react";

import {
  LANGUAGES,
  type CreateTypingExamPayload,
  type TypingExamScoringMethod,
} from "../types/typingExam.types";

import { examSchema, type ExamFormErrors } from "../schemas/exam.schema";

// Extended scoring types mirror the TypingExam Mongoose scoring schema.
type ErrorPenaltyKey =
  | "spelling"
  | "wrongWord"
  | "omission"
  | "extraWord"
  | "capitalization"
  | "notReached";

type ExtendedScoring = Omit<CreateTypingExamPayload["scoring"], "method"> & {
  method:
    | TypingExamScoringMethod
    | "fixed_error_penalty"
    | "grouped_error_penalty"
    | "correct_words_ratio"
    | "qualifying_only"
    | "speed_based";
  policyVersion: number;
  errorPenalties: Record<ErrorPenaltyKey, number>;
  speedCalculation:
    | "gross_words_per_minute"
    | "correct_words_per_minute"
    | "gross_minus_error_penalty";
  accuracyCalculation:
    | "correct_words_divided_by_words_typed"
    | "correct_words_divided_by_reference_words";
  notReachedPolicy:
    | "no_separate_penalty"
    | "count_as_error"
    | "apply_configured_penalty";
  rounding: "none" | "integer" | "two_decimals";
  errorsPerGroup: number;
  groupPenalty: number;
  qualification: {
    minimumMarks: number;
    minimumWpm: number;
    minimumAccuracy: number;
    maximumErrors: number | null;
    maximumErrorPercentage: number | null;
    requireAll: boolean;
  };
};

type ExtendedExamPayload = Omit<CreateTypingExamPayload, "scoring"> & {
  scoring: ExtendedScoring;
};

const DEFAULT_ERROR_PENALTIES: Record<ErrorPenaltyKey, number> = {
  spelling: 0,
  wrongWord: 0,
  omission: 0,
  extraWord: 0,
  capitalization: 0,
  notReached: 0,
};

const DEFAULT_QUALIFICATION: ExtendedScoring["qualification"] = {
  minimumMarks: 0,
  minimumWpm: 0,
  minimumAccuracy: 0,
  maximumErrors: null,
  maximumErrorPercentage: null,
  requireAll: true,
};

interface ExamFormProps {
  initialValues?: CreateTypingExamPayload;
  onSubmit: (values: CreateTypingExamPayload) => Promise<void>;
  submitText?: string;
  submitting?: boolean;
}

const defaultValues: ExtendedExamPayload = {
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
    policyVersion: 1,
    wordLength: 5,
    minimumWpm: 0,
    minimumAccuracy: 0,
    errorPenalty: 0,
    errorPenalties: { ...DEFAULT_ERROR_PENALTIES },
    speedWeight: 50,
    accuracyWeight: 50,
    speedCalculation: "correct_words_per_minute",
    accuracyCalculation: "correct_words_divided_by_words_typed",
    notReachedPolicy: "no_separate_penalty",
    rounding: "two_decimals",
    errorsPerGroup: 1,
    groupPenalty: 0,
    qualification: { ...DEFAULT_QUALIFICATION },
  },

  instructions: [],
  status: "draft",
};

const getFormValues = (
  initialValues?: CreateTypingExamPayload,
): ExtendedExamPayload => {
  const incoming = initialValues as ExtendedExamPayload | undefined;
  return {
    ...defaultValues,
    ...initialValues,

    scoring: {
      ...defaultValues.scoring,
      ...(incoming?.scoring ?? {}),
      errorPenalties: {
        ...DEFAULT_ERROR_PENALTIES,
        ...(incoming?.scoring?.errorPenalties ?? {}),
      },
      qualification: {
        ...DEFAULT_QUALIFICATION,
        ...(incoming?.scoring?.qualification ?? {}),
      },
    },

    instructions: Array.isArray(incoming?.instructions)
      ? incoming.instructions
      : [],
  };
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-80";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

const sectionClass =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6";

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

  const [values, setValues] = useState<ExtendedExamPayload>(() =>
    getFormValues(initialValues),
  );

  const [instructionsText, setInstructionsText] = useState(() =>
    (initialValues?.instructions ?? []).join("\n"),
  );

  const [errors, setErrors] = useState<ExamFormErrors>({});

  // Populate form when exam data is loaded.
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

  const updateScoring = <K extends keyof ExtendedScoring>(
    field: K,
    value: ExtendedScoring[K],
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

  const updateErrorPenalty = (field: ErrorPenaltyKey, value: number) => {
    setValues((previous) => ({
      ...previous,
      scoring: {
        ...previous.scoring,
        errorPenalties: {
          ...previous.scoring.errorPenalties,
          [field]: value,
        },
      },
    }));
    setErrors((previous) => ({
      ...previous,
      [`scoring.errorPenalties.${field}`]: "",
    }));
  };

  const updateQualification = <
    K extends keyof ExtendedScoring["qualification"],
  >(
    field: K,
    value: ExtendedScoring["qualification"][K],
  ) => {
    setValues((previous) => ({
      ...previous,
      scoring: {
        ...previous.scoring,
        qualification: {
          ...previous.scoring.qualification,
          [field]: value,
        },
      },
    }));
    setErrors((previous) => ({
      ...previous,
      [`scoring.qualification.${field}`]: "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    const payload: ExtendedExamPayload = {
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

    await onSubmit(result.data as CreateTypingExamPayload);
  };

  const passingMarks = Number(
    ((values.maximumMarks * values.passingPercentage) / 100).toFixed(2),
  );

  const weightsTotal =
    Number(values.scoring.speedWeight ?? 0) +
    Number(values.scoring.accuracyWeight ?? 0);

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
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
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
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
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
              type="number"
              min={1}
              className={getFieldClass("durationSeconds")}
              value={values.durationSeconds}
              onChange={(event) =>
                updateField("durationSeconds", Number(event.target.value))
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
              type="number"
              min={0}
              className={getFieldClass("targetWpm")}
              value={values.targetWpm}
              onChange={(event) =>
                updateField("targetWpm", Number(event.target.value))
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
              type="number"
              min={1}
              max={100000}
              className={getFieldClass("maximumMarks")}
              value={values.maximumMarks}
              onChange={(event) =>
                updateField("maximumMarks", Number(event.target.value))
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
              type="number"
              min={0}
              max={100}
              className={getFieldClass("passingPercentage")}
              value={values.passingPercentage}
              onChange={(event) =>
                updateField("passingPercentage", Number(event.target.value))
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
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
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
              <option value="fixed_error_penalty">Fixed Error Penalty</option>
              <option value="grouped_error_penalty">
                Grouped Error Penalty
              </option>
              <option value="correct_words_ratio">Correct Words Ratio</option>
              <option value="qualifying_only">Qualifying Only</option>
              <option value="speed_based">Speed Based</option>
            </select>

            <FieldError message={errors["scoring.method"]} />
          </div>

          <div>
            <label className={labelClass}>Word Length</label>

            <input
              disabled={isEditing}
              type="number"
              min={1}
              max={20}
              className={getFieldClass("scoring.wordLength")}
              value={values.scoring.wordLength}
              onChange={(event) =>
                updateScoring("wordLength", Number(event.target.value))
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
              type="number"
              min={0}
              max={500}
              className={getFieldClass("scoring.minimumWpm")}
              value={values.scoring.minimumWpm}
              onChange={(event) =>
                updateScoring("minimumWpm", Number(event.target.value))
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
              type="number"
              min={0}
              max={100}
              className={getFieldClass("scoring.minimumAccuracy")}
              value={values.scoring.minimumAccuracy}
              onChange={(event) =>
                updateScoring("minimumAccuracy", Number(event.target.value))
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
              type="number"
              min={0}
              max={100}
              className={getFieldClass("scoring.errorPenalty")}
              value={values.scoring.errorPenalty}
              onChange={(event) =>
                updateScoring("errorPenalty", Number(event.target.value))
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

        {/* Weighted scoring */}
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
                  type="number"
                  min={0}
                  max={100}
                  className={getFieldClass("scoring.speedWeight")}
                  value={values.scoring.speedWeight}
                  onChange={(event) =>
                    updateScoring("speedWeight", Number(event.target.value))
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
                  type="number"
                  min={0}
                  max={100}
                  className={getFieldClass("scoring.accuracyWeight")}
                  value={values.scoring.accuracyWeight}
                  onChange={(event) =>
                    updateScoring("accuracyWeight", Number(event.target.value))
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

        {/* Calculation and evaluation policy */}
        <div className="mt-6 space-y-5 border-t border-gray-100 pt-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Calculation Policy
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Choose how speed, accuracy, not-reached words, and rounding are
              calculated.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Speed Calculation</label>
              <select
                disabled={isEditing}
                className={inputClass}
                value={values.scoring.speedCalculation}
                onChange={(e) =>
                  updateScoring(
                    "speedCalculation",
                    e.target.value as ExtendedScoring["speedCalculation"],
                  )
                }
              >
                <option value="gross_words_per_minute">
                  Gross words per minute
                </option>
                <option value="correct_words_per_minute">
                  Correct words per minute
                </option>
                <option value="gross_minus_error_penalty">
                  Gross WPM minus error penalty
                </option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Accuracy Calculation</label>
              <select
                disabled={isEditing}
                className={inputClass}
                value={values.scoring.accuracyCalculation}
                onChange={(e) =>
                  updateScoring(
                    "accuracyCalculation",
                    e.target.value as ExtendedScoring["accuracyCalculation"],
                  )
                }
              >
                <option value="correct_words_divided_by_words_typed">
                  Correct words / words typed
                </option>
                <option value="correct_words_divided_by_reference_words">
                  Correct words / reference words
                </option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Not-Reached Word Policy</label>
              <select
                disabled={isEditing}
                className={inputClass}
                value={values.scoring.notReachedPolicy}
                onChange={(e) =>
                  updateScoring(
                    "notReachedPolicy",
                    e.target.value as ExtendedScoring["notReachedPolicy"],
                  )
                }
              >
                <option value="no_separate_penalty">No separate penalty</option>
                <option value="count_as_error">Count as an error</option>
                <option value="apply_configured_penalty">
                  Apply configured penalty
                </option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Marks Rounding</label>
              <select
                disabled={isEditing}
                className={inputClass}
                value={values.scoring.rounding}
                onChange={(e) =>
                  updateScoring(
                    "rounding",
                    e.target.value as ExtendedScoring["rounding"],
                  )
                }
              >
                <option value="none">No rounding</option>
                <option value="integer">Nearest integer</option>
                <option value="two_decimals">Two decimal places</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900">
              Individual Error Penalties
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Penalty applied for each error of the selected type, according to
              the scoring method.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["spelling", "Spelling"],
                  ["wrongWord", "Wrong word"],
                  ["omission", "Omission"],
                  ["extraWord", "Extra word"],
                  ["capitalization", "Capitalization"],
                  ["notReached", "Not reached"],
                ] as [ErrorPenaltyKey, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input
                    disabled={isEditing}
                    type="number"
                    min={0}
                    step="any"
                    className={inputClass}
                    value={values.scoring.errorPenalties[key]}
                    onChange={(e) =>
                      updateErrorPenalty(key, Number(e.target.value))
                    }
                    onBlur={(e) =>
                      normalizeNumberOnBlur(e, (v) =>
                        updateErrorPenalty(key, v),
                      )
                    }
                  />
                  <FieldError
                    message={errors[`scoring.errorPenalties.${key}`]}
                  />
                </div>
              ))}
            </div>
          </div>

          {values.scoring.method === "grouped_error_penalty" && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
              <h4 className="text-sm font-semibold text-violet-900">
                Grouped Error Penalty
              </h4>
              <p className="mt-1 text-xs text-violet-700">
                Apply a penalty for each configured group of errors.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Errors per Group</label>
                  <input
                    disabled={isEditing}
                    type="number"
                    min={1}
                    step={1}
                    className={inputClass}
                    value={values.scoring.errorsPerGroup}
                    onChange={(e) =>
                      updateScoring("errorsPerGroup", Number(e.target.value))
                    }
                  />
                  <FieldError message={errors["scoring.errorsPerGroup"]} />
                </div>
                <div>
                  <label className={labelClass}>Penalty per Group</label>
                  <input
                    disabled={isEditing}
                    type="number"
                    min={0}
                    step="any"
                    className={inputClass}
                    value={values.scoring.groupPenalty}
                    onChange={(e) =>
                      updateScoring("groupPenalty", Number(e.target.value))
                    }
                  />
                  <FieldError message={errors["scoring.groupPenalty"]} />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Qualification Criteria
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Configure the minimum requirements a candidate must satisfy.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>Minimum Marks</label>
                <input
                  disabled={isEditing}
                  type="number"
                  min={0}
                  step="any"
                  className={inputClass}
                  value={values.scoring.qualification.minimumMarks}
                  onChange={(e) =>
                    updateQualification("minimumMarks", Number(e.target.value))
                  }
                />
                <FieldError
                  message={errors["scoring.qualification.minimumMarks"]}
                />
              </div>
              <div>
                <label className={labelClass}>Minimum WPM</label>
                <input
                  disabled={isEditing}
                  type="number"
                  min={0}
                  step="any"
                  className={inputClass}
                  value={values.scoring.qualification.minimumWpm}
                  onChange={(e) =>
                    updateQualification("minimumWpm", Number(e.target.value))
                  }
                />
                <FieldError
                  message={errors["scoring.qualification.minimumWpm"]}
                />
              </div>
              <div>
                <label className={labelClass}>Minimum Accuracy (%)</label>
                <input
                  disabled={isEditing}
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  className={inputClass}
                  value={values.scoring.qualification.minimumAccuracy}
                  onChange={(e) =>
                    updateQualification(
                      "minimumAccuracy",
                      Number(e.target.value),
                    )
                  }
                />
                <FieldError
                  message={errors["scoring.qualification.minimumAccuracy"]}
                />
              </div>
              <div>
                <label className={labelClass}>Maximum Errors (optional)</label>
                <input
                  disabled={isEditing}
                  type="number"
                  min={0}
                  step={1}
                  className={inputClass}
                  value={values.scoring.qualification.maximumErrors ?? ""}
                  placeholder="No limit"
                  onChange={(e) =>
                    updateQualification(
                      "maximumErrors",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
                <FieldError
                  message={errors["scoring.qualification.maximumErrors"]}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Maximum Error Percentage (optional)
                </label>
                <input
                  disabled={isEditing}
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  className={inputClass}
                  value={
                    values.scoring.qualification.maximumErrorPercentage ?? ""
                  }
                  placeholder="No limit"
                  onChange={(e) =>
                    updateQualification(
                      "maximumErrorPercentage",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
                <FieldError
                  message={
                    errors["scoring.qualification.maximumErrorPercentage"]
                  }
                />
              </div>
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <input
                disabled={isEditing}
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                checked={values.scoring.qualification.requireAll}
                onChange={(e) =>
                  updateQualification("requireAll", e.target.checked)
                }
              />
              <span>
                <span className="font-medium">
                  Require all qualification criteria
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  When enabled, every configured qualification threshold must be
                  met. When disabled, the evaluator may use any-one criteria
                  behavior.
                </span>
              </span>
            </label>
          </div>
        </div>
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
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
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
