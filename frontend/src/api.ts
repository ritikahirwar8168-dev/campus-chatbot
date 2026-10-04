export type Student = {
  id: number;
  username: string;
  name: string;
  program: string;
  semester: number;
  roll_no: string;
};

export type Subject = {
  id: number;
  code: string;
  name: string;
  present: number;
  total: number;
  percentage: number;
  warning: boolean;
  classes_to_reach_75: number;
};

export type SimulateResult = Subject & {
  extra_absences: number;
  extra_classes: number;
};

export type Assignment = {
  id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  days_left: number;
};

export type Exam = {
  id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  title: string;
  exam_date: string;
  venue: string;
  days_left: number;
};

export type Note = {
  id: number;
  subject_id: number | null;
  subject_code: string | null;
  subject_name: string | null;
  title: string;
  body: string;
  created_at: string;
};

export type Task = {
  id: number;
  subject_id: number | null;
  subject_code: string | null;
  subject_name: string | null;
  title: string;
  due_date: string | null;
  done: boolean;
  source: string;
};

export type StudyBlock = {
  title: string;
  reason: string;
  priority: string;
  subject_code: string | null;
  due_date: string | null;
  kind: string;
  minutes: number;
};

export type Action = {
  type: string;
  title: string;
  reason: string;
  payload: Record<string, unknown>;
};

export type Dashboard = {
  student: Student;
  overall_attendance: number;
  warning_count: number;
  upcoming_assignments: Assignment[];
  upcoming_exams: Exam[];
  open_tasks: number;
  todays_actions: Action[];
  subjects: Subject[];
};

export type ChatResponse = {
  reply: string;
  actions: Action[];
  used_llm: boolean;
};

// ── AI feature types ──────────────────────────────────────────────

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type QuizResponse = {
  questions: QuizQuestion[];
  used_llm: boolean;
};

export type Flashcard = {
  front: string;
  back: string;
};

export type FlashcardResponse = {
  cards: Flashcard[];
  used_llm: boolean;
};

export type SummarizeResponse = {
  summary: string;
  used_llm: boolean;
};

export type DailyPrioritiesResponse = {
  priorities: string;
  used_llm: boolean;
};

export type AIStudyPlanResponse = {
  recommendations: string;
  used_llm: boolean;
};

export type OllamaHealthResponse = {
  ok: boolean;
  reason: string;
  models: unknown[];
};

const TOKEN_KEY = "campus_copilot_token";
const BASE = import.meta.env.VITE_API_URL ?? "";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (response.status === 401) {
    setToken(null);
    throw new Error("Please sign in again.");
  }
  if (!response.ok) {
    let detail = "Request failed";
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string; student: Student }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  dashboard: () => request<Dashboard>("/api/dashboard"),
  attendance: () => request<Subject[]>("/api/attendance"),
  simulate: (subject_id: number, extra_absences: number, extra_classes: number) =>
    request<SimulateResult>("/api/attendance/simulate", {
      method: "POST",
      body: JSON.stringify({ subject_id, extra_absences, extra_classes }),
    }),
  assignments: () => request<Assignment[]>("/api/academics/assignments"),
  patchAssignment: (id: number, status: string) =>
    request<Assignment>(`/api/academics/assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  exams: () => request<Exam[]>("/api/academics/exams"),
  notes: () => request<Note[]>("/api/academics/notes"),
  createNote: (payload: { subject_id: number | null; title: string; body: string }) =>
    request<Note>("/api/academics/notes", { method: "POST", body: JSON.stringify(payload) }),
  deleteNote: (id: number) => request<{ ok: boolean }>(`/api/academics/notes/${id}`, { method: "DELETE" }),
  tasks: () => request<Task[]>("/api/productivity/tasks"),
  createTask: (payload: { title: string; subject_id: number | null; due_date: string | null }) =>
    request<Task>("/api/productivity/tasks", { method: "POST", body: JSON.stringify(payload) }),
  patchTask: (id: number, payload: Partial<Task>) =>
    request<Task>(`/api/productivity/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTask: (id: number) => request<{ ok: boolean }>(`/api/productivity/tasks/${id}`, { method: "DELETE" }),
  studyPlan: () => request<StudyBlock[]>("/api/productivity/study-plan"),
  actions: () => request<Action[]>("/api/assistant/actions"),
  chat: (message: string, history: { role: string; content: string }[]) =>
    request<ChatResponse>("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  apply: (type: string, payload: Record<string, unknown>) =>
    request<Task>("/api/assistant/apply", { method: "POST", body: JSON.stringify({ type, payload }) }),

  // ── AI features ──
  aiHealth: () => request<OllamaHealthResponse>("/api/ai/health"),
  dailyPriorities: () => request<DailyPrioritiesResponse>("/api/ai/daily-priorities"),
  summarize: (text: string, subject_id?: number | null) =>
    request<SummarizeResponse>("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ text, subject_id: subject_id ?? null }),
    }),
  quiz: (topic: string, count: number = 5, subject_id?: number | null) =>
    request<QuizResponse>("/api/ai/quiz", {
      method: "POST",
      body: JSON.stringify({ topic, count, subject_id: subject_id ?? null }),
    }),
  flashcards: (topic: string, count: number = 8, subject_id?: number | null) =>
    request<FlashcardResponse>("/api/ai/flashcards", {
      method: "POST",
      body: JSON.stringify({ topic, count, subject_id: subject_id ?? null }),
    }),
  aiStudyPlan: () => request<AIStudyPlanResponse>("/api/ai/study-plan"),
};

