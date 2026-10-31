import { useEffect, useState, type FormEvent } from "react";

import type {
  TypingPassageDifficulty,
  TypingPassageStatus,
} from "../types/passage.types";

export interface PassageFormValues {
  title: string;
  language: string;
  content: string;
  difficulty: TypingPassageDifficulty;
  status: TypingPassageStatus;
}

interface PassageFormProps {
  initialValues?: Partial<PassageFormValues>;
  onSubmit: (values: PassageFormValues) => Promise<void>;
  submitText: string;
  submitting: boolean;
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
  language: values?.language ?? "en",
  content: values?.content ?? "",
  difficulty: values?.difficulty ?? "easy",
  status: values?.status ?? "draft",
});

const PassageForm = ({
  initialValues,
  onSubmit,
  submitText,
  submitting,
}: PassageFormProps) => {
  const [values, setValues] = useState<PassageFormValues>(() =>
    getFormValues(initialValues),
  );

  const [errors, setErrors] = useState<PassageFormErrors>({});

  useEffect(() => {
    setValues(getFormValues(initialValues));
    setErrors({});
  }, [initialValues]);

  const handleChange = (field: keyof PassageFormValues, value: string) => {
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
    }

    if (!values.language.trim()) {
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
      language: values.language.trim(),
      content: values.content.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Passage Title <span className="text-red-500">*</span>
        </label>

        <input
          id="title"
          type="text"
          value={values.title}
          onChange={(event) => handleChange("title", event.target.value)}
          placeholder="Enter passage title"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="language"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Language <span className="text-red-500">*</span>
        </label>

        <select
          id="language"
          value={values.language}
          onChange={(event) => handleChange("language", event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
        </select>

        {errors.language && (
          <p className="mt-1 text-sm text-red-600">{errors.language}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Passage Content <span className="text-red-500">*</span>
        </label>

        <textarea
          id="content"
          rows={10}
          value={values.content}
          onChange={(event) => handleChange("content", event.target.value)}
          placeholder="Enter the typing passage content..."
          className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content}</p>
        )}

        <p className="mt-1 text-xs text-gray-500">
          Words:{" "}
          {values.content.trim()
            ? values.content.trim().split(/\s+/).length
            : 0}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="difficulty"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Difficulty
          </label>

          <select
            id="difficulty"
            value={values.difficulty}
            onChange={(event) =>
              handleChange(
                "difficulty",
                event.target.value as TypingPassageDifficulty,
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Status
          </label>

          <select
            id="status"
            value={values.status}
            onChange={(event) =>
              handleChange("status", event.target.value as TypingPassageStatus)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
};

export default PassageForm;
