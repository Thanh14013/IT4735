"""
Simulation API Router
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.simulation import simulation_manager

router = APIRouter(prefix="/simulation", tags=["Simulation"])

class SimulationStart(BaseModel):
    scenario: str

@router.post("/start")
async def start_simulation(payload: SimulationStart):
    """Start simulation with a scenario"""
    valid_scenarios = ["normal", "hot", "cold", "fire", "polluted", "raining"]
    if payload.scenario not in valid_scenarios:
        raise HTTPException(status_code=400, detail=f"Invalid scenario. Must be one of {valid_scenarios}")
    
    simulation_manager.start_simulation(payload.scenario)
    return {"status": "success", "message": f"Simulation started: {payload.scenario}"}

@router.post("/stop")
async def stop_simulation():
    """Stop simulation"""
    simulation_manager.stop_simulation()
    return {"status": "success", "message": "Simulation stopped"}

@router.get("/status")
async def get_simulation_status():
    """Get current simulation status"""
    return {
        "is_active": simulation_manager.is_active,
        "current_scenario": simulation_manager.current_scenario
    }
