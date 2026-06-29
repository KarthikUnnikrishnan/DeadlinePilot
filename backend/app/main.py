from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import tasks, schedule

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DeadlinePilot API",
    description="Backend API for DeadlinePilot - AI-Powered Productivity Companion",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",  # default Vite development port
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(tasks.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to DeadlinePilot API. Use /docs for API documentation.",
        "status": "healthy"
    }
