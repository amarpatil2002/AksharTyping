import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  Clock3,
  Flame,
  Keyboard,
  Play,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    label: "Average speed",
    value: "42",
    unit: "WPM",
    change: "+12.5%",
    positive: true,
    description: "vs. last week",
    icon: Zap,
    iconStyle: "bg-blue-50 text-blue-600",
  },
  {
    label: "Accuracy",
    value: "96.4",
    unit: "%",
    change: "+2.4%",
    positive: true,
    description: "vs. last week",
    icon: Target,
    iconStyle: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Practice time",
    value: "2.5",
    unit: "hrs",
    change: "+30 min",
    positive: true,
    description: "this week",
    icon: Clock3,
    iconStyle: "bg-violet-50 text-violet-600",
  },
  {
    label: "Daily streak",
    value: "4",
    unit: "days",
    change: "Keep going!",
    positive: true,
    description: "current streak",
    icon: Flame,
    iconStyle: "bg-orange-50 text-orange-600",
  },
];

const weeklyProgress = [
  { day: "Mon", wpm: 30 },
  { day: "Tue", wpm: 35 },
  { day: "Wed", wpm: 32 },
  { day: "Thu", wpm: 39 },
  { day: "Fri", wpm: 36 },
  { day: "Sat", wpm: 45 },
  { day: "Sun", wpm: 42 },
];

const recentTests = [
  {
    title: "Everyday English",
    date: "Today, 10:30 AM",
    wpm: 42,
    accuracy: 96,
    duration: "1 min",
  },
  {
    title: "Common Words",
    date: "Yesterday, 6:15 PM",
    wpm: 38,
    accuracy: 94,
    duration: "2 min",
  },
  {
    title: "Quick Sentences",
    date: "Oct 11, 4:20 PM",
    wpm: 35,
    accuracy: 97,
    duration: "1 min",
  },
];

export default function DashboardPage() {
  const dailyGoal = 10;
  const completedMinutes = 7;
  const goalPercentage = Math.min(
    100,
    Math.round((completedMinutes / dailyGoal) * 100),
  );

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-600">
            YOUR LEARNING OVERVIEW
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Welcome back, Learner! 👋
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Every minute of practice brings you closer to your goals.
          </p>
        </div>

        <Link
          to="/typing"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Play size={17} fill="currentColor" />
          Start typing test
          <ArrowRight size={17} />
        </Link>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {stat.label}
                </span>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconStyle}`}
                >
                  <Icon size={20} />
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-slate-950">
                  {stat.value}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {stat.unit}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                {stat.positive && (
                  <ArrowUpRight size={14} className="text-emerald-600" />
                )}
                <span
                  className={
                    stat.positive ? "font-semibold text-emerald-600" : ""
                  }
                >
                  {stat.change}
                </span>
                <span className="text-slate-400">{stat.description}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* Chart and goal */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Typing speed progress
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your average words per minute this week
              </p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              +12.5% this week
            </span>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-950">42</span>
              <span className="text-sm text-slate-500">WPM average</span>
            </div>

            <div className="grid h-48 grid-cols-7 items-end gap-3 sm:gap-5">
              {weeklyProgress.map((item) => (
                <div
                  key={item.day}
                  className="flex h-full flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-medium text-slate-500">
                    {item.wpm}
                  </span>
                  <div className="flex h-full w-full items-end">
                    <div
                      title={`${item.wpm} WPM`}
                      className={`w-full rounded-t-lg transition-all ${
                        item.day === "Sun"
                          ? "bg-blue-600"
                          : "bg-blue-100 hover:bg-blue-200"
                      }`}
                      style={{ height: `${(item.wpm / 50) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
              Current day
              <span className="ml-3 h-2.5 w-2.5 rounded-sm bg-blue-100" />
              Previous days
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Target size={21} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Daily goal</h2>
              <p className="text-sm text-slate-500">
                Small steps, big progress
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#2563eb ${goalPercentage}%, #e2e8f0 ${goalPercentage}% 100%)`,
              }}
              role="img"
              aria-label={`${goalPercentage}% of daily practice goal completed`}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-bold text-slate-950">
                  {goalPercentage}%
                </span>
                <span className="mt-1 text-xs text-slate-500">completed</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-lg font-bold text-slate-900">
              {completedMinutes} of {dailyGoal} minutes
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Just {dailyGoal - completedMinutes} minutes left today.
            </p>
          </div>

          <Link
            to="/typing"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Continue practicing
            <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      {/* Recent tests and achievement */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">Recent typing tests</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review your latest practice sessions
              </p>
            </div>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTests.map((test) => (
              <div
                key={test.title}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Keyboard size={19} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {test.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{test.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 pl-1 sm:pl-0">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {test.wpm} WPM
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Speed</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {test.accuracy}%
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {test.duration}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Duration</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Trophy size={21} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Your next milestone</h2>
              <p className="text-sm text-slate-500">Keep pushing forward</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Award size={25} className="text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Speed Starter
                </p>
                <p className="text-xs text-slate-500">
                  Reach 50 WPM average speed
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="text-slate-500">Current: 42 WPM</span>
              <span className="font-semibold text-blue-700">84%</span>
            </div>

            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="Progress toward 50 WPM milestone"
              aria-valuemin={0}
              aria-valuemax={50}
              aria-valuenow={42}
            >
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: "84%" }}
              />
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                You're making progress!
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Consistent daily practice can help you reach your next goal.
              </p>
            </div>
          </div>

          <Link
            to="/achievements"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Explore achievements <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      {/* Bottom banner */}
      <section className="relative overflow-hidden rounded-2xl bg-blue-600 p-6 text-white sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
              <ArrowDownRight size={14} />
              Your next step
            </div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Ready for your next typing challenge?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              Practice with real-world passages, improve your accuracy, and
              build a faster typing habit.
            </p>
          </div>

          <Link
            to="/typing"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Start a test <ArrowRight size={17} />
          </Link>
        </div>

        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/5" />
      </section>
    </div>
  );
}
