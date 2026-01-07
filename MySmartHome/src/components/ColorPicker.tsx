import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

// Available colors with Vietnamese labels
const AVAILABLE_COLORS = [
  { name: 'blue', label: 'Xanh dương', hex: '#3b82f6' },
  { name: 'green', label: 'Xanh lá', hex: '#22c55e' },
  { name: 'purple', label: 'Tím', hex: '#a855f7' },
  { name: 'orange', label: 'Cam', hex: '#f97316' },
  { name: 'pink', label: 'Hồng', hex: '#ec4899' },
  { name: 'indigo', label: 'Chàm', hex: '#6366f1' },
  { name: 'red', label: 'Đỏ', hex: '#ef4444' },
  { name: 'yellow', label: 'Vàng', hex: '#eab308' },
  { name: 'teal', label: 'Xanh ngọc', hex: '#14b8a6' },
  { name: 'gray', label: 'Xám', hex: '#6b7280' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn Màu</Text>
      <View style={styles.colorList}>
        {AVAILABLE_COLORS.map((color) => {
          const isSelected = selectedColor === color.name;
          
          return (
            <TouchableOpacity
              key={color.name}
              onPress={() => onSelectColor(color.name)}
              style={[
                styles.colorItem,
                isSelected && styles.colorItemSelected
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.colorCircle,
                { backgroundColor: color.hex }
              ]}>
                {isSelected && (
                  <Check size={20} color="#ffffff" strokeWidth={3} />
                )}
              </View>
              <Text style={[
                styles.colorLabel,
                isSelected && styles.colorLabelSelected
              ]}>
                {color.label}
              </Text>
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
  colorList: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 4,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  colorItemSelected: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  colorLabelSelected: {
    color: '#1f2937',
    fontWeight: '600',
  },
});
