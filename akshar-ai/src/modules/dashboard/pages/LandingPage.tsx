import { Link } from "react-router-dom";

const features = [
  { title: "Typing practice", description: "Improve speed and accuracy with structured typing sessions.", to: "/typing/practice" },
  { title: "Typing exams", description: "Practise using configurable exam-style typing tests.", to: "/typing/exams" },
  { title: "State-wise exams", description: "Explore exam preparation by state and recruiting authority.", to: "/state-exams" },
];

export function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <div className="max-w-3xl">
        <p className="font-semibold text-blue-700">Learn · Practise · Improve</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Prepare with confidence.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Typing practice and structured exam preparation for students across India.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/signup" className="primary-button">Get started</Link>
          <Link to="/typing/practice" className="secondary-button">Explore typing practice</Link>
        </div>
      </div>
      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            <Link className="mt-5 inline-block text-sm font-semibold text-blue-700" to={feature.to}>Explore →</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
