/*
 * Air Quality Monitor - ESP32
 * Project III - Vũ Đức Trung (20225161)
 * Date: 27/10/2025
 * 
 * Features:
 * - Read DHT11 (Temperature & Humidity)
 * - Read MQ-135 (Air Quality)
 * - Read GP2Y1010AU0F (Dust Density)
 * - Display on OLED SSD1306
 * - Send data to ThingSpeak Cloud
 * - MQTT support (prepared but not activated)
 */

#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "display.h"
#include "network.h"

// --- Timing variables ---
unsigned long lastSendTime = 0;

void setup() {
  // Initialize Serial
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("========================================");
  Serial.println("  Air Quality Monitor - ESP32");
  Serial.println("  Project III - Vu Duc Trung");
  Serial.println("  MSSV: 20225161");
  Serial.println("========================================");
  Serial.println();
  
  // Initialize Display
  if (!initDisplay()) {
    Serial.println("Display initialization failed!");
    while(1);  // Stop if display fails
  }
  delay(2000);
  
  // Initialize Sensors
  initSensors();
  delay(1000);
  
  // Connect to WiFi
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("Connecting WiFi..."));
  display.display();
  
  if (!connectWiFi()) {
    Serial.println("WiFi connection failed!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(F("WiFi Failed!"));
    display.display();
    // Continue anyway for local display
  } else {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(F("WiFi Connected!"));
    display.println(WiFi.localIP());
    display.display();
    delay(2000);
  }
  
  // MQTT connection (commented out - prepared for future use)
  if (!connectMQTT()) {
    Serial.println("MQTT connection failed!");
  }
  
  Serial.println("Setup complete!");
  Serial.println();
}

void loop() {
  // Read all sensors
  readAllSensors();
  
  // Update OLED display
  updateDisplay(temperature, humidity, airValue, getAirQuality(airValue), dustDensity);
  
  // Send to ThingSpeak every SEND_INTERVAL_MS (30 seconds)
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = currentTime;
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("--- Sending to ThingSpeak ---");
      if (sendToThingSpeak(temperature, humidity, airValue, dustDensity)) {
        Serial.println("Data sent successfully!");
      } else {
        Serial.println("Failed to send data!");
      }
      Serial.println();
      
      // MQTT send (commented out - prepared for future use)
      sendToMQTT(temperature, humidity, airValue, dustDensity);
    } else {
      Serial.println("WiFi disconnected! Attempting to reconnect...");
      connectWiFi();
    }
  }
  
  // Main loop delay
  delay(SENSOR_LOOP_DELAY);
}