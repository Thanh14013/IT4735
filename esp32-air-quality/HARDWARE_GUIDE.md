# Hướng dẫn Kết nối Phần cứng

## Sơ đồ Kết nối Chi tiết

### ESP32 Pinout

```
                     ESP32 DevKit V1
                    ┌──────────────┐
                    │              │
            3V3 ────┤ 3V3      GND ├──── GND (Common Ground)
            GND ────┤ EN       D23 │
           DHT11────┤ D4       D22 ├──── OLED SCL
                    │ D5       D21 ├──── OLED SDA
        DUST_LED────┤ D5       D19 │
                    │ D18      D18 │
                    │ D19      D5  │
                    │ D21      D17 │
                    │ D22      D16 │
                    │ D23      D4  │
                    │          D0  │
                    │ D34      D2  │
        MQ135_AO────┤ D34      D15 │
         DUST_AO────┤ D35      GND │
                    └──────────────┘
```

## 1. Kết nối DHT11 (Cảm biến Nhiệt độ & Độ ẩm)

```
DHT11          ESP32
┌─────┐        ┌─────┐
│  -  ├────────┤ GND │
│  +  ├────────┤ 3V3 │
│ OUT ├────────┤ D4  │
└─────┘        └─────┘
```

**Lưu ý**:

- Cần điện trở pull-up 10kΩ giữa VCC và DATA pin
- Hoặc sử dụng module DHT11 có sẵn điện trở

## 2. Kết nối MQ-135 (Cảm biến Chất lượng Không khí)

```
MQ-135         ESP32
┌─────┐        ┌─────┐
│ VCC ├────────┤ 5V  │ (hoặc 3V3)
│ GND ├────────┤ GND │
│  AO ├────────┤ D34 │ (Analog Out)
│  DO │ (not used)
└─────┘        └─────┘
```

**Lưu ý**:

- MQ-135 cần thời gian "đốt nóng" 24-48h để cho kết quả chính xác
- Sử dụng chân Analog Out (AO) kết nối với GPIO34 (ADC1_CH6)
- Chân Digital Out (DO) không sử dụng trong dự án này

## 3. Kết nối GP2Y1010AU0F (Cảm biến Bụi)

```
GP2Y1010AU0F          ESP32          Tụ điện
┌─────────┐           ┌─────┐        150µF
│ 1 (LED) ├───────────┤ D5  │
│ 2 (LED-)├───────────┤ GND │
│ 3 (LED) │ (NC)
│ 4 (GND) ├───────────┤ GND │────┬───║───
│ 5 (Vo)  ├───────────┤ D35 │    │
│ 6 (Vcc) ├───────────┤ 5V  │────┴───║───
└─────────┘           └─────┘
```

**Lưu ý quan trọng**:

- Tụ điện 150µF cần được đặt giữa VCC và GND (gần cảm biến)
- Điện trở 150Ω có thể cần thiết cho LED (tùy module)
- GPIO5 điều khiển LED (LOW = bật, HIGH = tắt)
- GPIO35 đọc giá trị analog

**Pinout GP2Y1010AU0F**:

```
   ┌───────┐
   │ 1 2 3 │  Top View
   │ 4 5 6 │  (Connector)
   └───────┘

Pin 1: S-LED  (LED Control)
Pin 2: LED-GND (LED Ground)
Pin 3: LED    (Not used)
Pin 4: S-GND  (Signal Ground)
Pin 5: Vo     (Analog Output)
Pin 6: Vcc    (5V Power)
```

## 4. Kết nối OLED SSD1306 (Màn hình I2C)

```
OLED SSD1306   ESP32
┌─────┐        ┌─────┐
│ VCC ├────────┤ 3V3 │
│ GND ├────────┤ GND │
│ SCL ├────────┤ D22 │
│ SDA ├────────┤ D21 │
└─────┘        └─────┘
```

**Lưu ý**:

- Màn hình OLED sử dụng giao tiếp I2C
- Địa chỉ I2C mặc định: 0x3C
- Độ phân giải: 128x64 pixels

## Sơ đồ Tổng thể

```
                        ESP32 DevKit V1
                     ┌──────────────────┐
                     │                  │
    DHT11 DATA ──────┤ D4               │
                     │                  │
   MQ-135 AO ────────┤ D34              │
                     │                  │
  GP2Y LED ──────────┤ D5               │
  GP2Y Vo ───────────┤ D35              │
                     │                  │
   OLED SDA ─────────┤ D21              │
   OLED SCL ─────────┤ D22              │
                     │                  │
                     │ 5V  ├──── VCC (MQ-135, GP2Y)
                     │ 3V3 ├──── VCC (DHT11, OLED)
                     │ GND ├──── GND (Common)
                     │                  │
                     └──────────────────┘
```

## Danh sách Vật tư

### Linh kiện chính:

- [ ] 1x ESP32 DevKit V1
- [ ] 1x DHT11 (module hoặc sensor + điện trở 10kΩ)
- [ ] 1x MQ-135
- [ ] 1x GP2Y1010AU0F
- [ ] 1x OLED SSD1306 128x64 I2C

### Linh kiện phụ:

- [ ] 1x Tụ điện 150µF (cho GP2Y)
- [ ] 1x Điện trở 150Ω (cho LED GP2Y - nếu cần)
- [ ] 1x Breadboard
- [ ] Dây jumper (M-M, M-F)
- [ ] Cáp USB Type-C (cho ESP32)
- [ ] Nguồn 5V/2A

## Kiểm tra Kết nối

### Checklist:

1. ✅ Tất cả GND đã được nối chung
2. ✅ Các cảm biến nhận đúng điện áp (3.3V hoặc 5V)
3. ✅ Không có chân nào bị ngắn mạch
4. ✅ Tụ điện 150µF đã được đặt cho GP2Y
5. ✅ Các chân Analog sử dụng đúng GPIO (34, 35)
6. ✅ I2C (SDA/SCL) kết nối đúng với OLED

### Lưu ý an toàn:

- ⚠️ **Không** kết nối nguồn 5V trực tiếp vào GPIO
- ⚠️ Chỉ GPIO 34-39 mới có thể làm ADC (không có pull-up/pull-down)
- ⚠️ MQ-135 nóng khi hoạt động - tránh chạm vào
- ⚠️ Kiểm tra phân cực tụ điện (+ và -)

## Troubleshooting

### OLED không hiển thị:

- Kiểm tra địa chỉ I2C (dùng I2C scanner)
- Kiểm tra kết nối SDA/SCL
- Thử thay đổi SCREEN_ADDRESS từ 0x3C sang 0x3D

### DHT11 trả về NaN:

- Kiểm tra điện trở pull-up 10kΩ
- Thử kết nối VCC vào 5V thay vì 3.3V
- Đợi ít nhất 2 giây giữa các lần đọc

### MQ-135 giá trị không ổn định:

- Cảm biến cần "preheat" 24-48h
- Đặt ở nơi thông thoáng
- Calibrate theo môi trường cụ thể

### GP2Y đọc sai:

- Kiểm tra tụ điện 150µF
- Kiểm tra timing (280µs LED on)
- Đảm bảo không có ánh sáng mạnh chiếu vào cảm biến
