from datetime import date, datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class StudentOut(BaseModel):
    id: int
    username: str
    name: str
    program: str
    semester: int
    roll_no: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student: StudentOut


class SubjectOut(BaseModel):
    id: int
    code: str
    name: str
    present: int
    total: int
    percentage: float
    warning: bool
    classes_to_reach_75: int

    model_config = {"from_attributes": True}


class SimulateRequest(BaseModel):
    subject_id: int
    extra_absences: int = Field(default=0, ge=0)
    extra_classes: int = Field(default=0, ge=0)


class SimulateOut(BaseModel):
    subject_id: int
    code: str
    name: str
    present: int
    total: int
    percentage: float
    warning: bool
    classes_to_reach_75: int
    extra_absences: int
    extra_classes: int


class AssignmentOut(BaseModel):
    id: int
    subject_id: int
    subject_code: str
    subject_name: str
    title: str
    description: str
    due_date: date
    status: str
    days_left: int


class AssignmentStatusIn(BaseModel):
    status: str


class ExamOut(BaseModel):
    id: int
    subject_id: int
    subject_code: str
    subject_name: str
    title: str
    exam_date: date
    venue: str
    days_left: int


class NoteIn(BaseModel):
    subject_id: int | None = None
    title: str
    body: str = ""


class NoteOut(BaseModel):
    id: int
    subject_id: int | None
    subject_code: str | None
    subject_name: str | None
    title: str
    body: str
    created_at: datetime


class TaskIn(BaseModel):
    subject_id: int | None = None
    title: str
    due_date: date | None = None
    source: str = "manual"


class TaskPatch(BaseModel):
    title: str | None = None
    done: bool | None = None
    due_date: date | None = None
    subject_id: int | None = None


class TaskOut(BaseModel):
    id: int
    subject_id: int | None
    subject_code: str | None
    subject_name: str | None
    title: str
    due_date: date | None
    done: bool
    source: str


class StudyBlockOut(BaseModel):
    title: str
    reason: str
    priority: str
    subject_code: str | None = None
    due_date: date | None = None
    kind: str
    minutes: int


class ActionOut(BaseModel):
    type: str
    title: str
    reason: str
    payload: dict = Field(default_factory=dict)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    actions: list[ActionOut]
    used_llm: bool


class ApplyActionRequest(BaseModel):
    type: str
    payload: dict = Field(default_factory=dict)


class DashboardOut(BaseModel):
    student: StudentOut
    overall_attendance: float
    warning_count: int
    upcoming_assignments: list[AssignmentOut]
    upcoming_exams: list[ExamOut]
    open_tasks: int
    todays_actions: list[ActionOut]
    subjects: list[SubjectOut]


# ── AI feature schemas ────────────────────────────────────────────


class SummarizeRequest(BaseModel):
    text: str
    subject_id: int | None = None


class SummarizeResponse(BaseModel):
    summary: str
    used_llm: bool


class QuizRequest(BaseModel):
    subject_id: int | None = None
    topic: str
    count: int = Field(default=5, ge=1, le=15)


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    answer: str
    explanation: str


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]
    used_llm: bool


class FlashcardRequest(BaseModel):
    subject_id: int | None = None
    topic: str
    count: int = Field(default=8, ge=1, le=20)


class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardResponse(BaseModel):
    cards: list[Flashcard]
    used_llm: bool


class DailyPrioritiesResponse(BaseModel):
    priorities: str
    used_llm: bool


class AIStudyPlanResponse(BaseModel):
    recommendations: str
    used_llm: bool


class OllamaHealthResponse(BaseModel):
    ok: bool
    reason: str = ""
    models: list = Field(default_factory=list)

