import React, { useState } from 'react';
import SmartHomeSimulationScreen from './SmartHomeSimulationScreen';
import DeviceManagementScreen from './DeviceManagementScreen';

type Screen = 'Home' | 'DeviceManagement';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');

  if (currentScreen === 'DeviceManagement') {
    return (
      <DeviceManagementScreen 
        onBack={() => setCurrentScreen('Home')}
        stationId="station_01"
      />
    );
  }

  return (
    <SmartHomeSimulationScreen 
      onNavigateToDeviceManagement={() => setCurrentScreen('DeviceManagement')}
    />
  );
}
