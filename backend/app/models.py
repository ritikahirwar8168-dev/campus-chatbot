from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    program: Mapped[str] = mapped_column(String(120))
    semester: Mapped[int] = mapped_column(Integer)
    roll_no: Mapped[str] = mapped_column(String(40))

    subjects: Mapped[list["Subject"]] = relationship(back_populates="student")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="student")
    exams: Mapped[list["Exam"]] = relationship(back_populates="student")
    notes: Mapped[list["Note"]] = relationship(back_populates="student")
    tasks: Mapped[list["Task"]] = relationship(back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("student_id", "code", name="uq_student_subject_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    code: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(120))
    present: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)

    student: Mapped["Student"] = relationship(back_populates="subjects")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="pending")

    student: Mapped["Student"] = relationship(back_populates="assignments")
    subject: Mapped["Subject"] = relationship()


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    exam_date: Mapped[date] = mapped_column(Date)
    venue: Mapped[str] = mapped_column(String(120), default="")

    student: Mapped["Student"] = relationship(back_populates="exams")
    subject: Mapped["Subject"] = relationship()


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    subject_id = mapped_column(Integer, ForeignKey("subjects.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student: Mapped["Student"] = relationship(back_populates="notes")
    subject = relationship("Subject")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    subject_id = mapped_column(Integer, ForeignKey("subjects.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    due_date = mapped_column(Date, nullable=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(20), default="manual")

    student: Mapped["Student"] = relationship(back_populates="tasks")
    subject = relationship("Subject")
