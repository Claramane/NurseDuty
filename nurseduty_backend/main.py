from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
    __root__: List[FormulaSchedule]

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




def load_nurses():
    with open('data/nurses.json', 'r') as f:
        return json.load(f)

def save_nurses(nurses):
    with open('data/nurses.json', 'w') as f:
        json.dump(nurses, f, indent=2)

def ensure_data_directory():
    if not os.path.exists('data'):
        os.makedirs('data')

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

# @app.get("/api/formula/{formula_type}")
# async def get_formula_schedule(formula_type: str):
#     formulas = load_json('data/formula_schedules.json')
#     for formula in formulas:
#         if isinstance(formula, dict) and formula.get("type") == formula_type:
#             return formula
#     return {"type": formula_type, "formula_data": []}

@app.post("/api/formula")
async def save_all_formula_schedules(schedules: AllFormulaSchedules):
    logger.info(f"Received schedules: {schedules}")
    formulas = schedules.__root__
    save_json('data/formula_schedules.json', [formula.dict() for formula in formulas])
    logger.info("Schedules saved successfully")
    return {"message": "All formula schedules saved successfully"}

@app.get("/api/formula")
async def get_all_formula_schedules():
    return load_json('data/formula_schedules.json')

@app.post("/api/settings")
async def save_settings(settings: Settings):
    save_json('data/settings.json', settings.dict())
    return {"message": "Settings saved successfully"}

@app.get("/api/settings")
async def get_settings():
    settings = load_json('data/settings.json')
    if settings:
        return settings
    raise HTTPException(status_code=404, detail="Settings not found")


@app.post("/api/monthly-schedule")
async def save_monthly_schedule(schedule: MonthlySchedule):
    file_path = 'data/monthly_schedule.json'
    
    # Ensure data directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Read existing data (if file exists)
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}
    
    # Update or add new monthly schedule
    year_key = str(schedule.year)
    if year_key not in existing_data:
        existing_data[year_key] = {}
    existing_data[year_key][str(schedule.month)] = schedule.dict()
    
    # Save updated data
    with open(file_path, 'w') as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    
    return {"message": "Monthly schedule saved successfully"}

@app.get("/api/monthly-schedule/{year}/{month}")
async def get_monthly_schedule(year: int, month: int):
    file_path = 'data/monthly_schedule.json'
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="No monthly schedules found")
    
    with open(file_path, 'r') as f:
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
        'data/formula_schedules.json',
        'data/settings.json'
    ]
    for file in files_to_initialize:
        if not os.path.exists(file):
            if file == 'data/formula_schedules.json':
                save_json(file, [
                    {"type": "regular", "formula_data": []},
                    {"type": "por", "formula_data": []},
                    {"type": "leader", "formula_data": []},
                    {"type": "secretary", "formula_data": []}
                ])
            else:
                save_json(file, {})

@app.on_event("startup")
async def startup_event():
    initialize_data_files()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)