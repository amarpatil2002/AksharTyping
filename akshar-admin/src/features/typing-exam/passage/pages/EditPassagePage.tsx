import { useEffect, useState, type FormEvent } from "react";

import {
  LANGUAGES,
  type TypingPassageLanguage,
  type TypingPassageDifficulty,
  type TypingPassageStatus,
} from "../types/passage.types";

export interface PassageFormValues {
  title: string;
  language: TypingPassageLanguage;
  content: string;
  difficulty: TypingPassageDifficulty;
  status: TypingPassageStatus;
}

interface PassageFormProps {
  initialValues?: Partial<PassageFormValues>;
  onSubmit: (values: PassageFormValues) => Promise<void>;
  submitText: string;
  submitting: boolean;
  isEdit?: boolean;
}

interface PassageFormErrors {
  title?: string;
  language?: string;
  content?: string;
}

const getFormValues = (
  values?: Partial<PassageFormValues>,
): PassageFormValues => ({
  title: values?.title ?? "",
  language: values?.language ?? "english",
  content: values?.content ?? "",
  difficulty: values?.difficulty ?? "easy",
  status: values?.status ?? "draft",
});

const formatLanguage = (language: string) =>
  language.charAt(0).toUpperCase() + language.slice(1);

const PassageForm = ({
  initialValues,
  onSubmit,
  submitText,
  submitting,
  isEdit = false,
}: PassageFormProps) => {
  const [values, setValues] = useState<PassageFormValues>(() =>
    getFormValues(initialValues),
  );

  const [errors, setErrors] = useState<PassageFormErrors>({});

  useEffect(() => {
    setValues(getFormValues(initialValues));
    setErrors({});
  }, [initialValues]);

  const handleChange = <K extends keyof PassageFormValues>(
    field: K,
    value: PassageFormValues[K],
  ) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: PassageFormErrors = {};

    if (!values.title.trim()) {
      newErrors.title = "Passage title is required.";
    } else if (values.title.trim().length < 3) {
      newErrors.title = "Title must contain at least 3 characters.";
    }

    if (!values.language) {
      newErrors.language = "Language is required.";
    }

    if (!values.content.trim()) {
      newErrors.content = "Passage content is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    await onSubmit({
      ...values,
      title: values.title.trim(),
      content: values.content.trim(),
    });
  };

  const wordCount = values.content.trim()
    ? values.content.trim().split(/\s+/).length
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Passage Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Passage Title <span className="text-red-500">*</span>
        </label>

        <input
          id="title"
          type="text"
          value={values.title}
          onChange={(event) => handleChange("title", event.target.value)}
          placeholder="Enter passage title"
          disabled={submitting}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Language */}
      <div>
        <label
          htmlFor="language"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Language <span className="text-red-500">*</span>
        </label>

        <select
          id="language"
          value={values.language}
          disabled={isEdit || submitting}
          onChange={(event) =>
            handleChange(
              "language",
              event.target.value as TypingPassageLanguage,
            )
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        >
          {LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {formatLanguage(language)}
            </option>
          ))}
        </select>

        {isEdit && (
          <p className="mt-1.5 text-xs text-gray-500">
            Language cannot be changed after passage creation.
          </p>
        )}

        {errors.language && (
          <p className="mt-1 text-xs text-red-600">{errors.language}</p>
        )}
      </div>

      {/* Passage Content */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor="content"
            className="text-sm font-medium text-gray-700"
          >
            Passage Content <span className="text-red-500">*</span>
          </label>

          <span className="text-xs text-gray-400">{wordCount} words</span>
        </div>

        <textarea
          id="content"
          rows={12}
          value={values.content}
          disabled={submitting}
          onChange={(event) => handleChange("content", event.target.value)}
          placeholder="Enter the typing passage content..."
          className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        {errors.content && (
          <p className="mt-1 text-xs text-red-600">{errors.content}</p>
        )}
      </div>

      {/* Difficulty and Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="difficulty"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Difficulty
          </label>

          <select
            id="difficulty"
            value={values.difficulty}
            disabled={submitting}
            onChange={(event) =>
              handleChange(
                "difficulty",
                event.target.value as TypingPassageDifficulty,
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Status
          </label>

          <select
            id="status"
            value={values.status}
            disabled={submitting}
            onChange={(event) =>
              handleChange("status", event.target.value as TypingPassageStatus)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
};

export default PassageForm;
