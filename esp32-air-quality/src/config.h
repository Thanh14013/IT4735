#ifndef CONFIG_H
#define CONFIG_H

// --- WiFi ---
const char* WIFI_SSID = "Xiaomi 13";
const char* WIFI_PASS = "09876543";

// --- ThingSpeak ---
const char* THINGSPEAK_API_KEY = "UT59MFG72WYBCLZM";
const char* THINGSPEAK_SERVER = "https://api.thingspeak.com";

// --- MQTT ---
const char* MQTT_SERVER = "broker.hivemq.com";
const int   MQTT_PORT = 1883;
const char* MQTT_TOPIC = "home/trungvu/airquality";


// --- Pins ---
#define PIN_DHT      4    // DHT11 data
#define PIN_MQ135_AO 34   // MQ135 analog out
#define PIN_MQ135_DO 25   // optional digital out
#define PIN_DUST_LED 5    // GP2Y LED control (LOW = on)
#define PIN_DUST_AO  35   // GP2Y analog out
#define PIN_SDA      21   // OLED SDA
#define PIN_SCL      22   // OLED SCL

// --- Sampling & timing ---
#define SEND_INTERVAL_MS 30000UL  // send to cloud every 30s
#define SENSOR_LOOP_DELAY 2000UL  // main loop delay

// --- ADC settings ---
#define ADC_RESOLUTION 4095.0
#define ADC_VREF 3.3

#endif
