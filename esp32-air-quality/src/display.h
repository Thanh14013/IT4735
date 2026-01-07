#ifndef DISPLAY_H
#define DISPLAY_H

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

// --- OLED display settings ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1  // Reset pin (or -1 if sharing ESP32 reset pin)
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- Initialize OLED display ---
bool initDisplay() {
  Wire.begin(PIN_SDA, PIN_SCL);
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    return false;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("Air Quality Monitor"));
  display.println(F("Initializing..."));
  display.display();
  
  Serial.println("Display initialized");
  return true;
}

// --- Update display with sensor data ---
void updateDisplay(float temp, float hum, int airVal, String airQual, float dust) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(0, 0);
  display.println(F("Air Quality Monitor"));
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Temperature
  display.setCursor(0, 14);
  display.print(F("Temp: "));
  display.print(temp, 1);
  display.println(F(" C"));
  
  // Humidity
  display.setCursor(0, 24);
  display.print(F("Hum:  "));
  display.print(hum, 1);
  display.println(F(" %"));
  
  // Dust
  display.setCursor(0, 34);
  display.print(F("Dust: "));
  display.print(dust, 1);
  display.println(F(" ug/m3"));
  
  // Air Quality Value
  display.setCursor(0, 44);
  display.print(F("Air:  "));
  display.println(airVal);
  
  // Air Quality Status
  display.setCursor(0, 54);
  display.print(F(""));
  display.println(airQual);
  
  display.display();
}

#endif
