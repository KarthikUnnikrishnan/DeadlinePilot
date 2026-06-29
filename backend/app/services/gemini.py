import os
import json
import google.generativeai as genai
from typing import List, Dict, Any

def get_mock_breakdown(title: str) -> Dict[str, Any]:
    title_lower = title.lower()
    
    if "report" in title_lower or "paper" in title_lower or "essay" in title_lower:
        priority = "high"
        subtasks = [
            {"title": "Research topic and gather resources", "estimated_time_minutes": 60, "order_index": 1},
            {"title": "Outline document structure", "estimated_time_minutes": 30, "order_index": 2},
            {"title": "Write introduction and body paragraphs", "estimated_time_minutes": 120, "order_index": 3},
            {"title": "Draft conclusion and bibliography", "estimated_time_minutes": 45, "order_index": 4},
            {"title": "Review, edit, and proofread draft", "estimated_time_minutes": 40, "order_index": 5}
        ]
    elif "code" in title_lower or "build" in title_lower or "develop" in title_lower or "program" in title_lower:
        priority = "high"
        subtasks = [
            {"title": "Define requirements and architecture design", "estimated_time_minutes": 45, "order_index": 1},
            {"title": "Set up project repository and initial config", "estimated_time_minutes": 30, "order_index": 2},
            {"title": "Implement core functional logic", "estimated_time_minutes": 180, "order_index": 3},
            {"title": "Write unit tests and debug code", "estimated_time_minutes": 60, "order_index": 4},
            {"title": "Refactor codebase and document features", "estimated_time_minutes": 45, "order_index": 5}
        ]
    elif "clean" in title_lower or "room" in title_lower or "house" in title_lower:
        priority = "low"
        subtasks = [
            {"title": "Declutter surfaces and throw away trash", "estimated_time_minutes": 15, "order_index": 1},
            {"title": "Dust shelves, tables, and electronics", "estimated_time_minutes": 20, "order_index": 2},
            {"title": "Vacuum carpets and mop hard floors", "estimated_time_minutes": 30, "order_index": 3},
            {"title": "Organize drawers and closet space", "estimated_time_minutes": 45, "order_index": 4}
        ]
    else:
        priority = "medium"
        subtasks = [
            {"title": "Analyze main task objective & define milestones", "estimated_time_minutes": 20, "order_index": 1},
            {"title": "Gather required tools, templates or resources", "estimated_time_minutes": 15, "order_index": 2},
            {"title": "Execute first major phase (Core execution)", "estimated_time_minutes": 90, "order_index": 3},
            {"title": "Review first draft / initial results", "estimated_time_minutes": 30, "order_index": 4},
            {"title": "Polishing, final adjustments and completion", "estimated_time_minutes": 25, "order_index": 5}
        ]
        
    return {"priority": priority, "subtasks": subtasks}

def generate_subtasks_for_task(title: str, description: str = "") -> Dict[str, Any]:
    """
    Calls Gemini API to break a task down into subtasks and suggest priority.
    Falls back gracefully to a mock breakdown if no key is configured or requests fail.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found. Using mock generator.")
        return get_mock_breakdown(title)
        
    try:
        genai.configure(api_key=api_key)
        # Use gemini-1.5-flash for speed, cost, and reliability
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        You are a task analysis assistant. Break down the following task title and description.
        Task Title: {title}
        Task Description: {description}

        Perform the following steps:
        1. Break the task down into a sequential list of logical subtasks (usually 3 to 7 items).
        2. Estimate the focus time for each subtask in minutes.
        3. Suggest a priority level for the overall task ('low', 'medium', or 'high') based on its description and urgency.

        You MUST respond ONLY with a JSON object matching this schema:
        {{
          "priority": "low" | "medium" | "high",
          "subtasks": [
            {{
              "title": "Subtask name",
              "estimated_time_minutes": integer
            }}
          ]
        }}
        """
        
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        result = json.loads(response.text.strip())
        
        # Validate format
        if "priority" not in result or "subtasks" not in result:
            raise ValueError("Response missing required keys")
            
        # Add order_index
        for idx, subtask in enumerate(result["subtasks"]):
            subtask["order_index"] = idx + 1
            if "estimated_time_minutes" not in subtask or not isinstance(subtask["estimated_time_minutes"], int):
                subtask["estimated_time_minutes"] = 30
                
        # Validate priority value
        if result["priority"] not in ["low", "medium", "high"]:
            result["priority"] = "medium"
            
        return result
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back to mock generator.")
        return get_mock_breakdown(title)
