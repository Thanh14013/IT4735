"""
Seed default devices for testing
Run this script to initialize default devices for station_01
"""
import asyncio
import sys
from datetime import datetime
import uuid

# Add parent directory to path
sys.path.append('.')

from app.database.mongo_client import db


async def seed_devices():
    """Create default devices for station_01"""
    
    # Connect to database
    await db.connect_db()
    
    station_id = "station_01"
    
    # Check if devices already exist
    existing_devices = await db.get_devices(station_id)
    if existing_devices:
        print(f"⚠️  Found {len(existing_devices)} existing devices for {station_id}")
        response = input("Do you want to delete and recreate them? (y/n): ")
        if response.lower() == 'y':
            for device in existing_devices:
                await db.delete_device(device["device_id"])
            print("✅ Deleted existing devices")
        else:
            print("❌ Cancelled")
            await db.close_db()
            return
    
    # Default devices
    default_devices = [
        {
            "device_id": f"device_{uuid.uuid4().hex[:12]}",
            "station_id": station_id,
            "name": "Smart Fan",
            "icon": "Fan",
            "color": "blue",
            "device_type": "fan",
            "is_on": False,
            "auto_control_enabled": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "device_id": f"device_{uuid.uuid4().hex[:12]}",
            "station_id": station_id,
            "name": "Humidifier",
            "icon": "Droplets",
            "color": "teal",
            "device_type": "humidifier",
            "is_on": False,
            "auto_control_enabled": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "device_id": f"device_{uuid.uuid4().hex[:12]}",
            "station_id": station_id,
            "name": "Air Purifier",
            "icon": "ShieldCheck",
            "color": "green",
            "device_type": "purifier",
            "is_on": False,
            "auto_control_enabled": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "device_id": f"device_{uuid.uuid4().hex[:12]}",
            "station_id": station_id,
            "name": "Emergency Alarm",
            "icon": "Bell",
            "color": "red",
            "device_type": "alarm",
            "is_on": False,
            "auto_control_enabled": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Insert devices
    for device in default_devices:
        await db.insert_device(device)
        print(f"✅ Created device: {device['name']} ({device['device_id']})")
    
    print(f"\n🎉 Successfully seeded {len(default_devices)} devices for {station_id}!")
    
    # Close database connection
    await db.close_db()


if __name__ == "__main__":
    asyncio.run(seed_devices())
