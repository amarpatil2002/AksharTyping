import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Gauge,
  Keyboard,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";
import { getTypingAttemptResult } from "../services/typing.service";
import {
  ResultTabs,
  ResultTabPanel,
  type ResultTabId,
} from "../components/ResultTable";

type AnyRecord = Record<string, any>;

type ResultData = {
  attempt: AnyRecord;
  exam: AnyRecord;
  passage: AnyRecord;
  scoringConfiguration: AnyRecord;
  summary: AnyRecord;
  examinationSummary?: AnyRecord;
  requirements: AnyRecord;
  charts: AnyRecord;
  analytics: AnyRecord;
  result: AnyRecord;
};

const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fmt = (value: unknown, digits = 1) => number(value).toFixed(digits);

const clampPercent = (value: unknown) =>
  Math.max(0, Math.min(100, number(value)));

const displayCount = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : number(value).toLocaleString();

const formatDuration = (seconds: unknown) => {
  const total = Math.max(0, Math.floor(number(seconds)));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

const formatDate = (value: unknown) => {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const unwrapResult = (response: any): ResultData => {
  const candidates = [
    response?.data?.data,
    response?.data,
    response?.data?.data?.data,
    response,
  ];
  const found = candidates.find(
    (candidate) =>
      candidate &&
      typeof candidate === "object" &&
      candidate.summary &&
      candidate.charts,
  );
  if (!found) {
    throw new Error("The result response has an unexpected format.");
  }
  return found as ResultData;
};

function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-[#343b3f] bg-[#1b1f22] p-5 shadow-sm ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#d2d7d4]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 border-l border-[#343b3f] px-4 first:border-l-0 first:pl-0">
      <p
        className={`text-2xl font-bold tracking-tight ${accent ? "text-[#83c4ae]" : "text-[#e5e7e6]"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#929b96]">
        {label}
      </p>
      {detail && (
        <p className="mt-1 text-xs leading-5 text-[#929b96]">{detail}</p>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#343b3f] bg-[#252a2e] p-3 text-[#e5e7e6] shadow-lg">
      <p className="mb-2 text-xs font-semibold text-[#929b96]">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p
          key={`${entry.dataKey}-${index}`}
          className="text-sm font-medium"
          style={{ color: entry.color }}
        >
          {entry.name}: {fmt(entry.value, 2)}
          {String(entry.dataKey).toLowerCase().includes("accuracy") ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

function ChartEmpty({
  message = "No recorded data is available for this chart.",
}: {
  message?: string;
}) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[#343b3f] bg-[#15191c] px-5 text-center text-sm text-[#929b96]">
      {message}
    </div>
  );
}

function RequirementRow({
  label,
  minimum,
  achieved,
  met,
  percentage,
}: {
  label: string;
  minimum: string;
  achieved: string;
  met: boolean;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {met ? (
          <CheckCircle2 size={18} className="shrink-0 text-[#83c4ae]" />
        ) : (
          <XCircle size={18} className="shrink-0 text-[#D92D20]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm text-[#d2d7d4]">
              {label}{" "}
              <span className="ml-1 text-xs text-[#929b96]">{minimum}</span>
            </p>
            <strong className="text-sm text-[#e5e7e6]">{achieved}</strong>
          </div>
          <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[#343b3f]">
            <div
              className={`h-full rounded-full ${met ? "bg-[#83c4ae]" : "bg-[#d97970]"}`}
              style={{ width: `${clampPercent(percentage)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TypingResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ResultTabId>("overview");

  useEffect(() => {
    let active = true;
    const loadResult = async () => {
      if (!attemptId) {
        setError("Missing examination attempt ID.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const response = await getTypingAttemptResult(attemptId);
        const parsed = unwrapResult(response);
        if (active) setData(parsed);
      } catch (err: any) {
        if (active) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load your examination result.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadResult();
    return () => {
      active = false;
    };
  }, [attemptId]);

  const summary = data?.summary ?? {};
  const requirements = data?.requirements ?? {};
  const analytics = data?.analytics ?? {};
  const overview = analytics.overview ?? {};
  const charts = data?.charts ?? {};
  const result = data?.result ?? {};
  const scoring = data?.scoringConfiguration ?? {};

  const wordMetrics = summary.wordMetrics ?? result.wordMetrics ?? {};
  const wordsTyped = number(summary.wordsTyped ?? wordMetrics.wordsTyped);
  const totalWords = number(
    summary.totalWords ?? wordMetrics.totalWords ?? data?.passage?.wordCount,
  );
  const correctWords = number(summary.correctWords ?? wordMetrics.correctWords);
  const incorrectWords = number(
    summary.incorrectWords ?? wordMetrics.incorrectWords,
  );
  const misspellings = number(summary.misspellings ?? wordMetrics.misspellings);
  const omissions = number(summary.omissions ?? wordMetrics.omissions);
  const notReachedWords = number(
    summary.notReachedWords ?? wordMetrics.notReachedWords,
  );
  const extraWords = number(summary.extraWords ?? wordMetrics.extraWords);
  const totalErrors = number(summary.totalErrors ?? result.totalErrors);
  const accuracy = clampPercent(summary.accuracy ?? result.accuracy);
  const grossWpm = number(summary.grossWpm ?? result.grossWpm);
  const netWpm = number(summary.netWpm ?? result.netWpm);
  const marks = number(summary.marks ?? result.marks);
  const maximumMarks = number(
    summary.maximumMarks ?? result.maximumMarks ?? scoring.maximumMarks,
  );
  const passingMarks = number(
    summary.passingMarks ?? requirements.passingMarks ?? scoring.passingMarks,
  );
  const passingPercentage = number(
    summary.passingPercentage ??
      requirements.passingPercentage ??
      scoring.passingPercentage,
  );
  const marksPercentage =
    maximumMarks > 0
      ? (marks / maximumMarks) * 100
      : number(summary.percentage);
  const passed = Boolean(summary.passed ?? result.passed);
  const elapsedSeconds = number(data?.attempt?.elapsedSeconds);
  const minimumWpm = number(requirements.minimumWpm ?? scoring.minimumWpm);
  const minimumAccuracy = number(
    requirements.minimumAccuracy ?? scoring.minimumAccuracy,
  );
  const targetWpm = number(requirements.targetWpm ?? scoring.targetWpm);

  const timeline = useMemo(() => {
    const source = Array.isArray(charts.performanceTimeline)
      ? charts.performanceTimeline
      : [];
    const points = source;
    return points.map((point: AnyRecord, index: number) => ({
      ...point,
      label: formatDuration(point.elapsedSeconds),
      sample: index + 1,
      grossWpm: number(point.grossWpm),
      netWpm: number(point.netWpm),
      accuracy: number(point.accuracy),
    }));
  }, [
    charts.performanceTimeline,
    data,
    elapsedSeconds,
    grossWpm,
    netWpm,
    accuracy,
  ]);

  const minuteData = useMemo(() => {
    const source = Array.isArray(charts.minutePerformance)
      ? charts.minutePerformance
      : [];
    const points = source;
    return points.map((point: AnyRecord) => ({
      ...point,
      label: point.label || `Minute ${point.minute}`,
      wordsTyped: number(point.wordsTyped),
      correctWords: number(point.correctWords),
      errors: number(point.errors ?? point.totalErrors),
      grossWpm: number(point.grossWpm),
      netWpm: number(point.netWpm),
      accuracy: number(point.accuracy),
    }));
  }, [
    charts.minutePerformance,
    data,
    elapsedSeconds,
    wordsTyped,
    correctWords,
    totalErrors,
    grossWpm,
    netWpm,
    accuracy,
  ]);

  const wordBreakdown = useMemo(() => {
    const source = Array.isArray(charts.wordBreakdown)
      ? charts.wordBreakdown
      : [];
    const points = source.length
      ? source.map((item: AnyRecord) => ({
          name: item.label,
          value: Math.max(0, number(item.value)),
        }))
      : [
          { name: "Correct", value: correctWords },
          { name: "Incorrect", value: incorrectWords },
          { name: "Not reached", value: notReachedWords },
          { name: "Extra", value: extraWords },
        ];
    return points.filter((item) => item.value > 0);
  }, [
    charts.wordBreakdown,
    correctWords,
    incorrectWords,
    notReachedWords,
    extraWords,
  ]);

  const errorBreakdown = useMemo(() => {
    const source = Array.isArray(charts.wordErrorBreakdown)
      ? charts.wordErrorBreakdown
      : [];
    const points = source.length
      ? source.map((item: AnyRecord) => ({
          name: item.label,
          errors: Math.max(0, number(item.value)),
        }))
      : [
          { name: "Misspellings", errors: misspellings },
          { name: "Omissions", errors: omissions },
          { name: "Extra words", errors: extraWords },
        ];
    return points.filter((item) => item.errors > 0);
  }, [charts.wordErrorBreakdown, misspellings, omissions, extraWords]);

  const speedBars = [
    { name: "Your net speed", wpm: netWpm },
    ...(minimumWpm > 0 ? [{ name: "Minimum", wpm: minimumWpm }] : []),
    ...(targetWpm > 0 ? [{ name: "Target", wpm: targetWpm }] : []),
  ].filter((item) => item.wpm > 0);

  const accuracyBars = [
    { name: "Your accuracy", accuracy },
    ...(minimumAccuracy > 0
      ? [{ name: "Required", accuracy: minimumAccuracy }]
      : []),
  ].filter((item) => item.accuracy > 0);

  const accuracyPie = [
    { name: "Correct", value: accuracy },
    { name: "Remaining", value: 100 - accuracy },
  ];

  const resultBreakdown =
    result.marksBreakdown ??
    result.scoreBreakdown ??
    summary.marksBreakdown ??
    null;
  const scoredWordCount = number(
    result.scoredWordCount ??
      summary.scoredWordCount ??
      data?.scoringConfiguration?.scoredWordCount,
  );
  const hasScoredWordLimit =
    scoredWordCount > 0 && totalWords > scoredWordCount;

  const typedMetrics = [
    {
      label: "Correct words",
      value: `${displayCount(correctWords)} / ${displayCount(totalWords)}`,
      detail: "correctly typed words",
      accent: true,
    },
    {
      label: "Incorrect words",
      value: displayCount(incorrectWords || misspellings + omissions),
      detail: "wrong, misspelled or misplaced",
    },
    {
      label: "Not reached",
      value: displayCount(notReachedWords),
      detail: "words not reached by the end",
    },
    {
      label: "Accuracy",
      value: `${fmt(accuracy, 1)}%`,
      detail: "correct words ÷ words typed",
      accent: true,
    },
    {
      label: "Gross WPM",
      value: fmt(grossWpm, 0),
      detail: "typed words per minute",
    },
    {
      label: "Net WPM",
      value: fmt(netWpm, 0),
      detail: "after word-level error deductions",
    },
    {
      label: "Time used",
      value: formatDuration(elapsedSeconds),
      detail: "time on the scoring phase",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15191c] px-4 text-[#e5e7e6]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#35423e] border-t-[#83c4ae]" />
          <p className="mt-4 text-sm text-[#929b96]">
            Preparing your performance report…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15191c] p-5 text-[#e5e7e6]">
        <div className="w-full max-w-md rounded-2xl border border-[#343b3f] bg-[#1b1f22] p-7 text-center">
          <XCircle className="mx-auto text-[#D92D20]" size={36} />
          <h1 className="mt-3 text-xl font-bold">Result unavailable</h1>
          <p className="mt-2 text-sm text-[#929b96]">
            {error || "No result data was returned."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 rounded-xl bg-[#83c4ae] px-5 py-2.5 text-sm font-semibold text-[#14211c]"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#15191c] pb-24 text-[#e5e7e6]">
      <header className="sticky top-0 z-30 border-b border-[#343b3f] bg-[#1b1f22]/95 shadow-sm backdrop-blur">
        <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() => navigate("/typing-exams")}
              aria-label="Back to examinations"
              className="rounded-lg p-2 text-[#aeb6b2] hover:bg-[#1b1f22]/5"
            >
              <ArrowLeft size={21} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-[#e5e7e6] sm:text-lg">
                {data.exam?.title || "Typing examination"} — Result
              </h1>
              <p className="text-xs text-[#929b96]">
                {data.exam?.language || data.passage?.language || "Typing test"}{" "}
                · {formatDate(data.attempt?.submittedAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <span className="hidden text-xs text-[#929b96] sm:inline">
              # Attempt{" "}
              {String(data.attempt?.attemptId || attemptId || "")
                .slice(-6)
                .toUpperCase()}
            </span>
            <button
              onClick={() => window.print()}
              aria-label="Print or save result"
              className="rounded-lg p-2 text-[#aeb6b2] hover:bg-[#1b1f22]/5"
            >
              <Download size={21} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-7">
        {hasScoredWordLimit && (
          <div className="flex gap-3 rounded-xl border border-[#31584c] bg-[#244238] px-4 py-3 text-[#a3d4c1]">
            <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="text-sm font-bold">
                Scored on first {displayCount(scoredWordCount)} words
              </p>
              <p className="mt-0.5 text-sm text-[#aeb6b2]">
                The passage has {displayCount(totalWords)} words, but only the
                first {displayCount(scoredWordCount)} are counted toward WPM,
                accuracy, and mistakes.
              </p>
            </div>
          </div>
        )}

        <ResultTabs activeTab={activeTab} onChange={setActiveTab} />

        <ResultTabPanel active={activeTab === "overview"}>
          <div className="grid gap-4 xl:grid-cols-2">
            <section
              className={`rounded-xl border p-5 sm:p-6 ${passed ? "border-[#31584c] bg-[#244238]" : "border-[#754343] bg-[#482a2a]"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#d2d7d4]">
                  Marks awarded
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${passed ? "bg-[#244238] text-[#a3d4c1]" : "bg-[#482a2a] text-[#f08b82]"}`}
                >
                  {passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {passed ? "Qualified" : "Not qualified"}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {fmt(marks, 2)}
                </span>
                <span className="text-base font-semibold text-[#929b96]">
                  / {fmt(maximumMarks, 2)}
                </span>
              </div>

              {resultBreakdown && (
                <div className="mt-5 divide-y divide-[#343b3f] text-sm">
                  {[
                    ["Base marks", resultBreakdown.baseMarks],
                    ["Penalties", resultBreakdown.penalties],
                    ["Raw total", resultBreakdown.rawTotal],
                    ["Awarded", resultBreakdown.awarded],
                  ]
                    .filter(
                      ([, value]) => value !== undefined && value !== null,
                    )
                    .map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="flex items-center justify-between gap-4 py-2"
                      >
                        <span className="text-[#aeb6b2]">{label}</span>
                        <strong className="tabular-nums">
                          {fmt(value, 2)}
                        </strong>
                      </div>
                    ))}
                </div>
              )}
              {!resultBreakdown && (
                <p className="mt-4 text-xs text-[#929b96]">
                  Final evaluated marks supplied by the examination server.
                </p>
              )}
            </section>

            <Panel title="Qualifying criteria — all required">
              <div className="space-y-4">
                <RequirementRow
                  label="Marks"
                  minimum={`min ${fmt(passingMarks, 2)}`}
                  achieved={fmt(marks, 2)}
                  met={Boolean(
                    requirements.passingMarksRequirementMet ??
                    marks >= passingMarks,
                  )}
                  percentage={
                    maximumMarks > 0 ? (marks / maximumMarks) * 100 : 0
                  }
                />
                <RequirementRow
                  label="Net speed"
                  minimum={`min ${fmt(minimumWpm, 0)} WPM`}
                  achieved={`${fmt(netWpm, 0)} WPM`}
                  met={Boolean(
                    requirements.wpmRequirementMet ?? netWpm >= minimumWpm,
                  )}
                  percentage={minimumWpm > 0 ? (netWpm / minimumWpm) * 100 : 0}
                />
                <RequirementRow
                  label="Accuracy"
                  minimum={`min ${fmt(minimumAccuracy, 1)}%`}
                  achieved={`${fmt(accuracy, 1)}%`}
                  met={Boolean(
                    requirements.accuracyRequirementMet ??
                    accuracy >= minimumAccuracy,
                  )}
                  percentage={
                    minimumAccuracy > 0
                      ? (accuracy / minimumAccuracy) * 100
                      : accuracy
                  }
                />
              </div>
              <p className="mt-4 text-xs text-[#929b96]">
                Qualification thresholds are taken from the examination
                configuration.
              </p>
            </Panel>
          </div>

          <section className="rounded-xl border border-[#343b3f] bg-[#1b1f22] p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-7">
              {typedMetrics.map((metric) => (
                <Metric key={metric.label} {...metric} />
              ))}
            </div>
            {(misspellings > 0 || omissions > 0 || extraWords > 0) && (
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#343b3f] pt-4 text-xs text-[#929b96]">
                <span>
                  Misspellings:{" "}
                  <strong className="text-[#e5e7e6]">
                    {displayCount(misspellings)}
                  </strong>
                </span>
                <span>
                  Omissions:{" "}
                  <strong className="text-[#e5e7e6]">
                    {displayCount(omissions)}
                  </strong>
                </span>
                <span>
                  Extra words:{" "}
                  <strong className="text-[#e5e7e6]">
                    {displayCount(extraWords)}
                  </strong>
                </span>
              </div>
            )}
          </section>
        </ResultTabPanel>

        <ResultTabPanel active={activeTab === "speed"}>
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Typing speed over time">
              {timeline.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timeline}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="grossFillDark"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#83c4ae"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="95%"
                            stopColor="#83c4ae"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="netFillDark"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#83c4ae"
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="95%"
                            stopColor="#83c4ae"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#343b3f"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#aeb6b2" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#aeb6b2" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="grossWpm"
                        name="Gross WPM"
                        stroke="#83c4ae"
                        fill="url(#grossFillDark)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="netWpm"
                        name="Net WPM"
                        stroke="#83c4ae"
                        fill="url(#netFillDark)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty />
              )}
            </Panel>

            <Panel title="Accuracy progression">
              {timeline.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeline}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#343b3f"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#aeb6b2" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#aeb6b2" }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine
                        y={minimumAccuracy}
                        stroke="#F79009"
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        name="Accuracy"
                        stroke="#a3d4c1"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty />
              )}
            </Panel>

            <Panel title="Minute-wise typing speed">
              {minuteData.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={minuteData}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#343b3f"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#aeb6b2" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#aeb6b2" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="grossWpm"
                        name="Gross WPM"
                        fill="#83c4ae"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="netWpm"
                        name="Net WPM"
                        fill="#83c4ae"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty />
              )}
            </Panel>

            <Panel title="Minute-wise accuracy">
              {minuteData.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={minuteData}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#343b3f"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#aeb6b2" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#aeb6b2" }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine
                        y={minimumAccuracy}
                        stroke="#F79009"
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        name="Accuracy"
                        stroke="#a3d4c1"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty />
              )}
            </Panel>
          </div>
        </ResultTabPanel>

        <ResultTabPanel active={activeTab === "words"}>
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Word accuracy breakdown">
              {wordBreakdown.some((item: AnyRecord) => item.value > 0) ? (
                <div className="grid items-center gap-4 md:grid-cols-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wordBreakdown}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={2}
                        >
                          {wordBreakdown.map((_: AnyRecord, index: number) => (
                            <Cell
                              key={index}
                              fill={
                                [
                                  "#83c4ae",
                                  "#e58b83",
                                  "#d9ad69",
                                  "#75b8d4",
                                  "#9ba8ff",
                                ][index % 5]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {wordBreakdown.map((item: AnyRecord, index: number) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex items-center gap-2 text-[#929b96]">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: [
                                "#83c4ae",
                                "#e58b83",
                                "#d9ad69",
                                "#75b8d4",
                                "#9ba8ff",
                              ][index % 5],
                            }}
                          />
                          {item.name}
                        </span>
                        <strong className="text-[#e5e7e6]">
                          {displayCount(item.value)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ChartEmpty />
              )}
            </Panel>

            <Panel title="Word error distribution">
              {errorBreakdown.some((item: AnyRecord) => item.errors > 0) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={errorBreakdown}
                      layout="vertical"
                      margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid
                        stroke="#343b3f"
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#aeb6b2" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 11, fill: "#c4cbc7" }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="errors"
                        name="Words"
                        fill="#d88b70"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty />
              )}
            </Panel>

            <Panel title="Speed benchmark">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={speedBars}
                    margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#343b3f"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#aeb6b2" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#aeb6b2" }} />
                    <Tooltip />
                    <Bar dataKey="wpm" name="WPM" radius={[7, 7, 0, 0]}>
                      {speedBars.map((_, index) => (
                        <Cell
                          key={index}
                          fill={["#83c4ae", "#d9ad69", "#9ba8ff"][index]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Accuracy benchmark">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={accuracyBars}
                    margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#343b3f"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#aeb6b2" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#aeb6b2" }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="accuracy"
                      name="Accuracy"
                      radius={[7, 7, 0, 0]}
                    >
                      <Cell fill="#83c4ae" />
                      <Cell fill="#d9ad69" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Typing accuracy">
              <div className="grid items-center gap-5 md:grid-cols-2">
                <div className="relative mx-auto h-64 w-full max-w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accuracyPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="72%"
                        outerRadius="94%"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        <Cell fill="#83c4ae" />
                        <Cell fill="#394145" />
                      </Pie>
                      <Tooltip
                        formatter={(value, name) =>
                          [
                            `${Number(value ?? 0).toFixed(2)}%`,
                            String(name),
                          ] as [string, string]
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#929b96]">
                      Accuracy
                    </span>
                    <span className="mt-2 text-4xl font-extrabold">
                      {accuracy.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#31584c] bg-[#244238]/60 p-4">
                    <p className="text-sm font-semibold text-[#83c4ae]">
                      Your typing accuracy
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#83c4ae]">
                      {accuracy.toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#343b3f] p-3 text-sm">
                    <span className="text-[#929b96]">Correct typing</span>
                    <strong>{accuracy.toFixed(2)}%</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#343b3f] p-3 text-sm">
                    <span className="text-[#929b96]">Remaining</span>
                    <strong>{(100 - accuracy).toFixed(2)}%</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#252a2e] p-3 text-sm">
                    <span className="text-[#929b96]">Required accuracy</span>
                    <strong>{minimumAccuracy.toFixed(2)}%</strong>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </ResultTabPanel>

        <ResultTabPanel active={activeTab === "analytics"}>
          <Panel title="Advanced performance analytics">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Average net speed",
                  value: `${fmt(overview.averageNetWpm ?? netWpm)} WPM`,
                  icon: Gauge,
                },
                {
                  label: "Peak net speed",
                  value: `${fmt(overview.peakNetWpm ?? netWpm)} WPM`,
                  icon: Trophy,
                },
                {
                  label: "Speed consistency",
                  value: `${fmt(overview.speedConsistency)}%`,
                  icon: Target,
                },
                {
                  label: "Words per minute",
                  value: fmt(overview.wordsPerMinute ?? netWpm, 1),
                  icon: Keyboard,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#343b3f] bg-[#15191c] p-4"
                >
                  <div className="flex items-center justify-between gap-2 text-[#929b96]">
                    <span className="text-sm">{label}</span>
                    <Icon size={17} />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-[#e5e7e6]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                { label: "Strongest minute", item: analytics.bestMinute },
                { label: "Weakest minute", item: analytics.weakestMinute },
              ].map(({ label, item }) => (
                <div key={label} className="rounded-xl bg-[#252a2e] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#929b96]">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-bold">
                    {item?.minute ? `Minute ${item.minute}` : "—"}
                  </p>
                  <p className="mt-1 text-sm text-[#929b96]">
                    {fmt(item?.netWpm)} net WPM
                  </p>
                </div>
              ))}
              <div className="rounded-xl bg-[#252a2e] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#929b96]">
                  Speed variation
                </p>
                <p className="mt-2 text-xl font-bold">
                  {fmt(overview.speedDeviation)} WPM
                </p>
                <p className="mt-1 text-sm text-[#929b96]">
                  Standard deviation of recorded samples
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#343b3f] p-4">
                <p className="text-sm font-semibold text-[#d2d7d4]">
                  First half vs second half
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#929b96]">First half average</p>
                    <p className="mt-1 text-2xl font-bold">
                      {fmt(analytics.halfComparison?.firstHalfAverageNetWpm)}{" "}
                      <span className="text-xs text-[#929b96]">WPM</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#929b96]">
                      Second half average
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {fmt(analytics.halfComparison?.secondHalfAverageNetWpm)}{" "}
                      <span className="text-xs text-[#929b96]">WPM</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#aeb6b2]">
                  {number(analytics.halfComparison?.improvementPercentage) >=
                  0 ? (
                    <TrendingUp size={15} className="text-[#83c4ae]" />
                  ) : (
                    <TrendingDown size={15} className="text-[#D92D20]" />
                  )}
                  {fmt(analytics.halfComparison?.improvementPercentage)}% change
                </p>
              </div>
              <div className="rounded-xl border border-[#343b3f] p-4">
                <p className="text-sm font-semibold text-[#d2d7d4]">
                  Word accuracy
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {accuracy.toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-[#929b96]">
                  Accuracy returned by the examination evaluator.
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#343b3f]">
                  <div
                    className="h-full rounded-full bg-[#83c4ae]"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            </div>

            {Array.isArray(analytics.insights) &&
              analytics.insights.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#929b96]">
                    Performance insights
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {analytics.insights.map(
                      (insight: AnyRecord, index: number) => (
                        <div
                          key={`${insight.title}-${index}`}
                          className="rounded-lg border border-[#343b3f] bg-[#15191c] p-4"
                        >
                          <p className="text-sm font-semibold text-[#e5e7e6]">
                            {insight.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#929b96]">
                            {insight.description}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </Panel>
        </ResultTabPanel>

        <ResultTabPanel active={activeTab === "passage"}>
          <Panel title="Passage attempted">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#e5e7e6]">
                  {data.passage?.title || "Typing passage"}
                </h3>
                <p className="mt-1 text-sm text-[#929b96]">
                  {[data.passage?.language, data.passage?.difficulty]
                    .filter(Boolean)
                    .join(" · ") || "Passage details"}
                </p>
              </div>
              <span className="rounded-lg bg-[#244238] px-3 py-1.5 text-xs font-semibold text-[#83c4ae]">
                {displayCount(data.passage?.wordCount ?? totalWords)} words
              </span>
            </div>
            {typeof data.passage?.content === "string" &&
              data.passage.content.trim() && (
                <div className="mt-4 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#343b3f] bg-[#15191c] p-4 text-sm leading-7 text-[#aeb6b2]">
                  {data.passage.content}
                </div>
              )}
          </Panel>

          <Panel title="Examination details">
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Attempt ID", data.attempt?.attemptId || attemptId || "—"],
                ["Passage word count", displayCount(data.passage?.wordCount)],
                ["Words scored", displayCount(totalWords)],
                ["Time used", formatDuration(elapsedSeconds)],
                ["Time allowed", formatDuration(data.attempt?.durationSeconds)],
                ["Scoring method", scoring.method || "—"],
                ["Target speed", targetWpm ? `${targetWpm} WPM` : "—"],
                ["Minimum speed", minimumWpm ? `${minimumWpm} WPM` : "—"],
                ["Minimum accuracy", `${fmt(minimumAccuracy, 1)}%`],
                ["Qualifying marks", displayCount(passingMarks)],
                ["Submitted", formatDate(data.attempt?.submittedAt)],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#929b96]">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-[#e5e7e6]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </ResultTabPanel>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#343b3f] bg-[#1b1f22]/95 px-4 py-3 backdrop-blur sm:px-7 print:hidden">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate("/typing-exams")}
            className="inline-flex items-center gap-2 rounded-full border border-[#343b3f] px-5 py-2.5 text-sm font-semibold text-[#aeb6b2] hover:bg-[#1b1f22]/5"
          >
            <ArrowLeft size={16} /> Back to examinations
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-[#83c4ae] px-5 py-2.5 text-sm font-semibold text-[#14211c] hover:bg-[#004EEB]"
          >
            <Download size={16} /> Result PDF
          </button>
        </div>
      </footer>

      <style>{`
        @media print {
          body { background: #fff !important; }
          main { background: #fff !important; color: #101828 !important; padding-bottom: 0 !important; }
          header, footer { position: static !important; }
          footer { display: none !important; }
          section { break-inside: avoid; box-shadow: none !important; }
          button { display: none !important; }
        }
      `}</style>
    </main>
  );
}
