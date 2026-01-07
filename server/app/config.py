"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "air_quality_db"
    
    # MQTT
    mqtt_broker: str = "broker.hivemq.com"
    mqtt_port: int = 1883
    mqtt_topic: str = "home/trungvu/airquality"
    mqtt_client_id: str = "server_listener"
    
    # Station
    station_id: str = "station_01"
    
    # Alert
    alert_threshold_aqi: int = 150
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Prediction
    prediction_interval_minutes: int = 30
    history_hours_for_training: int = 168  # 7 days
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
