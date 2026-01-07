"""
Alert system for high AQI values
"""
import logging
from typing import Optional
import asyncio

logger = logging.getLogger(__name__)

# Try to import telegram
try:
    from telegram import Bot
    TELEGRAM_AVAILABLE = True
except ImportError:
    logger.warning("python-telegram-bot not available. Telegram alerts disabled.")
    TELEGRAM_AVAILABLE = False


class AlertManager:
    """Manage alerts for high AQI"""
    
    def __init__(self, bot_token: Optional[str] = None, chat_id: Optional[str] = None):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.bot = None
        
        if TELEGRAM_AVAILABLE and bot_token and chat_id:
            self.bot = Bot(token=bot_token)
    
    async def send_telegram_alert(self, message: str) -> bool:
        """Send alert via Telegram"""
        if not self.bot or not self.chat_id:
            logger.warning("Telegram not configured")
            return False
        
        try:
            await self.bot.send_message(chat_id=self.chat_id, text=message)
            logger.info("Telegram alert sent successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False
    
    async def check_and_alert(self, station_id: str, predicted_aqi: int, threshold: int):
        """Check AQI and send alert if above threshold"""
        if predicted_aqi > threshold:
            message = f"🚨 *HIGH AQI ALERT* 🚨\n\n"
            message += f"Station: {station_id}\n"
            message += f"Predicted AQI: {predicted_aqi}\n"
            message += f"Threshold: {threshold}\n\n"
            
            if predicted_aqi <= 100:
                category = "Moderate"
            elif predicted_aqi <= 150:
                category = "Unhealthy for Sensitive Groups"
            elif predicted_aqi <= 200:
                category = "Unhealthy"
            elif predicted_aqi <= 300:
                category = "Very Unhealthy"
            else:
                category = "Hazardous"
            
            message += f"Category: {category}\n"
            message += f"⚠️ Take precautions!"
            
            logger.warning(f"AQI Alert: {predicted_aqi} > {threshold}")
            
            # Send telegram alert
            await self.send_telegram_alert(message)
            
            # Could add email alerts here
            return True
        
        return False
