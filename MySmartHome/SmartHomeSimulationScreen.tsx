import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Thermometer, Wind, Activity, Flame, Cloud, Settings, Droplets } from 'lucide-react-native';
import { clsx } from 'clsx';
import { fetchSensorData, connectWebSocket, Device, fetchDevices, toggleDevice as toggleDeviceAPI } from './src/services/api';
import { CONFIG } from './src/config';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DeviceCard } from './src/components/DeviceCard';

// --- Types ---
interface SensorData {
  temperature: number; // > 30 -> Fan ON
  humidity: number;    // < 40 -> Humidifier ON
  pm25: number;        // > 35 -> Purifier ON
  gasDetected: boolean; // true -> Alarm ON
  aqi: number;
}

interface SmartHomeSimulationScreenProps {
  onNavigateToDeviceManagement?: () => void;
}

// --- Main Screen ---
export default function SmartHomeSimulationScreen({ onNavigateToDeviceManagement }: SmartHomeSimulationScreenProps = {}) {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 28,
    humidity: 50,
    pm25: 20,
    gasDetected: false,
    aqi: 45,
  });

  const [isAutoMode, setIsAutoMode] = useState(false); // Default to Manual/Real Data
  const [useRealData, setUseRealData] = useState(true); // Default to Real Data
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  
  // Load devices from API
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({});
  const [devicesLoading, setDevicesLoading] = useState(true);


  // Track previous sensor data to detect threshold crossings
  const prevSensorData = useRef<SensorData>(sensorData);

  // Load devices from API
  useEffect(() => {
    const loadDevices = async () => {
      setDevicesLoading(true);
      try {
        const deviceList = await fetchDevices('station_01');
        setDevices(deviceList);
        
        // Initialize device states
        const initialStates: Record<string, boolean> = {};
        deviceList.forEach(device => {
          initialStates[device.device_id] = device.is_on;
        });
        setDeviceStates(initialStates);
      } catch (error) {
        console.error('Failed to load devices:', error);
      } finally {
        setDevicesLoading(false);
      }
    };
    
    loadDevices();
  }, []);


  // Data Fetching Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      if (useRealData) {
        const data = await fetchSensorData();
        if (data) {
          setSensorData(data);
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      }
    };

    if (useRealData) {
      fetchData(); // Fetch initial data
      
      // Connect WebSocket for real-time updates
      const disconnect = connectWebSocket((data) => {
        setSensorData(data);
        setConnectionStatus('connected');
      });
      
      return () => {
        disconnect();
      };
    } else if (isAutoMode) {
      // Simulation Mode
      interval = setInterval(() => {
        setSensorData({
          temperature: Math.floor(Math.random() * (35 - 25) + 25),
          humidity: Math.floor(Math.random() * (60 - 30) + 30),
          pm25: Math.floor(Math.random() * (50 - 10) + 10),
          gasDetected: Math.random() > 0.8,
          aqi: Math.floor(Math.random() * (180 - 20) + 20),
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAutoMode, useRealData]);

  // Hybrid Control Logic: React to Sensor Changes (Threshold Events)
  useEffect(() => {
    const prev = prevSensorData.current;
    const current = sensorData;

    setDeviceStates(prevStates => {
      const newStates = { ...prevStates };
      let changed = false;

      // Auto-control logic for devices with auto_control_enabled
      devices.forEach(device => {
        if (!device.auto_control_enabled) return;

        const deviceId = device.device_id;
        
        // Fan Logic (> 30)
        if (device.device_type === 'fan') {
          if (prev.temperature <= 30 && current.temperature > 30) {
            newStates[deviceId] = true; changed = true;
          } else if (prev.temperature > 30 && current.temperature <= 30) {
            newStates[deviceId] = false; changed = true;
          }
        }
        
        // Humidifier Logic (< 40)
        if (device.device_type === 'humidifier') {
          if (prev.humidity >= 40 && current.humidity < 40) {
            newStates[deviceId] = true; changed = true;
          } else if (prev.humidity < 40 && current.humidity >= 40) {
            newStates[deviceId] = false; changed = true;
          }
        }
        
        // Air Purifier Logic (> 35)
        if (device.device_type === 'purifier') {
          if (prev.pm25 <= 35 && current.pm25 > 35) {
            newStates[deviceId] = true; changed = true;
          } else if (prev.pm25 > 35 && current.pm25 <= 35) {
            newStates[deviceId] = false; changed = true;
          }
        }
        
        // Alarm Logic (Gas Detected)
        if (device.device_type === 'alarm') {
          if (!prev.gasDetected && current.gasDetected) {
            newStates[deviceId] = true; changed = true;
          } else if (prev.gasDetected && !current.gasDetected) {
            newStates[deviceId] = false; changed = true;
          }
        }
      });

      return changed ? newStates : prevStates;
    });

    // Update ref for next render
    prevSensorData.current = current;
  }, [sensorData, devices]);

  const toggleDeviceHandler = async (deviceId: string) => {
    const newState = !deviceStates[deviceId];
    
    // Optimistically update UI
    setDeviceStates(prev => ({ ...prev, [deviceId]: newState }));
    
    // Call API to update backend
    const result = await toggleDeviceAPI(deviceId, newState);
    if (!result) {
      // Revert if API call failed
      setDeviceStates(prev => ({ ...prev, [deviceId]: !newState }));
    }
  };

  return (
    <SafeAreaProvider className="flex-1 bg-gray-50">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        
        <ScrollView className="flex-1 p-4">
          {/* Header */}
          <View className="mb-6 mt-2 flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-800">Smart Home</Text>
              <Text className="text-gray-500">
                {useRealData ? `Real Data (${connectionStatus})` : 'Simulation Mode'}
              </Text>
            </View>
            
            {/* Settings Button */}
            {onNavigateToDeviceManagement && (
              <TouchableOpacity 
                onPress={onNavigateToDeviceManagement}
                className="bg-gray-800 p-3 rounded-xl mr-2"
              >
                <Settings size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
            
            <View className={clsx("w-3 h-3 rounded-full", 
              useRealData 
                ? (connectionStatus === 'connected' ? "bg-green-500" : "bg-red-500") 
                : "bg-blue-500"
            )} />
          </View>

          {/* Sensor Dashboard */}
          <View className="bg-white rounded-3xl p-5 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Sensor Status</Text>
            
            <View className="flex-row flex-wrap justify-between">
              {/* Temperature */}
              <View className="w-[48%] bg-orange-50 rounded-xl p-3 mb-3 flex-row items-center">
                  <View className="bg-orange-100 p-2 rounded-full mr-3">
                      <Thermometer size={20} color="#f97316" />
                  </View>
                  <View>
                      <Text className="text-xs text-gray-500">Temp</Text>
                      <Text className="text-lg font-bold text-gray-800">{sensorData.temperature}°C</Text>
                  </View>
              </View>

              {/* Humidity */}
              <View className="w-[48%] bg-blue-50 rounded-xl p-3 mb-3 flex-row items-center">
                  <View className="bg-blue-100 p-2 rounded-full mr-3">
                      <Droplets size={20} color="#3b82f6" />
                  </View>
                  <View>
                      <Text className="text-xs text-gray-500">Humidity</Text>
                      <Text className="text-lg font-bold text-gray-800">{sensorData.humidity}%</Text>
                  </View>
              </View>

              {/* PM2.5 */}
              <View className="w-[48%] bg-green-50 rounded-xl p-3 mb-3 flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-full mr-3">
                      <Wind size={20} color="#22c55e" />
                  </View>
                  <View>
                      <Text className="text-xs text-gray-500">PM2.5</Text>
                      <Text className="text-lg font-bold text-gray-800">{sensorData.pm25}</Text>
                  </View>
              </View>

              {/* Gas Status */}
              <View className={clsx("w-[48%] rounded-xl p-3 mb-3 flex-row items-center", sensorData.gasDetected ? "bg-red-100" : "bg-gray-100")}>
                  <View className={clsx("p-2 rounded-full mr-3", sensorData.gasDetected ? "bg-red-200" : "bg-gray-200")}>
                      <Flame size={20} color={sensorData.gasDetected ? "#ef4444" : "#6b7280"} />
                  </View>
                  <View>
                      <Text className="text-xs text-gray-500">Gas</Text>
                      <Text className={clsx("text-lg font-bold", sensorData.gasDetected ? "text-red-600" : "text-gray-800")}>
                          {sensorData.gasDetected ? "DETECTED" : "Normal"}
                      </Text>
                  </View>
              </View>

              {/* AQI Status */}
              <View className={clsx("w-[48%] rounded-xl p-3 mb-3 flex-row items-center", 
                  sensorData.aqi <= 50 ? "bg-green-50" : 
                  sensorData.aqi <= 100 ? "bg-yellow-50" : 
                  "bg-red-50"
              )}>
                  <View className={clsx("p-2 rounded-full mr-3", 
                      sensorData.aqi <= 50 ? "bg-green-100" : 
                      sensorData.aqi <= 100 ? "bg-yellow-100" : 
                      "bg-red-100"
                  )}>
                      <Cloud size={20} color={
                          sensorData.aqi <= 50 ? "#22c55e" : 
                          sensorData.aqi <= 100 ? "#eab308" : 
                          "#ef4444"
                      } />
                  </View>
                  <View>
                      <Text className="text-xs text-gray-500">AQI</Text>
                      <Text className={clsx("text-lg font-bold", 
                          sensorData.aqi <= 50 ? "text-green-700" : 
                          sensorData.aqi <= 100 ? "text-yellow-700" : 
                          "text-red-700"
                      )}>
                          {sensorData.aqi}
                      </Text>
                  </View>
              </View>
            </View>
          </View>

          {/* Devices Grid */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-800">Devices</Text>
          </View>
          
          {devicesLoading ? (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500">Loading devices...</Text>
            </View>
          ) : devices.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500 text-center">No devices found</Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                Tap the ⚙️ button to add devices
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {devices.map((device) => (
                <View key={device.device_id} className="w-1/2">
                  <DeviceCard 
                    device={device}
                    isOn={deviceStates[device.device_id] || false}
                    onToggle={() => toggleDeviceHandler(device.device_id)}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Control Panel */}
          <View className="mt-8 mb-10">
              {/* Mode Switcher */}
              <View className="flex-row mb-4 bg-gray-200 p-1 rounded-xl">
                <TouchableOpacity 
                  onPress={() => { setUseRealData(true); setIsAutoMode(false); }}
                  className={clsx("flex-1 p-3 rounded-lg items-center", useRealData ? "bg-white shadow-sm" : "")}
                >
                  <Text className={clsx("font-bold", useRealData ? "text-gray-800" : "text-gray-500")}>Real Data</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setUseRealData(false); setIsAutoMode(true); }}
                  className={clsx("flex-1 p-3 rounded-lg items-center", !useRealData ? "bg-white shadow-sm" : "")}
                >
                  <Text className={clsx("font-bold", !useRealData ? "text-gray-800" : "text-gray-500")}>Simulation</Text>
                </TouchableOpacity>
              </View>

              {!useRealData && (
                  <TouchableOpacity 
                      onPress={() => setIsAutoMode(!isAutoMode)}
                      className={clsx("p-4 rounded-xl items-center mb-4", isAutoMode ? "bg-indigo-600" : "bg-gray-800")}
                  >
                      <Text className="text-white font-bold text-lg">
                          {isAutoMode ? "Stop Simulation" : "Start Simulation"}
                      </Text>
                  </TouchableOpacity>
              )}

              {!useRealData && !isAutoMode && (
                  <View className="bg-white p-4 rounded-xl shadow-sm">
                      <Text className="font-bold mb-2">Manual Control</Text>
                      <TouchableOpacity 
                          className="bg-gray-100 p-3 rounded-lg mb-2"
                          onPress={() => setSensorData(prev => ({ ...prev, temperature: prev.temperature > 30 ? 25 : 35 }))}
                      >
                          <Text>Toggle High Temp ({sensorData.temperature}°C)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          className="bg-gray-100 p-3 rounded-lg mb-2"
                          onPress={() => setSensorData(prev => ({ ...prev, gasDetected: !prev.gasDetected }))}
                      >
                          <Text>Toggle Gas Leak ({sensorData.gasDetected ? "ON" : "OFF"})</Text>
                      </TouchableOpacity>
                  </View>
              )}
              
              {useRealData && (
                 <View className="bg-white p-4 rounded-xl shadow-sm items-center">
                    <Text className="text-gray-500 mb-1">Connected to Server:</Text>
                    <Text className="font-mono text-xs bg-gray-100 p-2 rounded">{CONFIG.API_BASE_URL}</Text>
                    {connectionStatus === 'disconnected' && (
                      <Text className="text-red-500 text-xs mt-2">Cannot connect to server. Check IP in config.ts</Text>
                    )}
                 </View>
              )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
