## Campus Copilot

> AI-powered academic assistant built with **Ollama + Gemma** — attendance warnings, absence simulator, study-plan generation, quiz & flashcard generation, and a chat assistant that turns campus context into personalised actions.

Built for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).

---

## What it does

| Feature | Type | Description |
|---|---|---|
| **Dashboard** | Deterministic | Attendance ring, warnings, deadlines, apply today's actions |
| **Attendance** | Deterministic | Subject bars, 75% warnings, skip/attend simulator |
| **Academics** | Deterministic | Assignments, exams, notes CRUD |
| **Productivity** | Deterministic | Tasks + study plan ranked by risk and due dates |
| **Assistant** | AI + Fallback | Chat with structured actions (`create_task`, `start_study_block`, `flag_attendance`) |
| **Daily Priorities** | AI + Fallback | Personalised daily academic priority plan |
| **Summarize** | AI | Paste notes → concise bullet-point summary |
| **Quiz Generator** | AI | Pick a topic → interactive MCQs with explanations |
| **Flashcards** | AI | Pick a topic → tap-to-flip Q&A cards |
| **AI Study Plan** | AI + Fallback | AI-enhanced recommendations on top of deterministic plan |

> All AI features fall back to rule-based responses when Ollama is offline. The app is fully functional without a GPU.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | [Gemma 3 4B](https://ai.google.dev/gemma) — Google's open-weight model |
| **Inference** | [Ollama](https://ollama.com) — local inference, OpenAI-compatible API |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com) · SQLAlchemy · SQLite |
| **Frontend** | React 18 · Vite 6 · Tailwind CSS 3 |
| **Auth** | JWT (python-jose + bcrypt) |
| **Deployment** | Render (backend) · Vercel (frontend) |

---

## Demo Login

| Field | Value |
|---|---|
| Username | `demo` |
| Password | `campus` |

Seeded student: **Ritik Sharma**, B.Tech CSE, semester 5 — with 5 subjects, assignments, exams, notes, and tasks.

---

## Run Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com/download) (optional, for AI features)

### 1. Backend (FastAPI, port 8000)

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

SQLite database is created automatically on first boot (`campus_copilot.db`) and filled with demo data.

### 2. Frontend (Vite, port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite proxy forwards `/api` to the backend.

### 3. Ollama + Gemma (optional, for AI features)

```bash
# Install Ollama from https://ollama.com/download
ollama pull gemma3:4b
ollama serve
```

Ollama runs on `http://localhost:11434` by default. The backend connects to it automatically.

> **Without Ollama:** The assistant uses rule-based responses, and AI tools show a fallback message. All other features work normally.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
SECRET_KEY=campus-copilot-demo-secret
DATABASE_URL=sqlite:///./campus_copilot.db

# Ollama / Gemma (primary AI provider)
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=gemma3:4b
OLLAMA_API_KEY=

# Legacy OpenAI-compatible (optional fallback)
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## Project Structure

```
campus-chatbot/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py            # Login, JWT, /me
│   │   │   ├── attendance.py      # Attendance + dashboard + simulator
│   │   │   ├── academics.py       # Assignments, exams, notes CRUD
│   │   │   ├── productivity.py    # Tasks CRUD + study plan
│   │   │   ├── assistant.py       # Chat + actions + apply
│   │   │   └── ai.py              # AI tools: summarize, quiz, flashcards, priorities
│   │   ├── services/
│   │   │   ├── ollama_service.py   # Centralised Ollama/Gemma LLM client
│   │   │   ├── prompts.py          # Prompt templates for each AI feature
│   │   │   ├── assistant.py        # Chat logic (LLM + rule-based fallback)
│   │   │   ├── actions.py          # Recommended actions engine
│   │   │   ├── study_plan.py       # Deterministic study plan builder
│   │   │   ├── attendance_sim.py   # Attendance calculator + simulator
│   │   │   └── context.py          # Student context builder for AI
│   │   ├── auth.py         # JWT + bcrypt auth
│   │   ├── config.py       # Pydantic settings (.env)
│   │   ├── db.py           # SQLAlchemy engine + session
│   │   ├── models.py       # 6 ORM models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── seed.py         # Demo data seeder
│   │   └── main.py         # FastAPI app + lifespan
│   ├── .env.example
│   ├── requirements.txt
│   ├── Procfile            # Render deployment
│   └── render.yaml         # Render blueprint
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AttendancePage.tsx
│   │   │   ├── AcademicsPage.tsx
│   │   │   ├── ProductivityPage.tsx
│   │   │   ├── AssistantPage.tsx
│   │   │   └── AIToolsPage.tsx     # New: Summarize, Quiz, Flashcards, Priorities
│   │   ├── api.ts          # Typed API client + all endpoints
│   │   ├── auth.ts         # Auth context
│   │   ├── App.tsx         # Routes
│   │   ├── AppShell.tsx    # Sidebar layout
│   │   └── main.tsx        # React root
│   ├── vercel.json         # Vercel SPA + API proxy
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Current student |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/attendance` | All subjects with percentages |
| POST | `/api/attendance/simulate` | What-if simulator |
| GET | `/api/dashboard` | Full dashboard snapshot |

### Academics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/academics/assignments` | All assignments |
| PATCH | `/api/academics/assignments/:id` | Toggle status |
| GET | `/api/academics/exams` | All exams |
| GET | `/api/academics/notes` | All notes |
| POST | `/api/academics/notes` | Create note |
| DELETE | `/api/academics/notes/:id` | Delete note |

### Productivity
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/productivity/tasks` | All tasks |
| POST | `/api/productivity/tasks` | Create task |
| PATCH | `/api/productivity/tasks/:id` | Update task |
| DELETE | `/api/productivity/tasks/:id` | Delete task |
| GET | `/api/productivity/study-plan` | Deterministic study plan |

### Assistant
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assistant/actions` | Recommended actions |
| POST | `/api/assistant/chat` | Chat with context |
| POST | `/api/assistant/apply` | Apply action → create task |

### AI Tools (Ollama/Gemma)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/health` | Ollama connectivity check |
| GET | `/api/ai/daily-priorities` | AI daily priority plan |
| POST | `/api/ai/summarize` | Summarize study material |
| POST | `/api/ai/quiz` | Generate MCQ quiz |
| POST | `/api/ai/flashcards` | Generate flashcards |
| GET | `/api/ai/study-plan` | AI-enhanced study plan |

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│   React Frontend    │        │    Ollama Server      │
│   (Vite + Tailwind) │        │    (gemma3:4b)        │
│                     │        │                       │
│  /api/* via proxy   │        │  :11434/v1/chat/      │
└────────┬────────────┘        └──────────┬────────────┘
         │                                │
         │  HTTP                          │  HTTP
         ▼                                │
┌────────────────────────────────────────────────────┐
│              FastAPI Backend                        │
│                                                    │
│  ┌─────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │ Routers │→ │ Services  │→ │ ollama_service.py │─┘
│  └─────────┘  └───────────┘  └──────────────────┘
│       │            │
│       ▼            ▼
│  ┌─────────┐  ┌──────────┐
│  │ Models  │  │ Prompts  │
│  └────┬────┘  └──────────┘
│       │
│       ▼
│  ┌─────────┐
│  │ SQLite  │
│  └─────────┘
└────────────────────────────────────────────────────┘
```

**Key design decisions:**
- AI calls are **never exposed to the frontend** — all go through the backend
- Ollama config lives in **environment variables**, not code
- The AI provider is in a **single service module** (`ollama_service.py`)
- Deterministic logic (attendance math, deadlines) is **never delegated to AI**
- Every AI endpoint has a **graceful fallback** when Ollama is offline

---
