import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Switch,
} from 'react-native';
import { useMqtt } from '@/context/mqtt-context';
import { MqttConfig, PRESET_BROKERS } from '@/types/mqtt';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function BrokerConfigForm({ onClose }: { onClose: () => void }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { config, connect, updateConfig, resetConfig, status } = useMqtt();
  const [formData, setFormData] = useState<MqttConfig>({ ...config });

  const handleSelectPreset = (preset: (typeof PRESET_BROKERS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.config,
    }));
  };

  const handleSaveAndConnect = () => {
    updateConfig(formData);
    connect(formData);
    onClose();
  };

  const handleReset = () => {
    resetConfig();
    onClose();
  };

  return (
    <View
      style={[
        styles.modalContent,
        { backgroundColor: isDark ? '#1C1D21' : '#FFFFFF' },
      ]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Cấu hình MQTT Broker
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Hỗ trợ MQTTX & EMQX Cloud
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Presets */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Mẫu cấu hình sẵn (Presets)
        </Text>
        <View style={styles.presetContainer}>
          {PRESET_BROKERS.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetCard,
                {
                  backgroundColor: isDark ? '#2A2B30' : '#F1F3F7',
                  borderColor:
                    formData.host === preset.config.host
                      ? '#2563EB'
                      : 'transparent',
                },
              ]}
              onPress={() => handleSelectPreset(preset)}>
              <Text style={[styles.presetName, { color: colors.text }]}>
                {preset.name}
              </Text>
              <Text
                style={[styles.presetDesc, { color: colors.textSecondary }]}>
                {preset.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note on WebSocket */}
        <View
          style={[
            styles.noticeBox,
            { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' },
          ]}>
          <Text style={styles.noticeIcon}>ℹ️</Text>
          <Text
            style={[
              styles.noticeText,
              { color: isDark ? '#93C5FD' : '#1E40AF' },
            ]}>
            React Native & Web kết nối MQTT qua WebSocket (WSS cổng 8084 hoặc WS cổng 8083). ESP32 dùng TCP 8883, cả 2 đều dùng chung broker và chia sẻ cùng dữ liệu topics!
          </Text>
        </View>

        {/* Form Fields */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Chi tiết kết nối
        </Text>

        {/* Protocol */}
        <View style={styles.formRow}>
          <Text style={[styles.label, { color: colors.text }]}>Giao thức (Protocol)</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                formData.protocol === 'wss' && styles.radioBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, protocol: 'wss', port: 8084 })}>
              <Text
                style={[
                  styles.radioBtnText,
                  formData.protocol === 'wss' && styles.radioBtnTextActive,
                ]}>
                WSS (Bảo mật - 8084)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                formData.protocol === 'ws' && styles.radioBtnActive,
              ]}
              onPress={() => setFormData({ ...formData, protocol: 'ws', port: 8083 })}>
              <Text
                style={[
                  styles.radioBtnText,
                  formData.protocol === 'ws' && styles.radioBtnTextActive,
                ]}>
                WS (Thường - 8083)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Host */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Broker Host / Server</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                borderColor: isDark ? '#3E424B' : '#E2E4E9',
              },
            ]}
            value={formData.host}
            onChangeText={(text) => setFormData({ ...formData, host: text.trim() })}
            placeholder="vd: o3e70108.ala.eu-central-1.emqxsl.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>

        {/* Port & Path */}
        <View style={styles.rowTwoCols}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Port (WebSocket)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                  borderColor: isDark ? '#3E424B' : '#E2E4E9',
                },
              ]}
              value={String(formData.port)}
              onChangeText={(text) =>
                setFormData({ ...formData, port: parseInt(text, 10) || 8084 })
              }
              keyboardType="numeric"
              placeholder="8084"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Path</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                  borderColor: isDark ? '#3E424B' : '#E2E4E9',
                },
              ]}
              value={formData.path}
              onChangeText={(text) => setFormData({ ...formData, path: text.trim() })}
              placeholder="/mqtt"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Client ID */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Client ID</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                borderColor: isDark ? '#3E424B' : '#E2E4E9',
              },
            ]}
            value={formData.clientId}
            onChangeText={(text) => setFormData({ ...formData, clientId: text })}
            placeholder="Client ID ngẫu nhiên"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>

        {/* Username & Password */}
        <View style={styles.rowTwoCols}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                  borderColor: isDark ? '#3E424B' : '#E2E4E9',
                },
              ]}
              value={formData.username || ''}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder="Username (vd: 1)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                  borderColor: isDark ? '#3E424B' : '#E2E4E9',
                },
              ]}
              value={formData.password || ''}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={true}
              placeholder="Password (vd: 12345)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Clean Session */}
        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.label, { color: colors.text, marginBottom: 2 }]}>
              Clean Session
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Xóa phiên làm việc cũ khi kết nối
            </Text>
          </View>
          <Switch
            value={formData.clean}
            onValueChange={(val) => setFormData({ ...formData, clean: val })}
            trackColor={{ false: '#767577', true: '#2563EB' }}
          />
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.resetBtn,
            { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
          ]}
          onPress={handleReset}>
          <Text style={[styles.resetBtnText, { color: colors.text }]}>
            Mặc định
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveAndConnect}>
          <Text style={styles.saveBtnText}>
            {status === 'connected' ? 'Cập nhật & Kết nối lại' : 'Lưu & Kết nối'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BrokerConfigModal({ visible, onClose }: Props) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BrokerConfigForm onClose={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollArea: {
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetContainer: {
    gap: 8,
  },
  presetCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '600',
  },
  presetDesc: {
    fontSize: 12,
    marginTop: 3,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 10,
  },
  noticeIcon: {
    fontSize: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    marginBottom: 12,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
  },
  radioBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB20',
  },
  radioBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  radioBtnTextActive: {
    color: '#2563EB',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: 16,
    gap: 12,
  },
  resetBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
