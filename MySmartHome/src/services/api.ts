import { CONFIG } from '../config';

export interface SensorData {
  temperature: number;
  humidity: number;
  pm25: number;
  gasDetected: boolean;
  aqi: number;
}

export interface Device {
  device_id: string;
  station_id: string;
  name: string;
  icon: string;
  color: string;
  device_type: string;
  is_on: boolean;
  auto_control_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceCreate {
  station_id: string;
  name: string;
  icon: string;
  color: string;
  device_type: string;
  auto_control_enabled?: boolean;
}

export interface DeviceUpdate {
  name?: string;
  icon?: string;
  color?: string;
  auto_control_enabled?: boolean;
}


export const fetchSensorData = async (): Promise<SensorData | null> => {
  try {
    // Gọi API lấy dữ liệu mới nhất từ Station 01
    const response = await fetch(`${CONFIG.API_BASE_URL}/data/latest?station_id=station_01`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseJson = await response.json();
    const sensorData = responseJson.data;
    
    // Map dữ liệu từ Server về format của App
    // Server trả về: { status: "success", data: { temperature, humidity, ... } }
    return {
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      pm25: sensorData.dust_density, // Map dust_density -> pm25
      gasDetected: sensorData.air_value > 300, // Giả sử air_value > 300 là có khí gas/khói
      aqi: sensorData.aqi || 0,
    };
  } catch (error) {
    console.log('Error fetching data:', error);
    return null;
  }
};

export const connectWebSocket = (onMessage: (data: SensorData) => void) => {
  const wsUrl = CONFIG.API_BASE_URL.replace('http', 'ws') + '/ws';
  let ws: WebSocket | null = null;
  let reconnectTimeout: NodeJS.Timeout;

  const connect = () => {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'sensor_update' && message.data) {
            const serverData = message.data;
            const sensorData: SensorData = {
              temperature: serverData.temperature,
              humidity: serverData.humidity,
              pm25: serverData.dust_density,
              gasDetected: serverData.air_value > 300,
              aqi: serverData.aqi || 0,
            };
            onMessage(sensorData);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected. Reconnecting in 5s...');
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
        ws?.close();
      };
    } catch (e) {
      console.error('WebSocket Connection Failed:', e);
      reconnectTimeout = setTimeout(connect, 5000);
    }
  };

  connect();

  return () => {
    if (ws) {
      ws.onclose = null; // Prevent reconnect on manual close
      ws.close();
    }
    clearTimeout(reconnectTimeout);
  };
};

// ==================== Device Management API ====================

export const fetchDevices = async (stationId: string): Promise<Device[]> => {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/devices?station_id=${stationId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const devices = await response.json();
    return devices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
};

export const createDevice = async (deviceData: DeviceCreate): Promise<Device | null> => {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });

    if (!response.ok) {
      throw new Error('Failed to create device');
    }

    const device = await response.json();
    return device;
  } catch (error) {
    console.error('Error creating device:', error);
    return null;
  }
};

export const updateDevice = async (deviceId: string, updateData: DeviceUpdate): Promise<Device | null> => {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/devices/${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error('Failed to update device');
    }

    const device = await response.json();
    return device;
  } catch (error) {
    console.error('Error updating device:', error);
    return null;
  }
};

export const deleteDevice = async (deviceId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/devices/${deviceId}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting device:', error);
    return false;
  }
};

export const toggleDevice = async (deviceId: string, isOn: boolean): Promise<Device | null> => {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/devices/${deviceId}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_on: isOn }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle device');
    }

    const device = await response.json();
    return device;
  } catch (error) {
    console.error('Error toggling device:', error);
    return null;
  }
};

