from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, marks, appeals

app = FastAPI(
    title="Sri Lankan School Report Card & Mark Appeal API",
    version="1.0.0"
)

# Allow our Next.js frontend (localhost:3000) to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(marks.router)
app.include_router(appeals.router)

@app.get("/")
def health_check():
    return {"status": "online", "system": "SL School Automated Report Card API"}