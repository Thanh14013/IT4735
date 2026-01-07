#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include <DHT.h>
#include "config.h"

// --- DHT11 sensor ---
DHT dht(PIN_DHT, DHT11);

// --- Global sensor values ---
float temperature = 0.0;
float humidity = 0.0;
int airValue = 0;
float dustDensity = 0.0;

// --- Initialize all sensors ---
void initSensors() {
  dht.begin();
  pinMode(PIN_DUST_LED, OUTPUT);
  digitalWrite(PIN_DUST_LED, HIGH);  // LED off initially
  
  // Configure ADC
  analogReadResolution(12);  // 12-bit ADC (0-4095)
  analogSetAttenuation(ADC_11db);  // Full range 0-3.3V
  
  // TEST: Blink dust sensor LED to verify wiring
  Serial.println("Testing dust sensor LED...");
  Serial.println("Look into the sensor - you should see a RED light!");
  for (int i = 0; i < 5; i++) {
    digitalWrite(PIN_DUST_LED, LOW);  // LED ON
    delay(500);
    digitalWrite(PIN_DUST_LED, HIGH); // LED OFF
    delay(500);
  }
  Serial.println("LED test complete.");
  
  Serial.println("Sensors initialized");
}

// --- Read DHT11 sensor ---
void readDHT() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  temperature = t;
  humidity = h;
}

// --- Read MQ-135 air quality sensor ---
void readMQ135() {
  int rawValue = analogRead(PIN_MQ135_AO);
  // Map from 0-4095 to 0-1023 for compatibility
  airValue = map(rawValue, 0, 4095, 0, 1023);
}

// --- Get air quality description ---
String getAirQuality(int value) {
  if (value < 100) return "Excellent";
  else if (value < 200) return "Good";
  else if (value < 300) return "Moderate";
  else if (value < 400) return "Poor";
  else if (value < 500) return "Very Poor";
  else return "Hazardous";
}

// --- Read GP2Y1010AU0F dust sensor ---
void readDustSensor() {
  const int NUM_SAMPLES = 10;
  long rawSum = 0;
  int rawMin = 4095;
  int rawMax = 0;
  
  // Sample multiple times for accuracy
  for (int i = 0; i < NUM_SAMPLES; i++) {
    // 1. Turn on LED (Active LOW)
    digitalWrite(PIN_DUST_LED, LOW);
    delayMicroseconds(280);  // Wait 280us before reading

    // 2. Read analog value
    int rawValue = analogRead(PIN_DUST_AO);
    rawSum += rawValue;
    if (rawValue < rawMin) rawMin = rawValue;
    if (rawValue > rawMax) rawMax = rawValue;
    
    delayMicroseconds(40);  // Complete sampling time

    // 3. Turn off LED
    digitalWrite(PIN_DUST_LED, HIGH);
    
    delay(10);  // Wait 10ms between samples
  }
  
  // 4. Calculate average raw and voltage
  int rawAvg = rawSum / NUM_SAMPLES;
  float avgVoltage = rawAvg * (ADC_VREF / ADC_RESOLUTION);
  
  // Debug: Show raw ADC values
  Serial.print("Dust ADC - Min:");
  Serial.print(rawMin);
  Serial.print(" Max:");
  Serial.print(rawMax);
  Serial.print(" Avg:");
  Serial.print(rawAvg);
  Serial.print(" -> ");
  Serial.print(avgVoltage, 3);
  Serial.println("V");
  
  // 5. Calculate Dust Density
  // GP2Y1010AU0F - Your sensor has lower baseline (~0.3V instead of 0.6V)
  // This is common with 3.3V logic or clone sensors
  // 
  // Formula: dustDensity (ug/m3) = (voltage - baseline) * sensitivity
  // Baseline: ~0.1V (minimum clean air reading for your sensor)
  // Sensitivity: 500 ug/m³ per volt (adjusted for low voltage output)
  
  float dustDensityUg = 0.0;
  
  // Adjusted baseline for your sensor (based on readings ~0.3V in clean air)
  const float BASELINE_VOLTAGE = 0.3;
  const float SENSITIVITY = 500.0;  // ug/m³ per volt
  
  if (avgVoltage > BASELINE_VOLTAGE) {
    dustDensityUg = (avgVoltage - BASELINE_VOLTAGE) * SENSITIVITY;
  }
  
  dustDensity = dustDensityUg;
  
  // Ensure non-negative
  if (dustDensity < 0) {
    dustDensity = 0;
  }
  
  // Cap at reasonable maximum (500 ug/m³ is very polluted)
  if (dustDensity > 1000) {
    dustDensity = 1000;
  }
  
  // Debug output
  Serial.print("Dust Density: ");
  Serial.print(dustDensity, 1);
  Serial.println(" ug/m³");
}

// --- Read all sensors ---
void readAllSensors() {
  readDHT();
  readMQ135();
  readDustSensor();
  
  // Print to Serial for debugging
  Serial.println("=== Sensor Readings ===");
  Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Air Value: "); Serial.print(airValue); Serial.print(" ("); Serial.print(getAirQuality(airValue)); Serial.println(")");
  Serial.print("Dust Density: "); Serial.print(dustDensity); Serial.println(" ug/m3");
  Serial.println();
}

#endif
