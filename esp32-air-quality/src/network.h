#ifndef NETWORK_H
#define NETWORK_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "config.h"

// --- WiFi client ---
WiFiClient wifiClient;
WiFiClientSecure secureClient;

// --- MQTT client (prepared but not activated) ---
PubSubClient mqttClient(wifiClient);

// --- Connect to WiFi ---
bool connectWiFi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
    return false;
  }
}

// --- Send data to ThingSpeak ---
bool sendToThingSpeak(float temp, float hum, int airVal, float dust) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }
  
  HTTPClient http;
  secureClient.setInsecure();  // Skip certificate validation for simplicity
  
  // Build URL with data
  String url = String(THINGSPEAK_SERVER) + "/update?api_key=" + THINGSPEAK_API_KEY;
  url += "&field1=" + String(temp, 2);
  url += "&field2=" + String(hum, 2);
  url += "&field3=" + String(airVal);
  url += "&field4=" + String(dust, 2);
  
  Serial.println("Sending to ThingSpeak...");
  Serial.println(url);
  
  http.begin(secureClient, url);
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    String payload = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpCode);
    Serial.print("Response: ");
    Serial.println(payload);
    http.end();
    return true;
  } else {
    Serial.print("Error code: ");
    Serial.println(httpCode);
    http.end();
    return false;
  }
}

// --- MQTT Functions (prepared but commented out) ---
bool connectMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  
  Serial.print("Connecting to MQTT broker: ");
  Serial.println(MQTT_SERVER);
  
  String clientId = "ESP32_AirQuality_" + String(random(0xffff), HEX);
  
  if (mqttClient.connect(clientId.c_str())) {
    Serial.println("MQTT connected!");
    return true;
  } else {
    Serial.print("MQTT connection failed, rc=");
    Serial.println(mqttClient.state());
    return false;
  }
}

void sendToMQTT(float temp, float hum, int airVal, float dust) {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  
  if (mqttClient.connected()) {
    String payload = "{";
    payload += "\"temperature\":" + String(temp, 2) + ",";
    payload += "\"humidity\":" + String(hum, 2) + ",";
    payload += "\"airValue\":" + String(airVal) + ",";
    payload += "\"dustDensity\":" + String(dust, 2);
    payload += "}";
    
    mqttClient.publish(MQTT_TOPIC, payload.c_str());
    Serial.println("Data sent to MQTT");
  }
}


#endif
