import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { Device, DeviceCreate, fetchDevices, createDevice, updateDevice, deleteDevice } from './src/services/api';
import { IconPicker } from './src/components/IconPicker';
import { ColorPicker } from './src/components/ColorPicker';

interface DeviceManagementScreenProps {
  onBack: () => void;
  stationId: string;
}

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

export default function DeviceManagementScreen({ onBack, stationId }: DeviceManagementScreenProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  
  // Form state
  const [deviceName, setDeviceName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Lightbulb');
  const [selectedColor, setSelectedColor] = useState('blue');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    const deviceList = await fetchDevices(stationId);
    setDevices(deviceList);
    setLoading(false);
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setDeviceName('');
    setSelectedIcon('Lightbulb');
    setSelectedColor('blue');
    setModalVisible(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setDeviceName(device.name);
    setSelectedIcon(device.icon);
    setSelectedColor(device.color);
    setModalVisible(true);
  };

  const handleSaveDevice = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thiết bị');
      return;
    }

    if (editingDevice) {
      const updated = await updateDevice(editingDevice.device_id, {
        name: deviceName,
        icon: selectedIcon,
        color: selectedColor,
      });
      
      if (updated) {
        Alert.alert('Thành công', 'Đã cập nhật thiết bị');
        loadDevices();
        setModalVisible(false);
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật thiết bị');
      }
    } else {
      const newDevice: DeviceCreate = {
        station_id: stationId,
        name: deviceName,
        icon: selectedIcon,
        color: selectedColor,
        device_type: 'custom',
        auto_control_enabled: false,
      };
      
      const created = await createDevice(newDevice);
      
      if (created) {
        Alert.alert('Thành công', 'Đã thêm thiết bị mới');
        loadDevices();
        setModalVisible(false);
      } else {
        Alert.alert('Lỗi', 'Không thể thêm thiết bị');
      }
    }
  };

  const handleDeleteDevice = (device: Device) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa thiết bị "${device.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteDevice(device.device_id);
            if (success) {
              Alert.alert('Thành công', 'Đã xóa thiết bị');
              loadDevices();
            } else {
              Alert.alert('Lỗi', 'Không thể xóa thiết bị');
            }
          },
        },
      ]
    );
  };

  const PreviewIcon = ({ iconName, color }: { iconName: string; color: string }) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Circle;
    return <IconComponent size={32} color={colorMap[color]} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản Lý Thiết Bị</Text>
        <TouchableOpacity onPress={handleAddDevice} style={styles.addButton}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Device List */}
      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.centerText}>Đang tải...</Text>
        ) : devices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa có thiết bị nào</Text>
            <Text style={styles.emptySubtitle}>Nhấn nút + để thêm thiết bị mới</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {devices.map((device) => {
              const IconComponent = (LucideIcons as any)[device.icon] || LucideIcons.Circle;
              return (
                <View key={device.device_id} style={styles.deviceItem}>
                  {/* Icon + Info */}
                  <View style={styles.deviceInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: colorMap[device.color] + '20' }]}>
                      <IconComponent size={28} color={colorMap[device.color]} />
                    </View>
                    <View style={styles.deviceText}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceStatus}>
                        {device.is_on ? 'Đang bật' : 'Đang tắt'} • {device.device_type}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      onPress={() => handleEditDevice(device)}
                      style={styles.editButton}
                    >
                      <Edit2 size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => handleDeleteDevice(device)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Device Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDevice ? 'Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Live Preview */}
              <View style={styles.previewContainer}>
                <Text style={styles.sectionLabel}>Preview</Text>
                <View style={[styles.previewCard, { borderColor: colorMap[selectedColor] }]}>
                  <PreviewIcon iconName={selectedIcon} color={selectedColor} />
                  <Text style={styles.previewName}>{deviceName || 'Tên thiết bị'}</Text>
                  <Text style={[styles.previewStatus, { color: colorMap[selectedColor] }]}>
                    ON
                  </Text>
                </View>
              </View>

              {/* Device Name */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Tên Thiết Bị</Text>
                <TextInput
                  value={deviceName}
                  onChangeText={setDeviceName}
                  placeholder="Nhập tên thiết bị..."
                  style={styles.textInput}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Icon Picker */}
              <IconPicker 
                selectedIcon={selectedIcon}
                onSelectIcon={setSelectedIcon}
              />

              {/* Color Picker */}
              <ColorPicker 
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />

              {/* Save Button */}
              <TouchableOpacity 
                onPress={handleSaveDevice}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {editingDevice ? 'Lưu Thay Đổi' : 'Thêm Thiết Bị'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    color: '#6b7280',
    fontSize: 18,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  listContainer: {
    gap: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceText: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  deviceStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  previewContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  previewName: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  previewStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  formSection: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1f2937',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
