"""
FastAPI Main Application
Air Quality Monitoring Server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import asyncio

from app.config import settings
from app.database.mongo_client import db
from app.mqtt_listener import mqtt_listener
from app.routers import data_api, prediction_api, auth, simulation_api, device_api
from app.models.aqi_model import lstm_predictor
from app.utils.websocket_manager import manager
from fastapi import WebSocket, WebSocketDisconnect

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Periodic prediction task
async def periodic_prediction_task():
    """Run predictions periodically"""
    while True:
        try:
            await asyncio.sleep(settings.prediction_interval_minutes * 60)
            
            logger.info("Running periodic AQI prediction...")
            
            # Get recent data
            recent_data = await db.get_history(settings.station_id, hours=12)
            
            if len(recent_data) >= 10:
                # Make prediction
                predicted_aqi = lstm_predictor.predict_next_hour(recent_data)
                
                if predicted_aqi:
                    from datetime import datetime
                    from app.models.aqi_model import aqi_calculator
                    from app.utils.alerts import AlertManager
                    
                    category = aqi_calculator.get_aqi_category(predicted_aqi)
                    
                    # Store prediction
                    prediction_doc = {
                        "station_id": settings.station_id,
                        "prediction_timestamp": datetime.utcnow(),
                        "predicted_aqi": predicted_aqi,
                        "predicted_category": category,
                        "model_type": "LSTM" if lstm_predictor.model else "Simple Average",
                        "data_points_used": len(recent_data),
                        "auto_generated": True
                    }
                    
                    await db.insert_prediction(prediction_doc)
                    logger.info(f"Periodic prediction: AQI={predicted_aqi} ({category})")
                    
                    # Check alerts
                    alert_mgr = AlertManager(settings.telegram_bot_token, settings.telegram_chat_id)
                    await alert_mgr.check_and_alert(
                        settings.station_id,
                        predicted_aqi,
                        settings.alert_threshold_aqi
                    )
            else:
                logger.warning(f"Not enough data for prediction: {len(recent_data)} readings")
                
        except Exception as e:
            logger.error(f"Error in periodic prediction: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("=" * 60)
    logger.info("  Air Quality Monitoring Server")
    logger.info("  Project III - Vu Duc Trung")
    logger.info("=" * 60)
    
    # Connect to MongoDB
    await db.connect_db()
    
    # Start MQTT listener
    loop = asyncio.get_event_loop()
    mqtt_listener.start(loop)
    
    # Try to load existing model
    if lstm_predictor.load_model():
        logger.info("LSTM model loaded successfully")
    else:
        logger.info("No pre-trained model found, will use simple prediction")
    
    # Start periodic prediction task
    prediction_task = asyncio.create_task(periodic_prediction_task())
    
    logger.info(f"Server starting on {settings.host}:{settings.port}")
    logger.info(f"Station ID: {settings.station_id}")
    logger.info(f"MQTT Topic: {settings.mqtt_topic}")
    logger.info(f"Prediction interval: {settings.prediction_interval_minutes} minutes")
    logger.info(f"Alert threshold: {settings.alert_threshold_aqi} AQI")
    
    yield
    
    # Shutdown
    logger.info("Shutting down server...")
    prediction_task.cancel()
    mqtt_listener.stop()
    await db.close_db()
    logger.info("Server shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Air Quality Monitoring API",
    description="REST API for ESP32 Air Quality Monitor - Real-time sensor data and AQI predictions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_api.router)
app.include_router(data_api.stations_router)
app.include_router(prediction_api.router)
app.include_router(auth.router)
app.include_router(simulation_api.router)
app.include_router(device_api.router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages if any
            # For this app, clients mostly listen, but we can handle pings here
            data = await websocket.receive_text()
            # await manager.broadcast(f"Client says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)




@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API information"""
    return {
        "name": "Air Quality Monitoring API",
        "version": "1.0.0",
        "description": "REST API for ESP32 Air Quality Monitor",
        "project": "Project III - Vu Duc Trung (20225161)",
        "endpoints": {
            "documentation": "/docs",
            "openapi": "/openapi.json",
            "latest_data": "/data/latest?station_id=station_01",
            "history": "/data/history?station_id=station_01&hours=24",
            "predict": "/predict/next_hour?station_id=station_01"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": asyncio.get_event_loop().time(),
        "database": "connected" if db.client else "disconnected",
        "mqtt": "active"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
