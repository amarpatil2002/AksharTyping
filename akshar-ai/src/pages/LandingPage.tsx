import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  BrainCircuit,
  Check,
  CirclePlay,
  Clock3,
  Flame,
  Gauge,
  Globe2,
  Keyboard,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Keyboard,
    title: "Smart typing practice",
    description:
      "Practice with structured passages and focus on accuracy before building speed.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: BrainCircuit,
    title: "AI-powered coaching",
    description:
      "Discover recurring mistakes and get actionable suggestions to improve.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: TrendingUp,
    title: "Track your progress",
    description:
      "Follow your words per minute, accuracy, consistency, and learning progress.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const steps = [
  {
    number: "01",
    title: "Take a typing test",
    description:
      "Start with a short passage to understand your current speed and accuracy.",
  },
  {
    number: "02",
    title: "Practice with purpose",
    description:
      "Build consistency with focused exercises designed around your skill level.",
  },
  {
    number: "03",
    title: "Improve with insights",
    description:
      "Review your results, identify mistakes, and work on your weak areas.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function TypingPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-5 rounded-[2rem] bg-blue-100/70 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-950/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Keyboard size={21} />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">Typing session</p>
              <p className="mt-0.5 text-xs text-slate-500">
                English · Beginner
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Practice mode
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <div className="px-4 py-5 text-center">
            <p className="text-xs font-medium text-slate-500">Speed</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              42 <span className="text-xs font-medium text-slate-500">WPM</span>
            </p>
          </div>

          <div className="px-4 py-5 text-center">
            <p className="text-xs font-medium text-slate-500">Accuracy</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">96%</p>
          </div>

          <div className="px-4 py-5 text-center">
            <p className="text-xs font-medium text-slate-500">Time</p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-2xl font-bold text-slate-950">
              <Clock3 size={17} className="text-slate-400" />
              01:24
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Your practice passage
            </p>
            <span className="text-xs text-slate-400">Sample preview</span>
          </div>

          <p className="text-base leading-8 sm:text-lg sm:leading-9">
            <span className="text-slate-400">
              Consistent practice helps you develop better typing habits and
              improve your confidence.
            </span>
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
            <Sparkles size={18} className="shrink-0 text-blue-600" />
            <p className="text-sm leading-6 text-blue-800">
              <span className="font-semibold">Practice tip:</span> Aim for
              accuracy first. Speed will follow.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs text-slate-500">Illustrative preview</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <AudioLines size={16} />
              Focus mode
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
          <Flame size={20} />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">Build your streak</p>
          <p className="text-xs text-slate-500">One session at a time</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white">
        <div className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-12 lg:py-28">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <Sparkles size={16} />A smarter way to practice typing
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Type better.
              <br />
              Learn faster.
              <br />
              <span className="text-blue-600">Grow every day.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Improve your typing speed and accuracy with focused practice,
              personalized AI coaching, and progress insights that help you move
              forward.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#get-started"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start practicing
                <ArrowRight size={18} />
              </a>

              <a
                href="#features"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <CirclePlay size={18} />
                Explore features
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                Practice at your pace
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                Progress insights
              </span>
            </div>
          </div>

          <TypingPreview />
        </div>

        <div className="pb-8 text-center">
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 transition hover:text-blue-600"
          >
            Discover Akshar AI
            <ArrowDown size={14} />
          </a>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Built for improvement"
            title="Everything you need to type with confidence"
            description="A focused learning experience that combines practical exercises, helpful feedback, and measurable progress."
          />

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5 sm:p-8"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}
                  >
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>

                  <a
                    href="#how-it-works"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3"
                  >
                    Learn more
                    <ArrowRight size={16} />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/80 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="A simple process"
            title="Small practice sessions. Real progress."
            description="Build a sustainable typing habit with a clear process that helps you understand what to improve next."
          />

          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <article key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-14 top-7 hidden h-px w-[calc(100%-2rem)] bg-blue-200 md:block" />
                )}

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-lg font-bold text-blue-600 shadow-sm">
                  {step.number}
                </div>

                <h3 className="mt-6 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section
        id="languages"
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Learn in your language
            </p>

            <h2 className="max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Build typing skills, one language at a time.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              Start practicing in English, with Marathi and Hindi support
              planned for future releases. Our goal is to make typing practice
              accessible to more learners.
            </p>

            <div className="mt-7 flex items-center gap-3 text-sm font-medium text-slate-600">
              <Globe2 size={19} className="text-blue-600" />
              More language options can be added as the platform grows.
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Available first
              </span>
              <p className="mt-5 text-2xl font-bold text-slate-950">English</p>
              <p className="mt-2 text-sm text-slate-600">
                Start building your skills
              </p>
              <Check size={20} className="mt-5 text-blue-600" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Planned
              </span>
              <p className="mt-5 text-2xl font-bold text-slate-950">मराठी</p>
              <p className="mt-2 text-sm text-slate-600">Marathi typing</p>
              <Clock3 size={20} className="mt-5 text-slate-400" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Planned
              </span>
              <p className="mt-5 text-2xl font-bold text-slate-950">हिन्दी</p>
              <p className="mt-2 text-sm text-slate-600">Hindi typing</p>
              <Clock3 size={20} className="mt-5 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="get-started"
        className="scroll-mt-24 px-5 pb-20 sm:px-8 sm:pb-24"
      >
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-blue-600 px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[40px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-36 -left-16 h-72 w-72 rounded-full border-[40px] border-white/10" />

          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Zap size={25} />
            </div>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your next improvement starts with practice.
            </h2>

            <p className="mt-4 text-base leading-7 text-blue-100">
              Build better habits, understand your progress, and work toward
              your personal typing goals.
            </p>

            <a
              href="/signup"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get started with Akshar AI
              <ArrowRight size={18} />
            </a>

            <p className="mt-4 text-xs text-blue-100">
              Sign-up functionality will be connected when authentication is
              implemented.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
