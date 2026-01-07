"""
MQTT Listener for receiving sensor data from ESP32
"""
import json
import logging
from datetime import datetime
import asyncio
from typing import Optional
import paho.mqtt.client as mqtt

from app.config import settings
from app.database.mongo_client import db
from app.models.aqi_model import aqi_calculator
from app.utils.websocket_manager import manager
from app.simulation import simulation_manager

logger = logging.getLogger(__name__)


class MQTTListener:
    """MQTT client to receive sensor data"""
    
    def __init__(self):
        self.client: Optional[mqtt.Client] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        if rc == 0:
            logger.info(f"Connected to MQTT broker: {settings.mqtt_broker}")
            client.subscribe(settings.mqtt_topic)
            logger.info(f"Subscribed to topic: {settings.mqtt_topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker, return code: {rc}")
    
    def on_message(self, client, userdata, msg):
        """Callback when message received"""
        try:
            # Parse JSON payload
            payload = json.loads(msg.payload.decode())
            
            # --- SIMULATION CHECK ---
            if simulation_manager.is_active:
                logger.debug(f"Simulation active. Ignoring real MQTT message: {payload}")
                return
            
            logger.info(f"Received MQTT message: {payload}")
            
            # Process the data asynchronously
            if self.loop:
                asyncio.run_coroutine_threadsafe(
                    self.process_sensor_data(payload),
                    self.loop
                )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse MQTT message: {e}")
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    async def process_sensor_data(self, data: dict):
        """Process and store sensor data"""
        try:
            # Validate required fields
            required_fields = ['temperature', 'humidity', 'airValue', 'dustDensity']
            if not all(field in data for field in required_fields):
                logger.warning(f"Missing required fields in data: {data}")
                return
            
            # Calculate AQI
            air_value = int(data['airValue'])
            aqi = aqi_calculator.calculate_aqi_from_air_value(air_value)
            aqi_category = aqi_calculator.get_aqi_category(aqi)
            
            # Prepare document for MongoDB
            document = {
                "station_id": settings.station_id,
                "timestamp": datetime.utcnow(),
                "temperature": float(data['temperature']),
                "humidity": float(data['humidity']),
                "air_value": air_value,
                "dust_density": float(data['dustDensity']),
                "aqi": aqi,
                "aqi_category": aqi_category
            }
            
            # Insert into MongoDB
            # Hàm này trả về ID, đồng thời thêm _id vào biến document
            doc_id = await db.insert_sensor_reading(document) 
            logger.info(f"Sensor data stored with ID: {doc_id}, AQI: {aqi} ({aqi_category})")
            
            # --- ĐOẠN SỬA QUAN TRỌNG ---
            # Tạo một bản sao để gửi đi, tránh lỗi ObjectId
            broadcast_data = document.copy()
            
            # Chuyển ObjectId thành string
            if '_id' in broadcast_data:
                broadcast_data['_id'] = str(broadcast_data['_id'])
            
            # Chuyển datetime thành string ISO (cho chắc ăn)
            if isinstance(broadcast_data.get('timestamp'), datetime):
                broadcast_data['timestamp'] = broadcast_data['timestamp'].isoformat()

            # Broadcast to WebSocket clients
            await manager.broadcast({
                "type": "sensor_update",
                "data": broadcast_data # Gửi bản sao đã xử lý string
            })
            
        except Exception as e:
            logger.error(f"Error storing sensor data: {e}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback when disconnected"""
        if rc != 0:
            logger.warning(f"Unexpected MQTT disconnect, code: {rc}")
        else:
            logger.info("Disconnected from MQTT broker")
    
    def start(self, loop: asyncio.AbstractEventLoop):
        """Start MQTT listener"""
        self.loop = loop
        
        # Create MQTT client
        self.client = mqtt.Client(client_id=settings.mqtt_client_id)
        
        # Set callbacks
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        # Connect to broker
        try:
            logger.info(f"Connecting to MQTT broker: {settings.mqtt_broker}:{settings.mqtt_port}")
            self.client.connect(settings.mqtt_broker, settings.mqtt_port, 60)
            
            # Start loop in background thread
            self.client.loop_start()
            logger.info("MQTT listener started")
            
        except Exception as e:
            logger.error(f"Failed to start MQTT listener: {e}")
            raise
    
    def stop(self):
        """Stop MQTT listener"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("MQTT listener stopped")


# Singleton instance
mqtt_listener = MQTTListener()
