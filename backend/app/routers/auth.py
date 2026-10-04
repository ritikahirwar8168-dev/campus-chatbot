from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_student, verify_password
from app.db import get_db
from app.models import Student
from app.schemas import LoginRequest, StudentOut, TokenOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.username == payload.username).first()
    if not student or not verify_password(payload.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(student.id)
    return TokenOut(access_token=token, student=StudentOut.model_validate(student))


@router.get("/me", response_model=StudentOut)
def me(student: Student = Depends(get_current_student)):
    return student
