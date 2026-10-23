import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const passages: Record<string, string> = {
  "marathi-basic": "महाराष्ट्र हे भारतातील एक महत्त्वाचे राज्य आहे. शिक्षण, प्रशासन आणि तंत्रज्ञानाच्या क्षेत्रात संगणकाचा वापर वाढत आहे.",
  "english-basic": "Consistent practice helps students improve typing speed, accuracy, focus, and confidence over time.",
  "hindi-basic": "नियमित अभ्यास से विद्यार्थियों की टाइपिंग गति, सटीकता और आत्मविश्वास में सुधार होता है।",
};

export function TypingSessionPage() {
  const { passageId = "" } = useParams();
  const passage = passages[passageId] ?? passages["english-basic"];
  const [typedText, setTypedText] = useState("");
  const correctChars = [...typedText].filter((char, index) => char === [...passage][index]).length;
  const accuracy = typedText.length ? Math.round((correctChars / typedText.length) * 100) : 100;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/typing/practice" className="text-sm font-semibold text-blue-700">← Back to passages</Link>
      <h1 className="mt-4 text-3xl font-bold">Typing practice</h1>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference passage</p>
        <p className="mt-3 whitespace-pre-wrap text-lg leading-8">{passage}</p>
      </div>
      <label className="mt-5 block font-semibold">Type the passage here
        <textarea className="form-input mt-2 min-h-40" value={typedText} onChange={(e) => setTypedText(e.target.value)} placeholder="Start typing…" />
      </label>
      <div className="mt-4 flex gap-3">
        <div className="stat-card"><p className="text-xs text-slate-500">Accuracy</p><p className="text-2xl font-bold">{accuracy}%</p></div>
        <div className="stat-card"><p className="text-xs text-slate-500">Characters typed</p><p className="text-2xl font-bold">{[...typedText].length}</p></div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Starter demo only: no timer, official scoring, persistence or server evaluation is implemented yet.</p>
    </div>
  );
}
