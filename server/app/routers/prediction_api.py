"""
REST API endpoints for AQI prediction
"""
from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from datetime import datetime
import logging

from app.database.mongo_client import db
from app.models.aqi_model import lstm_predictor
from app.config import settings
from app.utils.alerts import AlertManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["AQI Prediction"])

# Alert manager
alert_manager = AlertManager(
    bot_token=settings.telegram_bot_token,
    chat_id=settings.telegram_chat_id
)


@router.get("/next_hour")
async def predict_next_hour(
    station_id: str = Query(default="station_01", description="Station ID"),
    background_tasks: BackgroundTasks = None
):
    """
    Predict AQI for the next hour using LSTM model
    
    - **station_id**: ID of the monitoring station
    """
    # Get recent data for prediction
    recent_data = await db.get_history(station_id, hours=12)
    
    if len(recent_data) < 5:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough historical data for prediction (need at least 5 readings, got {len(recent_data)})"
        )
    
    # Make prediction
    predicted_aqi = lstm_predictor.predict_next_hour(recent_data)
    
    if predicted_aqi is None:
        raise HTTPException(status_code=500, detail="Prediction failed")
    
    # Get category
    from app.models.aqi_model import aqi_calculator
    category = aqi_calculator.get_aqi_category(predicted_aqi)
    
    # Store prediction
    prediction_doc = {
        "station_id": station_id,
        "prediction_timestamp": datetime.utcnow(),
        "predicted_aqi": predicted_aqi,
        "predicted_category": category,
        "model_type": "LSTM" if lstm_predictor.model else "Simple Average",
        "data_points_used": len(recent_data)
    }
    
    await db.insert_prediction(prediction_doc)
    
    # Check for alerts in background
    if background_tasks:
        background_tasks.add_task(
            alert_manager.check_and_alert,
            station_id,
            predicted_aqi,
            settings.alert_threshold_aqi
        )
    
    return {
        "status": "success",
        "data": {
            "station_id": station_id,
            "prediction_timestamp": prediction_doc["prediction_timestamp"],
            "predicted_aqi": predicted_aqi,
            "predicted_category": category,
            "model_type": prediction_doc["model_type"],
            "alert_threshold": settings.alert_threshold_aqi,
            "is_alert": predicted_aqi > settings.alert_threshold_aqi
        }
    }


@router.get("/latest")
async def get_latest_prediction(station_id: str = Query(default="station_01")):
    """
    Get the latest prediction for a station
    
    - **station_id**: ID of the monitoring station
    """
    prediction = await db.get_latest_prediction(station_id)
    
    if not prediction:
        raise HTTPException(status_code=404, detail=f"No predictions found for station {station_id}")
    
    return {
        "status": "success",
        "data": prediction
    }


@router.post("/train")
async def train_model(
    station_id: str = Query(default="station_01"),
    hours: int = Query(default=168, ge=24, le=720, description="Hours of data for training (24-720)")
):
    """
    Train the LSTM model with historical data
    
    - **station_id**: ID of the monitoring station
    - **hours**: Number of hours of historical data to use for training
    """
    # Get training data
    training_data = await db.get_training_data(station_id, hours)
    
    if len(training_data) < 100:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough data for training (need at least 100 readings, got {len(training_data)})"
        )
    
    # Train model
    success = lstm_predictor.train(training_data, epochs=50)
    
    if not success:
        return {
            "status": "warning",
            "message": "Model training skipped (TensorFlow not available or insufficient data)",
            "data_points": len(training_data)
        }
    
    return {
        "status": "success",
        "message": "Model trained successfully",
        "data_points": len(training_data),
        "hours_used": hours
    }


@router.get("/status")
async def get_prediction_status():
    """Get prediction system status"""
    model_loaded = lstm_predictor.model is not None
    
    return {
        "status": "success",
        "data": {
            "model_loaded": model_loaded,
            "model_type": "LSTM" if model_loaded else "Simple Average",
            "prediction_interval_minutes": settings.prediction_interval_minutes,
            "alert_threshold_aqi": settings.alert_threshold_aqi,
            "telegram_configured": alert_manager.bot is not None
        }
    }
