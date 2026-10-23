import { Link } from "react-router-dom";

const practiceOptions = [
  { id: "marathi-basic", title: "Marathi typing practice", language: "Marathi", description: "Practise Marathi typing with a sample passage." },
  { id: "english-basic", title: "English typing practice", language: "English", description: "Build English typing speed and accuracy." },
  { id: "hindi-basic", title: "Hindi typing practice", language: "Hindi", description: "Practise Hindi text input and accuracy." },
];

export function TypingPracticePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">Typing practice</h1>
      <p className="mt-2 text-slate-600">Choose a language to start. These are starter options; connect published passages from the API.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {practiceOptions.map((option) => (
          <article key={option.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{option.language}</p>
            <h2 className="mt-2 font-bold">{option.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{option.description}</p>
            <Link className="mt-5 inline-block text-sm font-semibold text-blue-700" to={`/typing/practice/${option.id}`}>Start practice →</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
