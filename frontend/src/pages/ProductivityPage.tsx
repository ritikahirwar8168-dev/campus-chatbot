import { FormEvent, useEffect, useState } from "react";
import { api, type StudyBlock, type Subject, type Task } from "../api";

export default function ProductivityPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<StudyBlock[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [error, setError] = useState("");

  async function load() {
    const [t, p, s] = await Promise.all([api.tasks(), api.studyPlan(), api.attendance()]);
    setTasks(t);
    setPlan(p);
    setSubjects(s);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function addTask(event: FormEvent) {
    event.preventDefault();
    const task = await api.createTask({
      title,
      due_date: due || null,
      subject_id: subjectId === "" ? null : Number(subjectId),
    });
    setTasks((rows) => [task, ...rows]);
    setTitle("");
    setDue("");
  }

  async function toggle(task: Task) {
    const updated = await api.patchTask(task.id, { done: !task.done });
    setTasks((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
  }

  async function remove(id: number) {
    await api.deleteTask(id);
    setTasks((rows) => rows.filter((row) => row.id !== id));
  }

  if (error) return <p className="text-rust-400">{error}</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Productivity</p>
        <h2 className="font-display text-4xl">Tasks and study plan</h2>
      </header>

      <form onSubmit={addTask} className="grid gap-3 rounded-3xl border border-white/10 bg-ink-800/70 p-5 md:grid-cols-4">
        <input
          required
          placeholder="New task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2 md:col-span-2"
        />
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
        >
          <option value="">No subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.code}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
        />
        <button className="rounded-full bg-brass-500 py-2 font-semibold text-ink-950 md:col-span-4">Add task</button>
      </form>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
          <h3 className="font-display text-2xl">Task list</h3>
          <ul className="mt-4 space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-3 py-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={task.done} onChange={() => toggle(task)} />
                  <span className={task.done ? "text-white/40 line-through" : ""}>
                    {task.title}
                    <span className="ml-2 text-xs text-white/35">
                      {task.subject_code ?? "general"}
                      {task.due_date ? ` · ${task.due_date}` : ""}
                      {task.source === "assistant" ? " · copilot" : ""}
                    </span>
                  </span>
                </label>
                <button onClick={() => remove(task.id)} className="text-xs text-white/30 hover:text-rust-400">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
          <h3 className="font-display text-2xl">Study plan</h3>
          <p className="text-sm text-white/50">Ranked from attendance risk, overdue work, and exams.</p>
          <ol className="mt-4 space-y-3">
            {plan.map((block, index) => (
              <li key={`${block.title}-${index}`} className="rounded-2xl border border-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    {index + 1}. {block.title}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      block.priority === "high" ? "bg-rust-400/20 text-rust-400" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {block.priority} · {block.minutes}m
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/55">{block.reason}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
