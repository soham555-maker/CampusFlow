from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(
    title="CampusFlow API",
    description="Backend API for CampusFlow",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import timetable

@app.get("/")
def read_root():
    return {"message": "Welcome to CampusFlow API"}

app.include_router(timetable.router)
