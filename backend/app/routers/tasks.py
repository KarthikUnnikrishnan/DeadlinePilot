from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database
from ..services import gemini

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.get("", response_model=List[schemas.TaskResponse])
def read_tasks(db: Session = Depends(database.get_db)):
    return crud.get_tasks(db)

@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db)):
    # 1. Create the task in the database
    db_task = crud.create_task(db=db, task=task)
    
    # 2. Call Gemini service to suggest subtasks and priority
    analysis = gemini.generate_subtasks_for_task(db_task.title, db_task.description or "")
    
    # 3. Update task priority based on suggested priority from Gemini
    crud.update_task(db=db, task_id=db_task.id, task_update=schemas.TaskUpdate(priority=analysis["priority"]))
    
    # 4. Insert the generated subtasks
    for subtask_data in analysis["subtasks"]:
        subtask_schema = schemas.SubtaskCreate(
            title=subtask_data["title"],
            estimated_time_minutes=subtask_data["estimated_time_minutes"],
            order_index=subtask_data["order_index"],
            status="pending"
        )
        crud.create_subtask(db=db, subtask=subtask_schema, task_id=db_task.id)
        
    db.refresh(db_task)
    return db_task

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def read_task(task_id: int, db: Session = Depends(database.get_db)):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(database.get_db)):
    db_task = crud.update_task(db, task_id=task_id, task_update=task_update)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_task(db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@router.post("/{task_id}/generate-subtasks", response_model=schemas.TaskResponse)
def generate_subtasks(task_id: int, db: Session = Depends(database.get_db)):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Clear existing subtasks
    for subtask in list(db_task.subtasks):
        crud.delete_subtask(db, subtask_id=subtask.id)
    
    # Generate subtasks using Gemini
    analysis = gemini.generate_subtasks_for_task(db_task.title, db_task.description or "")
    
    # Update priority based on new analysis
    crud.update_task(db=db, task_id=task_id, task_update=schemas.TaskUpdate(priority=analysis["priority"]))
    
    for subtask_data in analysis["subtasks"]:
        subtask_schema = schemas.SubtaskCreate(
            title=subtask_data["title"],
            estimated_time_minutes=subtask_data["estimated_time_minutes"],
            order_index=subtask_data["order_index"],
            status="pending"
        )
        crud.create_subtask(db, subtask=subtask_schema, task_id=task_id)
        
    db.refresh(db_task)
    return db_task

@router.put("/subtasks/{subtask_id}", response_model=schemas.SubtaskResponse)
def update_subtask(subtask_id: int, subtask_update: schemas.SubtaskUpdate, db: Session = Depends(database.get_db)):
    db_subtask = crud.update_subtask(db, subtask_id=subtask_id, subtask_update=subtask_update)
    if db_subtask is None:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return db_subtask

@router.delete("/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(subtask_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_subtask(db, subtask_id=subtask_id)
    if not success:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return None
