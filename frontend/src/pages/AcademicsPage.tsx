import { FormEvent, useEffect, useState } from "react";
import { api, type Assignment, type Exam, type Note, type Subject } from "../api";

export default function AcademicsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [error, setError] = useState("");

  async function load() {
    const [a, e, n, s] = await Promise.all([api.assignments(), api.exams(), api.notes(), api.attendance()]);
    setAssignments(a);
    setExams(e);
    setNotes(n);
    setSubjects(s);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function toggle(item: Assignment) {
    const next = item.status === "done" ? "pending" : "done";
    const updated = await api.patchAssignment(item.id, next);
    setAssignments((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    const note = await api.createNote({
      title,
      body,
      subject_id: subjectId === "" ? null : Number(subjectId),
    });
    setNotes((rows) => [note, ...rows]);
    setTitle("");
    setBody("");
  }

  async function removeNote(id: number) {
    await api.deleteNote(id);
    setNotes((rows) => rows.filter((row) => row.id !== id));
  }

  if (error) return <p className="text-rust-400">{error}</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Academics</p>
        <h2 className="font-display text-4xl">Assignments, exams, notes</h2>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
          <h3 className="font-display text-2xl">Assignments</h3>
          <ul className="mt-4 space-y-3">
            {assignments.map((item) => (
              <li key={item.id} className="rounded-2xl border border-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-brass-400">{item.subject_code}</p>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-white/55">{item.description}</p>
                    <p className={`mt-1 text-xs ${item.days_left < 0 ? "text-rust-400" : "text-white/40"}`}>
                      {item.days_left < 0 ? `Overdue by ${-item.days_left}d` : `Due in ${item.days_left}d`} · {item.due_date}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(item)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      item.status === "done" ? "bg-moss-500 text-ink-950" : "bg-white/10"
                    }`}
                  >
                    {item.status === "done" ? "Done" : "Pending"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
          <h3 className="font-display text-2xl">Exams</h3>
          <ul className="mt-4 space-y-3">
            {exams.map((item) => (
              <li key={item.id} className="flex justify-between rounded-2xl border border-white/10 p-3">
                <div>
                  <p className="text-xs text-brass-400">{item.subject_code}</p>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-white/50">{item.venue}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl">{item.days_left}d</p>
                  <p className="text-xs text-white/40">{item.exam_date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
        <h3 className="font-display text-2xl">Notes</h3>
        <form onSubmit={addNote} className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_auto]">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
          >
            <option value="">General</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
          />
          <button className="rounded-full bg-brass-500 px-4 py-2 text-sm font-semibold text-ink-950">Save note</button>
          <textarea
            placeholder="Details"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="md:col-span-3 min-h-24 rounded-xl border border-white/10 bg-ink-950 px-3 py-2"
          />
        </form>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-2xl border border-white/10 p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-white/40">{note.subject_code ?? "General"}</p>
                  <p className="font-semibold">{note.title}</p>
                </div>
                <button onClick={() => removeNote(note.id)} className="text-xs text-white/30 hover:text-rust-400">
                  Delete
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">{note.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
