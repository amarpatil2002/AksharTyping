import { useEffect, useMemo, useState } from "react";
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
  Award,
  CheckCircle2,
  Clock3,
  Crosshair,
  Gauge,
  Keyboard,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { getTypingAttemptResult } from "../services/typing.service";

type AnyRecord = Record<string, any>;

type ResultData = {
  attempt: AnyRecord;
  exam: AnyRecord;
  passage: AnyRecord;
  scoringConfiguration: AnyRecord;
  summary: AnyRecord;
  requirements: AnyRecord;
  charts: AnyRecord;
  analytics: AnyRecord;
  performanceInsights: AnyRecord[];
  result: AnyRecord;
};

const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fmt = (value: unknown, digits = 1) => number(value).toFixed(digits);

const clampPercent = (value: unknown) =>
  Math.max(0, Math.min(100, number(value)));

const formatDuration = (seconds: unknown) => {
  const total = Math.max(0, Math.floor(number(seconds)));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
};

const formatDate = (value: unknown) => {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const unwrapResult = (response: any): ResultData => {
  // Supports Axios responses, service-unwrapped responses, and the
  // API envelope shown in the supplied sample.
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
  if (!found) throw new Error("The result response has an unexpected format.");
  return found as ResultData;
};

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "indigo",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ElementType;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky";
}) {
  const accents = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-xl p-2 ${accents[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function ChartEmpty({
  message = "Not enough recorded data for this chart.",
}: {
  message?: string;
}) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 px-5 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
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

export default function TypingResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const timeline = useMemo(() => {
    const source = Array.isArray(charts.performanceTimeline)
      ? charts.performanceTimeline
      : [];
    return source.map((point: AnyRecord, index: number) => ({
      ...point,
      label: formatDuration(point.elapsedSeconds),
      sample: index + 1,
      grossWpm: number(point.grossWpm),
      netWpm: number(point.netWpm),
      accuracy: number(point.accuracy),
    }));
  }, [charts.performanceTimeline]);

  const minuteData = useMemo(() => {
    const source = Array.isArray(charts.minutePerformance)
      ? charts.minutePerformance
      : [];
    return source.map((point: AnyRecord) => ({
      ...point,
      label: point.label || `Minute ${point.minute}`,
      grossWpm: number(point.grossWpm),
      netWpm: number(point.netWpm),
      accuracy: number(point.accuracy),
      charactersTyped: number(point.charactersTyped),
      correctCharacters: number(point.correctCharacters),
      errors: number(point.errors),
    }));
  }, [charts.minutePerformance]);

  const characterData = useMemo(() => {
    const source = Array.isArray(charts.characterBreakdown)
      ? charts.characterBreakdown
      : [];
    return source.map((item: AnyRecord) => ({
      name: item.label,
      value: Math.max(0, number(item.value)),
    }));
  }, [charts.characterBreakdown]);

  const errorData = useMemo(() => {
    const source = Array.isArray(charts.errorBreakdown)
      ? charts.errorBreakdown
      : [];
    return source.map((item: AnyRecord) => ({
      name: item.label,
      errors: Math.max(0, number(item.value)),
    }));
  }, [charts.errorBreakdown]);

  const totalReferenceCharacters =
    number(summary.correctCharacters) +
    number(summary.incorrectCharacters) +
    number(summary.missedCharacters);

  const correctRate =
    totalReferenceCharacters > 0
      ? (number(summary.correctCharacters) / totalReferenceCharacters) * 100
      : 0;

  const errorRate =
    totalReferenceCharacters > 0
      ? ((number(summary.incorrectCharacters) +
          number(summary.missedCharacters)) /
          totalReferenceCharacters) *
        100
      : 0;

  const marksPercentage =
    number(summary.maximumMarks) > 0
      ? (number(summary.marks) / number(summary.maximumMarks)) * 100
      : number(summary.percentage);

  const markColor =
    marksPercentage >= 60 ? "text-emerald-600" : "text-rose-600";
  const passed = Boolean(summary.passed);

  const speedComparison = charts.speedComparison ?? {};
  const speedTarget = number(
    speedComparison.targetWpm ?? requirements.targetWpm,
  );
  const minimumWpm = number(
    speedComparison.minimumWpm ?? requirements.minimumWpm,
  );
  const achievedWpm = number(summary.netWpm);
  const speedBars = [
    { name: "Your net speed", wpm: achievedWpm },
    { name: "Minimum", wpm: minimumWpm },
    { name: "Target", wpm: speedTarget },
  ];

  const accuracyComparison = charts.accuracyComparison ?? {};
  const minimumAccuracy = number(
    accuracyComparison.minimumAccuracy ?? requirements.minimumAccuracy,
  );
  const accuracyBars = [
    {
      name: "Your accuracy",
      accuracy: number(summary.accuracy),
    },
    { name: "Required", accuracy: minimumAccuracy },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Preparing your performance report…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <XCircle className="mx-auto text-rose-500" size={36} />
          <h1 className="mt-3 text-xl font-bold text-slate-900">
            Result unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {error || "No result data was returned."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate("/typing-exam")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft size={17} /> Back to examinations
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={15} /> Refresh report
          </button>
        </div>

        {/* Hero scorecard */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                  EXAMINATION REPORT
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${passed ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}
                >
                  {passed ? "PASSED" : "NOT PASSED"}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                {data.exam?.title || "Typing examination"}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Passage: {data.passage?.title || "Typing passage"} · Difficulty:{" "}
                {data.passage?.difficulty || "—"}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={16} />{" "}
                  {formatDuration(data.attempt?.elapsedSeconds)} elapsed
                </span>
                <span className="inline-flex items-center gap-2">
                  <Keyboard size={16} />{" "}
                  {number(summary.totalCharacters).toLocaleString()} typed
                  characters
                </span>
                <span className="inline-flex items-center gap-2">
                  <Award size={16} /> {formatDate(data.attempt?.submittedAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <div
                className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${passed ? "#34d399" : "#fb7185"} ${clampPercent(marksPercentage)}%, rgba(255,255,255,.12) 0)`,
                }}
              >
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-slate-950">
                  <span className="text-3xl font-extrabold">
                    {fmt(marksPercentage, 0)}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Score
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Final marks
                </p>
                <p className="mt-1 text-3xl font-extrabold">
                  {fmt(summary.marks, 2)}
                  <span className="text-lg font-semibold text-slate-400">
                    {" "}
                    / {fmt(summary.maximumMarks, 0)}
                  </span>
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Evaluated score supplied by the examination server
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Net typing speed"
            value={`${fmt(summary.netWpm, 1)} WPM`}
            detail={`Target ${fmt(speedTarget, 0)} WPM`}
            icon={Gauge}
            accent="indigo"
          />
          <MetricCard
            label="Gross typing speed"
            value={`${fmt(summary.grossWpm, 1)} WPM`}
            detail="Before error deductions"
            icon={Zap}
            accent="sky"
          />
          <MetricCard
            label="Typing accuracy"
            value={`${fmt(summary.accuracy, 2)}%`}
            detail={`Required ${fmt(minimumAccuracy, 1)}%`}
            icon={Crosshair}
            accent="emerald"
          />
          <MetricCard
            label="Total errors"
            value={number(summary.totalErrors).toLocaleString()}
            detail={`${fmt(errorRate, 1)}% of reference characters`}
            icon={Target}
            accent="rose"
          />
        </div>

        {/* Requirements */}
        <Panel
          title="Qualification requirements"
          subtitle="Your evaluated performance compared with the examination thresholds"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Net typing speed
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {fmt(achievedWpm, 1)} WPM achieved · {fmt(minimumWpm, 1)}{" "}
                    WPM minimum
                  </p>
                </div>
                {requirements.wpmRequirementMet ? (
                  <CheckCircle2 className="text-emerald-600" />
                ) : (
                  <XCircle className="text-rose-500" />
                )}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{
                    width: `${clampPercent(minimumWpm > 0 ? (achievedWpm / minimumWpm) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Typing accuracy
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {fmt(summary.accuracy, 2)}% achieved ·{" "}
                    {fmt(minimumAccuracy, 1)}% required
                  </p>
                </div>
                {requirements.accuracyRequirementMet ? (
                  <CheckCircle2 className="text-emerald-600" />
                ) : (
                  <XCircle className="text-rose-500" />
                )}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${clampPercent(summary.accuracy)}%` }}
                />
              </div>
            </div>
          </div>
        </Panel>

        {/* Trend charts */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="Typing speed over time"
            subtitle="Gross and net words per minute from recorded timeline samples"
          >
            {timeline.length > 1 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timeline}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="grossFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#818cf8"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor="#818cf8"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#34d399"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#34d399"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="grossWpm"
                      name="Gross WPM"
                      stroke="#6366f1"
                      fill="url(#grossFill)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="netWpm"
                      name="Net WPM"
                      stroke="#10b981"
                      fill="url(#netFill)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty />
            )}
          </Panel>

          <Panel
            title="Accuracy progression"
            subtitle="Accuracy percentage at each saved examination checkpoint"
          >
            {timeline.length > 1 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeline}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine
                      y={minimumAccuracy}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      label={{
                        value: "Required",
                        fill: "#b45309",
                        fontSize: 11,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty />
            )}
          </Panel>

          <Panel
            title="Minute-wise typing speed"
            subtitle="Compare gross and net WPM across each examination minute"
          >
            {minuteData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={minuteData}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="grossWpm"
                      name="Gross WPM"
                      fill="#818cf8"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="netWpm"
                      name="Net WPM"
                      fill="#10b981"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty />
            )}
          </Panel>

          <Panel
            title="Minute-wise accuracy"
            subtitle="Accuracy by minute, with the required threshold"
          >
            {minuteData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={minuteData}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine
                      y={minimumAccuracy}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty />
            )}
          </Panel>
        </div>

        {/* Character and errors */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="Character accuracy breakdown"
            subtitle="Correct, incorrect and missed characters from the evaluated passage"
          >
            {characterData.some((item: AnyRecord) => item.value > 0) ? (
              <div className="grid items-center gap-4 md:grid-cols-[1fr_1fr]">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={characterData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={94}
                        paddingAngle={2}
                      >
                        {characterData.map((_: AnyRecord, index: number) => (
                          <Cell
                            key={index}
                            fill={
                              ["#10b981", "#f97316", "#6366f1", "#94a3b8"][
                                index % 4
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) =>
                          number(value).toLocaleString()
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {characterData.map((item: AnyRecord, index: number) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-2 text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: [
                              "#10b981",
                              "#f97316",
                              "#6366f1",
                              "#94a3b8",
                            ][index % 4],
                          }}
                        />
                        {item.name}
                      </span>
                      <strong className="text-slate-900">
                        {number(item.value).toLocaleString()}
                      </strong>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Correct rate across reference characters:{" "}
                    <strong className="text-slate-800">
                      {fmt(correctRate, 2)}%
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <ChartEmpty />
            )}
          </Panel>

          <Panel
            title="Error distribution"
            subtitle="Incorrect, missed and extra characters"
          >
            {errorData.some((item: AnyRecord) => item.errors > 0) ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={errorData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="errors"
                      name="Characters"
                      fill="#f97316"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty />
            )}
          </Panel>

          <Panel
            title="Speed benchmark"
            subtitle="Your net speed against minimum and target speed"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={speedBars}
                  margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="wpm" name="WPM" radius={[7, 7, 0, 0]}>
                    {speedBars.map((_, index) => (
                      <Cell
                        key={index}
                        fill={["#6366f1", "#f59e0b", "#10b981"][index]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Accuracy benchmark"
            subtitle="Your accuracy against the qualifying threshold"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={accuracyBars}
                  margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="accuracy" name="Accuracy" radius={[7, 7, 0, 0]}>
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Advanced analytics */}
        <Panel
          title="Advanced performance analytics"
          subtitle="Descriptive metrics calculated from the saved typing timeline"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Average net speed"
              value={`${fmt(overview.averageNetWpm)} WPM`}
              icon={Gauge}
            />
            <MetricCard
              label="Peak net speed"
              value={`${fmt(overview.peakNetWpm)} WPM`}
              icon={Trophy}
              accent="emerald"
            />
            <MetricCard
              label="Speed consistency"
              value={`${fmt(overview.speedConsistency)}%`}
              detail="Based on recorded timeline samples"
              icon={Crosshair}
              accent="sky"
            />
            <MetricCard
              label="Characters per minute"
              value={fmt(overview.charactersPerMinute, 1)}
              icon={Keyboard}
              accent="amber"
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Strongest minute
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {analytics.bestMinute?.minute
                  ? `Minute ${analytics.bestMinute.minute}`
                  : "—"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {fmt(analytics.bestMinute?.netWpm)} net WPM
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Weakest minute
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {analytics.weakestMinute?.minute
                  ? `Minute ${analytics.weakestMinute.minute}`
                  : "—"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {fmt(analytics.weakestMinute?.netWpm)} net WPM
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Speed variation
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {fmt(overview.speedDeviation)} WPM
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Standard deviation of recorded samples
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                First half vs second half
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">First half average</p>
                  <p className="mt-1 text-2xl font-bold">
                    {fmt(analytics.halfComparison?.firstHalfAverageNetWpm)}{" "}
                    <span className="text-xs font-medium text-slate-500">
                      WPM
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Second half average</p>
                  <p className="mt-1 text-2xl font-bold">
                    {fmt(analytics.halfComparison?.secondHalfAverageNetWpm)}{" "}
                    <span className="text-xs font-medium text-slate-500">
                      WPM
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                {number(analytics.halfComparison?.improvementPercentage) >=
                0 ? (
                  <TrendingUp size={15} className="text-emerald-600" />
                ) : (
                  <TrendingDown size={15} className="text-rose-600" />
                )}
                {fmt(analytics.halfComparison?.improvementPercentage)}% change
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Character accuracy
              </p>
              <p className="mt-3 text-3xl font-bold">{fmt(correctRate, 2)}%</p>
              <p className="mt-1 text-xs text-slate-500">
                Correct characters divided by correct + incorrect + missed
                reference characters.
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${clampPercent(correctRate)}%` }}
                />
              </div>
            </div>
          </div>
        </Panel>

        {/* Insights */}
        <Panel
          title="Personalised performance insights"
          subtitle="Actionable feedback based on the returned analytics"
        >
          {Array.isArray(data.performanceInsights) &&
          data.performanceInsights.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {data.performanceInsights.map(
                (insight: AnyRecord, index: number) => {
                  const positive = insight.type === "positive";
                  return (
                    <div
                      key={`${insight.title || "insight"}-${index}`}
                      className="flex gap-3 rounded-xl border border-slate-200 p-4"
                    >
                      <span
                        className={`mt-0.5 rounded-lg p-2 ${positive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {positive ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Target size={18} />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {insight.title || "Performance insight"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {insight.description || String(insight)}
                        </p>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No additional insights were returned for this attempt.
            </p>
          )}
        </Panel>

        {/* Attempt details */}
        <Panel
          title="Examination details"
          subtitle="Attempt, passage and scoring configuration"
        >
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Attempt ID", data.attempt?.attemptId || "—"],
              [
                "Passage word count",
                number(data.passage?.wordCount).toLocaleString(),
              ],
              ["Time used", formatDuration(data.attempt?.elapsedSeconds)],
              ["Time allowed", formatDuration(data.attempt?.durationSeconds)],
              ["Scoring method", data.scoringConfiguration?.method || "—"],
              [
                "Word length",
                `${number(data.scoringConfiguration?.wordLength, 5)} characters`,
              ],
              [
                "Error penalty",
                String(data.scoringConfiguration?.errorPenalty ?? "—"),
              ],
              ["Submitted", formatDate(data.attempt?.submittedAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <p className="text-xs text-slate-500">
            Report generated from the evaluated attempt and saved performance
            timeline.
          </p>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 print:hidden"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </main>
  );
}
