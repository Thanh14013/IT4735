"""
AQI Calculation and LSTM Prediction Model
"""
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import logging
from sklearn.preprocessing import MinMaxScaler
import pickle
import os

logger = logging.getLogger(__name__)

# Try to import TensorFlow/Keras
try:
    from tensorflow import keras
    from keras.models import Sequential
    from keras.layers import LSTM, Dense, Dropout
    KERAS_AVAILABLE = True
except ImportError:
    logger.warning("TensorFlow/Keras not available. Prediction will use simple averaging.")
    KERAS_AVAILABLE = False


class AQICalculator:
    """Calculate AQI from sensor readings"""
    
    @staticmethod
    def calculate_aqi_from_pm25(pm25: float) -> int:
        """
        Calculate AQI from PM2.5 using EPA breakpoints
        Note: MQ-135 gives general air quality, we'll use it as proxy for PM2.5
        """
        # EPA AQI breakpoints for PM2.5
        breakpoints = [
            (0.0, 12.0, 0, 50),      # Good
            (12.1, 35.4, 51, 100),   # Moderate
            (35.5, 55.4, 101, 150),  # Unhealthy for Sensitive Groups
            (55.5, 150.4, 151, 200), # Unhealthy
            (150.5, 250.4, 201, 300),# Very Unhealthy
            (250.5, 500.4, 301, 500) # Hazardous
        ]
        
        for c_low, c_high, i_low, i_high in breakpoints:
            if c_low <= pm25 <= c_high:
                # Linear interpolation
                aqi = ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
                return int(aqi)
        
        # If PM2.5 > 500.4
        return 500
    
    @staticmethod
    def calculate_aqi_from_air_value(air_value: int) -> int:
        """
        Convert MQ-135 air quality value to AQI
        This is a simplified mapping based on the ranges in ESP32 code
        """
        if air_value < 100:
            return int(air_value * 0.5)  # 0-50 (Good)
        elif air_value < 200:
            return int(50 + (air_value - 100) * 0.5)  # 50-100 (Moderate)
        elif air_value < 300:
            return int(100 + (air_value - 200) * 0.5)  # 100-150 (Unhealthy for Sensitive)
        elif air_value < 400:
            return int(150 + (air_value - 300) * 0.5)  # 150-200 (Unhealthy)
        elif air_value < 500:
            return int(200 + (air_value - 400))  # 200-300 (Very Unhealthy)
        else:
            return min(500, int(300 + (air_value - 500) * 0.4))  # 300-500 (Hazardous)
    
    @staticmethod
    def get_aqi_category(aqi: int) -> str:
        """Get AQI category description"""
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Moderate"
        elif aqi <= 150:
            return "Unhealthy for Sensitive Groups"
        elif aqi <= 200:
            return "Unhealthy"
        elif aqi <= 300:
            return "Very Unhealthy"
        else:
            return "Hazardous"


class LSTMPredictor:
    """LSTM model for AQI forecasting"""
    
    def __init__(self, model_path: str = "app/models/lstm_model.h5"):
        self.model_path = model_path
        self.model = None
        self.scaler = MinMaxScaler()
        self.sequence_length = 24  # Use last 24 readings (12 hours at 30s interval)
        self.features = ['temperature', 'humidity', 'air_value', 'dust_density']
        
    def prepare_data(self, data: List[Dict]) -> Optional[Tuple[np.ndarray, np.ndarray]]:
        """Prepare data for training"""
        if len(data) < self.sequence_length + 1:
            logger.warning("Not enough data for training")
            return None
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Calculate AQI for each reading
        df['aqi'] = df['air_value'].apply(AQICalculator.calculate_aqi_from_air_value)
        
        # Select features
        feature_data = df[self.features + ['aqi']].values
        
        # Normalize
        scaled_data = self.scaler.fit_transform(feature_data)
        
        # Create sequences
        X, y = [], []
        for i in range(len(scaled_data) - self.sequence_length):
            X.append(scaled_data[i:i + self.sequence_length, :-1])  # Features only
            y.append(scaled_data[i + self.sequence_length, -1])      # AQI target
        
        return np.array(X), np.array(y)
    
    def build_model(self, input_shape: Tuple[int, int]):
        """Build LSTM model"""
        model = Sequential([
            LSTM(50, activation='relu', return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, activation='relu'),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def train(self, data: List[Dict], epochs: int = 50):
        """Train the LSTM model"""
        if not KERAS_AVAILABLE:
            logger.warning("Keras not available, skipping training")
            return False
        
        prepared_data = self.prepare_data(data)
        if prepared_data is None:
            return False
        
        X, y = prepared_data
        
        # Build model
        self.model = self.build_model((X.shape[1], X.shape[2]))
        
        # Train
        logger.info(f"Training LSTM model with {len(X)} samples...")
        self.model.fit(X, y, epochs=epochs, batch_size=32, validation_split=0.2, verbose=0)
        
        # Save model
        self.model.save(self.model_path)
        
        # Save scaler
        with open(self.model_path.replace('.h5', '_scaler.pkl'), 'wb') as f:
            pickle.dump(self.scaler, f)
        
        logger.info("Model trained and saved successfully")
        return True
    
    def load_model(self):
        """Load trained model"""
        if not KERAS_AVAILABLE:
            return False
        
        if os.path.exists(self.model_path):
            self.model = keras.models.load_model(self.model_path)
            
            # Load scaler
            scaler_path = self.model_path.replace('.h5', '_scaler.pkl')
            if os.path.exists(scaler_path):
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
            
            logger.info("Model loaded successfully")
            return True
        return False
    
    def predict_next_hour(self, recent_data: List[Dict]) -> Optional[int]:
        """Predict AQI for next hour"""
        if not KERAS_AVAILABLE:
            # Fallback to simple averaging
            return self._simple_prediction(recent_data)
        
        if len(recent_data) < self.sequence_length:
            logger.warning("Not enough recent data for prediction")
            return self._simple_prediction(recent_data)
        
        # Load model if not loaded
        if self.model is None:
            if not self.load_model():
                return self._simple_prediction(recent_data)
        
        # Prepare input
        df = pd.DataFrame(recent_data[-self.sequence_length:])
        df['aqi'] = df['air_value'].apply(AQICalculator.calculate_aqi_from_air_value)
        
        feature_data = df[self.features + ['aqi']].values
        scaled_data = self.scaler.transform(feature_data)
        
        # Get features only (exclude AQI)
        X = scaled_data[:, :-1].reshape(1, self.sequence_length, len(self.features))
        
        # Predict
        prediction = self.model.predict(X, verbose=0)
        
        # Inverse transform
        dummy = np.zeros((1, len(self.features) + 1))
        dummy[0, -1] = prediction[0, 0]
        aqi_prediction = self.scaler.inverse_transform(dummy)[0, -1]
        
        return int(max(0, min(500, aqi_prediction)))
    
    def _simple_prediction(self, recent_data: List[Dict]) -> int:
        """Simple moving average fallback"""
        if not recent_data:
            return 0
        
        # Take last 10 readings
        last_readings = recent_data[-10:]
        avg_air_value = np.mean([r['air_value'] for r in last_readings])
        
        return AQICalculator.calculate_aqi_from_air_value(int(avg_air_value))


# Singleton instances
aqi_calculator = AQICalculator()
lstm_predictor = LSTMPredictor()
