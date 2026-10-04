"""
/api/ai/* — AI-powered feature endpoints.

Every endpoint goes through ollama_service and returns a graceful
fallback when Ollama is unavailable.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_student
from app.db import get_db
from app.models import Student, Subject
from app.schemas import (
    AIStudyPlanResponse,
    DailyPrioritiesResponse,
    FlashcardRequest,
    FlashcardResponse,
    OllamaHealthResponse,
    QuizRequest,
    QuizResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.services import ollama_service
from app.services.context import student_context
from app.services.prompts import (
    daily_priorities_prompt,
    flashcard_prompt,
    quiz_prompt,
    study_plan_prompt,
    summarize_prompt,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ── Health ──────────────────────────────────────────────────────────


@router.get("/health", response_model=OllamaHealthResponse)
async def ai_health():
    result = await ollama_service.health()
    return OllamaHealthResponse(**result)


# ── Daily Priorities ────────────────────────────────────────────────


@router.get("/daily-priorities", response_model=DailyPrioritiesResponse)
async def daily_priorities(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    ctx = student_context(db, student)
    text = await ollama_service.generate(
        system_prompt=daily_priorities_prompt(),
        user_message="Generate my daily priority plan for today.",
        context=ctx,
    )
    if text is None:
        # Deterministic fallback
        plan = ctx.get("study_plan", [])
        lines = ["Here are your priorities based on urgency:"]
        for i, block in enumerate(plan[:5], 1):
            lines.append(f"{i}. [{block['priority'].upper()}] {block['title']} — {block['reason']}")
        if not plan:
            lines.append("No urgent items today. Use this time to get ahead!")
        return DailyPrioritiesResponse(priorities="\n".join(lines), used_llm=False)
    return DailyPrioritiesResponse(priorities=text, used_llm=True)


# ── Summarize ───────────────────────────────────────────────────────


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    payload: SummarizeRequest,
    student: Student = Depends(get_current_student),
):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    text = await ollama_service.generate(
        system_prompt=summarize_prompt(),
        user_message=payload.text.strip(),
    )
    if text is None:
        return SummarizeResponse(
            summary="AI summarisation is currently unavailable. Please ensure Ollama is running with the Gemma model.",
            used_llm=False,
        )
    return SummarizeResponse(summary=text, used_llm=True)


# ── Quiz Generation ─────────────────────────────────────────────────


@router.post("/quiz", response_model=QuizResponse)
async def quiz(
    payload: QuizRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    subject_name = ""
    if payload.subject_id:
        subject = db.get(Subject, payload.subject_id)
        if subject and subject.student_id == student.id:
            subject_name = f"{subject.code} {subject.name}"

    user_msg = f"Generate {payload.count} quiz questions on: {payload.topic}"
    if subject_name:
        user_msg += f" (subject: {subject_name})"

    data = await ollama_service.generate_json(
        system_prompt=quiz_prompt(),
        user_message=user_msg,
        temperature=0.5,
    )
    if data and isinstance(data, list):
        questions = []
        for item in data[:payload.count]:
            if isinstance(item, dict) and "question" in item:
                questions.append({
                    "question": item.get("question", ""),
                    "options": item.get("options", ["A", "B", "C", "D"]),
                    "answer": item.get("answer", "A"),
                    "explanation": item.get("explanation", ""),
                })
        if questions:
            return QuizResponse(questions=questions, used_llm=True)

    return QuizResponse(
        questions=[
            {
                "question": "AI quiz generation is currently unavailable. Please ensure Ollama is running with the Gemma model.",
                "options": ["Try again later", "Check Ollama status", "Use /api/ai/health", "Read the docs"],
                "answer": "Check Ollama status",
                "explanation": "The Ollama server needs to be running with a Gemma model loaded.",
            }
        ],
        used_llm=False,
    )


# ── Flashcard Generation ────────────────────────────────────────────


@router.post("/flashcards", response_model=FlashcardResponse)
async def flashcards(
    payload: FlashcardRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    subject_name = ""
    if payload.subject_id:
        subject = db.get(Subject, payload.subject_id)
        if subject and subject.student_id == student.id:
            subject_name = f"{subject.code} {subject.name}"

    user_msg = f"Generate {payload.count} flashcards on: {payload.topic}"
    if subject_name:
        user_msg += f" (subject: {subject_name})"

    data = await ollama_service.generate_json(
        system_prompt=flashcard_prompt(),
        user_message=user_msg,
        temperature=0.5,
    )
    if data and isinstance(data, list):
        cards = []
        for item in data[:payload.count]:
            if isinstance(item, dict) and "front" in item:
                cards.append({
                    "front": item.get("front", ""),
                    "back": item.get("back", ""),
                })
        if cards:
            return FlashcardResponse(cards=cards, used_llm=True)

    return FlashcardResponse(
        cards=[
            {
                "front": "Is Ollama running?",
                "back": "Flashcard generation requires Ollama with Gemma. Check /api/ai/health.",
            }
        ],
        used_llm=False,
    )


# ── AI-Enhanced Study Plan ──────────────────────────────────────────


@router.get("/study-plan", response_model=AIStudyPlanResponse)
async def ai_study_plan(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    ctx = student_context(db, student)
    text = await ollama_service.generate(
        system_prompt=study_plan_prompt(),
        user_message="Analyse my current study plan and provide recommendations.",
        context=ctx,
    )
    if text is None:
        return AIStudyPlanResponse(
            recommendations="AI study plan enhancement is currently unavailable. Your deterministic study plan on the Productivity page is still active.",
            used_llm=False,
        )
    return AIStudyPlanResponse(recommendations=text, used_llm=True)
