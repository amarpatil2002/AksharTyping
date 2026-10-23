const states = [
  { code: "MH", name: "Maharashtra", status: "Initial catalog" },
  { code: "UP", name: "Uttar Pradesh", status: "Coming later" },
  { code: "MP", name: "Madhya Pradesh", status: "Coming later" },
];

export function StateExamsPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">State-wise exams</h1>
      <p className="mt-2 text-slate-600">Explore government recruitment preparation by state. Exam availability will be driven by the admin-managed catalog.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {states.map((state) => (
          <article key={state.code} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-blue-700">{state.code}</p>
            <h2 className="mt-2 text-lg font-bold">{state.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{state.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
