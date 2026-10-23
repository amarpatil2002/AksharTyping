export function AdminDashboardPage() {
  return (
    <section className="max-w-5xl">
      <p className="text-sm font-semibold text-blue-700">ADMINISTRATION</p>
      <h1 className="mt-2 text-3xl font-bold">Admin dashboard</h1>
      <p className="mt-2 text-slate-600">Manage exam catalog, typing passages, marking schemes and publishing workflows.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Exam catalog", "Create and maintain state-wise exam records."],
          ["Typing passages", "Manage language-specific practice content."],
          ["Marking schemes", "Configure and version assessment rules."],
        ].map(([title, description]) => (
          <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p>
          </article>
        ))}
      </div>
      <p className="mt-5 text-xs text-slate-500">Admin APIs and content-management forms still need to be implemented.</p>
    </section>
  );
}
