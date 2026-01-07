# Trạm Quan trắc Chất lượng Không khí (Air Quality Monitor)

**Project III - Vũ Đức Trung**  
**MSSV: 20225161**  
**Ngày: 27/10/2025**

## 📋 Tổng quan Dự án

Dự án xây dựng thiết bị IoT nhỏ gọn để đo lường các chỉ số quan trọng về chất lượng không khí, hiển thị dữ liệu tại chỗ và gửi dữ liệu lên nền tảng cloud (ThingSpeak) để theo dõi từ xa.

## 🔧 Phần cứng

### Linh kiện chính:

- **Vi điều khiển**: ESP32
- **Cảm biến Nhiệt độ/Độ ẩm**: DHT11
- **Cảm biến Chất lượng Không khí**: MQ-135 (analog)
- **Cảm biến Bụi**: GP2Y1010AU0F (đo PM)
- **Màn hình**: OLED SSD1306 (128x64, I2C)

### Sơ đồ kết nối:

| Linh kiện  | Chân trên Linh kiện | Chân trên ESP32 | Ghi chú       |
| ---------- | ------------------- | --------------- | ------------- |
| DHT11      | DATA                | GPIO 4          |               |
| MQ-135     | AO (Analog Out)     | GPIO 34         | ADC1_CH6      |
| GP2Y (Bụi) | LED Control         | GPIO 5          |               |
|            | AO (Analog Out)     | GPIO 35         | ADC1_CH7      |
| OLED (I2C) | SDA                 | GPIO 21         |               |
|            | SCL                 | GPIO 22         |               |
| Nguồn      | VCC                 | 5V / 3.3V       |               |
|            | GND                 | GND             | Nối đất chung |

## 💻 Phần mềm

### Cấu trúc Code (Modular):

```
src/
├── main.cpp       # Logic chính (setup & loop)
├── config.h       # Cấu hình WiFi, API keys, định nghĩa chân
├── sensors.h      # Xử lý tất cả cảm biến
├── display.h      # Xử lý màn hình OLED
└── network.h      # Kết nối WiFi và gửi dữ liệu cloud
```

### Các tính năng đã hoàn thành:

✅ **Đọc cảm biến:**

- DHT11: Nhiệt độ và độ ẩm
- MQ-135: Giá trị chất lượng không khí (với phân loại định tính)
- GP2Y1010AU0F: Nồng độ bụi (ug/m³)

✅ **Hiển thị:**

- Giao diện OLED hiển thị 4 thông số chính
- Tự động cập nhật mỗi 2 giây

✅ **Kết nối mạng:**

- Tự động kết nối WiFi khi khởi động
- Gửi dữ liệu lên ThingSpeak mỗi 30 giây

🔧 **Đã chuẩn bị (chưa kích hoạt):**

- MQTT: Code đã viết nhưng đang được chú thích

## 🚀 Hướng dẫn sử dụng

### 1. Cài đặt môi trường:

- Cài đặt [PlatformIO](https://platformio.org/)
- Mở dự án trong VS Code với PlatformIO extension

### 2. Cấu hình:

Chỉnh sửa file `src/config.h`:

```cpp
// WiFi credentials
const char* WIFI_SSID = "your_wifi_ssid";
const char* WIFI_PASS = "your_wifi_password";

// ThingSpeak API Key
const char* THINGSPEAK_API_KEY = "your_api_key";
```

### 3. Build và Upload:

```bash
# Build project
pio run

# Upload to ESP32
pio run --target upload

# Monitor serial output
pio device monitor
```

### 4. Thiết lập ThingSpeak:

1. Tạo tài khoản tại [ThingSpeak](https://thingspeak.com/)
2. Tạo channel mới với 4 fields:
   - Field 1: Temperature (°C)
   - Field 2: Humidity (%)
   - Field 3: Air Quality Value
   - Field 4: Dust Density (ug/m³)
3. Copy API Key vào `config.h`

## 📊 Dữ liệu hiển thị

### Trên màn hình OLED:

- **Temp**: Nhiệt độ (°C)
- **Hum**: Độ ẩm (%)
- **Dust**: Nồng độ bụi (ug/m³)
- **Air**: Giá trị và chất lượng không khí

### Phân loại chất lượng không khí:

- **Excellent**: < 100
- **Good**: 100-200
- **Moderate**: 200-300
- **Poor**: 300-400
- **Very Poor**: 400-500
- **Hazardous**: > 500

## 📈 Tiến độ

| Hạng mục           | Trạng thái    | Ghi chú                              |
| ------------------ | ------------- | ------------------------------------ |
| Thiết kế Phần cứng | ✅ Hoàn thành | Đã chọn linh kiện và chốt sơ đồ chân |
| Lắp đặt Phần cứng  | ✅ Hoàn thành | Đã ghép nối các mô-đun theo sơ đồ    |
| Code - Cảm biến    | ✅ Hoàn thành | Đọc thành công cả 3 loại cảm biến    |
| Code - Hiển thị    | ✅ Hoàn thành | Dữ liệu hiển thị rõ ràng trên OLED   |
| Code - WiFi        | ✅ Hoàn thành | Tự động kết nối khi khởi động        |
| Code - ThingSpeak  | ✅ Hoàn thành | Gửi dữ liệu thành công               |
| Code - MQTT        | 🔧 Đang chờ   | Đã viết code nhưng chưa kích hoạt    |

## 🔮 Phát triển tương lai

- [ ] Kích hoạt MQTT để tích hợp với Home Assistant
- [ ] Thêm cảm biến CO2
- [ ] Thiết kế vỏ case 3D printing
- [ ] Thêm chế độ tiết kiệm pin
- [ ] Web dashboard riêng

## 📝 Ghi chú kỹ thuật

### Cảm biến bụi GP2Y1010AU0F:

- LED bật trong 280µs để đo
- Công thức: `density = (voltage - 0.9) / 0.5`
- Đơn vị: ug/m³

### MQ-135:

- ADC 12-bit (0-4095) được map về 0-1023
- Giá trị thô được chuyển đổi thành phân loại định tính

### Thời gian:

- Đọc cảm biến: Mỗi 2 giây
- Gửi ThingSpeak: Mỗi 30 giây (giới hạn free tier)

## 📄 License

Educational Project - Project III

## 👤 Tác giả

**Vũ Đức Trung**  
MSSV: 20225161  
Email: trung.vd225161@sis.hust.edu.vn
