# DeadlinePilot

DeadlinePilot is an AI-powered productivity companion designed to help you organize tasks, break them down into actionable subtasks, estimate focus times, prioritize schedules, and keep up with deadlines.

This is a full-stack project built with FastAPI (Python) and React + Tailwind CSS v4 (TypeScript).

## Project Structure

```
DeadlinePilot/
├── backend/            # FastAPI + SQLite + SQLAlchemy
│   ├── app/
│   │   ├── database.py   # SQLAlchemy configuration
│   │   ├── models.py     # SQLAlchemy models (Task, Subtask)
│   │   ├── schemas.py    # Pydantic validation schemas
│   │   ├── crud.py       # DB CRUD helper operations
│   │   ├── main.py       # FastAPI application entrypoint
│   │   ├── routers/
│   │   │   └── tasks.py  # Tasks endpoints
│   │   └── services/
│   │       └── gemini.py # Gemini AI service placeholder
│   ├── requirements.txt  # Python backend dependencies
│   └── run.py            # Simple runner script for FastAPI
├── frontend/           # Vite + React (TS) + Tailwind CSS v4
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskDashboard.tsx # Main dashboard page
│   │   │   ├── TaskCard.tsx      # Task item component (with subtasks)
│   │   │   └── TaskForm.tsx      # Add task modal
│   │   ├── api.ts        # Client api helper
│   │   ├── App.tsx       # Main page container
│   │   ├── index.css     # Tailwind v4 directives and globals
│   │   └── main.tsx      # React Vite mounting entrypoint
│   ├── index.html        # Root HTML file
│   └── package.json      # Frontend package configuration
└── README.md           # This document
```

## Setup & Running Instructions

### 1. Run the Backend (FastAPI)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   python run.py
   ```
   The backend will be running at [http://localhost:8000](http://localhost:8000). You can access the API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Run the Frontend (React + Tailwind CSS v4)

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at [http://localhost:5173](http://localhost:5173). Open this URL in your browser to interact with DeadlinePilot.
