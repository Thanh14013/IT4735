import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

// Common icon names with labels
const AVAILABLE_ICONS = [
  { name: 'Fan', label: 'Quạt' },
  { name: 'Droplets', label: 'Máy tạo ẩm' },
  { name: 'ShieldCheck', label: 'Máy lọc không khí' },
  { name: 'Bell', label: 'Chuông báo động' },
  { name: 'Lightbulb', label: 'Đèn' },
  { name: 'Tv', label: 'TV' },
  { name: 'Speaker', label: 'Loa' },
  { name: 'Lock', label: 'Khóa cửa' },
  { name: 'Camera', label: 'Camera' },
  { name: 'Thermometer', label: 'Nhiệt kế' },
  { name: 'Wind', label: 'Điều hòa' },
  { name: 'Zap', label: 'Điện' },
  { name: 'Coffee', label: 'Máy pha cà phê' },
  { name: 'Home', label: 'Nhà' },
  { name: 'Sun', label: 'Ánh sáng' },
  { name: 'Moon', label: 'Đèn ngủ' },
  { name: 'Wifi', label: 'WiFi' },
  { name: 'Music', label: 'Nhạc' },
  { name: 'Volume2', label: 'Âm thanh' },
  { name: 'Radio', label: 'Radio' },
  { name: 'Laptop', label: 'Laptop' },
  { name: 'Smartphone', label: 'Điện thoại' },
  { name: 'Tablet', label: 'Máy tính bảng' },
  { name: 'Watch', label: 'Đồng hồ' },
  { name: 'Plug', label: 'Ổ cắm' },
  { name: 'Battery', label: 'Pin' },
  { name: 'Power', label: 'Nguồn' },
  { name: 'Flame', label: 'Lò sưởi' },
  { name: 'Snowflake', label: 'Tủ lạnh' },
  { name: 'Activity', label: 'Hoạt động' },
];

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn Icon</Text>
      <View style={styles.iconList}>
        {AVAILABLE_ICONS.map((item) => {
          const IconComponent = (LucideIcons as any)[item.name] || LucideIcons.Circle;
          const isSelected = selectedIcon === item.name;
          
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => onSelectIcon(item.name)}
              style={[
                styles.iconItem,
                isSelected && styles.iconItemSelected
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconCircle,
                isSelected && styles.iconCircleSelected
              ]}>
                <IconComponent 
                  size={24} 
                  color={isSelected ? "#3b82f6" : "#6b7280"} 
                />
              </View>
              <Text style={[
                styles.iconLabel,
                isSelected && styles.iconLabelSelected
              ]}>
                {item.label}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <LucideIcons.Check size={16} color="#3b82f6" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  iconList: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 4,
  },
  iconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  iconItemSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleSelected: {
    backgroundColor: '#dbeafe',
  },
  iconLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  iconLabelSelected: {
    color: '#1f2937',
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 8,
  },
});
