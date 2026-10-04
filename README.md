# Campus Copilot

AI-powered academic assistant built with **Ollama + Gemma** — attendance warnings, absence simulation, study-plan generation, quiz & flashcard generation, and a chat assistant that turns campus context into personalised actions.

🚀 **Live Demo:** [campus-copilot on Vercel](https://campus-chatbot-kbkdt49ms-ritikahirwar8168-dev.vercel.app)
🔧 **Backend API:** [campus-copilot-api on Render](https://campus-chatbot-bzk0.onrender.com)

Built for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).

---

## What it does

| Feature | Type | Description |
|---|---|---|
| **Dashboard** | Deterministic | Attendance ring, warnings, deadlines, and today's recommended actions |
| **Attendance** | Deterministic | Subject bars, 75% warnings, and skip/attend simulator |
| **Academics** | Deterministic | Assignments, exams, and notes CRUD |
| **Productivity** | Deterministic | Tasks + study plan ranked by risk and due dates |
| **Assistant** | AI + Fallback | Chat with structured actions (`create_task`, `start_study_block`, `flag_attendance`) |
| **Daily Priorities** | AI + Fallback | Personalised daily academic priority plan |
| **Summarize** | AI | Paste notes → concise bullet-point summary |
| **Quiz Generator** | AI | Pick a topic → interactive MCQs with explanations |
| **Flashcards** | AI | Pick a topic → tap-to-flip Q&A cards |
| **AI Study Plan** | AI + Fallback | AI-enhanced recommendations on top of the deterministic plan |

> All AI features fall back to rule-based responses when Ollama is offline. The app remains functional without a GPU.

---

## Demo

### Demo Login

| Field | Value |
|---|---|
| Username | `demo` |
| Password | `campus` |

Seeded student: **Ritik Sharma**, B.Tech CSE, semester 5 — with 5 subjects, assignments, exams, notes, and tasks.

### Live Application

- **Frontend:** https://campus-chatbot-kbkdt49ms-ritikahirwar8168-dev.vercel.app
- **Backend:** https://campus-chatbot-bzk0.onrender.com

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

## Deployment

### Backend → Render

The FastAPI backend is deployed on **Render**.

| Setting | Value |
|---|---|
| Repository | `ritikahirwar8168-dev/campus-chatbot` |
| Branch | `main` |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Compute | Render Free instance for the demo deployment |

Production environment variables:

```env
SECRET_KEY=<your-secure-secret>
OLLAMA_ENABLED=false
CORS_ORIGINS=https://campus-chatbot-kbkdt49ms-ritikahirwar8168-dev.vercel.app
```

**Backend URL:** https://campus-chatbot-bzk0.onrender.com

### Frontend → Vercel

The React/Vite frontend is deployed on **Vercel**.

| Setting | Value |
|---|---|
| Repository | `ritikahirwar8168-dev/campus-chatbot` |
| Branch | `main` |
| Root Directory | `frontend` |
| Framework | Vite |

Production environment variable:

```env
VITE_API_URL=https://campus-chatbot-bzk0.onrender.com
```

**Live frontend:** https://campus-chatbot-kbkdt49ms-ritikahirwar8168-dev.vercel.app

### Production AI note

The deployed Render environment uses:

```env
OLLAMA_ENABLED=false
```

because the Render service does not run a local Ollama/Gemma instance. AI features therefore use the application's graceful **fallback behavior** unless an externally accessible Ollama-compatible endpoint is configured.

For local development, Ollama + Gemma can be enabled as described below.

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

Open http://localhost:5173.
In local development, the Vite proxy forwards `/api` requests to the local FastAPI backend.

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

For local development, copy `backend/.env.example` to `backend/.env`:

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

# Local CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> **Never commit production secrets or real API keys to GitHub.** Use your deployment provider's environment-variable settings.

---

## Project Structure

```
campus-chatbot/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py              # Login, JWT, /me
│   │   │   ├── attendance.py        # Attendance + dashboard + simulator
│   │   │   ├── academics.py         # Assignments, exams, notes CRUD
│   │   │   ├── productivity.py      # Tasks CRUD + study plan
│   │   │   ├── assistant.py         # Chat + actions + apply
│   │   │   └── ai.py                # AI tools: summarize, quiz, flashcards, priorities
│   │   ├── services/
│   │   │   ├── ollama_service.py     # Centralised Ollama/Gemma LLM client
│   │   │   ├── prompts.py            # Prompt templates for each AI feature
│   │   │   ├── assistant.py          # Chat logic (LLM + rule-based fallback)
│   │   │   ├── actions.py            # Recommended actions engine
│   │   │   ├── study_plan.py         # Deterministic study plan builder
│   │   │   ├── attendance_sim.py     # Attendance calculator + simulator
│   │   │   └── context.py            # Student context builder for AI
│   │   ├── auth.py           # JWT + bcrypt auth
│   │   ├── config.py         # Pydantic settings (.env)
│   │   ├── db.py             # SQLAlchemy engine + session
│   │   ├── models.py         # ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── seed.py           # Demo data seeder
│   │   └── main.py           # FastAPI app + lifespan
│   ├── .env.example
│   ├── requirements.txt
│   ├── Procfile              # Render deployment
│   └── render.yaml           # Render blueprint
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AttendancePage.tsx
│   │   │   ├── AcademicsPage.tsx
│   │   │   ├── ProductivityPage.tsx
│   │   │   ├── AssistantPage.tsx
│   │   │   └── AIToolsPage.tsx       # Summarize, Quiz, Flashcards, Priorities
│   │   ├── api.ts            # Typed API client + all endpoints
│   │   ├── auth.ts           # Auth context
│   │   ├── App.tsx           # Routes
│   │   ├── AppShell.tsx      # Sidebar layout
│   │   └── main.tsx          # React root
│   ├── vercel.json           # Vercel SPA + API proxy
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
| POST | `/api/attendance/simulate` | What-if attendance simulator |
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

### Local / AI-enabled

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
│       │            │                               │
│       ▼            ▼                               │
│  ┌─────────┐  ┌──────────┐                        │
│  │ Models  │  │ Prompts  │                        │
│  └────┬────┘  └──────────┘                        │
│       │                                            │
│       ▼                                            │
│  ┌─────────┐                                       │
│  │ SQLite  │                                       │
│  └─────────┘                                       │
└────────────────────────────────────────────────────┘
```

### Production deployment

```
┌──────────────────────────┐
│     Vercel Frontend      │
│     React + Vite         │
└────────────┬─────────────┘
             │ HTTPS
             ▼
┌──────────────────────────┐
│     Render Backend       │
│     FastAPI + SQLite     │
│                          │
│  Deterministic logic     │
│  + AI fallback logic     │
└──────────────────────────┘
       OLLAMA_ENABLED=false
```

### Key Design Decisions

- AI calls are **never exposed directly to the frontend** — they go through the backend.
- Ollama configuration lives in **environment variables**, not hard-coded application logic.
- The AI provider is isolated in a **single service module** (`ollama_service.py`).
- Deterministic logic such as attendance calculations and deadlines is **never delegated to AI**.
- Every AI endpoint has a **graceful fallback** when Ollama is offline.
- The application remains usable for core academic workflows **even without a GPU** or local LLM server.
- Production frontend and backend are **deployed separately** using Vercel and Render.

---

## Why Campus Copilot?

Traditional chatbots often give generic productivity advice without understanding the student's actual academic situation.

Campus Copilot combines:

- **attendance risk**
- **assignment and exam deadlines**
- **study tasks**
- **academic context**
- **deterministic planning**
- **AI-generated assistance**

into one student-focused workflow.

Instead of simply saying *"study DSA today"*, the assistant can use the student's actual context to recommend concrete actions such as creating a task, starting a study block, or flagging an attendance risk.

---
