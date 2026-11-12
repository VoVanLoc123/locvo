import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useMqtt } from '@/context/mqtt-context';
import { MQTT_TOPICS } from '@/types/mqtt';
import { Colors } from '@/constants/theme';

export function PumpCard() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { deviceState, status, turnPumpOn, turnPumpOff } = useMqtt();
  const { isOn, lastUpdated, lastCommand } = deviceState.pump;
  const soilValue = deviceState.soil.value;
  const [loading, setLoading] = useState(false);

  const isConnected = status === 'connected';

  const handleTurnOn = async () => {
    if (!isConnected) return;
    setLoading(true);
    await turnPumpOn();
    setLoading(false);
  };

  const handleTurnOff = async () => {
    if (!isConnected) return;
    setLoading(true);
    await turnPumpOff();
    setLoading(false);
  };

  // Trạng thái đất theo ngưỡng trong sketch.ino
  const getSoilStatus = () => {
    if (soilValue === null) return { text: 'Chờ cảm biến...', color: colors.textSecondary };
    if (soilValue < 1500) return { text: 'ĐẤT KHÔ (< 1500) ⚠️', color: '#EF4444' };
    if (soilValue > 2200) return { text: 'ĐỦ ẨM (> 2200) ✅', color: '#16A34A' };
    return { text: 'ĐỘ ẨM VỪA PHẢI 💧', color: '#0284C7' };
  };

  const soilStatus = getSoilStatus();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1F2024' : '#FFFFFF',
          borderColor: isOn
            ? '#0284C7'
            : isDark
            ? '#2D3036'
            : '#E5E7EB',
        },
        isOn && (isDark ? styles.cardPumpDark : styles.cardPumpLight),
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: colors.text }]}>
            Hệ Thống Tưới Tự Động
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            GPIO 18 (LED Bơm) • GPIO 34 (Chiết áp đất)
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: isOn
                ? isDark
                  ? '#082F49'
                  : '#E0F2FE'
                : isDark
                ? '#374151'
                : '#F3F4F6',
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {
                color: isOn ? '#0284C7' : colors.textSecondary,
              },
            ]}>
            {isOn ? 'BƠM ĐANG BẬT' : 'BƠM ĐANG TẮT'}
          </Text>
        </View>
      </View>

      {/* Main Status Display */}
      <View style={styles.body}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isOn
                ? '#BAE6FD'
                : isDark
                ? '#2D3036'
                : '#F1F5F9',
            },
          ]}>
          <Text style={styles.iconEmoji}>{isOn ? '💧' : '🌱'}</Text>
        </View>

        <View style={styles.bodyText}>
          <Text
            style={[
              styles.mainStatus,
              {
                color: isOn ? '#0284C7' : colors.text,
              },
            ]}>
            {isOn ? 'Máy Bơm Đang Hoạt Động' : 'Máy Bơm Đang Tắt'}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {isOn
              ? 'Đang cấp nước tưới cây tự động hoặc điều khiển bằng lệnh.'
              : 'Hệ thống tự động ngắt bơm khi độ ẩm đất đạt ngưỡng.'}
          </Text>
        </View>
      </View>

      {/* Real-time Soil Moisture Indicator */}
      <View
        style={[
          styles.soilBox,
          {
            backgroundColor: isDark ? '#26282E' : '#F8FAFC',
            borderColor: isDark ? '#374151' : '#E2E8F0',
          },
        ]}>
        <View style={styles.soilRow}>
          <Text style={[styles.soilLabel, { color: colors.text }]}>
            Cảm biến độ ẩm đất (GPIO 34):
          </Text>
          <Text style={[styles.soilValue, { color: soilStatus.color }]}>
            {soilValue !== null ? `${soilValue} ADC` : '---'}
          </Text>
        </View>
        <Text style={[styles.soilSubStatus, { color: soilStatus.color }]}>
          {soilStatus.text}
        </Text>
      </View>

      {/* Manual Control Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.btnOn,
            (!isConnected || loading) && styles.btnDisabled,
          ]}
          disabled={!isConnected || loading}
          onPress={handleTurnOn}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>BẬT BƠM (PUMP_ON)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.btnOff,
            (!isConnected || loading) && styles.btnDisabled,
          ]}
          disabled={!isConnected || loading}
          onPress={handleTurnOff}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>TẮT BƠM (PUMP_OFF)</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Threshold guide */}
      <View
        style={[
          styles.thresholdBox,
          { backgroundColor: isDark ? '#1C1D21' : '#F1F3F5' },
        ]}>
        <Text style={[styles.thresholdTitle, { color: colors.text }]}>
          Ngưỡng tự động trong sketch.ino:
        </Text>
        <Text style={[styles.thresholdItem, { color: colors.textSecondary }]}>
          • SOIL_DRY &lt; 1500: Tự động BẬT bơm nước
        </Text>
        <Text style={[styles.thresholdItem, { color: colors.textSecondary }]}>
          • SOIL_WET &gt; 2200: Tự động TẮT bơm nước
        </Text>
      </View>

      {/* Footer Info */}
      <View
        style={[
          styles.footer,
          { borderTopColor: isDark ? '#2D3036' : '#F1F3F5' },
        ]}>
        <View style={styles.footerCol}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Topic gửi / nhận:
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]} numberOfLines={1}>
            {MQTT_TOPICS.COMMAND} / {MQTT_TOPICS.DATA}
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Cập nhật lần cuối:
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]}>
            {lastUpdated || 'Chờ ESP32 publish...'} {lastCommand ? `(${lastCommand})` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPumpLight: {
    shadowColor: '#0284C7',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    backgroundColor: '#F0F9FF',
  },
  cardPumpDark: {
    shadowColor: '#0284C7',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  bodyText: {
    flex: 1,
  },
  mainStatus: {
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  soilBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  soilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soilLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  soilValue: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  soilSubStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOn: {
    backgroundColor: '#0284C7',
  },
  btnOff: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  thresholdBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 3,
  },
  thresholdTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  thresholdItem: {
    fontSize: 11.5,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 6,
    gap: 4,
  },
  footerCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11.5,
  },
  footerValue: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});
