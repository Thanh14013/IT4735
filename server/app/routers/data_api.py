"""
REST API endpoints for sensor data
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime
import logging

from app.database.mongo_client import db
from app.models.aqi_model import aqi_calculator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data", tags=["Sensor Data"])


@router.get("/latest")
async def get_latest_data(station_id: str = Query(default="station_01", description="Station ID")):
    """
    Get the latest sensor reading for a station
    
    - **station_id**: ID of the monitoring station
    """
    reading = await db.get_latest_reading(station_id)
    
    if not reading:
        raise HTTPException(status_code=404, detail=f"No data found for station {station_id}")
    
    return {
        "status": "success",
        "data": reading
    }


@router.get("/history")
async def get_history(
    station_id: str = Query(default="station_01", description="Station ID"),
    hours: int = Query(default=24, ge=1, le=168, description="Number of hours of history (1-168)")
):
    """
    Get historical sensor readings for a station
    
    - **station_id**: ID of the monitoring station
    - **hours**: Number of hours of history to retrieve (max 168 = 7 days)
    """
    readings = await db.get_history(station_id, hours)
    
    if not readings:
        return {
            "status": "success",
            "data": [],
            "count": 0,
            "message": f"No historical data found for station {station_id}"
        }
    
    return {
        "status": "success",
        "data": readings,
        "count": len(readings),
        "station_id": station_id,
        "hours": hours
    }


@router.get("/stats")
async def get_statistics(
    station_id: str = Query(default="station_01", description="Station ID"),
    hours: int = Query(default=24, ge=1, le=168, description="Number of hours for statistics")
):
    """
    Get statistical summary of sensor data
    
    - **station_id**: ID of the monitoring station
    - **hours**: Number of hours to calculate statistics for
    """
    readings = await db.get_history(station_id, hours)
    
    if not readings:
        raise HTTPException(status_code=404, detail=f"No data found for station {station_id}")
    
    # Calculate statistics
    temps = [r['temperature'] for r in readings]
    hums = [r['humidity'] for r in readings]
    air_vals = [r['air_value'] for r in readings]
    dusts = [r['dust_density'] for r in readings]
    aqis = [r.get('aqi', 0) for r in readings]
    
    stats = {
        "station_id": station_id,
        "period_hours": hours,
        "total_readings": len(readings),
        "temperature": {
            "min": min(temps),
            "max": max(temps),
            "avg": sum(temps) / len(temps)
        },
        "humidity": {
            "min": min(hums),
            "max": max(hums),
            "avg": sum(hums) / len(hums)
        },
        "air_value": {
            "min": min(air_vals),
            "max": max(air_vals),
            "avg": sum(air_vals) / len(air_vals)
        },
        "dust_density": {
            "min": min(dusts),
            "max": max(dusts),
            "avg": sum(dusts) / len(dusts)
        },
        "aqi": {
            "min": min(aqis) if aqis else 0,
            "max": max(aqis) if aqis else 0,
            "avg": sum(aqis) / len(aqis) if aqis else 0
        }
    }
    
    return {
        "status": "success",
        "data": stats
    }


@router.get("/aqi")
async def calculate_current_aqi(station_id: str = Query(default="station_01")):
    """
    Calculate current AQI based on latest reading
    
    - **station_id**: ID of the monitoring station
    """
    reading = await db.get_latest_reading(station_id)
    
    if not reading:
        raise HTTPException(status_code=404, detail=f"No data found for station {station_id}")
    
    air_value = reading['air_value']
    aqi = aqi_calculator.calculate_aqi_from_air_value(air_value)
    category = aqi_calculator.get_aqi_category(aqi)
    
    return {
        "status": "success",
        "data": {
            "station_id": station_id,
            "timestamp": reading['timestamp'],
            "air_value": air_value,
            "aqi": aqi,
            "category": category,
            "temperature": reading['temperature'],
            "humidity": reading['humidity'],
            "dust_density": reading['dust_density']
        }
    }
@router.get("/stations")
async def get_stations():
    """
    Get list of all monitoring stations
    """
    # In a real app, this would query a 'stations' collection
    # For now, we return the single configured station with its latest data
    try:
        latest = await db.get_latest_reading("station_01")
        
        station_data = {
            "id": "station_01",
            "name": "Station 01 (HUST)",
            "location": {
                "lat": 21.0056,
                "lng": 105.8433
            },
            "status": "online" if latest else "offline",
            "last_update": latest['timestamp'] if latest else None,
        }
        
        if latest:
            # Calculate AQI
            air_value = latest.get('air_value', 0)
            aqi = aqi_calculator.calculate_aqi_from_air_value(air_value)
            category = aqi_calculator.get_aqi_category(aqi)
            
            station_data["readings"] = {
                "pm25": latest.get('dust_density', 0), # Using dust_density as PM2.5 proxy
                "pm10": latest.get('dust_density', 0), # Using dust_density as PM10 proxy
                "temperature": latest.get('temperature', 0),
                "humidity": latest.get('humidity', 0),
                "aqi": aqi,
                "aqi_category": category
            }
            
        return [station_data]
    except Exception as e:
        logger.error(f"Error getting stations: {e}")
        return []


# Stations Router
stations_router = APIRouter(prefix="/stations", tags=["Stations"])

@stations_router.get("")
async def get_stations_list():
    """Get list of all monitoring stations"""
    return await get_stations()

@stations_router.get("/{station_id}/latest")
async def get_station_latest(station_id: str):
    """Get latest data for a specific station"""
    reading = await db.get_latest_reading(station_id)
    if not reading:
        raise HTTPException(status_code=404, detail=f"No data found for station {station_id}")
    
    # Calculate AQI
    air_value = reading.get('air_value', 0)
    aqi = aqi_calculator.calculate_aqi_from_air_value(air_value)
    category = aqi_calculator.get_aqi_category(aqi)
    
    return {
        "station_id": station_id,
        "station_name": f"Station {station_id.split('_')[-1] if '_' in station_id else station_id}",
        "timestamp": reading['timestamp'],
        "aqi": aqi,
        "aqi_category": category,
        "pm25": reading.get('dust_density', 0),
        "pm10": reading.get('dust_density', 0),
        "temperature": reading.get('temperature', 0),
        "humidity": reading.get('humidity', 0)
    }

@stations_router.get("/{station_id}/history")
async def get_station_history(
    station_id: str,
    from_param: str = Query(default="24h", alias="from"),
    to_param: Optional[str] = Query(default=None, alias="to")
):
    """Get history for a specific station"""
    # Parse 'from' param (e.g., '24h', '7d')
    hours = 24
    if from_param == "7d":
        hours = 168
    elif from_param == "24h":
        hours = 24
        
    readings = await db.get_history(station_id, hours)
    if not readings:
        return []
        
    # Format for frontend chart
    formatted_data = []
    for r in readings:
        formatted_data.append({
            "timestamp": r['timestamp'],
            "pm25": r.get('dust_density', 0),
            "temperature": r.get('temperature', 0),
            "humidity": r.get('humidity', 0),
            "aqi": r.get('aqi', 0)
        })
    
    return formatted_data
