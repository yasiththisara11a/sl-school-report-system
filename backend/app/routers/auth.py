from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models import LoginRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
def login(req: LoginRequest):
    if req.role == "teacher":
        res = supabase.table("users").select("*").eq("role", "teacher").eq("email", req.identifier.strip()).execute()
    else:
        res = supabase.table("users").select("*").eq("role", "student").eq("admission_no", req.identifier.strip().upper()).execute()

    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid credentials or user not found")

    user = res.data[0]
    if user["password_hash"] != req.password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    return {
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "admission_no": user["admission_no"],
        "email": user["email"],
        "class_id": user["class_id"]
    }