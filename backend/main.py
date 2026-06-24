import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(
    title="CampusFlow API",
    description="Backend API for CampusFlow campus management platform",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
CORS_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global error handler for unhandled exceptions ────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
from routers import timetable_slots, students, teachers, subjects, terms, classrooms, classes, announcements, assignments, marks

app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(subjects.router)
app.include_router(terms.router)
app.include_router(classrooms.router)
app.include_router(classes.router)
app.include_router(announcements.router)
app.include_router(assignments.router)
app.include_router(marks.router)
app.include_router(timetable_slots.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "service": "CampusFlow API"}
