from pydantic import BaseModel, Field
from typing import Optional, List

class LoginRequest(BaseModel):
    role: str = Field(..., pattern="^(teacher|student)$")
    identifier: str  # Email for teacher, Admission No for student
    password: str

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    role: str = Field(..., pattern="^(teacher|student)$")
    identifier: str  # Email for teacher, Admission No for student
    password: str = Field(..., min_length=4)
    class_id: str = "10-A"

class MarkItem(BaseModel):
    student_id: str
    subject_id: str
    score: Optional[int] = Field(None, ge=0, le=100)
    is_absent: bool = False

class BulkMarksRequest(BaseModel):
    class_id: str = "10-A"
    term: str
    marks: List[MarkItem]
    remarks: Optional[dict] = None

class AppealCreateRequest(BaseModel):
    mark_id: str
    student_id: str
    subject_name: str
    term: str
    current_score: Optional[int] = None
    reason: str

class AppealResolveRequest(BaseModel):
    status: str = Field(..., pattern="^(Resolved|Rejected)$")
    new_score: Optional[int] = Field(None, ge=0, le=100)
    teacher_note: str