from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
from typing import List, Dict, Any, Optional
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NurseUpdate(BaseModel):
    group: int
    active: Optional[bool] = None

class FormulaSchedule(BaseModel):
    type: str
    formula_data: List[Dict[str, Any]]

class AllFormulaSchedules(BaseModel):
    schedules: List[FormulaSchedule]

class Settings(BaseModel):
    regularGroupCount: int
    porGroupCount: int
    leaderGroupCount: int
    secretaryGroupCount: int

class MonthlyScheduleItem(BaseModel):
    name: str
    role: str
    group: int
    shifts: List[str]
    vacationDays: Optional[int] = 0
    accumulatedLeave: Optional[int] = 0

class MonthlySchedule(BaseModel):
    year: int
    month: int
    schedule: List[MonthlyScheduleItem]


def get_data_path(filename: str) -> str:
    """Returns the absolute path to the data file."""
    return os.path.join(os.path.dirname(__file__), 'data', filename)

def load_nurses():
    file_path = get_data_path('nurses.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_nurses(nurses):
    file_path = get_data_path('nurses.json')
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(nurses, f, indent=2)

def ensure_data_directory():
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

def load_json(file_path):
    ensure_data_directory()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_json(file_path, data):
    ensure_data_directory()
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.get("/api/nurses")
async def get_nurses():
    return load_nurses()

@app.put("/api/nurses/{id}")
async def update_nurse(id: int, nurse_update: NurseUpdate):
    nurses_data = load_nurses()
    for nurse in nurses_data['nurses']:
        if nurse['id'] == id:
            if nurse_update.group is not None:
                nurse['group'] = nurse_update.group
            if nurse_update.active is not None:
                nurse['active'] = nurse_update.active
            save_nurses(nurses_data)
            return {"message": "Nurse updated successfully"}
    raise HTTPException(status_code=404, detail="Nurse not found")

@app.post("/api/nurses/reset-groups")
async def reset_nurse_groups():
    nurses_data = load_nurses()
    for nurse in nurses_data['nurses']:
        nurse['group'] = 0
    save_nurses(nurses_data)
    return {"message": "All nurse groups reset to 0"}

@app.post("/api/formula")
async def save_all_formula_schedules(schedules: List[FormulaSchedule]):
    try:
        save_json(get_data_path('formula_schedules.json'), [formula.dict() for formula in schedules])
        logger.info("Schedules saved successfully")
        return {"message": "All formula schedules saved successfully"}
    except Exception as e:
        logger.error(f"Error saving schedules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving schedules: {str(e)}")

@app.get("/api/formula")
async def get_all_formula_schedules():
    return load_json(get_data_path('formula_schedules.json'))

@app.post("/api/settings")
async def save_settings(settings: Settings):
    save_json(get_data_path('settings.json'), settings.dict())
    return {"message": "Settings saved successfully"}

@app.get("/api/settings")
async def get_settings():
    settings = load_json(get_data_path('settings.json'))
    if settings:
        return settings
    raise HTTPException(status_code=404, detail="Settings not found")

@app.post("/api/monthly-schedule")
async def save_monthly_schedule(schedule: MonthlySchedule):
    file_path = get_data_path('monthly_schedule.json')
    
    # Ensure data directory exists
    ensure_data_directory()
    
    # Read existing data (if file exists)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}
    
    # Update or add new monthly schedule
    year_key = str(schedule.year)
    if year_key not in existing_data:
        existing_data[year_key] = {}
    existing_data[year_key][str(schedule.month)] = schedule.dict()
    
    # Save updated data
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    
    return {"message": "Monthly schedule saved successfully"}

@app.get("/api/monthly-schedule/{year}/{month}")
async def get_monthly_schedule(year: int, month: int):
    file_path = get_data_path('monthly_schedule.json')
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="No monthly schedules found")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        all_schedules = json.load(f)
    
    year_str = str(year)
    month_str = str(month)
    
    if year_str in all_schedules and month_str in all_schedules[year_str]:
        return all_schedules[year_str][month_str]
    else:
        raise HTTPException(status_code=404, detail="Schedule for specified month not found")

def initialize_data_files():
    ensure_data_directory()
    files_to_initialize = [
        'formula_schedules.json',
        'settings.json'
    ]
    for file in files_to_initialize:
        file_path = get_data_path(file)
        if not os.path.exists(file_path):
            if file == 'formula_schedules.json':
                save_json(file_path, [
                    {"type": "regular", "formula_data": []},
                    {"type": "por", "formula_data": []},
                    {"type": "leader", "formula_data": []},
                    {"type": "secretary", "formula_data": []}
                ])
            else:
                save_json(file_path, {})

@app.on_event("startup")
async def startup_event():
    initialize_data_files()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6200)