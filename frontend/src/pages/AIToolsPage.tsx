import { FormEvent, useEffect, useState } from "react";
import {
  api,
  type Flashcard,
  type OllamaHealthResponse,
  type QuizQuestion,
  type Subject,
} from "../api";

type Tab = "priorities" | "summarize" | "quiz" | "flashcards";

export default function AIToolsPage() {
  const [tab, setTab] = useState<Tab>("priorities");
  const [health, setHealth] = useState<OllamaHealthResponse | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    api.aiHealth().then(setHealth).catch(() => setHealth({ ok: false, reason: "unreachable", models: [] }));
    api.attendance().then(setSubjects).catch(() => {});
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "priorities", label: "Daily Priorities" },
    { key: "summarize", label: "Summarize" },
    { key: "quiz", label: "Quiz" },
    { key: "flashcards", label: "Flashcards" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-brass-400">AI Tools</p>
        <h2 className="font-display text-4xl">Powered by Gemma</h2>
        <p className="mt-1 text-sm text-white/50">
          {health?.ok ? (
            <span className="text-moss-400">● Ollama connected</span>
          ) : (
            <span className="text-rust-400">● Ollama offline — fallback mode</span>
          )}
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
              tab === t.key ? "bg-brass-500 text-ink-950" : "text-white/70 hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "priorities" && <PrioritiesPanel />}
      {tab === "summarize" && <SummarizePanel />}
      {tab === "quiz" && <QuizPanel subjects={subjects} />}
      {tab === "flashcards" && <FlashcardsPanel subjects={subjects} />}
    </div>
  );
}

/* ── Daily Priorities ──────────────────────────────────────────── */

function PrioritiesPanel() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedLlm, setUsedLlm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.dailyPriorities();
      setText(res.priorities);
      setUsedLlm(res.used_llm);
    } catch (err) {
      setText(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">Today's Priorities</h3>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full bg-brass-500 px-4 py-2 text-sm font-semibold text-ink-950 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Generate"}
        </button>
      </div>
      {text ? (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-ink-950 p-4 text-sm text-white/85">
          {text}
          {!usedLlm && (
            <p className="mt-3 text-[10px] uppercase tracking-wide text-white/35">rule-based (Ollama offline)</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/40">Click Generate to get your AI-powered daily priority plan.</p>
      )}
    </section>
  );
}

/* ── Summarize ─────────────────────────────────────────────────── */

function SummarizePanel() {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedLlm, setUsedLlm] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await api.summarize(input.trim());
      setSummary(res.summary);
      setUsedLlm(res.used_llm);
    } catch (err) {
      setSummary(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
      <h3 className="font-display text-2xl">Summarize Study Material</h3>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your notes, textbook excerpt, or topic description here…"
          className="min-h-32 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
        />
        <button
          disabled={loading || !input.trim()}
          className="rounded-full bg-brass-500 px-5 py-2 font-semibold text-ink-950 disabled:opacity-50"
        >
          {loading ? "Summarizing…" : "Summarize"}
        </button>
      </form>
      {summary && (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-ink-950 p-4 text-sm text-white/85">
          {summary}
          {!usedLlm && (
            <p className="mt-3 text-[10px] uppercase tracking-wide text-white/35">Ollama offline</p>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Quiz ──────────────────────────────────────────────────────── */

function QuizPanel({ subjects }: { subjects: Subject[] }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setSelected({});
    try {
      const res = await api.quiz(topic.trim(), count, subjectId === "" ? null : subjectId);
      setQuestions(res.questions);
    } catch (err) {
      setQuestions([
        {
          question: err instanceof Error ? err.message : "Failed",
          options: [],
          answer: "",
          explanation: "",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
      <h3 className="font-display text-2xl">Quiz Generator</h3>
      <form onSubmit={generate} className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_160px_auto]">
        <input
          required
          placeholder="Topic (e.g. B+ trees, deadlocks)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
        />
        <input
          type="number"
          min={1}
          max={15}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
          title="Number of questions"
        />
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
        >
          <option value="">Any subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code}
            </option>
          ))}
        </select>
        <button
          disabled={loading}
          className="rounded-full bg-brass-500 px-5 py-2 font-semibold text-ink-950 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </form>

      {questions.length > 0 && (
        <ol className="mt-6 space-y-4">
          {questions.map((q, qi) => (
            <li key={qi} className="rounded-2xl border border-white/10 p-4">
              <p className="font-semibold">
                {qi + 1}. {q.question}
              </p>
              {q.options.length > 0 && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt) => {
                    const picked = selected[qi] === opt;
                    const correct = selected[qi] && opt === q.answer;
                    const wrong = picked && opt !== q.answer;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelected((prev) => ({ ...prev, [qi]: opt }))}
                        className={`rounded-xl border px-3 py-2 text-left text-sm ${
                          correct
                            ? "border-moss-500 bg-moss-500/20 text-moss-400"
                            : wrong
                              ? "border-rust-400 bg-rust-400/20 text-rust-400"
                              : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {selected[qi] && (
                <p className="mt-2 text-sm text-white/55">
                  {selected[qi] === q.answer ? "✓ Correct!" : `✗ Answer: ${q.answer}`}
                  {q.explanation ? ` — ${q.explanation}` : ""}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ── Flashcards ────────────────────────────────────────────────── */

function FlashcardsPanel({ subjects }: { subjects: Subject[] }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setFlipped({});
    try {
      const res = await api.flashcards(topic.trim(), count, subjectId === "" ? null : subjectId);
      setCards(res.cards);
    } catch (err) {
      setCards([
        {
          front: err instanceof Error ? err.message : "Failed",
          back: "Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
      <h3 className="font-display text-2xl">Flashcard Generator</h3>
      <form onSubmit={generate} className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_160px_auto]">
        <input
          required
          placeholder="Topic (e.g. SQL joins, OS scheduling)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
        />
        <input
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
          title="Number of cards"
        />
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
        >
          <option value="">Any subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code}
            </option>
          ))}
        </select>
        <button
          disabled={loading}
          className="rounded-full bg-brass-500 px-5 py-2 font-semibold text-ink-950 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </form>

      {cards.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => setFlipped((prev) => ({ ...prev, [i]: !prev[i] }))}
              className="min-h-36 rounded-2xl border border-white/10 bg-ink-950 p-4 text-left transition-colors hover:border-brass-500/40"
            >
              <p className="text-[10px] uppercase tracking-wide text-white/35">
                {flipped[i] ? "Answer" : "Question"} · tap to flip
              </p>
              <p className="mt-2 text-sm text-white/85">
                {flipped[i] ? card.back : card.front}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
