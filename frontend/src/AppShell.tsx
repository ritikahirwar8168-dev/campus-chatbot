import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { setToken } from "./api";
import { useAuth } from "./auth";

const links = [
  { to: "/", label: "Overview" },
  { to: "/attendance", label: "Attendance" },
  { to: "/academics", label: "Academics" },
  { to: "/productivity", label: "Productivity" },
  { to: "/assistant", label: "Assistant" },
  { to: "/ai-tools", label: "AI Tools" },
];

export default function AppShell() {
  const { student, setSession } = useAuth();
  const navigate = useNavigate();

  function logout() {
    setToken(null);
    setSession(null, null);
    navigate("/login");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-white/10 bg-ink-900/90 px-5 py-6 lg:border-b-0 lg:border-r">
        <p className="text-xs uppercase tracking-[0.28em] text-brass-400">Campus</p>
        <h1 className="font-display mt-1 text-2xl font-semibold">Copilot</h1>
        <p className="mt-3 text-sm text-moss-400">
          {student?.name}
          <span className="mt-1 block text-xs text-white/50">
            {student?.roll_no} · Sem {student?.semester}
          </span>
        </p>
        <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                  isActive ? "bg-brass-500 text-ink-950" : "text-white/70 hover:bg-white/5"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-8 hidden text-sm text-white/40 hover:text-white lg:block"
        >
          Sign out
        </button>
      </aside>
      <main className="px-4 py-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
