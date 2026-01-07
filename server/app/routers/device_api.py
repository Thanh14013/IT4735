"""
Device API Router
API endpoints for device management
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
import uuid

from app.models.device_model import (
    DeviceCreate,
    DeviceUpdate,
    DeviceToggle,
    DeviceResponse
)
from app.database.mongo_client import db

router = APIRouter(
    prefix="/devices",
    tags=["Devices"]
)


@router.get("", response_model=List[DeviceResponse])
async def get_devices(station_id: str):
    """
    Get all devices for a specific station
    
    - **station_id**: ID of the station
    """
    devices = await db.get_devices(station_id)
    
    # Convert to response model
    response_devices = []
    for device in devices:
        response_devices.append(DeviceResponse(
            device_id=device["device_id"],
            station_id=device["station_id"],
            name=device["name"],
            icon=device["icon"],
            color=device["color"],
            device_type=device["device_type"],
            is_on=device["is_on"],
            auto_control_enabled=device.get("auto_control_enabled", False),
            created_at=device["created_at"],
            updated_at=device["updated_at"]
        ))
    
    return response_devices


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(device: DeviceCreate):
    """
    Create a new device
    
    - **station_id**: ID of the station
    - **name**: Device name
    - **icon**: Icon name from lucide-react-native
    - **color**: Color (blue, green, purple, etc.)
    - **device_type**: Type of device (fan, humidifier, etc.)
    - **auto_control_enabled**: Enable automatic control based on sensors
    """
    # Generate unique device_id
    device_id = f"device_{uuid.uuid4().hex[:12]}"
    
    now = datetime.utcnow()
    device_data = {
        "device_id": device_id,
        "station_id": device.station_id,
        "name": device.name,
        "icon": device.icon,
        "color": device.color,
        "device_type": device.device_type,
        "is_on": False,
        "auto_control_enabled": device.auto_control_enabled,
        "created_at": now,
        "updated_at": now
    }
    
    await db.insert_device(device_data)
    
    return DeviceResponse(**device_data)


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str):
    """
    Get a specific device by ID
    
    - **device_id**: ID of the device
    """
    device = await db.get_device(device_id)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    return DeviceResponse(
        device_id=device["device_id"],
        station_id=device["station_id"],
        name=device["name"],
        icon=device["icon"],
        color=device["color"],
        device_type=device["device_type"],
        is_on=device["is_on"],
        auto_control_enabled=device.get("auto_control_enabled", False),
        created_at=device["created_at"],
        updated_at=device["updated_at"]
    )


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(device_id: str, device_update: DeviceUpdate):
    """
    Update device information
    
    - **device_id**: ID of the device
    - **name**: New device name (optional)
    - **icon**: New icon name (optional)
    - **color**: New color (optional)
    - **auto_control_enabled**: Enable/disable automatic control (optional)
    """
    # Check if device exists
    existing_device = await db.get_device(device_id)
    if not existing_device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    # Build update data (only include non-None fields)
    update_data = {}
    if device_update.name is not None:
        update_data["name"] = device_update.name
    if device_update.icon is not None:
        update_data["icon"] = device_update.icon
    if device_update.color is not None:
        update_data["color"] = device_update.color
    if device_update.auto_control_enabled is not None:
        update_data["auto_control_enabled"] = device_update.auto_control_enabled
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Update device
    await db.update_device(device_id, update_data)
    
    # Get updated device
    updated_device = await db.get_device(device_id)
    
    return DeviceResponse(
        device_id=updated_device["device_id"],
        station_id=updated_device["station_id"],
        name=updated_device["name"],
        icon=updated_device["icon"],
        color=updated_device["color"],
        device_type=updated_device["device_type"],
        is_on=updated_device["is_on"],
        auto_control_enabled=updated_device.get("auto_control_enabled", False),
        created_at=updated_device["created_at"],
        updated_at=updated_device["updated_at"]
    )


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(device_id: str):
    """
    Delete a device
    
    - **device_id**: ID of the device
    """
    # Check if device exists
    existing_device = await db.get_device(device_id)
    if not existing_device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    await db.delete_device(device_id)
    
    return None


@router.put("/{device_id}/toggle", response_model=DeviceResponse)
async def toggle_device(device_id: str, toggle_data: DeviceToggle):
    """
    Toggle device on/off
    
    - **device_id**: ID of the device
    - **is_on**: New state (true/false)
    """
    # Check if device exists
    existing_device = await db.get_device(device_id)
    if not existing_device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    # Toggle device
    await db.toggle_device(device_id, toggle_data.is_on)
    
    # Get updated device
    updated_device = await db.get_device(device_id)
    
    return DeviceResponse(
        device_id=updated_device["device_id"],
        station_id=updated_device["station_id"],
        name=updated_device["name"],
        icon=updated_device["icon"],
        color=updated_device["color"],
        device_type=updated_device["device_type"],
        is_on=updated_device["is_on"],
        auto_control_enabled=updated_device.get("auto_control_enabled", False),
        created_at=updated_device["created_at"],
        updated_at=updated_device["updated_at"]
    )
