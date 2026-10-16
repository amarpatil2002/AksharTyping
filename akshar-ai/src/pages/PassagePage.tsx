import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Check,
  Clock3,
  FileText,
  Filter,
  Play,
  Plus,
  Search,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { usePassages } from "../features/passages/PassageContext";
import type { Difficulty, Passage } from "../features/passages/passageData";

const DURATION_PRESETS = [
  { label: "30 sec", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
];

const CATEGORIES = [
  "All categories",
  "Education",
  "Lifestyle",
  "Productivity",
  "Technology",
  "Custom",
];

const DIFFICULTIES = [
  "All levels",
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) return `${remainder} seconds`;
  if (remainder === 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;

  return `${minutes} min ${remainder} sec`;
}

export default function PassagesPage() {
  const navigate = useNavigate();
  const { passages, addPassage } = usePassages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]>("All levels");

  const [selectedPassageId, setSelectedPassageId] = useState("daily-habits");

  const [duration, setDuration] = useState("60");
  const [customMinutes, setCustomMinutes] = useState("2");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("General");
  const [customDifficulty, setCustomDifficulty] =
    useState<Difficulty>("Beginner");
  const [customText, setCustomText] = useState("");
  const [error, setError] = useState("");

  const selectedPassage =
    passages.find((passage) => passage.id === selectedPassageId) ?? passages[0];

  const durationSeconds =
    duration === "custom"
      ? Math.round((Number(customMinutes) || 0) * 60)
      : Number(duration);

  const filteredPassages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return passages.filter((passage) => {
      const matchesSearch =
        !normalizedSearch ||
        passage.title.toLowerCase().includes(normalizedSearch) ||
        passage.text.toLowerCase().includes(normalizedSearch) ||
        passage.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        category === "All categories" ||
        (category === "Custom"
          ? passage.source === "custom"
          : passage.category === category);

      const matchesDifficulty =
        difficulty === "All levels" || passage.difficulty === difficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [passages, search, category, difficulty]);

  function handleSelectPassage(passage: Passage) {
    setSelectedPassageId(passage.id);
    setError("");
  }

  function handleCreatePassage() {
    const title = customTitle.trim();
    const text = customText.replace(/\s+/g, " ").trim();

    if (!title) {
      setError("Please enter a title for your passage.");
      return;
    }

    if (text.length < 10) {
      setError("Your passage must contain at least 10 characters.");
      return;
    }

    if (text.length > 10000) {
      setError("Your passage cannot exceed 10,000 characters.");
      return;
    }

    const newPassage: Passage = {
      id: `custom-${Date.now()}`,
      title,
      text,
      category: customCategory.trim() || "General",
      difficulty: customDifficulty,
      source: "custom",
    };

    addPassage(newPassage);
    setSelectedPassageId(newPassage.id);
    setCustomTitle("");
    setCustomCategory("General");
    setCustomDifficulty("Beginner");
    setCustomText("");
    setShowCreateForm(false);
    setSearch("");
    setCategory("All categories");
    setDifficulty("All levels");
    setError("");
  }

  async function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) return;

    try {
      if (!file.name.toLowerCase().endsWith(".txt")) {
        setError("Please choose a plain-text .txt file.");
        return;
      }

      if (file.size > 100_000) {
        setError("The file must be 100 KB or smaller.");
        return;
      }

      const text = (await file.text()).replace(/\s+/g, " ").trim();

      if (text.length < 10) {
        setError("The file must contain at least 10 characters.");
        return;
      }

      if (text.length > 10000) {
        setError("Your passage cannot exceed 10,000 characters.");
        return;
      }

      const title = file.name.replace(/\.txt$/i, "");

      const newPassage: Passage = {
        id: `custom-${Date.now()}`,
        title: title || "Imported Passage",
        text,
        category: "General",
        difficulty: "Beginner",
        source: "custom",
      };

      addPassage(newPassage);
      setSelectedPassageId(newPassage.id);
      setSearch("");
      setCategory("All categories");
      setDifficulty("All levels");
      setError("");
    } catch {
      setError("Could not read this file. Please try another .txt file.");
    } finally {
      // Allows the same file to be selected again.
      event.currentTarget.value = "";
    }
  }

  function startPractice() {
    if (!selectedPassage) {
      setError("Select a passage before starting.");
      return;
    }

    if (
      !Number.isFinite(durationSeconds) ||
      durationSeconds < 10 ||
      durationSeconds > 3600
    ) {
      setError("Choose a duration between 10 seconds and 60 minutes.");
      return;
    }

    navigate("/typing", {
      state: {
        passage: selectedPassage,
        durationSeconds,
      },
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <BookOpen size={17} />
            Practice library
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Typing passages
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Pick a passage, choose your time, and improve your typing speed and
            accuracy one session at a time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((open) => !open);
            setError("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {showCreateForm ? <X size={18} /> : <Plus size={18} />}
          {showCreateForm ? "Close form" : "Create passage"}
        </button>
      </section>

      {/* Create custom passage */}
      {showCreateForm && (
        <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Create your own passage
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your passage will be available in this session's library.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Passage title
              <input
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                maxLength={80}
                placeholder="e.g. My daily practice"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Category
              <input
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                maxLength={40}
                placeholder="e.g. General"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Difficulty
              <select
                value={customDifficulty}
                onChange={(event) =>
                  setCustomDifficulty(event.target.value as Difficulty)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Passage text
              <textarea
                value={customText}
                onChange={(event) => setCustomText(event.target.value)}
                maxLength={10000}
                rows={5}
                placeholder="Paste your practice text here..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="block text-right text-xs font-normal text-slate-400">
                {customText.length.toLocaleString()} / 10,000 characters
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreatePassage}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Check size={17} />
              Save passage
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Upload size={17} />
              Import .txt
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </section>
      )}

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_180px]">
          <label className="relative block">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search passages..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as (typeof DIFFICULTIES)[number])
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            aria-label="Filter by difficulty"
          >
            {DIFFICULTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredPassages.length} passages found</span>
          <span>Admin library + your passages</span>
        </div>
      </section>

      {/* Passage selection and duration */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Explore passages
            </h2>
            <span className="text-xs text-slate-400">
              Select one to preview
            </span>
          </div>

          {filteredPassages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Search className="mx-auto mb-3 text-slate-400" size={26} />
              <h3 className="font-semibold text-slate-800">
                No passages found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredPassages.map((passage) => {
                const isSelected = passage.id === selectedPassageId;

                return (
                  <button
                    key={passage.id}
                    type="button"
                    onClick={() => handleSelectPassage(passage)}
                    aria-pressed={isSelected}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <FileText size={19} />
                      </span>

                      {isSelected && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          <Check size={12} />
                          Selected
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900">
                      {passage.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {passage.text}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {passage.category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {passage.difficulty}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {passage.source === "admin" ? "Admin" : "Custom"}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-400">
                      {passage.text.length.toLocaleString()} characters
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected passage preview and duration */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <BookOpen size={17} />
              Selected passage
            </div>

            {selectedPassage ? (
              <>
                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  {selectedPassage.title}
                </h2>

                <p className="mt-2 text-xs text-slate-500">
                  {selectedPassage.difficulty} · {selectedPassage.category}
                </p>

                <div className="mt-4 max-h-52 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-600">
                  {selectedPassage.text}
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  {selectedPassage.text.length.toLocaleString()} characters
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Choose a passage to preview it.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock3 size={18} className="text-blue-600" />
              Practice duration
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              The countdown begins when you type the first character.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => setDuration(String(preset.seconds))}
                  aria-pressed={duration === String(preset.seconds)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    duration === String(preset.seconds)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-blue-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDuration("custom")}
              aria-pressed={duration === "custom"}
              className={`mt-2 w-full rounded-xl border px-3 py-3 text-sm font-semibold ${
                duration === "custom"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-blue-200"
              }`}
            >
              Custom duration
            </button>

            {duration === "custom" && (
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Minutes
                <input
                  type="number"
                  min={1 / 6}
                  max={60}
                  step={1 / 6}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Enter a value from 0.17 to 60 minutes.
                </span>
              </label>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="text-sm text-slate-500">Session time</span>
              <span className="text-sm font-bold text-slate-900">
                {durationSeconds > 0 && durationSeconds <= 3600
                  ? formatDuration(durationSeconds)
                  : "Invalid duration"}
              </span>
            </div>

            {error && !showCreateForm && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={startPractice}
              disabled={!selectedPassage}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play size={17} fill="currentColor" />
              Start Practice
            </button>

            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-400">
              <Zap size={13} />
              Live speed and accuracy tracking
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
