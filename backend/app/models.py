from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, object_session
import datetime
from .database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high
    status = Column(String, default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subtasks = relationship(
        "Subtask",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Subtask.order_index"
    )

    def _calculate_remaining_wake_hours(self, start_dt: datetime.datetime, end_dt: datetime.datetime, wake_time_str: str, sleep_time_str: str) -> float:
        if start_dt >= end_dt:
            return 0.0
            
        try:
            wh, wm = map(int, wake_time_str.split(":"))
            sh, sm = map(int, sleep_time_str.split(":"))
        except:
            wh, wm = 8, 0
            sh, sm = 23, 0
            
        wake_minutes_per_day = 0
        if sh >= wh:
            wake_minutes_per_day = (sh * 60 + sm) - (wh * 60 + wm)
        else:
            wake_minutes_per_day = (1440 - (wh * 60 + wm)) + (sh * 60 + sm)
            
        total_wake_minutes = 0.0
        curr_date = start_dt.date()
        end_date = end_dt.date()
        
        if curr_date == end_date:
            wake_start = datetime.datetime.combine(curr_date, datetime.time(wh, wm))
            if sh >= wh:
                wake_end = datetime.datetime.combine(curr_date, datetime.time(sh, sm))
            else:
                wake_end = datetime.datetime.combine(curr_date + datetime.timedelta(days=1), datetime.time(sh, sm))
                
            overlap_start = max(start_dt, wake_start)
            overlap_end = min(end_dt, wake_end)
            
            if overlap_start < overlap_end:
                total_wake_minutes = (overlap_end - overlap_start).total_seconds() / 60.0
        else:
            # First day
            wake_start_today = datetime.datetime.combine(curr_date, datetime.time(wh, wm))
            if sh >= wh:
                wake_end_today = datetime.datetime.combine(curr_date, datetime.time(sh, sm))
            else:
                wake_end_today = datetime.datetime.combine(curr_date + datetime.timedelta(days=1), datetime.time(sh, sm))
                
            overlap_start = max(start_dt, wake_start_today)
            overlap_end = wake_end_today
            if overlap_start < overlap_end:
                total_wake_minutes += (overlap_end - overlap_start).total_seconds() / 60.0
                
            # Intermediate full days
            temp_date = curr_date + datetime.timedelta(days=1)
            while temp_date < end_date:
                total_wake_minutes += wake_minutes_per_day
                temp_date += datetime.timedelta(days=1)
                
            # Last day
            wake_start_last = datetime.datetime.combine(end_date, datetime.time(wh, wm))
            if sh >= wh:
                wake_end_last = datetime.datetime.combine(end_date, datetime.time(sh, sm))
            else:
                wake_end_last = datetime.datetime.combine(end_date + datetime.timedelta(days=1), datetime.time(sh, sm))
                
            overlap_start = wake_start_last
            overlap_end = min(end_dt, wake_end_last)
            if overlap_start < overlap_end:
                total_wake_minutes += (overlap_end - overlap_start).total_seconds() / 60.0
                
        return total_wake_minutes / 60.0

    @property
    def risk_level(self) -> str:
        if self.status == "completed":
            return "none"
        if not self.deadline:
            return "safe"
            
        now_local = datetime.datetime.now()
        now_utc = datetime.datetime.utcnow()
        tz_offset = now_local - now_utc
        
        deadline_local = self.deadline + tz_offset
        if deadline_local < now_local:
            return "critical"
            
        pending_minutes = sum(s.estimated_time_minutes for s in self.subtasks if s.status != "completed")
        if not self.subtasks:
            pending_minutes = 30
        pending_hours = pending_minutes / 60.0
        
        wake_time_str = "08:00"
        sleep_time_str = "23:00"
        
        session = object_session(self)
        if session:
            from .models import UserSettings
            settings = session.query(UserSettings).filter(UserSettings.id == 1).first()
            if settings:
                wake_time_str = settings.wake_time or "08:00"
                sleep_time_str = settings.sleep_time or "23:00"
                
        remaining_wake_hours = self._calculate_remaining_wake_hours(now_local, deadline_local, wake_time_str, sleep_time_str)
        
        if remaining_wake_hours <= 0 or remaining_wake_hours < pending_hours:
            return "critical"
        elif pending_hours >= remaining_wake_hours * 0.8:
            return "high"
        elif pending_hours >= remaining_wake_hours * 0.4:
            return "medium"
        return "safe"

    @property
    def risk_message(self) -> str:
        level = self.risk_level
        if level == "none":
            return ""
        if level == "safe" and not self.deadline:
            return "On Track: No deadline set."
            
        now_local = datetime.datetime.now()
        now_utc = datetime.datetime.utcnow()
        tz_offset = now_local - now_utc
        
        deadline_local = self.deadline + tz_offset
        
        if deadline_local < now_local:
            return "Critical Risk: Task is overdue!"
            
        pending_minutes = sum(s.estimated_time_minutes for s in self.subtasks if s.status != "completed")
        if not self.subtasks:
            pending_minutes = 30
        pending_hours = pending_minutes / 60.0
        
        wake_time_str = "08:00"
        sleep_time_str = "23:00"
        
        session = object_session(self)
        if session:
            from .models import UserSettings
            settings = session.query(UserSettings).filter(UserSettings.id == 1).first()
            if settings:
                wake_time_str = settings.wake_time or "08:00"
                sleep_time_str = settings.sleep_time or "23:00"
                
        remaining_wake_hours = self._calculate_remaining_wake_hours(now_local, deadline_local, wake_time_str, sleep_time_str)
        
        h_needed = round(pending_hours, 1)
        h_avail = round(remaining_wake_hours, 1)
        
        if level == "critical":
            if remaining_wake_hours <= 0:
                return f"Critical Risk: Deadline is extremely near, no wake hours left to work!"
            return f"Critical Risk: Needs {h_needed}h focus, but only {h_avail}h of wake time remains! You will miss this deadline."
        elif level == "high":
            return f"High Risk: Heavy workload ({h_needed}h) for the remaining wake hours ({h_avail}h). You may miss this deadline."
        elif level == "medium":
            return f"Medium Risk: Checklist ({h_needed}h) is tight for the remaining wake hours ({h_avail}h)."
        return f"Safe: Workload ({h_needed}h) is well within remaining wake hours ({h_avail}h)."

class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    estimated_time_minutes = Column(Integer, default=30)
    status = Column(String, default="pending")  # pending, completed
    order_index = Column(Integer, default=0)

    task = relationship("Task", back_populates="subtasks")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    wake_time = Column(String, default="08:00")
    sleep_time = Column(String, default="23:00")
    peak_start = Column(String, default="09:00")
    peak_end = Column(String, default="12:00")

class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    subtask_id = Column(Integer, ForeignKey("subtasks.id", ondelete="CASCADE"), nullable=True)
    time_slot = Column(String, nullable=False)
    task_title = Column(String, nullable=False)
    subtask_title = Column(String, nullable=False)
    duration_minutes = Column(Integer, default=30)
    reason = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    task = relationship("Task")
    subtask = relationship("Subtask")
