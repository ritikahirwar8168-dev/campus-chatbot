import { useEffect, useMemo, useState } from "react";
import { api, type SimulateResult, type Subject } from "../api";

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [absences, setAbsences] = useState(0);
  const [classes, setClasses] = useState(0);
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .attendance()
      .then((rows) => {
        setSubjects(rows);
        setSelected(rows[0]?.id ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const current = useMemo(
    () => subjects.find((s) => s.id === selected) ?? null,
    [subjects, selected],
  );

  useEffect(() => {
    if (!selected) return;
    api
      .simulate(selected, absences, classes)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [selected, absences, classes]);

  if (error) return <p className="text-rust-400">{error}</p>;

  const warnings = subjects.filter((s) => s.warning);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Attendance</p>
        <h2 className="font-display text-4xl">Warnings and simulator</h2>
      </header>

      <section className="rounded-3xl border border-rust-400/30 bg-rust-400/10 p-5">
        <h3 className="font-display text-xl">Below 75%</h3>
        {warnings.length === 0 ? (
          <p className="mt-2 text-white/60">No warnings. Keep showing up.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {warnings.map((subject) => (
              <li key={subject.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {subject.code} · {subject.name}
                </span>
                <span>
                  {subject.percentage}% · attend {subject.classes_to_reach_75} more
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => {
                setSelected(subject.id);
                setAbsences(0);
                setClasses(0);
              }}
              className={`w-full rounded-2xl border px-4 py-4 text-left ${
                selected === subject.id ? "border-brass-500 bg-ink-800" : "border-white/10 bg-ink-800/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40">{subject.code}</p>
                  <p className="font-semibold">{subject.name}</p>
                </div>
                <p className={subject.warning ? "text-rust-400" : "text-moss-400"}>
                  {subject.percentage}%
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className={`h-full ${subject.warning ? "bg-rust-400" : "bg-moss-400"}`}
                  style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                />
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-800/80 p-6">
          <h3 className="font-display text-2xl">Simulator</h3>
          <p className="mt-1 text-sm text-white/55">
            {current ? `${current.code} · currently ${current.present}/${current.total}` : "Pick a subject"}
          </p>
          <label className="mt-6 block text-sm">Extra absences: {absences}</label>
          <input
            type="range"
            min={0}
            max={8}
            value={absences}
            onChange={(e) => setAbsences(Number(e.target.value))}
            className="w-full"
          />
          <label className="mt-4 block text-sm">Extra classes attended: {classes}</label>
          <input
            type="range"
            min={0}
            max={12}
            value={classes}
            onChange={(e) => setClasses(Number(e.target.value))}
            className="w-full"
          />
          {result ? (
            <div className="mt-6 rounded-2xl bg-ink-950 p-4">
              <p className="font-display text-4xl">{result.percentage}%</p>
              <p className={`mt-2 text-sm ${result.warning ? "text-rust-400" : "text-moss-400"}`}>
                {result.warning
                  ? `Still under 75%. Attend ${result.classes_to_reach_75} consecutive classes to recover.`
                  : "You stay above the warning line."}
              </p>
              <p className="mt-2 text-xs text-white/40">
                Simulated {result.present}/{result.total}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
