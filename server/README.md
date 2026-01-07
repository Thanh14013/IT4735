# Air Quality Monitoring Server

**Project III - Vũ Đức Trung (20225161)**

FastAPI backend server for ESP32 Air Quality Monitor with MQTT integration, MongoDB storage, and AI-powered AQI prediction.

## 🚀 Features

- ✅ **MQTT Integration**: Real-time sensor data from ESP32
- ✅ **MongoDB Storage**: Persistent data storage in cloud (MongoDB Atlas)
- ✅ **REST API**: Query latest data, history, and statistics
- ✅ **AQI Calculation**: Automatic Air Quality Index calculation
- ✅ **LSTM Prediction**: ML-based AQI forecasting
- ✅ **Alerts**: Telegram notifications for high AQI
- ✅ **Periodic Tasks**: Automatic predictions every 30 minutes

## 📋 Requirements

- Python 3.9+
- MongoDB Atlas account (or local MongoDB)
- MQTT Broker (HiveMQ public broker or your own)
- Telegram Bot (optional, for alerts)

## 🔧 Installation

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=air_quality_db

# MQTT Configuration
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
MQTT_TOPIC=home/trungvu/airquality
MQTT_CLIENT_ID=server_listener

# Station Configuration
STATION_ID=station_01

# Alert Configuration
ALERT_THRESHOLD_AQI=150
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Prediction Configuration
PREDICTION_INTERVAL_MINUTES=30
```

### 3. Setup MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier M0)
3. Create database user
4. Whitelist your IP (or use 0.0.0.0/0 for testing)
5. Get connection string and update `MONGODB_URL` in `.env`

### 4. Setup Telegram Bot (Optional)

1. Talk to [@BotFather](https://t.me/botfather) on Telegram
2. Create new bot with `/newbot`
3. Get bot token
4. Get your chat ID from [@userinfobot](https://t.me/userinfobot)
5. Update `.env` with token and chat ID

## 🏃 Running the Server

### Development Mode

```bash
cd server
python -m app.main
```

Or using uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The server will start at: **http://localhost:8000**

## 📚 API Documentation

Once running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔌 API Endpoints

### Root & Health

| Method | Endpoint  | Description     |
| ------ | --------- | --------------- |
| GET    | `/`       | API information |
| GET    | `/health` | Health check    |

### Data Endpoints

| Method | Endpoint        | Description               |
| ------ | --------------- | ------------------------- |
| GET    | `/data/latest`  | Get latest sensor reading |
| GET    | `/data/history` | Get historical data       |
| GET    | `/data/stats`   | Get statistical summary   |
| GET    | `/data/aqi`     | Calculate current AQI     |

**Example:**

```bash
# Get latest data
curl "http://localhost:8000/data/latest?station_id=station_01"

# Get 24 hours history
curl "http://localhost:8000/data/history?station_id=station_01&hours=24"

# Get statistics
curl "http://localhost:8000/data/stats?station_id=station_01&hours=24"
```

### Prediction Endpoints

| Method | Endpoint             | Description                  |
| ------ | -------------------- | ---------------------------- |
| GET    | `/predict/next_hour` | Predict AQI for next hour    |
| GET    | `/predict/latest`    | Get latest prediction        |
| POST   | `/predict/train`     | Train LSTM model             |
| GET    | `/predict/status`    | Get prediction system status |

**Example:**

```bash
# Get AQI prediction
curl "http://localhost:8000/predict/next_hour?station_id=station_01"

# Train model with 7 days of data
curl -X POST "http://localhost:8000/predict/train?station_id=station_01&hours=168"

# Check prediction status
curl "http://localhost:8000/predict/status"
```

## 🗄️ Database Schema

### Collection: `sensor_readings`

```json
{
  "_id": "ObjectId",
  "station_id": "station_01",
  "timestamp": "2025-11-10T10:30:00Z",
  "temperature": 28.5,
  "humidity": 65.2,
  "air_value": 245,
  "dust_density": 35.6,
  "aqi": 122,
  "aqi_category": "Moderate"
}
```

### Collection: `predictions`

```json
{
  "_id": "ObjectId",
  "station_id": "station_01",
  "prediction_timestamp": "2025-11-10T11:00:00Z",
  "predicted_aqi": 135,
  "predicted_category": "Unhealthy for Sensitive Groups",
  "model_type": "LSTM",
  "data_points_used": 120,
  "auto_generated": true
}
```

## 🤖 MQTT Integration

The server listens to MQTT topic for data from ESP32.

**Expected MQTT payload format:**

```json
{
  "temperature": 28.5,
  "humidity": 65.2,
  "airValue": 245,
  "dustDensity": 35.6
}
```

**ESP32 sends this data every 30 seconds** (configured in ESP32 code).

## 🧠 AI Prediction

### LSTM Model

- Uses last 24 sensor readings (12 hours)
- Features: temperature, humidity, air_value, dust_density
- Target: AQI (Air Quality Index)
- Training: 50 epochs with validation split

### Fallback Mode

If TensorFlow/Keras not available, uses **simple moving average** of last 10 readings.

### Training the Model

```bash
# Via API
curl -X POST "http://localhost:8000/predict/train?hours=168"

# Requires at least 100 historical readings
```

### Automatic Predictions

Server runs predictions every **30 minutes** (configurable) and stores results in database.

## 🚨 Alert System

When predicted AQI > threshold (default: 150):

1. Log warning message
2. Send Telegram notification (if configured)
3. Mark prediction as alert

**Telegram Alert Format:**

```
🚨 HIGH AQI ALERT 🚨

Station: station_01
Predicted AQI: 165
Threshold: 150

Category: Unhealthy
⚠️ Take precautions!
```

## 📊 AQI Categories

| AQI Range | Category                       | Color  |
| --------- | ------------------------------ | ------ |
| 0-50      | Good                           | Green  |
| 51-100    | Moderate                       | Yellow |
| 101-150   | Unhealthy for Sensitive Groups | Orange |
| 151-200   | Unhealthy                      | Red    |
| 201-300   | Very Unhealthy                 | Purple |
| 301-500   | Hazardous                      | Maroon |

## 🔄 Data Flow

```
ESP32 → MQTT → Server → MongoDB
                ↓
            REST API ← Client
                ↓
         LSTM Model → Predictions → Alerts
```

## 📁 Project Structure

```
server/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration management
│   ├── mqtt_listener.py        # MQTT client
│   ├── database/
│   │   └── mongo_client.py     # MongoDB operations
│   ├── models/
│   │   └── aqi_model.py        # AQI calculation & LSTM
│   ├── routers/
│   │   ├── data_api.py         # Data endpoints
│   │   └── prediction_api.py   # Prediction endpoints
│   └── utils/
│       └── alerts.py           # Alert system
├── requirements.txt
├── .env.example
└── README.md
```

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check connection string format
# Ensure IP is whitelisted
# Verify username/password
```

### MQTT Not Receiving Data

```bash
# Check ESP32 is publishing to same topic
# Verify MQTT broker is accessible
# Check network connectivity
```

### TensorFlow Installation Issues

```bash
# For Windows with GPU
pip install tensorflow[and-cuda]

# For CPU only
pip install tensorflow-cpu

# If still issues, predictions will use simple averaging
```

## 🚀 Deployment

### Using Docker (Future)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Cloud Platforms

- **Heroku**: Deploy with Procfile
- **Railway**: Direct Git deployment
- **Google Cloud Run**: Containerized deployment
- **AWS EC2**: Traditional server deployment

## 📝 Next Steps

- [ ] Add WebSocket for real-time updates
- [ ] Create web dashboard frontend
- [ ] Implement user authentication
- [ ] Add more ML models (Random Forest, XGBoost)
- [ ] Email alert integration
- [ ] Export data to CSV/Excel
- [ ] Data visualization charts

## 👤 Author

**Vũ Đức Trung**  
MSSV: 20225161  
Email: trung.vd225161@sis.hust.edu.vn

## 📄 License

Educational Project - Project III
