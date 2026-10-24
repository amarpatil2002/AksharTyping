import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  Languages,
  Menu,
  ShieldCheck,
  Target,
  TrendingUp,
  X,
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
    <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm shadow-blue-200 sm:size-10">
        अ
      </span>

      <span className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
        Akshar<span className="text-blue-600"> AI</span>
      </span>
    </Link>
  );
}

function TypingPreview() {
  const text = "Practice makes progress.";
  const typed = "Practice makes";

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-3 rounded-[2rem] bg-blue-100/70 blur-3xl sm:-inset-5 sm:rounded-[2.5rem]" />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 sm:rounded-3xl sm:shadow-2xl">
        {/* Preview header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:px-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Typing practice
            </p>

            <p className="mt-0.5 text-xs text-slate-500">Beginner · English</p>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Practice mode
          </span>
        </div>

        <div className="p-4 sm:p-7">
          {/* Timer */}
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock3 size={16} />
              Time remaining
            </div>

            <span className="font-mono text-lg font-bold text-slate-900">
              01:24
            </span>
          </div>

          {/* Progress */}
          <div
            className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100 sm:mb-5"
            role="progressbar"
            aria-label="Practice progress"
            aria-valuenow={38}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full w-[38%] rounded-full bg-blue-600" />
          </div>

          {/* Passage */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 min-[420px]:rounded-2xl min-[420px]:p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Type the passage below
            </p>

            <p className="break-words text-lg leading-8 tracking-wide sm:text-2xl sm:leading-9">
              <span className="text-emerald-600">{typed}</span>
              <span className="relative text-slate-400">
                <span className="absolute -left-px top-1 h-6 w-0.5 animate-pulse bg-blue-600 sm:h-7" />
                {text.slice(typed.length)}
              </span>
            </p>

            <p className="mt-4 text-xs text-slate-400">
              Interactive practice preview
            </p>
          </div>

          {/* Statistics */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
            <div className="min-w-0 rounded-xl border border-slate-100 p-2.5 min-[420px]:p-3 sm:rounded-2xl sm:p-4">
              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Zap size={14} className="shrink-0 text-blue-600" />
                Speed
              </div>

              <p className="text-xl font-bold text-slate-950 min-[420px]:text-2xl">
                42{" "}
                <span className="text-xs font-medium text-slate-400">WPM</span>
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-100 p-2.5 min-[420px]:p-3 sm:rounded-2xl sm:p-4">
              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Target size={14} className="shrink-0 text-emerald-600" />
                Accuracy
              </div>

              <p className="text-xl font-bold text-slate-950 min-[420px]:text-2xl">
                96<span className="text-base">%</span>
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-100 p-2.5 min-[420px]:p-3 sm:rounded-2xl sm:p-4">
              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Flame size={14} className="shrink-0 text-orange-500" />
                Streak
              </div>

              <p className="text-xl font-bold text-slate-950 min-[420px]:text-2xl">
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

      {/* Floating card */}
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:min-h-[76px] sm:px-8 lg:px-12">
          <Logo />

          {/* Desktop navigation */}
          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
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

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 sm:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </nav>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg sm:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a
                href="#features"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                How it works
              </a>

              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                Exam practice
              </Link>

              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  onClick={closeMobileMenu}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Get started
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-32 -top-24 size-[300px] rounded-full bg-blue-100/60 blur-[80px] sm:size-[450px] sm:blur-[100px]" />
          <div className="absolute -left-40 top-72 size-[300px] rounded-full bg-blue-50 blur-[80px] sm:size-[350px] sm:blur-[90px]" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 sm:gap-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:px-12 lg:py-24">
          <div className="min-w-0">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-blue-700 sm:mb-7 sm:px-3.5 sm:text-sm">
              <Zap size={15} className="shrink-0" />
              <span>Your journey to better typing starts here</span>
              <ChevronRight size={14} className="shrink-0" />
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 min-[420px]:text-5xl sm:text-6xl lg:text-7xl">
              Every keystroke takes you{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                forward.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:mt-7 sm:text-lg sm:leading-8">
              Build your typing speed, improve accuracy, and prepare for typing
              exams with focused practice designed around your goals.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[480px]:flex-row sm:mt-9">
              <Link
                to="/signup"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 min-[480px]:w-auto sm:px-6"
              >
                Start practicing for free
                <ArrowRight size={18} className="shrink-0" />
              </Link>

              <Link
                to="/login"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 min-[480px]:w-auto sm:px-6"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-emerald-600" />
                Practice at your pace
              </span>

              <span className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-emerald-600" />
                Track your progress
              </span>
            </div>
          </div>

          <div className="min-w-0 px-1 py-3 sm:px-4 lg:px-0">
            <TypingPreview />
          </div>
        </div>
      </section>

      {/* Language strip */}
      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 py-7 sm:flex-row sm:flex-wrap sm:gap-6 sm:px-8 lg:gap-8 lg:px-12">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Languages size={18} className="shrink-0 text-blue-600" />
            Practice for your goals
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
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

          <span className="max-w-xl text-center text-xs leading-5 text-slate-400 sm:basis-full lg:basis-auto">
            Language availability depends on implemented practice content.
          </span>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
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

          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 sm:p-6"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-950 sm:mt-6">
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
        className="scroll-mt-24 bg-slate-50 px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
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
                to="/signup"
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
                  className="flex min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:gap-6 sm:p-7"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 sm:size-12">
                    {step.number}
                  </span>

                  <div className="min-w-0">
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

      {/* Call to action */}
      <section className="px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-blue-600 px-5 py-12 text-center sm:rounded-3xl sm:px-12 sm:py-16">
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
              to="/signup"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-center text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 sm:px-6"
            >
              Get started with Akshar AI
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <Logo />

          <p className="text-sm text-slate-500">
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
