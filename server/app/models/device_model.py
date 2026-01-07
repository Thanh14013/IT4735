"""
Device Model
Smart Home Device Management
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# Device color options
DeviceColor = Literal[
    "blue", "green", "purple", "orange", "pink", 
    "indigo", "red", "yellow", "teal", "gray"
]

# Device type options
DeviceType = Literal[
    "fan", "humidifier", "purifier", "alarm", "custom"
]


class Device(BaseModel):
    """Device data model"""
    device_id: Optional[str] = None
    station_id: str
    name: str
    icon: str  # Icon name from lucide-react-native
    color: DeviceColor
    device_type: DeviceType
    is_on: bool = False
    auto_control_enabled: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DeviceCreate(BaseModel):
    """Device creation request"""
    station_id: str
    name: str
    icon: str
    color: DeviceColor
    device_type: DeviceType
    auto_control_enabled: bool = False


class DeviceUpdate(BaseModel):
    """Device update request"""
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[DeviceColor] = None
    auto_control_enabled: Optional[bool] = None


class DeviceToggle(BaseModel):
    """Device toggle request"""
    is_on: bool


class DeviceResponse(BaseModel):
    """Device response"""
    device_id: str
    station_id: str
    name: str
    icon: str
    color: str
    device_type: str
    is_on: bool
    auto_control_enabled: bool
    created_at: datetime
    updated_at: datetime
