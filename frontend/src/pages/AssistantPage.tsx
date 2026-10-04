import { FormEvent, useEffect, useRef, useState } from "react";
import { api, type Action } from "../api";

type Bubble = { role: "user" | "assistant"; content: string; actions?: Action[]; used_llm?: boolean };

export default function AssistantPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [messages, setMessages] = useState<Bubble[]>([
    {
      role: "assistant",
      content:
        "I already see your attendance, deadlines, and tasks. Ask about bunking a class, what to study today, or apply an action below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .actions()
      .then(setActions)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function apply(action: Action) {
    await api.apply(action.type, action.payload);
    setApplied((prev) => [...prev, action.title]);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((rows) => [...rows, { role: "user", content: text }]);
    setBusy(true);
    try {
      const result = await api.chat(text, history);
      setMessages((rows) => [
        ...rows,
        { role: "assistant", content: result.reply, actions: result.actions, used_llm: result.used_llm },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex min-h-[70vh] flex-col rounded-3xl border border-white/10 bg-ink-800/70">
        <header className="border-b border-white/10 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.25em] text-brass-400">AI assistant</p>
          <h2 className="font-display text-3xl">Personalized actions</h2>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                  message.role === "user" ? "bg-brass-500 text-ink-950" : "bg-ink-950 text-white/85"
                }`}
              >
                {message.content}
                {message.used_llm === false ? (
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-white/35">rule-based (no API key)</p>
                ) : null}
                {message.actions?.length ? (
                  <div className="mt-3 space-y-2">
                    {message.actions.map((action) => (
                      <button
                        key={action.title}
                        onClick={() => apply(action)}
                        className="block w-full rounded-xl bg-white/10 px-3 py-2 text-left text-xs hover:bg-moss-500 hover:text-ink-950"
                      >
                        {applied.includes(action.title) ? "Added · " : "Apply · "}
                        {action.title}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Can I skip DBMS tomorrow?"
            className="flex-1 rounded-full border border-white/10 bg-ink-950 px-4 py-2"
          />
          <button disabled={busy} className="rounded-full bg-brass-500 px-5 py-2 font-semibold text-ink-950">
            {busy ? "…" : "Send"}
          </button>
        </form>
        {error ? <p className="px-4 pb-4 text-sm text-rust-400">{error}</p> : null}
      </section>

      <aside className="rounded-3xl border border-white/10 bg-ink-800/70 p-5">
        <h3 className="font-display text-2xl">Today</h3>
        <ul className="mt-4 space-y-3">
          {actions.map((action) => (
            <li key={action.title} className="rounded-2xl border border-white/10 p-3">
              <p className="font-semibold">{action.title}</p>
              <p className="text-sm text-white/55">{action.reason}</p>
              <button
                onClick={() => apply(action)}
                className="mt-2 text-xs text-brass-400"
                disabled={applied.includes(action.title)}
              >
                {applied.includes(action.title) ? "Added to tasks" : "Apply action"}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
