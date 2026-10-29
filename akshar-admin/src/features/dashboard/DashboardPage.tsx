import {
  FileText,
  Users,
  ClipboardCheck,
  ChartNoAxesCombined,
  ArrowRight,
  Plus,
  Settings2,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    label: "Total Exams",
    value: "—",
    description: "All created exams",
    icon: FileText,
  },
  {
    label: "Total Candidates",
    value: "—",
    description: "Registered candidates",
    icon: Users,
  },
  {
    label: "Exam Attempts",
    value: "—",
    description: "All recorded attempts",
    icon: ClipboardCheck,
  },
  {
    label: "Evaluated Results",
    value: "—",
    description: "Completed evaluations",
    icon: ChartNoAxesCombined,
  },
];

const quickActions = [
  {
    title: "Create typing exam",
    description: "Create a new exam and configure its settings.",
    path: "/admin/exams",
    icon: Plus,
  },
  {
    title: "Manage candidates",
    description: "View candidate records and account information.",
    path: "/admin/candidates",
    icon: Users,
  },
  {
    title: "Review exam results",
    description: "Review submissions and evaluated results.",
    path: "/admin/results",
    icon: ClipboardCheck,
  },
  {
    title: "Exam configurations",
    description: "Manage typing exam settings.",
    path: "/admin/configurations",
    icon: Settings2,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">Administration</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor and manage the Akshar AI typing examination platform.
          </p>
        </div>
      </section>

      {/* Statistics */}
      <section
        aria-label="Platform statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3">
                  <Icon
                    size={21}
                    className="text-blue-600"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">{stat.description}</p>
            </article>
          );
        })}
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Navigate directly to common administration tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.path}
                to={action.path}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="shrink-0 rounded-xl bg-blue-50 p-3 transition group-hover:bg-blue-100">
                  <Icon
                    size={21}
                    className="text-blue-600"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900 transition group-hover:text-blue-700">
                      {action.title}
                    </h3>

                    <ArrowRight
                      size={18}
                      className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Information panel */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900">Examination management</h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Create and publish typing exams, manage candidates, and review
          submitted attempts from your administration workspace.
        </p>
      </section>
    </div>
  );
}
