import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
import os

# Set random seed for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

print("Generating synthetic sensor data...")
n_points = 2000
t = np.linspace(0, 100, n_points)

# Simulate correlated sensor data
# Temperature: Daily cycle
temp = 25 + 5 * np.sin(t) + np.random.normal(0, 0.5, n_points)
# Humidity: Inverse to temperature roughly
hum = 60 - 5 * np.sin(t) + np.random.normal(0, 1.0, n_points)
# Air Value: Random events + baseline
air = 100 + 50 * np.sin(t/2) + np.random.normal(0, 5, n_points)
# Dust: Independent noise
dust = 20 + 10 * np.sin(t/3) + np.random.normal(0, 2, n_points)

# Target AQI (derived mainly from air_value for this simulation)
aqi = air * 0.5 + np.random.normal(0, 2, n_points)

# Create DataFrame
data = pd.DataFrame({
    'temperature': temp,
    'humidity': hum,
    'air_value': air,
    'dust_density': dust,
    'aqi': aqi
})

# Preprocessing
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(data)

# Create sequences (Timesteps = 24)
seq_len = 24
X, y = [], []
for i in range(len(scaled_data) - seq_len):
    # Features: temp, humidity, air, dust (first 4 columns)
    X.append(scaled_data[i:i+seq_len, :-1]) 
    # Target: AQI (last column)
    y.append(scaled_data[i+seq_len, -1])

X = np.array(X)
y = np.array(y)

# Split data
train_split = int(0.8 * len(X))
X_train, X_test = X[:train_split], X[train_split:]
y_train, y_test = y[:train_split], y[train_split:]

print(f"Data prepared. Training shape: {X_train.shape}")

# Build Model (Mirroring aqi_model.py logic)
print("Building LSTM model...")
model = Sequential([
    LSTM(50, activation='relu', return_sequences=True, input_shape=(seq_len, 4)),
    Dropout(0.2),
    LSTM(50, activation='relu'),
    Dropout(0.2),
    Dense(25, activation='relu'),
    Dense(1)
])

model.compile(optimizer='adam', loss='mse')

# Train
print("Starting training...")
history = model.fit(
    X_train, y_train, 
    epochs=20, 
    batch_size=32, 
    validation_data=(X_test, y_test),
    verbose=1
)

# Plot Loss
print("Plotting results...")
plt.figure(figsize=(10, 6))
plt.plot(history.history['loss'], label='Training Loss', linewidth=2)
plt.plot(history.history['val_loss'], label='Validation Loss', linewidth=2)
plt.title('Model Convergence: Training vs Validation Loss', fontsize=14)
plt.ylabel('Loss (MSE)', fontsize=12)
plt.xlabel('Epoch', fontsize=12)
plt.legend(fontsize=12)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()

# Save image
output_file = 'training_loss_chart.png'
plt.savefig(output_file, dpi=300)
print(f"Chart saved to {os.path.abspath(output_file)}")
