"""
Simulation Manager
Handles generation of fake sensor data based on selected scenarios.
"""
import asyncio
import logging
import random
from datetime import datetime
from typing import Optional

from app.models.aqi_model import aqi_calculator
from app.utils.websocket_manager import manager
from app.config import settings

logger = logging.getLogger(__name__)

class SimulationManager:
    def __init__(self):
        self.is_active = False
        self.current_scenario = "normal"
        self._task: Optional[asyncio.Task] = None
    
    def start_simulation(self, scenario: str):
        """Start simulation with specific scenario"""
        self.current_scenario = scenario
        if not self.is_active:
            self.is_active = True
            logger.info(f"Starting simulation: {scenario}")
            self._task = asyncio.create_task(self._generation_loop())
        else:
            logger.info(f"Switching simulation scenario to: {scenario}")
            
    def stop_simulation(self):
        """Stop simulation"""
        self.is_active = False
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("Simulation stopped")
        
    async def _generation_loop(self):
        """Loop to generate fake data"""
        try:
            while self.is_active:
                data = self._generate_data()
                await self._broadcast_data(data)
                
                # Wait 5 seconds
                await asyncio.sleep(5)
        except asyncio.CancelledError:
            logger.info("Simulation loop cancelled")
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
            self.is_active = False
            
    def _generate_data(self) -> dict:
        """Generate data based on scenario"""
        # Base values
        temp = 25.0
        humidity = 60.0
        pm25 = 15.0  # dustDensity
        air_value = 100 # Low is good for some sensors, but let's assume raw analog value
        # CO2/Gas usually represented by higher air_value or separate boolean
        gas_detected = False
        
        if self.current_scenario == "hot":
            temp = random.uniform(35, 40)
            humidity = random.uniform(30, 40)
        
        elif self.current_scenario == "cold":
            temp = random.uniform(10, 15)
            humidity = random.uniform(70, 80)
            
        elif self.current_scenario == "fire":
            temp = random.uniform(45, 60)
            pm25 = random.uniform(100, 300)
            gas_detected = True
            air_value = random.uniform(500, 800) # High value for gas/smoke
            
        elif self.current_scenario == "polluted":
            pm25 = random.uniform(150, 300)
            air_value = random.uniform(300, 500)
            
        elif self.current_scenario == "raining":
            temp = random.uniform(20, 24)
            humidity = random.uniform(90, 99)
            
        else: # normal
            temp = random.uniform(25, 30)
            humidity = random.uniform(50, 60)
            pm25 = random.uniform(10, 30)
            air_value = random.uniform(50, 150)
            
        # Add some random jitter
        if self.current_scenario != "normal":
            temp += random.uniform(-1, 1)
            humidity += random.uniform(-2, 2)
            
        # Calculate AQI
        aqi = aqi_calculator.calculate_aqi_from_air_value(int(air_value))
        category = aqi_calculator.get_aqi_category(aqi)
        
        return {
            "station_id": settings.station_id,
            "timestamp": datetime.utcnow().isoformat(),
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "air_value": int(air_value),
            "dust_density": round(pm25, 1),
            "gas_detected": gas_detected,
            "aqi": aqi,
            "aqi_category": category,
            "is_simulated": True,
            "scenario": self.current_scenario
        }
        
    async def _broadcast_data(self, data: dict):
        """Broadcast data to WebSockets"""
        await manager.broadcast({
            "type": "sensor_update",
            "data": data
        })

# Singleton
simulation_manager = SimulationManager()
