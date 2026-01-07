"""
MongoDB client and database operations
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import DESCENDING
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        try:
            cls.client = AsyncIOMotorClient(settings.mongodb_url)
            cls.db = cls.client[settings.mongodb_db_name]
            
            # Test connection
            await cls.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {settings.mongodb_db_name}")
            
            # Create indexes
            await cls.create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")
    
    @classmethod
    async def create_indexes(cls):
        """Create indexes for better query performance"""
        # Index for sensor_readings
        await cls.db.sensor_readings.create_index([
            ("station_id", 1),
            ("timestamp", DESCENDING)
        ])
        
        # Index for predictions
        await cls.db.predictions.create_index([
            ("station_id", 1),
            ("prediction_timestamp", DESCENDING)
        ])
        
        # Index for devices
        await cls.db.devices.create_index([
            ("station_id", 1),
            ("device_id", 1)
        ])
        
        logger.info("MongoDB indexes created")
    
    @classmethod
    async def insert_sensor_reading(cls, data: Dict) -> str:
        """Insert a sensor reading"""
        try:
            result = await cls.db.sensor_readings.insert_one(data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error inserting sensor reading: {e}")
            raise
    
    @classmethod
    async def get_latest_reading(cls, station_id: str) -> Optional[Dict]:
        """Get the latest sensor reading for a station"""
        try:
            reading = await cls.db.sensor_readings.find_one(
                {"station_id": station_id},
                sort=[("timestamp", DESCENDING)]
            )
            if reading:
                reading["_id"] = str(reading["_id"])
            return reading
        except Exception as e:
            logger.error(f"Error getting latest reading: {e}")
            return None
    
    @classmethod
    async def get_history(cls, station_id: str, hours: int = 24) -> List[Dict]:
        """Get historical sensor readings"""
        try:
            start_time = datetime.utcnow() - timedelta(hours=hours)
            
            cursor = cls.db.sensor_readings.find(
                {
                    "station_id": station_id,
                    "timestamp": {"$gte": start_time}
                },
                sort=[("timestamp", DESCENDING)]
            )
            
            readings = await cursor.to_list(length=None)
            
            # Convert ObjectId to string
            for reading in readings:
                reading["_id"] = str(reading["_id"])
            
            return readings
        except Exception as e:
            logger.error(f"Error getting history: {e}")
            return []
    
    @classmethod
    async def insert_prediction(cls, data: Dict) -> str:
        """Insert an AQI prediction"""
        try:
            result = await cls.db.predictions.insert_one(data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error inserting prediction: {e}")
            raise
    
    @classmethod
    async def get_latest_prediction(cls, station_id: str) -> Optional[Dict]:
        """Get the latest prediction for a station"""
        try:
            prediction = await cls.db.predictions.find_one(
                {"station_id": station_id},
                sort=[("prediction_timestamp", DESCENDING)]
            )
            if prediction:
                prediction["_id"] = str(prediction["_id"])
            return prediction
        except Exception as e:
            logger.error(f"Error getting latest prediction: {e}")
            return None
    
    @classmethod
    async def get_training_data(cls, station_id: str, hours: int = 168) -> List[Dict]:
        """Get historical data for model training"""
        return await cls.get_history(station_id, hours)
    
    # ==================== Device Management ====================
    
    @classmethod
    async def get_devices(cls, station_id: str) -> List[Dict]:
        """Get all devices for a station"""
        try:
            cursor = cls.db.devices.find({"station_id": station_id})
            devices = await cursor.to_list(length=None)
            
            # Convert ObjectId to string
            for device in devices:
                device["_id"] = str(device["_id"])
            
            return devices
        except Exception as e:
            logger.error(f"Error getting devices: {e}")
            return []
    
    @classmethod
    async def get_device(cls, device_id: str) -> Optional[Dict]:
        """Get a specific device by device_id"""
        try:
            device = await cls.db.devices.find_one({"device_id": device_id})
            if device:
                device["_id"] = str(device["_id"])
            return device
        except Exception as e:
            logger.error(f"Error getting device: {e}")
            return None
    
    @classmethod
    async def insert_device(cls, data: Dict) -> str:
        """Insert a new device"""
        try:
            result = await cls.db.devices.insert_one(data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error inserting device: {e}")
            raise
    
    @classmethod
    async def update_device(cls, device_id: str, update_data: Dict) -> bool:
        """Update device information"""
        try:
            # Add updated_at timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            result = await cls.db.devices.update_one(
                {"device_id": device_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating device: {e}")
            raise
    
    @classmethod
    async def delete_device(cls, device_id: str) -> bool:
        """Delete a device"""
        try:
            result = await cls.db.devices.delete_one({"device_id": device_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting device: {e}")
            raise
    
    @classmethod
    async def toggle_device(cls, device_id: str, is_on: bool) -> bool:
        """Toggle device on/off state"""
        try:
            result = await cls.db.devices.update_one(
                {"device_id": device_id},
                {"$set": {"is_on": is_on, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error toggling device: {e}")
            raise



# Singleton instance
db = MongoDB()
