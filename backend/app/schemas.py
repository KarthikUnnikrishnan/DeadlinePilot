from pydantic import BaseModel, field_serializer
from typing import List, Optional
from datetime import datetime, timezone

class SubtaskBase(BaseModel):
    title: str
    estimated_time_minutes: int = 30
    status: str = "pending"
    order_index: int = 0

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    estimated_time_minutes: Optional[int] = None
    status: Optional[str] = None
    order_index: Optional[int] = None

class SubtaskResponse(SubtaskBase):
    id: int
    task_id: int

    class Config:
        from_attributes = True
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: str = "medium"
    status: str = "pending"

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = "medium"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    subtasks: List[SubtaskResponse] = []
    risk_level: str
    risk_message: Optional[str] = None

    @field_serializer('deadline')
    def serialize_deadline(self, v: Optional[datetime]) -> Optional[str]:
        if v is None:
            return None
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat()
        return v.isoformat()

    @field_serializer('created_at')
    def serialize_created_at(self, v: datetime) -> str:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat()
        return v.isoformat()

    class Config:
        from_attributes = True
        orm_mode = True

class UserSettingsBase(BaseModel):
    wake_time: str
    sleep_time: str
    peak_start: str
    peak_end: str

class UserSettingsUpdate(BaseModel):
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    peak_start: Optional[str] = None
    peak_end: Optional[str] = None

class UserSettingsResponse(UserSettingsBase):
    id: int
    class Config:
        from_attributes = True
        orm_mode = True

class ScheduleItemResponse(BaseModel):
    id: int
    task_id: Optional[int] = None
    subtask_id: Optional[int] = None
    time_slot: str
    task_title: str
    subtask_title: str
    duration_minutes: int
    reason: Optional[str] = None
    start_time: datetime
    end_time: datetime

    @field_serializer('start_time')
    def serialize_start_time(self, v: datetime) -> str:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat()
        return v.isoformat()

    @field_serializer('end_time')
    def serialize_end_time(self, v: datetime) -> str:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat()
        return v.isoformat()

    class Config:
        from_attributes = True
        orm_mode = True
