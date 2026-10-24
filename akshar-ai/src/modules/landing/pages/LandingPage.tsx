import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  Languages,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Gauge,
    title: "Improve typing speed",
    description:
      "Build speed through focused practice sessions and measure your words per minute over time.",
  },
  {
    icon: Target,
    title: "Increase accuracy",
    description:
      "Identify mistakes, improve consistency, and learn to type with confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Prepare for exams",
    description:
      "Practice with timed passages and build the skills you need for typing examinations.",
  },
  {
    icon: TrendingUp,
    title: "Track your progress",
    description:
      "Follow your typing speed, accuracy, and practice history as your skills improve.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose your practice",
    description:
      "Select a passage, language, difficulty, and duration that suit your goals.",
  },
  {
    number: "02",
    title: "Start typing",
    description:
      "Practice against the clock while keeping an eye on speed and accuracy.",
  },
  {
    number: "03",
    title: "Review and improve",
    description:
      "Review your results and keep practicing to improve your performance.",
  },
];

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm shadow-blue-200">
        अ
      </span>
      <span className="text-xl font-bold tracking-tight text-slate-950">
        Akshar<span className="text-blue-600"> AI</span>
      </span>
    </Link>
  );
}

function TypingPreview() {
  const text = "Practice makes progress.";
  const typed = "Practice makes";
  const correct = typed.length;

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-5 rounded-[2.5rem] bg-blue-100/70 blur-3xl" />

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Typing practice
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Beginner · English</p>
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Practice mode
          </span>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock3 size={16} />
              Time remaining
            </div>
            <span className="font-mono text-lg font-bold text-slate-900">
              01:24
            </span>
          </div>

          <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[38%] rounded-full bg-blue-600" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Type the passage below
            </p>

            <p className="text-xl leading-9 tracking-wide sm:text-2xl">
              <span className="text-emerald-600">{typed}</span>
              <span className="relative text-slate-400">
                <span className="absolute -left-px top-1 h-7 w-0.5 animate-pulse bg-blue-600" />
                {" makes".slice(0, 0)}
                {text.slice(correct)}
              </span>
            </p>

            <p className="mt-4 text-xs text-slate-400">
              Interactive practice preview
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Zap size={14} className="text-blue-600" />
                Speed
              </div>
              <p className="text-2xl font-bold text-slate-950">
                42{" "}
                <span className="text-xs font-medium text-slate-400">WPM</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Target size={14} className="text-emerald-600" />
                Accuracy
              </div>
              <p className="text-2xl font-bold text-slate-950">
                96<span className="text-base">%</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Flame size={14} className="text-orange-500" />
                Streak
              </div>
              <p className="text-2xl font-bold text-slate-950">
                7{" "}
                <span className="text-xs font-medium text-slate-400">days</span>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Illustrative preview · Sample statistics
          </p>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Check size={21} />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">Keep improving</p>
          <p className="text-xs text-slate-500">Every practice counts</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Logo />

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              How it works
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Exam practice
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:px-5"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -right-32 -top-24 size-[450px] rounded-full bg-blue-100/60 blur-[100px]" />
          <div className="absolute -left-40 top-72 size-[350px] rounded-full bg-indigo-50 blur-[90px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-14 lg:px-12 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 sm:text-sm">
              <Zap size={15} />
              Your journey to better typing starts here
              <ChevronRight size={14} />
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Every keystroke takes you{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                forward.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Build your typing speed, improve accuracy, and prepare for typing
              exams with focused practice designed around your goals.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Start practicing for free
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/login"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                Practice at your pace
              </span>
              <span className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                Track your progress
              </span>
            </div>
          </div>

          <div className="px-1 py-3 sm:px-4 lg:px-0">
            <TypingPreview />
          </div>
        </div>
      </section>

      {/* Language strip */}
      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-5 py-7 sm:flex-row sm:gap-8 sm:px-8 lg:px-12">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Languages size={18} className="text-blue-600" />
            Practice for your goals
          </span>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              English
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              हिंदी
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              मराठी
            </span>
          </div>

          <span className="text-xs text-slate-400">
            Language availability depends on implemented practice content.
          </span>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Everything you need
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Practice with purpose.
              <br className="hidden sm:block" /> Improve with confidence.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Build good habits with tools that help you understand your
              performance and focus on what matters.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Simple by design
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Small steps.
                <br />
                Stronger typing.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-slate-600">
                Consistent practice makes it easier to build speed and accuracy.
                Start where you are and work toward your target.
              </p>

              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Start your journey
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="space-y-4">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:gap-6 sm:p-7"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    {step.number}
                  </span>

                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-blue-600 px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full border-[50px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-36 -left-20 size-80 rounded-full border-[50px] border-white/5" />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-blue-50">
              <Zap size={16} />
              Your next step starts today
            </span>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to become a better typist?
            </h2>

            <p className="mx-auto mt-5 max-w-xl leading-7 text-blue-100">
              Create your account, choose your first passage, and start building
              a skill that grows with every session.
            </p>

            <Link
              to="/login"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Get started with Akshar AI
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Logo />

          <p className="text-center text-sm text-slate-500">
            Practice consistently. Improve every day.
          </p>

          <div className="flex items-center gap-5 text-sm text-slate-500">
            <Link to="/login" className="transition hover:text-blue-600">
              Log in
            </Link>
            <Link to="/signup" className="transition hover:text-blue-600">
              Sign up
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-7xl text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Akshar AI. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
