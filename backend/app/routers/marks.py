from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models import BulkMarksRequest
from app.services.grading import calculate_sl_grade, compute_class_rankings

router = APIRouter(prefix="/api/marks", tags=["Marks & Report Cards"])

def recalculate_and_save_rankings(class_id: str, term: str, remarks_map: dict = None):
    """Recalculates Total, Average, and Tie-Broken Class Rank for all students in a class/term."""
    students_res = supabase.table("users").select("id, name, admission_no").eq("role", "student").eq("class_id", class_id).execute()
    students = students_res.data or []
    
    marks_res = supabase.table("marks").select("*").eq("term", term).execute()
    all_marks = marks_res.data or []

    existing_summaries = supabase.table("report_summaries").select("student_id, teacher_remark").eq("term", term).execute()
    existing_remarks = {row["student_id"]: row["teacher_remark"] for row in (existing_summaries.data or [])}

    student_totals = []
    for st in students:
        sid = st["id"]
        st_marks = [m for m in all_marks if m["student_id"] == sid]
        attended_scores = [m["score"] for m in st_marks if not m["is_absent"] and m["score"] is not None]
        
        total_score = sum(attended_scores) if attended_scores else 0
        subject_count = len(st_marks) if len(st_marks) > 0 else 6
        avg_score = round(total_score / subject_count, 2)
        
        remark = "Good progress. Keep it up!"
        if remarks_map and sid in remarks_map:
            remark = remarks_map[sid]
        elif sid in existing_remarks:
            remark = existing_remarks[sid]

        student_totals.append({
            "student_id": sid,
            "class_id": class_id,
            "term": term,
            "total_marks": total_score,
            "average": avg_score,
            "teacher_remark": remark
        })

    ranked = compute_class_rankings(student_totals)
    for item in ranked:
        supabase.table("report_summaries").upsert(item, on_conflict="student_id,term").execute()

    return ranked

@router.get("/grid/{class_id}/{term}")
def get_teacher_grid(class_id: str, term: str):
    students = supabase.table("users").select("id, name, admission_no").eq("role", "student").eq("class_id", class_id).order("admission_no").execute().data
    subjects = supabase.table("subjects").select("*").order("display_order").execute().data
    marks = supabase.table("marks").select("*").eq("term", term).execute().data
    summaries = supabase.table("report_summaries").select("*").eq("class_id", class_id).eq("term", term).execute().data

    return {
        "students": students,
        "subjects": subjects,
        "marks": marks,
        "summaries": summaries
    }

@router.post("/publish")
def save_and_publish_marks(payload: BulkMarksRequest):
    for m in payload.marks:
        grade = calculate_sl_grade(m.score, m.is_absent)
        row = {
            "student_id": m.student_id,
            "subject_id": m.subject_id,
            "term": payload.term,
            "score": None if m.is_absent else m.score,
            "is_absent": m.is_absent,
            "grade": grade
        }
        supabase.table("marks").upsert(row, on_conflict="student_id,subject_id,term").execute()

    ranked_summaries = recalculate_and_save_rankings(payload.class_id, payload.term, payload.remarks)
    return {"message": "Term results published and ranked successfully", "summaries": ranked_summaries}

@router.get("/report-card/{student_id}/{term}")
def get_student_report_card(student_id: str, term: str):
    student_res = supabase.table("users").select("id, name, admission_no, class_id").eq("id", student_id).execute()
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student not found")

    subjects = supabase.table("subjects").select("*").order("display_order").execute().data
    marks = supabase.table("marks").select("*").eq("student_id", student_id).eq("term", term).execute().data
    summary = supabase.table("report_summaries").select("*").eq("student_id", student_id).eq("term", term).execute().data
    appeals = supabase.table("appeals").select("*").eq("student_id", student_id).eq("term", term).execute().data

    marks_by_sub = {m["subject_id"]: m for m in marks}
    subject_rows = []
    for sub in subjects:
        m = marks_by_sub.get(sub["id"])
        subject_rows.append({
            "subject_id": sub["id"],
            "subject_code": sub["subject_code"],
            "subject_name": sub["name"],
            "mark_id": m["id"] if m else None,
            "score": m["score"] if m else None,
            "is_absent": m["is_absent"] if m else False,
            "grade": m["grade"] if m else "-"
        })

    return {
        "student": student_res.data[0],
        "term": term,
        "subjects": subject_rows,
        "summary": summary[0] if summary else None,
        "appeals": appeals
    }