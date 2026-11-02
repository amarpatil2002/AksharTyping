import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../../components/common/PageHeader";
import { useTypingExam } from "../hooks/useTypingExam";
import { getErrorMessage } from "../../../../utils/getErrorMessage";

import type { TypingExam } from "../types/typingExam.types";

// ============================================================
// HELPERS
// ============================================================

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${remainingSeconds} sec`;
  if (remainingSeconds === 0) return `${minutes} min`;

  return `${minutes} min ${remainingSeconds} sec`;
};

const formatLanguage = (language: string): string =>
  language.charAt(0).toUpperCase() + language.slice(1);

const formatLabel = (value?: string | null): string => {
  if (!value) return "Not configured";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatValue = (
  value: string | number | boolean | null | undefined,
  suffix = "",
): string => {
  if (value === null || value === undefined) return "Not configured";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  return `${value}${suffix}`;
};

const formatUser = (user: unknown): string => {
  if (!user) return "Not available";

  if (typeof user === "string") return user;

  if (typeof user === "object") {
    const userObject = user as {
      _id?: string;
      name?: string;
      email?: string;
    };

    return (
      userObject.name || userObject.email || userObject._id || "Not available"
    );
  }

  return String(user);
};

const formatDate = (date?: string): string => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? "Not available"
    : parsedDate.toLocaleString();
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

interface DetailItemProps {
  label: string;
  value: string | number | null | undefined;
}

const DetailItem = ({ label, value }: DetailItemProps) => (
  <div className="min-w-0 space-y-1">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="break-words text-sm font-medium text-gray-800">{value}</p>
  </div>
);

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const Section = ({ title, description, children }: SectionProps) => (
  <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
    <div className="mb-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>

      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>

    {children}
  </section>
);

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles: Record<string, string> = {
    published: "bg-green-50 text-green-700",
    archived: "bg-amber-50 text-amber-700",
    draft: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[status] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
};

const EmptyValue = () => (
  <span className="text-sm text-gray-400">Not configured</span>
);

// ============================================================
// EXAMINATION DETAILS PAGE
// ============================================================

const ExamDetailsPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const { getExamById } = useTypingExam();

  const [exam, setExam] = useState<TypingExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // FETCH EXAM
  // ==========================================================

  useEffect(() => {
    if (!examId) {
      setError("Invalid examination ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadExam = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getExamById(examId);

        if (!cancelled) {
          setExam(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load examination details."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadExam();

    return () => {
      cancelled = true;
    };
  }, [examId, getExamById]);

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading examination details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (error || !exam) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Examination not found
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {error || "The examination is unavailable."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/typing-exams")}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Back to Examinations
        </button>
      </div>
    );
  }

  // ==========================================================
  // EXAM DATA
  // ==========================================================

  const scoring = exam.scoring;
  const penalties = scoring.errorPenalties;
  const qualification = scoring.qualification;

  const passingMarks = (exam.maximumMarks * exam.passingPercentage) / 100;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5 pb-6">
      {/* PAGE HEADER */}

      <PageHeader
        title="Examination Details"
        description="View examination information and configuration."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/typing-exams")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={() => navigate(`/typing-exams/${exam._id}/edit`)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Edit Examination
          </button>
        </div>
      </PageHeader>

      {/* BASIC INFORMATION */}

      <Section title="Basic Information">
        <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>

          <StatusBadge status={exam.status} />
        </div>

        {exam.description && (
          <p className="mb-6 text-sm leading-6 text-gray-600">
            {exam.description}
          </p>
        )}

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Exam Title" value={exam.title} />

          <DetailItem label="Exam Slug" value={exam.slug} />

          <DetailItem label="Language" value={formatLanguage(exam.language)} />

          <DetailItem
            label="Duration"
            value={formatDuration(exam.durationSeconds)}
          />

          <DetailItem
            label="Target Typing Speed"
            value={`${exam.targetWpm} WPM`}
          />

          <DetailItem label="Maximum Marks" value={exam.maximumMarks} />

          <DetailItem
            label="Passing Percentage"
            value={`${exam.passingPercentage}%`}
          />

          <DetailItem
            label="Passing Marks"
            value={
              Number.isInteger(passingMarks)
                ? passingMarks
                : passingMarks.toFixed(2)
            }
          />
        </div>
      </Section>

      {/* SCORING CONFIGURATION */}

      <Section
        title="Scoring Configuration"
        description="Complete evaluation settings used to calculate typing examination results."
      >
        <div className="space-y-6">
          {/* GENERAL SCORING */}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-800">
              General Scoring Parameters
            </h3>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Scoring Method"
                value={formatLabel(scoring.method)}
              />

              <DetailItem
                label="Policy Version"
                value={scoring.policyVersion}
              />

              <DetailItem
                label="Word Length"
                value={`${scoring.wordLength} characters`}
              />

              <DetailItem
                label="Minimum Typing Speed"
                value={`${scoring.minimumWpm} WPM`}
              />

              <DetailItem
                label="Minimum Accuracy"
                value={`${scoring.minimumAccuracy}%`}
              />

              <DetailItem
                label="General Error Penalty"
                value={scoring.errorPenalty}
              />

              <DetailItem
                label="Rounding Policy"
                value={formatLabel(scoring.rounding)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* SPEED AND ACCURACY WEIGHTS */}

          {scoring.method === "weighted" && (
            <>
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-800">
                  Weighted Scoring
                </h3>

                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Speed Weight"
                    value={`${scoring.speedWeight}%`}
                  />

                  <DetailItem
                    label="Accuracy Weight"
                    value={`${scoring.accuracyWeight}%`}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100" />
            </>
          )}

          {/* CALCULATION POLICIES */}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-800">
              Calculation Policies
            </h3>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Speed Calculation"
                value={formatLabel(scoring.speedCalculation)}
              />

              <DetailItem
                label="Accuracy Calculation"
                value={formatLabel(scoring.accuracyCalculation)}
              />

              <DetailItem
                label="Not-Reached Policy"
                value={formatLabel(scoring.notReachedPolicy)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* INDIVIDUAL ERROR PENALTIES */}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-800">
              Individual Error Penalties
            </h3>

            {penalties ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Spelling Error"
                  value={formatValue(penalties.spelling)}
                />

                <DetailItem
                  label="Wrong Word"
                  value={formatValue(penalties.wrongWord)}
                />

                <DetailItem
                  label="Omission"
                  value={formatValue(penalties.omission)}
                />

                <DetailItem
                  label="Extra Word"
                  value={formatValue(penalties.extraWord)}
                />

                <DetailItem
                  label="Capitalization"
                  value={formatValue(penalties.capitalization)}
                />

                <DetailItem
                  label="Not Reached"
                  value={formatValue(penalties.notReached)}
                />
              </div>
            ) : (
              <EmptyValue />
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* GROUPED ERROR PENALTY */}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-800">
              Grouped Error Penalty
            </h3>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Errors Per Group"
                value={formatValue(scoring.errorsPerGroup)}
              />

              <DetailItem
                label="Penalty Per Group"
                value={formatValue(scoring.groupPenalty)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* QUALIFICATION CRITERIA */}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-800">
              Qualification Criteria
            </h3>

            {qualification ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Minimum Marks"
                  value={formatValue(qualification.minimumMarks)}
                />

                <DetailItem
                  label="Minimum WPM"
                  value={`${formatValue(qualification.minimumWpm)} WPM`}
                />

                <DetailItem
                  label="Minimum Accuracy"
                  value={`${formatValue(qualification.minimumAccuracy)}%`}
                />

                <DetailItem
                  label="Maximum Errors"
                  value={formatValue(qualification.maximumErrors)}
                />

                <DetailItem
                  label="Maximum Error Percentage"
                  value={`${formatValue(qualification.maximumErrorPercentage)}%`}
                />

                <DetailItem
                  label="Require All Criteria"
                  value={formatValue(qualification.requireAll)}
                />
              </div>
            ) : (
              <EmptyValue />
            )}
          </div>
        </div>
      </Section>

      {/* EXAMINATION INSTRUCTIONS */}

      <Section
        title="Examination Instructions"
        description="Instructions provided to candidates before starting."
      >
        {exam.instructions?.length ? (
          <ol className="space-y-3">
            {exam.instructions.map((instruction, index) => (
              <li
                key={`${index}-${instruction}`}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                  {index + 1}
                </span>

                <span className="pt-1 leading-5">{instruction}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-500">
            No examination instructions have been added.
          </p>
        )}
      </Section>

      {/* RECORD INFORMATION */}

      <Section
        title="Record Information"
        description="Examination creation and modification details."
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Created By" value={formatUser(exam.createdBy)} />

          <DetailItem label="Created At" value={formatDate(exam.createdAt)} />

          <DetailItem label="Updated By" value={formatUser(exam.updatedBy)} />

          <DetailItem label="Last Updated" value={formatDate(exam.updatedAt)} />
        </div>
      </Section>

      {/* FOOTER ACTION */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate(`/typing-exams/${exam._id}/passages`)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Manage Passages
        </button>
      </div>
    </div>
  );
};

export default ExamDetailsPage;
