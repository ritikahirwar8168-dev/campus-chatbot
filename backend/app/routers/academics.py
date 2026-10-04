from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_student
from app.db import get_db
from app.models import Assignment, Exam, Note, Student, Subject
from app.schemas import AssignmentOut, AssignmentStatusIn, ExamOut, NoteIn, NoteOut
from app.services.context import assignment_payload, exam_payload, note_payload

router = APIRouter(prefix="/api/academics", tags=["academics"])


@router.get("/assignments", response_model=list[AssignmentOut])
def list_assignments(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    items = (
        db.query(Assignment)
        .options(joinedload(Assignment.subject))
        .filter(Assignment.student_id == student.id)
        .order_by(Assignment.due_date)
        .all()
    )
    return [assignment_payload(item) for item in items]


@router.patch("/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(
    assignment_id: int,
    payload: AssignmentStatusIn,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    if payload.status not in {"pending", "done"}:
        raise HTTPException(status_code=400, detail="Status must be pending or done")
    item = db.get(Assignment, assignment_id)
    if not item or item.student_id != student.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    item.status = payload.status
    db.commit()
    db.refresh(item)
    return assignment_payload(item)


@router.get("/exams", response_model=list[ExamOut])
def list_exams(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    items = (
        db.query(Exam)
        .options(joinedload(Exam.subject))
        .filter(Exam.student_id == student.id)
        .order_by(Exam.exam_date)
        .all()
    )
    return [exam_payload(item) for item in items]


@router.get("/notes", response_model=list[NoteOut])
def list_notes(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    items = (
        db.query(Note)
        .options(joinedload(Note.subject))
        .filter(Note.student_id == student.id)
        .order_by(Note.created_at.desc())
        .all()
    )
    return [note_payload(item) for item in items]


@router.post("/notes", response_model=NoteOut)
def create_note(
    payload: NoteIn,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    if payload.subject_id:
        subject = db.get(Subject, payload.subject_id)
        if not subject or subject.student_id != student.id:
            raise HTTPException(status_code=404, detail="Subject not found")
    note = Note(
        student_id=student.id,
        subject_id=payload.subject_id,
        title=payload.title.strip(),
        body=payload.body.strip(),
    )
    if not note.title:
        raise HTTPException(status_code=400, detail="Title is required")
    db.add(note)
    db.commit()
    db.refresh(note)
    return note_payload(note)


@router.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    note = db.get(Note, note_id)
    if not note or note.student_id != student.id:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"ok": True}
