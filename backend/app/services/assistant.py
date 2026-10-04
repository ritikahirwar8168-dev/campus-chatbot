import json
import re

from app.services import ollama_service
from app.services.actions import recommended_actions
from app.services.prompts import chat_system_prompt


SYSTEM_PROMPT = chat_system_prompt()


def _parse_actions(text: str) -> tuple[str, list[dict]]:
    match = re.search(r"```actions\s*([\s\S]*?)```", text)
    if not match:
        return text.strip(), []
    reply = (text[: match.start()] + text[match.end() :]).strip()
    try:
        parsed = json.loads(match.group(1).strip())
        if isinstance(parsed, dict):
            parsed = [parsed]
        actions = []
        for item in parsed:
            if not isinstance(item, dict) or "type" not in item:
                continue
            actions.append(
                {
                    "type": item.get("type"),
                    "title": item.get("title") or "Suggested action",
                    "reason": item.get("reason") or "",
                    "payload": item.get("payload") or {},
                }
            )
        return reply, actions
    except json.JSONDecodeError:
        return reply, []


async def llm_reply(message: str, history: list[dict], context: dict) -> tuple[str, list[dict]] | None:
    text = await ollama_service.generate(
        system_prompt=SYSTEM_PROMPT,
        user_message=message,
        context=context,
        history=history,
    )
    if text is None:
        return None
    return _parse_actions(text)


def fallback_reply(message: str, context: dict, db, student) -> tuple[str, list[dict]]:
    text = message.lower()
    actions = recommended_actions(db, student)
    overall = context.get("overall_attendance")
    warnings = [s for s in context.get("subjects", []) if s.get("warning")]
    pending = [a for a in context.get("assignments", []) if a.get("status") != "done"]
    pending.sort(key=lambda a: a.get("due_date") or date.max)

    if any(word in text for word in ("attend", "bunk", "skip", "75", "warning")):
        if warnings:
            lines = [
                f"Overall attendance is {overall}%. These subjects are below {int(75)}%:"
            ]
            for subject in warnings:
                lines.append(
                    f"- {subject['code']} {subject['name']}: {subject['percentage']}% "
                    f"(attend {subject['classes_to_reach_75']} more)."
                )
            lines.append("Use the attendance simulator before you skip a class.")
            filtered = [a for a in actions if a["type"] == "flag_attendance"]
            return "\n".join(lines), filtered or actions[:3]
        return (
            f"Overall attendance is {overall}%. No subject is currently under the 75% warning line.",
            actions[:3],
        )

    if any(word in text for word in ("exam", "midterm", "quiz", "revise")):
        exams = sorted(context.get("exams", []), key=lambda e: e.get("exam_date") or date.max)
        if not exams:
            return "No exams are on the calendar yet.", actions[:3]
        lines = ["Upcoming exams:"]
        for exam in exams[:4]:
            lines.append(f"- {exam['subject_code']} {exam['title']} in {exam['days_left']} day(s) ({exam['venue']}).")
        filtered = [a for a in actions if a["type"] == "start_study_block"]
        return "\n".join(lines), filtered[:3] or actions[:3]

    if any(word in text for word in ("assign", "homework", "deadline", "due")):
        if not pending:
            return "No open assignments. Nice — keep the buffer for exams.", actions[:3]
        lines = ["Open assignments:"]
        for item in pending[:5]:
            suffix = "overdue" if item["days_left"] < 0 else f"{item['days_left']} day(s) left"
            lines.append(f"- {item['subject_code']}: {item['title']} ({suffix}).")
        return "\n".join(lines), [a for a in actions if a["type"] in {"create_task", "start_study_block"}][:3] or actions[:3]

    if any(word in text for word in ("plan", "today", "schedule", "study")):
        plan = context.get("study_plan") or []
        lines = ["Here is a focused plan:"]
        for block in plan[:5]:
            lines.append(f"- [{block['priority']}] {block['title']} ({block['minutes']} min) — {block['reason']}")
        return "\n".join(lines), actions[:4]

    warning_text = ", ".join(f"{s['code']} ({s['percentage']}%)" for s in warnings) or "none"
    next_due = pending[0]["title"] if pending else "nothing urgent"
    reply = (
        f"Hi {context['student']['name']}. Overall attendance is {overall}%. "
        f"Warnings: {warning_text}. Next academic focus: {next_due}. "
        "Ask me about attendance, assignments, exams, or a study plan."
    )
    return reply, actions[:4]


async def chat(db, student, message: str, history: list, context: dict) -> dict:
    llm = await llm_reply(message, history, context)
    if llm:
        reply, actions = llm
        if not actions:
            actions = recommended_actions(db, student)[:3]
        return {"reply": reply, "actions": actions, "used_llm": True}
    reply, actions = fallback_reply(message, context, db, student)
    return {"reply": reply, "actions": actions, "used_llm": False}
