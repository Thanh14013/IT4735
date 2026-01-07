# Hướng dẫn Thiết lập ThingSpeak

## 1. Tạo Tài khoản ThingSpeak

1. Truy cập [ThingSpeak.com](https://thingspeak.com/)
2. Nhấn "Get Started For Free"
3. Tạo MathWorks Account (miễn phí)
4. Xác nhận email và đăng nhập

## 2. Tạo Channel Mới

### Bước 1: New Channel

1. Sau khi đăng nhập, nhấn **"Channels"** → **"My Channels"**
2. Nhấn **"New Channel"**

### Bước 2: Cấu hình Channel

Điền thông tin sau:

**Channel Settings:**

- **Name**: `Air Quality Monitor`
- **Description**: `ESP32-based air quality monitoring station with DHT11, MQ-135, and GP2Y dust sensor`

**Field Settings:**
Bật 4 fields và đặt tên như sau:

| Field   | Name         | Description                   |
| ------- | ------------ | ----------------------------- |
| Field 1 | Temperature  | Temperature in Celsius (°C)   |
| Field 2 | Humidity     | Relative Humidity (%)         |
| Field 3 | Air Quality  | Air quality value from MQ-135 |
| Field 4 | Dust Density | Dust density in ug/m³         |

**Metadata (Tùy chọn):**

- **Tags**: `ESP32, Air Quality, IoT, DHT11, MQ-135`
- **Location**: Có thể thêm vị trí của thiết bị

### Bước 3: Save Channel

Nhấn **"Save Channel"** ở cuối trang

## 3. Lấy API Key

### Write API Key (Quan trọng!)

1. Sau khi tạo channel, chọn tab **"API Keys"**
2. Sao chép **"Write API Key"** (16 ký tự)
   ```
   Ví dụ: UT59MFG72WYBCLZM
   ```
3. Paste vào file `src/config.h`:
   ```cpp
   const char* THINGSPEAK_API_KEY = "YOUR_API_KEY_HERE";
   ```

### Read API Key (Tùy chọn)

- Dùng để đọc dữ liệu từ channel
- Không cần thiết cho dự án này

## 4. Cấu hình Visualizations

### 4.1. Tạo Widget cho Temperature

1. Chọn tab **"Private View"**
2. Nhấn **"Add Visualizations"**
3. Chọn **"Gauge"**
4. Cấu hình:
   - **Field**: Field 1 (Temperature)
   - **Min**: 0
   - **Max**: 50
   - **Units**: °C
   - **Title**: Temperature
5. Nhấn **"Create"**

### 4.2. Tạo Widget cho Humidity

1. Nhấn **"Add Visualizations"** → **"Gauge"**
2. Cấu hình:
   - **Field**: Field 2 (Humidity)
   - **Min**: 0
   - **Max**: 100
   - **Units**: %
   - **Title**: Humidity
3. Nhấn **"Create"**

### 4.3. Tạo Widget cho Air Quality

1. Nhấn **"Add Visualizations"** → **"Gauge"**
2. Cấu hình:
   - **Field**: Field 3 (Air Quality)
   - **Min**: 0
   - **Max**: 1023
   - **Color Ranges**:
     - 0-100: Green (Excellent)
     - 100-200: Light Green (Good)
     - 200-300: Yellow (Moderate)
     - 300-400: Orange (Poor)
     - 400-500: Red (Very Poor)
     - 500-1023: Dark Red (Hazardous)
   - **Title**: Air Quality Value
3. Nhấn **"Create"**

### 4.4. Tạo Widget cho Dust Density

1. Nhấn **"Add Visualizations"** → **"Gauge"**
2. Cấu hình:
   - **Field**: Field 4 (Dust Density)
   - **Min**: 0
   - **Max**: 500
   - **Units**: ug/m³
   - **Title**: Dust Density
3. Nhấn **"Create"**

### 4.5. Tạo Chart Timeline

1. Nhấn **"Add Visualizations"** → **"Chart"**
2. Chọn tất cả 4 fields
3. **Time Range**: 1 day
4. **Title**: Air Quality Trends
5. Nhấn **"Create"**

## 5. Public View (Tùy chọn)

Nếu muốn chia sẻ dữ liệu công khai:

1. Chọn tab **"Sharing"**
2. Bật **"Share channel view with everyone"**
3. Sao chép link public để chia sẻ

## 6. MATLAB Analysis (Nâng cao - Tùy chọn)

ThingSpeak cho phép chạy code MATLAB để phân tích dữ liệu:

### Ví dụ: Tính trung bình nhiệt độ 1 giờ

```matlab
% Read temperature data from the last hour
data = thingSpeakRead(CHANNEL_ID, 'Fields', 1, 'NumPoints', 12);

% Calculate average
avgTemp = mean(data);

% Write to another field or display
disp(['Average Temperature: ', num2str(avgTemp), ' °C']);
```

## 7. Alerts (Cảnh báo)

Thiết lập cảnh báo khi chất lượng không khí xấu:

1. Chọn **"Apps"** → **"React"**
2. Nhấn **"New React"**
3. Cấu hình:
   - **Condition Type**: Numeric
   - **Test Frequency**: On data insertion
   - **Condition**: If Field 3 (Air Quality) > 400
   - **Action**: ThingTweet / Email / ThingHTTP
   - **Message**: "Warning: Poor air quality detected!"
4. Nhấn **"Save React"**

## 8. Xem Dữ liệu

### Từ Web:

- Truy cập: `https://thingspeak.com/channels/YOUR_CHANNEL_ID`

### Từ API:

```
# Đọc field 1 (Temperature)
https://api.thingspeak.com/channels/YOUR_CHANNEL_ID/fields/1.json?api_key=YOUR_READ_API_KEY&results=10

# Đọc tất cả fields
https://api.thingspeak.com/channels/YOUR_CHANNEL_ID/feeds.json?api_key=YOUR_READ_API_KEY&results=10
```

### Từ Mobile App:

1. Download **ThingView** app (iOS/Android)
2. Thêm channel bằng Channel ID

## 9. Giới hạn Free Tier

ThingSpeak miễn phí có giới hạn:

- **Update interval**: Tối thiểu 15 giây
- **Messages/day**: 3 triệu messages/year (~8,200/day)
- **Channels**: 4 channels
- **Fields**: 8 fields/channel

**Dự án này:**

- Update: 30 giây (an toàn)
- Messages/day: 2,880 (30s × 60min × 24h = 2,880)

✅ **Phù hợp với Free Tier**

## 10. Troubleshooting

### Lỗi "0" response:

- **Nguyên nhân**: Update quá nhanh (< 15s)
- **Giải pháp**: Tăng `SEND_INTERVAL_MS` lên 30000 (30s)

### Lỗi "400 Bad Request":

- **Nguyên nhân**: API Key sai hoặc field không tồn tại
- **Giải pháp**: Kiểm tra lại API Key và field numbers

### Không nhận dữ liệu:

- Kiểm tra WiFi connection
- Kiểm tra Serial Monitor để xem HTTP response code
- Verify API Key trong `config.h`

### SSL Certificate Error:

- Code đã set `secureClient.setInsecure()` để bỏ qua
- Nếu muốn verify certificate, cần thêm root CA

## 11. Channel URL

Sau khi hoàn tất setup, channel của bạn sẽ có URL dạng:

```
https://thingspeak.com/channels/YOUR_CHANNEL_ID
```

**Example**: https://thingspeak.com/channels/2123456

Lưu link này để xem dashboard!

---

## Tóm tắt Thông tin cần thiết:

| Thông tin       | Giá trị                  | Vị trí                 |
| --------------- | ------------------------ | ---------------------- |
| Write API Key   | `UT59MFG72WYBCLZM`       | Tab "API Keys"         |
| Channel ID      | `YOUR_CHANNEL_ID`        | URL của channel        |
| Update Interval | 30 seconds               | Trong code             |
| Fields          | 4 (Temp, Hum, Air, Dust) | Tab "Channel Settings" |

**Hoàn tất!** 🎉

Bây giờ ESP32 sẽ tự động gửi dữ liệu lên ThingSpeak mỗi 30 giây.
