import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api";
import { useAuth } from "../auth";

export default function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("campus");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.login(username, password);
      setToken(result.access_token);
      setSession(result.access_token, result.student);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6">
      <div className="grid w-full gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brass-400">Student demo</p>
          <h1 className="font-display mt-3 text-5xl leading-tight">Campus Copilot</h1>
          <p className="mt-4 max-w-md text-white/70">
            Attendance warnings, an absence simulator, academics, a study plan, and an assistant
            that turns campus context into actions.
          </p>
        </div>
        <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-ink-800/80 p-8 shadow-panel">
          <label className="block text-sm text-white/60">Username</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 outline-none focus:border-brass-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className="mt-4 block text-sm text-white/60">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 outline-none focus:border-brass-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="mt-3 text-sm text-rust-400">{error}</p> : null}
          <button
            disabled={loading}
            className="mt-6 w-full rounded-full bg-brass-500 py-2.5 font-semibold text-ink-950 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Enter campus"}
          </button>
          <p className="mt-4 text-center text-xs text-white/40">demo / campus</p>
        </form>
      </div>
    </div>
  );
}
