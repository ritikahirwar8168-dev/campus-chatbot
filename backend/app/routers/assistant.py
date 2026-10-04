from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_student
from app.db import get_db
from app.models import Student
from app.schemas import ActionOut, ApplyActionRequest, ChatRequest, ChatResponse, TaskOut
from app.services.actions import apply_action, recommended_actions
from app.services.assistant import chat as assistant_chat
from app.services.context import student_context, task_payload

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.get("/actions", response_model=list[ActionOut])
def actions(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return recommended_actions(db, student)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    context = student_context(db, student)
    history = [item.model_dump() for item in payload.history]
    result = await assistant_chat(db, student, message, history, context)
    return ChatResponse(**result)


@router.post("/apply", response_model=TaskOut)
def apply(
    payload: ApplyActionRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    task = apply_action(db, student, payload.type, payload.payload)
    if task is None:
        raise HTTPException(status_code=400, detail="Unknown action type")
    return task_payload(task)
