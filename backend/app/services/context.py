from datetime import date

from sqlalchemy.orm import Session

from app.models import Assignment, Exam, Student, Task
from app.services.attendance_sim import THRESHOLD, classes_to_reach, percentage
from app.services.study_plan import build_study_plan


def subject_payload(subject) -> dict:
    pct = percentage(subject.present, subject.total)
    return {
        "id": subject.id,
        "code": subject.code,
        "name": subject.name,
        "present": subject.present,
        "total": subject.total,
        "percentage": pct,
        "warning": pct < THRESHOLD,
        "classes_to_reach_75": classes_to_reach(subject.present, subject.total),
    }


def assignment_payload(item: Assignment) -> dict:
    today = date.today()
    return {
        "id": item.id,
        "subject_id": item.subject_id,
        "subject_code": item.subject.code,
        "subject_name": item.subject.name,
        "title": item.title,
        "description": item.description,
        "due_date": item.due_date,
        "status": item.status,
        "days_left": (item.due_date - today).days,
    }


def exam_payload(item: Exam) -> dict:
    today = date.today()
    return {
        "id": item.id,
        "subject_id": item.subject_id,
        "subject_code": item.subject.code,
        "subject_name": item.subject.name,
        "title": item.title,
        "exam_date": item.exam_date,
        "venue": item.venue,
        "days_left": (item.exam_date - today).days,
    }


def note_payload(item) -> dict:
    return {
        "id": item.id,
        "subject_id": item.subject_id,
        "subject_code": item.subject.code if item.subject else None,
        "subject_name": item.subject.name if item.subject else None,
        "title": item.title,
        "body": item.body,
        "created_at": item.created_at,
    }


def task_payload(item: Task) -> dict:
    return {
        "id": item.id,
        "subject_id": item.subject_id,
        "subject_code": item.subject.code if item.subject else None,
        "subject_name": item.subject.name if item.subject else None,
        "title": item.title,
        "due_date": item.due_date,
        "done": item.done,
        "source": item.source,
    }


def student_context(db: Session, student: Student) -> dict:
    subjects = [subject_payload(s) for s in student.subjects]
    present = sum(s.present for s in student.subjects)
    total = sum(s.total for s in student.subjects)
    overall = percentage(present, total)
    assignments = [assignment_payload(a) for a in db.query(Assignment).filter(Assignment.student_id == student.id).all()]
    exams = [exam_payload(e) for e in db.query(Exam).filter(Exam.student_id == student.id).all()]
    tasks = [task_payload(t) for t in db.query(Task).filter(Task.student_id == student.id).all()]
    return {
        "student": {
            "name": student.name,
            "program": student.program,
            "semester": student.semester,
            "roll_no": student.roll_no,
        },
        "overall_attendance": overall,
        "subjects": subjects,
        "assignments": assignments,
        "exams": exams,
        "tasks": tasks,
        "study_plan": build_study_plan(db, student),
    }
