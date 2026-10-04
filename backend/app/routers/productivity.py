from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_student
from app.db import get_db
from app.models import Student, Subject, Task
from app.schemas import StudyBlockOut, TaskIn, TaskOut, TaskPatch
from app.services.context import task_payload
from app.services.study_plan import build_study_plan

router = APIRouter(prefix="/api/productivity", tags=["productivity"])


@router.get("/tasks", response_model=list[TaskOut])
def list_tasks(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    items = (
        db.query(Task)
        .options(joinedload(Task.subject))
        .filter(Task.student_id == student.id)
        .order_by(Task.done, Task.due_date.asc().nullslast())
        .all()
    )
    return [task_payload(item) for item in items]


@router.post("/tasks", response_model=TaskOut)
def create_task(
    payload: TaskIn,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    if payload.subject_id:
        subject = db.get(Subject, payload.subject_id)
        if not subject or subject.student_id != student.id:
            raise HTTPException(status_code=404, detail="Subject not found")
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    task = Task(
        student_id=student.id,
        subject_id=payload.subject_id,
        title=title,
        due_date=payload.due_date,
        done=False,
        source=payload.source or "manual",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_payload(task)


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def patch_task(
    task_id: int,
    payload: TaskPatch,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if not task or task.student_id != student.id:
        raise HTTPException(status_code=404, detail="Task not found")
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
        if not data["title"]:
            raise HTTPException(status_code=400, detail="Title is required")
    for key, value in data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task_payload(task)


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if not task or task.student_id != student.id:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}


@router.get("/study-plan", response_model=list[StudyBlockOut])
def study_plan(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return build_study_plan(db, student)
