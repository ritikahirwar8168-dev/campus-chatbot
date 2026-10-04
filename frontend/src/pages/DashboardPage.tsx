import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api, type Action, type Dashboard } from "../api";

function Ring({ value }: { value: number }) {
  return (
    <div
      className="ring-meter grid h-36 w-36 place-items-center rounded-full p-2"
      style={{ ["--pct" as string]: value, ["--ring" as string]: value < 75 ? "#e08a6a" : "#8fbf9a" }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-ink-800">
        <div className="text-center">
          <p className="font-display text-3xl">{value}%</p>
          <p className="text-xs text-white/50">overall</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<string[]>([]);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  async function apply(action: Action) {
    await api.apply(action.type, action.payload);
    setApplied((prev) => [...prev, action.title]);
  }

  if (error) return <p className="text-rust-400">{error}</p>;
  if (!data) return <p className="text-white/50">Loading campus snapshot…</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Today</p>
          <h2 className="font-display text-4xl">Hello, {data.student.name.split(" ")[0]}</h2>
          <p className="text-white/60">{data.student.program}</p>
        </div>
        <Ring value={data.overall_attendance} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Warnings" value={String(data.warning_count)} hint="subjects under 75%" />
        <Stat label="Open tasks" value={String(data.open_tasks)} hint="productivity queue" />
        <Stat
          label="Next exam"
          value={data.upcoming_exams[0] ? `${data.upcoming_exams[0].days_left}d` : "—"}
          hint={data.upcoming_exams[0]?.title ?? "none scheduled"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Personalized actions" to="/assistant">
          <ul className="space-y-3">
            {data.todays_actions.map((action) => (
              <li key={action.title} className="rounded-2xl border border-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{action.title}</p>
                    <p className="text-sm text-white/55">{action.reason}</p>
                  </div>
                  <button
                    onClick={() => apply(action)}
                    disabled={applied.includes(action.title)}
                    className="shrink-0 rounded-full bg-moss-500 px-3 py-1 text-xs text-ink-950 disabled:bg-white/10 disabled:text-white/40"
                  >
                    {applied.includes(action.title) ? "Added" : "Apply"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Deadlines" to="/academics">
          <ul className="space-y-3">
            {data.upcoming_assignments.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  <span className="text-brass-400">{item.subject_code}</span> {item.title}
                </span>
                <span className={item.days_left < 0 ? "text-rust-400" : "text-white/50"}>
                  {item.days_left < 0 ? "overdue" : `${item.days_left}d`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {data.subjects.map((subject) => (
          <div key={subject.id} className="rounded-2xl border border-white/10 bg-ink-800/60 p-4">
            <p className="text-xs text-white/40">{subject.code}</p>
            <p className="mt-1 font-semibold leading-tight">{subject.name}</p>
            <p className={`mt-3 font-display text-2xl ${subject.warning ? "text-rust-400" : "text-moss-400"}`}>
              {subject.percentage}%
            </p>
            <p className="text-xs text-white/40">
              {subject.present}/{subject.total}
              {subject.warning ? ` · need ${subject.classes_to_reach_75}` : ""}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800/70 p-5">
      <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
      <p className="font-display mt-2 text-3xl">{value}</p>
      <p className="text-sm text-white/50">{hint}</p>
    </div>
  );
}

function Card({ title, to, children }: { title: string; to: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-ink-800/70 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl">{title}</h3>
        <Link to={to} className="text-sm text-brass-400">
          Open
        </Link>
      </div>
      {children}
    </div>
  );
}
