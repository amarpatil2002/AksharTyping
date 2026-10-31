import { useEffect, useState, type FormEvent } from "react";

import type {
  CreateTypingExamPayload,
  TypingExamScoringMethod,
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
  language: "en",
  durationSeconds: 600,
  targetWpm: 30,
  scoring: {
    method: "standard",
    wordLength: 5,
    minimumWpm: 0,
    minimumAccuracy: 0,
    errorPenalty: 0,
  },
  instructions: [],
  status: "draft",
};

const getFormValues = (
  initialValues?: CreateTypingExamPayload,
): CreateTypingExamPayload => {
  return {
    ...defaultValues,
    ...initialValues,
    scoring: {
      ...defaultValues.scoring,
      ...(initialValues?.scoring ?? {}),
    },
    instructions: Array.isArray(initialValues?.instructions)
      ? initialValues.instructions
      : [],
  };
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;

  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
};

const ExamForm = ({
  initialValues,
  onSubmit,
  submitText = "Save Exam",
  submitting = false,
}: ExamFormProps) => {
  const [values, setValues] = useState<CreateTypingExamPayload>(() =>
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
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    const payload: CreateTypingExamPayload = {
      ...values,
      title: values.title.trim(),
      slug: values.slug.trim(),
      language: values.language.trim().toLowerCase(),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Basic Information */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Basic Information
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <label className={labelClass}>Slug *</label>

            <input
              className={getFieldClass("slug")}
              value={values.slug}
              onChange={(event) => updateField("slug", event.target.value)}
              placeholder="typing-exam"
            />

            <FieldError message={errors.slug} />
          </div>

          <div>
            <label className={labelClass}>Language *</label>

            <input
              className={getFieldClass("language")}
              value={values.language}
              onChange={(event) =>
                updateField("language", event.target.value.toLowerCase())
              }
              placeholder="en"
            />

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
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Exam Configuration
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Duration (seconds) *</label>

            <input
              type="number"
              min={1}
              className={getFieldClass("durationSeconds")}
              value={values.durationSeconds}
              onChange={(event) =>
                updateField("durationSeconds", Number(event.target.value))
              }
            />

            <FieldError message={errors.durationSeconds} />
          </div>

          <div>
            <label className={labelClass}>Target WPM *</label>

            <input
              type="number"
              min={0}
              className={getFieldClass("targetWpm")}
              value={values.targetWpm}
              onChange={(event) =>
                updateField("targetWpm", Number(event.target.value))
              }
            />

            <FieldError message={errors.targetWpm} />
          </div>
        </div>
      </section>

      {/* Scoring Configuration */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Scoring Configuration
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Scoring Method</label>

            <select
              className={inputClass}
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
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Word Length</label>

            <input
              type="number"
              min={1}
              className={getFieldClass("scoring.wordLength")}
              value={values.scoring.wordLength}
              onChange={(event) =>
                updateScoring("wordLength", Number(event.target.value))
              }
            />

            <FieldError message={errors["scoring.wordLength"]} />
          </div>

          <div>
            <label className={labelClass}>Minimum WPM</label>

            <input
              type="number"
              min={0}
              className={getFieldClass("scoring.minimumWpm")}
              value={values.scoring.minimumWpm}
              onChange={(event) =>
                updateScoring("minimumWpm", Number(event.target.value))
              }
            />

            <FieldError message={errors["scoring.minimumWpm"]} />
          </div>

          <div>
            <label className={labelClass}>Minimum Accuracy (%)</label>

            <input
              type="number"
              min={0}
              max={100}
              className={getFieldClass("scoring.minimumAccuracy")}
              value={values.scoring.minimumAccuracy}
              onChange={(event) =>
                updateScoring("minimumAccuracy", Number(event.target.value))
              }
            />

            <FieldError message={errors["scoring.minimumAccuracy"]} />
          </div>

          <div>
            <label className={labelClass}>Error Penalty</label>

            <input
              type="number"
              min={0}
              className={getFieldClass("scoring.errorPenalty")}
              value={values.scoring.errorPenalty}
              onChange={(event) =>
                updateScoring("errorPenalty", Number(event.target.value))
              }
            />

            <FieldError message={errors["scoring.errorPenalty"]} />
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          Instructions
        </h2>

        <p className="mb-3 text-xs text-gray-500">
          Enter one instruction per line.
        </p>

        <textarea
          rows={5}
          className={inputClass}
          value={instructionsText}
          onChange={(event) => setInstructionsText(event.target.value)}
          placeholder={
            "Read the passage carefully.\nType as accurately as possible."
          }
        />
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
};

export default ExamForm;
