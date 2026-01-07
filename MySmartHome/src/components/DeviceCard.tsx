import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { Device } from '../services/api';

interface DeviceCardProps {
  device: Device;
  isOn: boolean;
  onToggle: () => void;
}

// Color mapping
const colorMap: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
  indigo: '#6366f1',
  red: '#ef4444',
  yellow: '#eab308',
  teal: '#14b8a6',
  gray: '#6b7280',
};

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, isOn, onToggle }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Get icon component
  const IconComponent = (LucideIcons as any)[device.icon] || LucideIcons.Circle;
  const iconColor = isOn ? colorMap[device.color] || '#6b7280' : '#9ca3af';
  const borderColor = isOn ? colorMap[device.color] || '#d1d5db' : '#d1d5db';

  useEffect(() => {
    if (isOn) {
      // Different animations based on device type
      if (device.device_type === 'fan') {
        // Rotation animation for fan
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      } else if (device.device_type === 'humidifier') {
        // Opacity animation for humidifier
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.4,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else if (device.device_type === 'purifier') {
        // Scale animation for purifier
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
      opacityAnim.stopAnimation();
      opacityAnim.setValue(1);
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
    }
  }, [isOn, device.device_type]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Determine which animation to apply
  let animatedStyle = {};
  if (device.device_type === 'fan') {
    animatedStyle = { transform: [{ rotate: spin }] };
  } else if (device.device_type === 'humidifier') {
    animatedStyle = { opacity: opacityAnim };
  } else if (device.device_type === 'purifier') {
    animatedStyle = { transform: [{ scale: scaleAnim }] };
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.touchable}>
        <View style={[
          styles.card,
          { borderColor: borderColor }
        ]}>
          <Animated.View style={animatedStyle}>
            <IconComponent size={48} color={iconColor} />
          </Animated.View>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.name}
          </Text>
          <Text style={[
            styles.statusText,
            { color: isOn ? (colorMap[device.color] || '#6b7280') : '#9ca3af' }
          ]}>
            {isOn ? 'ON' : 'OFF'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  touchable: {
    width: '100%',
  },
  card: {
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceName: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
