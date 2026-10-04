from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import Assignment, Exam, Note, Student, Subject, Task


def seed_if_empty(db: Session) -> None:
    if db.query(Student).first():
        return

    student = Student(
        username="demo",
        password_hash=hash_password("campus"),
        name="Ritik Sharma",
        program="B.Tech Computer Science",
        semester=5,
        roll_no="CS21B1042",
    )
    db.add(student)
    db.flush()

    today = date.today()
    subjects_data = [
        ("CS501", "Database Management Systems", 22, 32),
        ("CS502", "Operating Systems", 28, 35),
        ("CS503", "Computer Networks", 18, 28),
        ("CS504", "Software Engineering", 30, 36),
        ("CS505", "Machine Learning", 24, 30),
    ]
    subjects: dict[str, Subject] = {}
    for code, name, present, total in subjects_data:
        subject = Subject(
            student_id=student.id,
            code=code,
            name=name,
            present=present,
            total=total,
        )
        db.add(subject)
        db.flush()
        subjects[code] = subject

    assignments = [
        (
            "CS501",
            "ER diagram + relational schema",
            "Normalize to 3NF and submit the schema PDF.",
            today + timedelta(days=2),
            "pending",
        ),
        (
            "CS505",
            "Linear regression notebook",
            "Train on the housing dataset and report RMSE.",
            today + timedelta(days=5),
            "pending",
        ),
        (
            "CS504",
            "SRS document",
            "Write functional and non-functional requirements for Campus Copilot.",
            today + timedelta(days=8),
            "pending",
        ),
        (
            "CS502",
            "Process scheduling lab",
            "Compare FCFS, SJF, and Round Robin with Gantt charts.",
            today - timedelta(days=1),
            "pending",
        ),
        (
            "CS503",
            "Wireshark capture report",
            "Capture HTTP vs DNS and annotate the packets.",
            today + timedelta(days=12),
            "done",
        ),
    ]
    for code, title, description, due, status in assignments:
        db.add(
            Assignment(
                student_id=student.id,
                subject_id=subjects[code].id,
                title=title,
                description=description,
                due_date=due,
                status=status,
            )
        )

    exams = [
        ("CS501", "DBMS mid-term", today + timedelta(days=14), "Hall A"),
        ("CS502", "OS mid-term", today + timedelta(days=16), "Hall B"),
        ("CS503", "Networks quiz", today + timedelta(days=6), "Lab 2"),
        ("CS505", "ML mid-term", today + timedelta(days=21), "Hall A"),
    ]
    for code, title, exam_date, venue in exams:
        db.add(
            Exam(
                student_id=student.id,
                subject_id=subjects[code].id,
                title=title,
                exam_date=exam_date,
                venue=venue,
            )
        )

    notes = [
        (
            "CS501",
            "Indexing cheat sheet",
            "B+ trees: leaf nodes linked. Clustered vs non-clustered. Use covering indexes for frequent queries.",
        ),
        (
            "CS502",
            "Deadlock conditions",
            "Mutual exclusion, hold and wait, no preemption, circular wait. Banker's algorithm for avoidance.",
        ),
        (
            None,
            "Campus week plan",
            "Protect DBMS and Networks attendance. Finish overdue OS lab before the quiz week.",
        ),
    ]
    for code, title, body in notes:
        db.add(
            Note(
                student_id=student.id,
                subject_id=subjects[code].id if code else None,
                title=title,
                body=body,
            )
        )

    tasks = [
        ("Revise CN subnetting before quiz", subjects["CS503"].id, today + timedelta(days=5), False, "manual"),
        ("Attend next 4 DBMS lectures", subjects["CS501"].id, today + timedelta(days=10), False, "assistant"),
        ("Print OS lab graphs", subjects["CS502"].id, today, False, "manual"),
        ("Backup notes to Drive", None, today + timedelta(days=3), True, "manual"),
    ]
    for title, subject_id, due, done, source in tasks:
        db.add(
            Task(
                student_id=student.id,
                subject_id=subject_id,
                title=title,
                due_date=due,
                done=done,
                source=source,
            )
        )

    db.commit()
