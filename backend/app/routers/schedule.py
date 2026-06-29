from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import datetime
import os
import json
import google.generativeai as genai
from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/schedule",
    tags=["schedule"]
)

@router.get("/settings", response_model=schemas.UserSettingsResponse)
def get_user_settings(db: Session = Depends(get_db)):
    settings = db.query(models.UserSettings).filter(models.UserSettings.id == 1).first()
    if not settings:
        settings = models.UserSettings(
            id=1,
            wake_time="08:00",
            sleep_time="23:00",
            peak_start="09:00",
            peak_end="12:00"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=schemas.UserSettingsResponse)
def update_user_settings(settings_update: schemas.UserSettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(models.UserSettings).filter(models.UserSettings.id == 1).first()
    if not settings:
        settings = models.UserSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    update_data = settings_update.model_dump(exclude_unset=True) if hasattr(settings_update, 'model_dump') else settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
        
    db.commit()
    db.refresh(settings)
    return settings

def calculate_local_schedule(active_tasks, settings: models.UserSettings) -> List[models.ScheduleItem]:
    # Calculate timezone offset to convert deadlines from UTC to local
    now_local = datetime.datetime.now()
    now_utc = datetime.datetime.utcnow()
    tz_offset = now_local - now_utc

    # 1. Sort parent tasks by urgency (deadline first, then priority)
    def task_urgency_key(task):
        deadline_local = (task.deadline + tz_offset) if task.deadline else datetime.datetime.max
        priority_val = 2
        if task.priority == "high":
            priority_val = 1
        elif task.priority == "low":
            priority_val = 3
        return (deadline_local, priority_val)
        
    sorted_tasks = sorted(active_tasks, key=task_urgency_key)
    
    # 2. Check Panic Mode and Deadline Compression
    # Panic Mode: active if any active task's deadline is in the past or within 24 hours
    panic_mode_active = False
    for task in sorted_tasks:
        if task.deadline:
            deadline_local = task.deadline + tz_offset
            time_left = deadline_local - now_local
            if time_left.total_seconds() < 86400:  # < 24 hours (including overdue)
                panic_mode_active = True
                break

    # Action: Exclude low priority tasks in Panic Mode
    if panic_mode_active:
        sorted_tasks = [t for t in sorted_tasks if t.priority != "low"]

    compression_active = False
    if not panic_mode_active:
        # Compression Mode: active if any active task has a deadline within 3 days
        for task in sorted_tasks:
            if task.deadline:
                deadline_local = task.deadline + tz_offset
                time_left = deadline_local - now_local
                if time_left.total_seconds() < 86400 * 3:  # 3 days
                    compression_active = True
                    break

    # Determine scheduler constraints based on mode
    if panic_mode_active:
        break_minutes = 0
        daily_limit_minutes = 720  # Maximize focus limit to 12 hours
    elif compression_active:
        break_minutes = 5
        daily_limit_minutes = 600  # 10 hours
    else:
        break_minutes = 10
        daily_limit_minutes = 360  # 6 hours
    
    # 3. Setup start time
    wake_time_str = settings.wake_time or "08:00"
    sleep_time_str = settings.sleep_time or "23:00"
    peak_start_str = settings.peak_start or "09:00"
    peak_end_str = settings.peak_end or "12:00"
    
    try:
        wh, wm = map(int, wake_time_str.split(":"))
        sh, sm = map(int, sleep_time_str.split(":"))
    except:
        wh, wm = 8, 0
        sh, sm = 23, 0

    today_wake = now_local.replace(hour=wh, minute=wm, second=0, microsecond=0)
    today_sleep = now_local.replace(hour=sh, minute=sm, second=0, microsecond=0)
    
    # Check if currently in sleep hours (handles overnight schedules)
    is_sleep_time = False
    if today_wake <= today_sleep:
        is_sleep_time = now_local.time() > today_sleep.time() or now_local.time() < today_wake.time()
    else:
        is_sleep_time = today_sleep.time() < now_local.time() < today_wake.time()

    current_time = now_local
    if is_sleep_time:
        # Move to tomorrow's wake time
        if now_local.time() > today_sleep.time():
            current_time = now_local + datetime.timedelta(days=1)
        current_time = current_time.replace(hour=wh, minute=wm, second=0, microsecond=0)
    else:
        # Start at max(now, today's wake)
        if current_time < today_wake:
            current_time = today_wake
            
    # Round current_time to next 5 minutes
    minutes_to_add = (5 - current_time.minute % 5) % 5
    current_time = current_time + datetime.timedelta(minutes=minutes_to_add)
    current_time = current_time.replace(second=0, microsecond=0)

    # 4. Extract pending subtasks, preserving sequence
    task_subtasks = {}
    for task in sorted_tasks:
        pending = [s for s in task.subtasks if s.status != "completed"]
        if pending:
            task_subtasks[task.id] = pending

    # 5. Define helpers for peak hours and wake hours
    def in_peak_hours(dt: datetime.datetime) -> bool:
        try:
            ps_h, ps_m = map(int, peak_start_str.split(":"))
            pe_h, pe_m = map(int, peak_end_str.split(":"))
        except:
            ps_h, ps_m = 9, 0
            pe_h, pe_m = 12, 0
        p_start = datetime.time(ps_h, ps_m)
        p_end = datetime.time(pe_h, pe_m)
        t = dt.time()
        if p_start <= p_end:
            return p_start <= t <= p_end
        return t >= p_start or t <= p_end

    def in_wake_hours(dt: datetime.datetime) -> bool:
        t = dt.time()
        w_time = datetime.time(wh, wm)
        s_time = datetime.time(sh, sm)
        if w_time <= s_time:
            return w_time <= t <= s_time
        return t >= w_time or t <= s_time

    # 6. Schedule loop
    schedule_items = []
    daily_work_minutes = 0
    current_day = current_time.date()
    
    while task_subtasks:
        # Gather candidate subtasks (first pending subtask of each active task)
        candidates = []
        for t_id in list(task_subtasks.keys()):
            if task_subtasks[t_id]:
                candidates.append((t_id, task_subtasks[t_id][0]))
            else:
                del task_subtasks[t_id]
                
        if not candidates:
            break
            
        # Separate hard and easy candidates
        hard_candidates = []
        easy_candidates = []
        
        for t_id, subtask in candidates:
            parent_task = next(t for t in sorted_tasks if t.id == t_id)
            is_hard = parent_task.priority == "high" or subtask.estimated_time_minutes >= 45
            if is_hard:
                hard_candidates.append((t_id, subtask, parent_task))
            else:
                easy_candidates.append((t_id, subtask, parent_task))
                
        # Select subtask depending on whether we are in panic mode
        selected = None
        if panic_mode_active:
            # Panic mode: schedule consecutively starting from the most urgent task.
            # The candidates list is already sorted by task urgency because task_subtasks is formed
            # in sorted_tasks order. We select candidates[0] which is the first pending subtask of the
            # most urgent task, maximizing focus blocks by fully completing it before moving on.
            t_id, subtask = candidates[0]
            parent_task = next(t for t in sorted_tasks if t.id == t_id)
            selected = (t_id, subtask, parent_task)
        else:
            # Normal scheduling interleaves hard/easy tasks based on peak hours
            is_peak = in_peak_hours(current_time)
            if is_peak:
                if hard_candidates:
                    selected = hard_candidates[0]
                else:
                    selected = easy_candidates[0]
            else:
                if easy_candidates:
                    selected = easy_candidates[0]
                else:
                    selected = hard_candidates[0]
                
        t_id, subtask, parent_task = selected
        duration = subtask.estimated_time_minutes or 30
        
        # Check daily work limits (Avoid Overload)
        if daily_work_minutes + duration > daily_limit_minutes:
            # Move to next day's wake time
            current_time = current_time + datetime.timedelta(days=1)
            current_time = current_time.replace(hour=wh, minute=wm, second=0, microsecond=0)
            current_day = current_time.date()
            daily_work_minutes = 0
            continue
            
        # Check if task crosses into sleep hours
        end_time = current_time + datetime.timedelta(minutes=duration)
        if not in_wake_hours(end_time):
            # Move to next day's wake time
            current_time = current_time + datetime.timedelta(days=1)
            current_time = current_time.replace(hour=wh, minute=wm, second=0, microsecond=0)
            current_day = current_time.date()
            daily_work_minutes = 0
            continue
            
        # Determine reason details
        reason_parts = []
        if panic_mode_active:
            reason_parts.append("🚨 PANIC MODE: Emergency focus block. Low-priority tasks suspended. Breaks eliminated for consecutive focus.")
        elif compression_active:
            reason_parts.append("Deadline is near! Compressed schedule applied (shorter breaks, extended limit).")
        
        # Add peak hours reasoning if in normal/compression mode
        if not panic_mode_active:
            is_peak = in_peak_hours(current_time)
            if is_peak and (parent_task.priority == "high" or duration >= 45):
                reason_parts.append("Hard task scheduled during peak productivity hours.")
            else:
                reason_parts.append(f"Scheduled based on task priority ({parent_task.priority}).")
            
        if parent_task.deadline:
            deadline_local = parent_task.deadline + tz_offset
            days_left = (deadline_local - now_local).days
            if days_left < 0:
                reason_parts.append("Task is overdue!")
            elif days_left == 0:
                reason_parts.append("Deadline is TODAY!")
            else:
                reason_parts.append(f"Deadline in {days_left} days.")
        
        reason = " ".join(reason_parts)
        
        start_str = current_time.strftime("%I:%M %p")
        end_str = end_time.strftime("%I:%M %p")
        day_str = current_time.strftime("%b %d")
        time_slot = f"{day_str}, {start_str} - {end_str}"
        
        item = models.ScheduleItem(
            task_id=parent_task.id,
            subtask_id=subtask.id,
            time_slot=time_slot,
            task_title=parent_task.title,
            subtask_title=subtask.title,
            duration_minutes=duration,
            reason=reason,
            start_time=current_time,
            end_time=end_time
        )
        schedule_items.append(item)
        
        # Pop subtask and update time
        task_subtasks[t_id].pop(0)
        if not task_subtasks[t_id]:
            del task_subtasks[t_id]
            
        current_time = end_time + datetime.timedelta(minutes=break_minutes)
        daily_work_minutes += duration
        
    return schedule_items

@router.get("", response_model=List[schemas.ScheduleItemResponse])
def generate_daily_schedule(db: Session = Depends(get_db)):
    # 1. Fetch user settings
    settings = db.query(models.UserSettings).filter(models.UserSettings.id == 1).first()
    if not settings:
        settings = models.UserSettings(
            id=1,
            wake_time="08:00",
            sleep_time="23:00",
            peak_start="09:00",
            peak_end="12:00"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # 2. Fetch active tasks with pending subtasks
    active_tasks = db.query(models.Task).filter(models.Task.status != "completed").all()
    tasks_with_subtasks = [t for t in active_tasks if any(s.status != "completed" for s in t.subtasks)]
    
    now_local = datetime.datetime.now()
    now_utc = datetime.datetime.utcnow()
    tz_offset = now_local - now_utc
    
    # Calculate Panic Mode
    panic_mode_active = False
    for task in tasks_with_subtasks:
        if task.deadline:
            deadline_local = task.deadline + tz_offset
            if (deadline_local - now_local).total_seconds() < 86400:
                panic_mode_active = True
                break
                
    if panic_mode_active:
        # Suspend low priority tasks in Panic Mode
        tasks_with_subtasks = [t for t in tasks_with_subtasks if t.priority != "low"]
    
    if not tasks_with_subtasks:
        # Clear schedule items in database and return empty list
        db.query(models.ScheduleItem).delete()
        db.commit()
        return []
        
    api_key = os.getenv("GEMINI_API_KEY")
    schedule_items = []
    
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            # Format tasks data for Gemini
            tasks_list = []
            for task in tasks_with_subtasks:
                pending_subtasks = [
                    {"id": s.id, "title": s.title, "estimated_time_minutes": s.estimated_time_minutes}
                    for s in task.subtasks if s.status != "completed"
                ]
                deadline_local = (task.deadline + tz_offset) if task.deadline else None
                tasks_list.append({
                    "id": task.id,
                    "title": task.title,
                    "description": task.description or "",
                    "deadline_local": deadline_local.isoformat() if deadline_local else "No deadline",
                    "priority": task.priority,
                    "subtasks": pending_subtasks
                })
                
            prompt = f"""
            You are a workspace organization AI scheduler for DeadlinePilot.
            Organize the following tasks and their checklists into a daily schedule.
            
            Current Time (Local): {now_local.isoformat()}
            Wake Time: {settings.wake_time}
            Sleep Time: {settings.sleep_time}
            Peak Productivity Hours: {settings.peak_start} to {settings.peak_end}
            Panic Mode: {"ACTIVE" if panic_mode_active else "INACTIVE"}
            
            Tasks to schedule:
            {json.dumps(tasks_list, indent=2)}
            
            Rules:
            1. Urgent tasks first: prioritize closer deadlines and higher priority tasks (high > medium > low).
            2. Sequence subtasks logically: a subtask cannot start before the previous subtasks of the same task are finished.
            3. Hard tasks in peak hours: schedule hard subtasks (high task priority or subtask duration >= 45 min) during peak productivity hours when possible. Easy subtasks should be scheduled during non-peak hours when possible.
            4. Breaks: Add a 10-minute break between subtasks.
            5. Avoid overload: Don't schedule tasks during sleep hours. Do not exceed a daily focus limit of 6 hours (360 minutes). Rollover remaining tasks to the next day's wake time.
            6. Panic Mode (if ACTIVE): Exclude low-priority tasks entirely. Maximize focus blocks by scheduling subtasks of critical tasks consecutively (completing one task's checklist fully before starting another). Set breaks to 0 minutes, and increase the daily focus limit to 12 hours (720 minutes). Tag each item's reason starting with '🚨 PANIC MODE:'.
            7. Deadline compression (if Panic Mode is INACTIVE but a task has a deadline within 3 days): compress the schedule: reduce breaks to 5 minutes, increase the daily focus limit to 10 hours (600 minutes).
            8. Reschedule past incomplete items: Start scheduling from the current local time or the next wake time.
            
            Respond ONLY with a JSON list matching this schema:
            [
              {{
                "task_id": 1,
                "subtask_id": 2,
                "time_slot": "Jun 29, 09:00 AM - 09:30 AM",
                "task_title": "Parent task title",
                "subtask_title": "Subtask title description",
                "duration_minutes": 30,
                "reason": "Explain scheduling reason (e.g. priority, peak hour, compressed breaks, etc.)",
                "start_time": "2026-06-29T09:00:00",
                "end_time": "2026-06-29T09:30:00"
              }}
            ]
            """
            
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            result = json.loads(response.text.strip())
            if isinstance(result, list):
                for item in result:
                    start_t = datetime.datetime.fromisoformat(item["start_time"])
                    end_t = datetime.datetime.fromisoformat(item["end_time"])
                    
                    db_item = models.ScheduleItem(
                        task_id=item.get("task_id"),
                        subtask_id=item.get("subtask_id"),
                        time_slot=item["time_slot"],
                        task_title=item["task_title"],
                        subtask_title=item["subtask_title"],
                        duration_minutes=item["duration_minutes"],
                        reason=item["reason"],
                        start_time=start_t,
                        end_time=end_t
                    )
                    schedule_items.append(db_item)
            else:
                raise ValueError("Expected a list of schedule items from Gemini")
                
        except Exception as e:
            print(f"Error compiling schedule with Gemini: {e}. Using fallback algorithm.")
            schedule_items = calculate_local_schedule(tasks_with_subtasks, settings)
    else:
        schedule_items = calculate_local_schedule(tasks_with_subtasks, settings)

    # 3. Store in database: clear previous and write new
    db.query(models.ScheduleItem).delete()
    for item in schedule_items:
        db.add(item)
    db.commit()

    # 4. Fetch from database to return
    stored_schedule = db.query(models.ScheduleItem).order_by(models.ScheduleItem.start_time).all()
    return stored_schedule

