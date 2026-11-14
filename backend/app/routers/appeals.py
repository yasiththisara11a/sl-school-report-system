from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models import AppealCreateRequest, AppealResolveRequest
from app.services.grading import calculate_sl_grade
from app.routers.marks import recalculate_and_save_rankings

router = APIRouter(prefix="/api/appeals", tags=["Mark Appeals"])

@router.post("/")
def create_appeal(req: AppealCreateRequest):
    existing = supabase.table("appeals").select("*").eq("mark_id", req.mark_id).eq("status", "Pending").execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="A pending appeal already exists for this subject mark.")

    res = supabase.table("appeals").insert({
        "mark_id": req.mark_id,
        "student_id": req.student_id,
        "subject_name": req.subject_name,
        "term": req.term,
        "current_score": req.current_score,
        "reason": req.reason,
        "status": "Pending"
    }).execute()
    return {"message": "Appeal submitted successfully", "appeal": res.data[0]}

@router.get("/teacher/{term}")
def list_appeals_for_term(term: str):
    appeals = supabase.table("appeals").select("*, users(name, admission_no, class_id)").eq("term", term).order("created_at", desc=True).execute()
    return appeals.data

@router.put("/{appeal_id}/resolve")
def resolve_appeal(appeal_id: str, req: AppealResolveRequest):
    appeal_res = supabase.table("appeals").select("*").eq("id", appeal_id).execute()
    if not appeal_res.data:
        raise HTTPException(status_code=404, detail="Appeal not found")

    appeal = appeal_res.data[0]

    # If Approved (Resolved) with a new score, update the mark and recalculate class ranks automatically
    if req.status == "Resolved" and req.new_score is not None:
        new_grade = calculate_sl_grade(req.new_score, is_absent=False)
        supabase.table("marks").update({
            "score": req.new_score,
            "is_absent": False,
            "grade": new_grade
        }).eq("id", appeal["mark_id"]).execute()

        recalculate_and_save_rankings("10-A", appeal["term"])

    updated = supabase.table("appeals").update({
        "status": req.status,
        "current_score": req.new_score if (req.status == "Resolved" and req.new_score is not None) else appeal["current_score"],
        "teacher_note": req.teacher_note
    }).eq("id", appeal_id).execute()

    return {"message": f"Appeal {req.status} successfully", "appeal": updated.data[0]}