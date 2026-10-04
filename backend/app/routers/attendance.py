from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_student
from app.db import get_db
from app.models import Student, Subject
from app.schemas import DashboardOut, SimulateOut, SimulateRequest, StudentOut, SubjectOut
from app.services.actions import recommended_actions
from app.services.attendance_sim import simulate
from app.services.context import assignment_payload, exam_payload, subject_payload
from app.models import Assignment, Exam

router = APIRouter(prefix="/api", tags=["attendance"])


@router.get("/attendance", response_model=list[SubjectOut])
def attendance(student: Student = Depends(get_current_student)):
    return [subject_payload(s) for s in student.subjects]


@router.post("/attendance/simulate", response_model=SimulateOut)
def attendance_simulate(
    payload: SimulateRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    subject = db.get(Subject, payload.subject_id)
    if not subject or subject.student_id != student.id:
        raise HTTPException(status_code=404, detail="Subject not found")
    result = simulate(subject.present, subject.total, payload.extra_absences, payload.extra_classes)
    return SimulateOut(
        subject_id=subject.id,
        code=subject.code,
        name=subject.name,
        **result,
    )


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    subjects = [subject_payload(s) for s in student.subjects]
    present = sum(s.present for s in student.subjects)
    total = sum(s.total for s in student.subjects)
    overall = round((present / total) * 100, 1) if total else 0.0
    assignments = (
        db.query(Assignment)
        .filter(Assignment.student_id == student.id, Assignment.status != "done")
        .order_by(Assignment.due_date)
        .limit(4)
        .all()
    )
    exams = db.query(Exam).filter(Exam.student_id == student.id).order_by(Exam.exam_date).limit(4).all()
    open_tasks = sum(1 for t in student.tasks if not t.done)
    return DashboardOut(
        student=StudentOut.model_validate(student),
        overall_attendance=overall,
        warning_count=sum(1 for s in subjects if s["warning"]),
        upcoming_assignments=[assignment_payload(a) for a in assignments],
        upcoming_exams=[exam_payload(e) for e in exams],
        open_tasks=open_tasks,
        todays_actions=recommended_actions(db, student)[:4],
        subjects=subjects,
    )
