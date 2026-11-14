from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models import LoginRequest, RegisterRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
def register(req: RegisterRequest):
    clean_id = req.identifier.strip()

    if req.role == "teacher":
        clean_id = clean_id.lower()
        existing = supabase.table("users").select("id").eq("email", clean_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="A teacher with this email already exists.")
        new_user = {
            "name": req.name.strip(),
            "role": "teacher",
            "email": clean_id,
            "admission_no": None,
            "password_hash": req.password,
            "class_id": req.class_id
        }
    else:
        clean_id = clean_id.upper()
        existing = supabase.table("users").select("id").eq("admission_no", clean_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="A student with this Admission Number already exists.")
        new_user = {
            "name": req.name.strip(),
            "role": "student",
            "email": None,
            "admission_no": clean_id,
            "password_hash": req.password,
            "class_id": req.class_id
        }

    res = supabase.table("users").insert(new_user).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to register user.")

    user = res.data[0]
    return {
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "admission_no": user["admission_no"],
        "email": user["email"],
        "class_id": user["class_id"]
    }

@router.post("/login")
def login(req: LoginRequest):
    if req.role == "teacher":
        res = supabase.table("users").select("*").eq("role", "teacher").eq("email", req.identifier.strip().lower()).execute()
    else:
        res = supabase.table("users").select("*").eq("role", "student").eq("admission_no", req.identifier.strip().upper()).execute()

    if not res.data:
        raise HTTPException(status_code=401, detail="User not found. Please register or check your ID/Email.")

    user = res.data[0]
    if user["password_hash"] != req.password:
        raise HTTPException(status_code=401, detail="Incorrect password.")

    return {
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "admission_no": user["admission_no"],
        "email": user["email"],
        "class_id": user["class_id"]
    }