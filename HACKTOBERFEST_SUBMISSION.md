---
title: "Campus Copilot: Building an Open-Weight Academic Agent with Gemma (and Render)"
published: false
tags: hacktoberfest, devchallenge, weekendchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01) in the **Best Use of Gemma** and **Best Use of Render** prize categories.*

<!--
Paste this into a DEV.to draft.
Tags (max 4): hacktoberfest · devchallenge · weekendchallenge · hf26challenge
Replace every TODO (repo URL, Vercel, Render) before publishing.
-->

## The Inspiration: Building for Aarav

College should feel like a plan. For my close friend **Aarav**, a 5th-semester CS student, it felt like a spreadsheet he was always one lecture behind.

Aarav is not failing. He is drowning in *small* numbers:

- **Attendance** is a clinic, not a vibe. One subject at 71% is a warning letter; one “I’ll bunk DBMS tomorrow” can take a week to recover.
- **Assignments** land in WhatsApp groups at 11pm. The OS lab is already overdue while ML is due Friday.
- **Exams** appear on a PDF with no relationship to how tired he is or which subject is already on fire.
- Closed chatbots were cheerfully useless. They would say “just study DSA today” while his **Networks attendance was 64%** and a **DBMS assignment was due tomorrow**. They had no campus state. They could not be trusted with the only metric that actually gates his degree: **75%**.

When Aarav asked a popular closed-source chatbot *“What should I focus on today?”*, it invented a generic pomodoro. It never saw:

```text
DSA attendance:     (example) 71%  → warning
DBMS assignment:    due tomorrow
OS exam:            6 days away
Today's classes:    DSA, DBMS
```

I built **Campus Copilot** to solve that for him: an open-source academic agent that **computes attendance and deadlines in code**, then asks **Gemma** (via Ollama) to turn that structured context into a short, usable priority plan — plus quizzes, flashcards, and summaries when he actually sits down to study.

Aarav’s reaction when I handed it over:

> “This is the first time a bot knew I was about to bunk DBMS and told me not to. It didn’t give me a TED Talk. It gave me the next four hours.”

**Try the seeded demo:** username `demo` / password `campus`

## Demo

- **Live app (Vercel):** TODO — `https://YOUR-APP.vercel.app`
- **API (Render):** TODO — `https://YOUR-SERVICE.onrender.com/api/health`
- **Video (optional):** TODO

Local:

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install && npm run dev
```

Gemma on the laptop:

```bash
ollama pull gemma3:4b
# backend/.env
# OLLAMA_ENABLED=true
# OLLAMA_BASE_URL=http://localhost:11434/v1
# OLLAMA_MODEL=gemma3:4b
```

## Code Repository

The full open-source app — FastAPI agent, React dashboard, SQLite seed data, Ollama/Gemma service, Render + Vercel configs — lives here:

{% github TODO-OWNER/TODO-REPO %}

## Why Open-Source AI at the Core?

For Campus Copilot, open-weight AI was not a sticker on a CRUD app. It was the product.

**Academic privacy.** Aarav’s attendance, roll number, overdue labs, and “can I skip this lecture?” panic should not be a training anecdote for a closed API.

**Zero cost on a student laptop.** Ollama + **Gemma** (`gemma3:4b` by default) runs locally. Inference cost is **$0.00**. Hostel Wi-Fi can die; the copilot does not need a quota.

**Deterministic guardrails.** Closed models will happily hallucinate “you’re at 82%” or suggest bunking a subject that is already under 75%. Attendance %, skip/attend projections, due dates, and exam countdowns stay in Python (`attendance_sim.py`, `study_plan.py`). Gemma **never owns the calculator**.

**A model we can swap.** `OLLAMA_MODEL` is an env var. The frontend never sees Ollama’s URL or the model name as a secret control panel — it only talks to FastAPI.

## How the Agent Works: Architecture

Campus Copilot is a split brain: **facts in code**, **advice in Gemma**.

```text
Aarav (student UI)
        │
        ▼
┌───────────────────┐
│  Campus Copilot   │  Vite + React  →  Vercel
│  Dashboard        │
└─────────┬─────────┘
          │  /api/* only
          ▼
┌───────────────────┐
│  FastAPI runtime  │  →  Render
│  JWT + SQLite     │
└─────────┬─────────┘
          │
    ┌─────┴──────────────────────────┐
    ▼                                ▼
Deterministic                    Open-weight Gemma
• attendance %                   via Ollama
• 75% warnings                   ollama_service.py
• skip/attend simulator          (env: OLLAMA_*)
• due dates / exam days
• ranked study queue
          │
          ▼
 Structured student JSON  →  Gemma  →  priorities, chat,
                              summaries, quiz, flashcards
```

**What the model is allowed to do**

| Feature | Who does the work |
| --- | --- |
| Attendance % and “classes needed to hit 75%” | Python |
| Absence simulator sliders | Python |
| Assignment due dates, exam countdown | Python |
| Ranked study blocks (risk + deadline) | Python |
| “What should I focus on today?” | **Gemma**, given that JSON |
| Summarize notes / pasted material | **Gemma** |
| Generate quiz + flashcards | **Gemma** |
| Critique / enrich the study plan | **Gemma** (on top of the code plan) |

**API surface (frontend never calls Ollama)**

- `POST /api/assistant/chat` — academic assistant + apply-able actions  
- `GET /api/assistant/actions` — today’s action cards  
- `GET /api/ai/daily-priorities` — daily priority plan  
- `POST /api/ai/summarize`  
- `POST /api/ai/quiz`  
- `POST /api/ai/flashcards`  
- `GET /api/ai/study-plan`  
- `GET /api/ai/health` — is Gemma reachable?

All LLM HTTP is isolated in `backend/app/services/ollama_service.py`. Routers pass a system prompt + **student context JSON** built by `student_context()`. If Ollama is down, the assistant **falls back** to rule-based priorities so Aarav still gets a plan.

## The Prompt Pattern (Context, Not Vibes)

When Aarav asks *“What should I focus on today?”*, Gemma does not get a blank chat. It gets a compact academic snapshot, for example:

```json
{
  "overall_attendance": 75.8,
  "subjects": [
    { "code": "CS501", "name": "DBMS", "percentage": 68.8, "warning": true, "classes_to_reach_75": 8 },
    { "code": "CS503", "name": "Computer Networks", "percentage": 64.3, "warning": true }
  ],
  "assignments": [{ "title": "ER diagram + schema", "days_left": 1, "status": "pending" }],
  "exams": [{ "title": "Networks quiz", "days_left": 6 }]
}
```

The system prompt tells Gemma: **use only this JSON; do not invent subjects or percentages; return a short priority plan and optional actions** (`create_task`, `start_study_block`, `flag_attendance`) that the UI can apply to his task list.

That is the difference between a chatbot and an agent for a friend: the model is downstream of campus truth.

## The Output: What Aarav Gets

**Original ask:** *“Can I skip DBMS tomorrow? What should I focus on today?”*

**Campus Copilot (Gemma + context):**

```text
Do not skip DBMS. CS501 is at 68.8% — you need 8 consecutive lectures
to climb back over 75%. Networks (CS503) is worse at 64.3%.

Today:
1. Attend DBMS (and Networks if it is on the timetable).
2. Finish the ER diagram + schema — it is due tomorrow.
3. 45–60 min Networks revision for the quiz in 6 days.
4. Do not start a new ML rabbit hole until the overdue OS lab is closed.

[Apply] Protect CS501 attendance
[Apply] Study block: ER diagram + relational schema
```

Plus a dashboard he can actually live in:

- Attendance ring, warnings, skip/attend **simulator**  
- Assignments, exams, notes  
- Tasks + deterministic study plan  
- Assistant chat  
- **AI Tools:** daily priorities, summarize, quiz, flashcards — labeled as Gemma, with an online/offline indicator  

## Why This Matters for Open Innovation

A closed campus bot would mean a paid key on Aarav’s card, his semester in someone else’s logs, and a model that changes personality every quarter.

**Gemma** made the opposite possible: pull an open-weight model, run it next to the student, keep the 75% math honest in open Python, and still get a plan that sounds like a senior who *saw the attendance sheet*.

**Render** is how that backend leaves my laptop: FastAPI as the AI runtime (`backend/render.yaml` — `uvicorn`, `SECRET_KEY`, `OLLAMA_*`, CORS). **Vercel** hosts the React UI and proxies `/api` to Render. Judges can clone, `ollama pull gemma3:4b`, and reproduce the same agent.

## My Agent Session

TODO — optional DevRelay `{% agent_session %}` embed.

Built in an agent loop (Cursor): campus CRUD + attendance simulator first, then a single Ollama/Gemma service, then AI tool routes, then Render/Vercel deploy files. The session is the paper trail for *why* the calculator never moved into the LLM.

## Prize Categories

### Featured — Best Use of Gemma

Campus Copilot’s academic brain **is Gemma**. Ollama serves it; FastAPI injects live student context; Gemma writes the daily plan, the chat, the summaries, the quizzes, and the flashcards. The React app never configures the model. That is “use Gemma in building the project”: local inference, open weights, and a product that collapses without it (the tools page is literally titled around Gemma; the assistant is context-Gemma or an honest fallback).

### Featured — Best Use of Render

The **AI runtime is FastAPI on Render**: the service that owns Ollama/Gemma calls, JWT, and SQLite. Env vars wire `OLLAMA_BASE_URL` / `OLLAMA_MODEL` without baking secrets into the frontend. This is hosting the agent’s backend — the same pattern as “use Render as your project’s AI runtime.”

---

Food was Elena’s clinical puzzle. **Attendance is Aarav’s.** Different friend, same idea: don’t let a closed model improvise the one number that can cost them a year.

Thanks for participating in Hacktoberfest.
