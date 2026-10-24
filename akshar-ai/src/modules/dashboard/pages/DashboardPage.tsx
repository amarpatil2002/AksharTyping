import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Clock3,
  Flame,
  Target,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "../../auth/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Student";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      {/* Welcome header */}
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-600">
            Your learning space
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {firstName}! 👋
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Keep practicing and make every keystroke count.
          </p>
        </div>

        <Link
          to="/typing-practice"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <Zap className="h-4 w-4" />
          Start Practicing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Sample statistics: replace with backend data when available */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Typing Speed"
          value="42 WPM"
          description="Latest practice"
          icon={<Zap className="h-5 w-5" />}
        />

        <StatCard
          title="Accuracy"
          value="96%"
          description="Latest practice"
          icon={<Target className="h-5 w-5" />}
        />

        <StatCard
          title="Practice Time"
          value="4.5 hrs"
          description="Total practice time"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <StatCard
          title="Current Streak"
          value="5 days"
          description="Keep it going"
          icon={<Flame className="h-5 w-5" />}
        />
      </section>

      {/* Quick access */}
      <section className="mt-9">
        <h2 className="text-lg font-bold text-slate-900">Quick Access</h2>

        <p className="mt-1 text-sm text-slate-500">
          Choose what you want to work on today.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            title="Typing Practice"
            description="Build speed and improve accuracy."
            href="/typing-practice"
            icon={<BookOpen className="h-6 w-6" />}
          />

          <FeatureCard
            title="Typing Exams"
            description="Test yourself with timed assessments."
            href="/typing-exams"
            icon={<Award className="h-6 w-6" />}
          />

          <FeatureCard
            title="My Progress"
            description="Review your performance and improvement."
            href="/student-progress"
            icon={<Activity className="h-6 w-6" />}
          />
        </div>
      </section>

      {/* Practice tip banner */}
      <section className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/15 p-3">
            <Target className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Focus on accuracy before speed.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Practice consistently at a comfortable pace to build muscle memory
              and improve your typing speed over time.
            </p>

            <Link
              to="/typing-practice"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold transition hover:text-blue-100"
            >
              Practice now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{value}</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

function FeatureCard({ title, description, href, icon }: FeatureCardProps) {
  return (
    <Link
      to={href}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
    >
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-100">
          {icon}
        </div>

        <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
      </div>

      <h3 className="mt-5 font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
