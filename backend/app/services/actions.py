from datetime import date, timedelta

from sqlalchemy.orm import Session, joinedload

from app.models import Assignment, Student, Subject, Task
from app.services.attendance_sim import THRESHOLD, classes_to_reach, percentage
from app.services.study_plan import build_study_plan


def recommended_actions(db: Session, student: Student) -> list[dict]:
    today = date.today()
    actions: list[dict] = []

    for subject in student.subjects:
        pct = percentage(subject.present, subject.total)
        if pct < THRESHOLD:
            need = classes_to_reach(subject.present, subject.total)
            actions.append(
                {
                    "type": "flag_attendance",
                    "title": f"Protect {subject.code} attendance",
                    "reason": f"{pct}% now. Attend the next {need} class(es) to reach {int(THRESHOLD)}%.",
                    "payload": {
                        "subject_id": subject.id,
                        "subject_code": subject.code,
                        "classes_needed": need,
                    },
                }
            )

    overdue = (
        db.query(Assignment)
        .options(joinedload(Assignment.subject))
        .filter(
            Assignment.student_id == student.id,
            Assignment.status != "done",
            Assignment.due_date < today,
        )
        .all()
    )
    for item in overdue:
        actions.append(
            {
                "type": "create_task",
                "title": f"Finish overdue {item.subject.code} work",
                "reason": f"{item.title} was due {item.due_date.isoformat()}.",
                "payload": {
                    "title": f"Complete: {item.title}",
                    "subject_id": item.subject_id,
                    "due_date": today.isoformat(),
                },
            }
        )

    soon = (
        db.query(Assignment)
        .options(joinedload(Assignment.subject))
        .filter(
            Assignment.student_id == student.id,
            Assignment.status != "done",
            Assignment.due_date >= today,
            Assignment.due_date <= today + timedelta(days=3),
        )
        .all()
    )
    for item in soon:
        actions.append(
            {
                "type": "start_study_block",
                "title": f"Study block: {item.title}",
                "reason": f"Due in {(item.due_date - today).days} day(s).",
                "payload": {
                    "title": f"Work on {item.title}",
                    "subject_id": item.subject_id,
                    "minutes": 75,
                    "due_date": item.due_date.isoformat(),
                },
            }
        )

    plan = build_study_plan(db, student)
    exam_blocks = [b for b in plan if b["kind"] == "exam"][:2]
    for block in exam_blocks:
        actions.append(
            {
                "type": "start_study_block",
                "title": block["title"],
                "reason": block["reason"],
                "payload": {
                    "title": block["title"],
                    "subject_code": block["subject_code"],
                    "minutes": block["minutes"],
                    "due_date": block["due_date"].isoformat() if block["due_date"] else None,
                },
            }
        )

    seen: set[str] = set()
    unique: list[dict] = []
    for action in actions:
        key = f"{action['type']}:{action['title']}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(action)
    return unique[:8]


def _subject_id_from_payload(db: Session, student: Student, payload: dict) -> int | None:
    subject_id = payload.get("subject_id")
    if subject_id:
        return int(subject_id)
    code = payload.get("subject_code")
    if not code:
        return None
    subject = db.query(Subject).filter(Subject.student_id == student.id, Subject.code == code).first()
    return subject.id if subject else None


def apply_action(db: Session, student: Student, action_type: str, payload: dict) -> Task | None:
    if action_type == "create_task":
        due = payload.get("due_date")
        task = Task(
            student_id=student.id,
            subject_id=_subject_id_from_payload(db, student, payload),
            title=payload.get("title") or "Assistant task",
            due_date=date.fromisoformat(due) if due else date.today(),
            done=False,
            source="assistant",
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    if action_type == "start_study_block":
        due = payload.get("due_date")
        minutes = payload.get("minutes") or 45
        title = payload.get("title") or "Study block"
        task = Task(
            student_id=student.id,
            subject_id=_subject_id_from_payload(db, student, payload),
            title=f"{title} ({minutes} min)",
            due_date=date.fromisoformat(due) if due else date.today(),
            done=False,
            source="assistant",
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    if action_type == "flag_attendance":
        code = payload.get("subject_code") or "subject"
        need = payload.get("classes_needed") or 1
        task = Task(
            student_id=student.id,
            subject_id=_subject_id_from_payload(db, student, payload),
            title=f"Attend next {need} {code} class(es)",
            due_date=date.today() + timedelta(days=7),
            done=False,
            source="assistant",
        )
        existing = (
            db.query(Task)
            .filter(Task.student_id == student.id, Task.title == task.title, Task.done.is_(False))
            .first()
        )
        if existing:
            return existing
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    return None
