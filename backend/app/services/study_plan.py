from datetime import date

from sqlalchemy.orm import Session

from app.models import Assignment, Exam, Student, Task
from app.services.attendance_sim import THRESHOLD, percentage


def build_study_plan(db: Session, student: Student) -> list[dict]:
    today = date.today()
    blocks: list[dict] = []

    for subject in student.subjects:
        pct = percentage(subject.present, subject.total)
        if pct < THRESHOLD:
            blocks.append(
                {
                    "title": f"Attend {subject.code} this week",
                    "reason": f"Attendance is {pct}% (below {int(THRESHOLD)}%).",
                    "priority": "high",
                    "subject_code": subject.code,
                    "due_date": None,
                    "kind": "attendance",
                    "minutes": 50,
                }
            )

    overdue = (
        db.query(Assignment)
        .filter(
            Assignment.student_id == student.id,
            Assignment.status != "done",
            Assignment.due_date < today,
        )
        .all()
    )
    for item in overdue:
        blocks.append(
            {
                "title": f"Finish overdue: {item.title}",
                "reason": f"Due {item.due_date.isoformat()} in {item.subject.code}.",
                "priority": "high",
                "subject_code": item.subject.code,
                "due_date": item.due_date,
                "kind": "assignment",
                "minutes": 90,
            }
        )

    soon = (
        db.query(Assignment)
        .filter(
            Assignment.student_id == student.id,
            Assignment.status != "done",
            Assignment.due_date >= today,
        )
        .order_by(Assignment.due_date)
        .all()
    )
    for item in soon:
        days = (item.due_date - today).days
        blocks.append(
            {
                "title": f"Work on {item.title}",
                "reason": f"Due in {days} day(s).",
                "priority": "high" if days <= 3 else "medium",
                "subject_code": item.subject.code,
                "due_date": item.due_date,
                "kind": "assignment",
                "minutes": 75 if days <= 3 else 45,
            }
        )

    exams = db.query(Exam).filter(Exam.student_id == student.id, Exam.exam_date >= today).order_by(Exam.exam_date).all()
    for exam in exams:
        days = (exam.exam_date - today).days
        blocks.append(
            {
                "title": f"Revise {exam.subject.code}: {exam.title}",
                "reason": f"Exam in {days} day(s) at {exam.venue or 'TBA'}.",
                "priority": "high" if days <= 7 else "medium",
                "subject_code": exam.subject.code,
                "due_date": exam.exam_date,
                "kind": "exam",
                "minutes": 60 if days <= 7 else 40,
            }
        )

    open_tasks = (
        db.query(Task)
        .filter(Task.student_id == student.id, Task.done.is_(False))
        .order_by(Task.due_date.asc().nullslast())
        .all()
    )
    for task in open_tasks[:4]:
        code = task.subject.code if task.subject else None
        blocks.append(
            {
                "title": task.title,
                "reason": "Open task on your list.",
                "priority": "low",
                "subject_code": code,
                "due_date": task.due_date,
                "kind": "task",
                "minutes": 30,
            }
        )

    rank = {"high": 0, "medium": 1, "low": 2}
    blocks.sort(key=lambda b: (rank.get(b["priority"], 9), b.get("due_date") or date.max))
    return blocks[:12]
