interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({
  title,
  description = "This page is under development.",
}: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>

      <p className="mt-3 text-slate-600">{description}</p>
    </section>
  );
}
