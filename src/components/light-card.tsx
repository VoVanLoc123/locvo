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

export function LightCard() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { deviceState, status, toggleLight, turnLightOn, turnLightOff } = useMqtt();
  const { isOn, lastUpdated, lastCommand } = deviceState.light;
  const [loading, setLoading] = useState(false);

  const isConnected = status === 'connected';

  const handleToggle = async () => {
    if (!isConnected) return;
    setLoading(true);
    await toggleLight();
    setLoading(false);
  };

  const handleTurnOn = async () => {
    if (!isConnected) return;
    setLoading(true);
    await turnLightOn();
    setLoading(false);
  };

  const handleTurnOff = async () => {
    if (!isConnected) return;
    setLoading(true);
    await turnLightOff();
    setLoading(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1F2024' : '#FFFFFF',
          borderColor: isOn
            ? isDark
              ? '#CA8A04'
              : '#EAB308'
            : isDark
            ? '#2D3036'
            : '#E5E7EB',
        },
        isOn && (isDark ? styles.cardGlowDark : styles.cardGlowLight),
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: colors.text }]}>Đèn Kho Lạnh</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            GPIO 23 • LED Đèn
          </Text>
        </View>

        <View
          style={[
            styles.stateBadge,
            {
              backgroundColor: isOn
                ? isDark
                  ? '#422006'
                  : '#FEF08A'
                : isDark
                ? '#374151'
                : '#F3F4F6',
            },
          ]}>
          <Text
            style={[
              styles.stateBadgeText,
              { color: isOn ? '#CA8A04' : colors.textSecondary },
            ]}>
            {isOn ? 'BẬT (ON)' : 'TẮT (OFF)'}
          </Text>
        </View>
      </View>

      {/* Center Bulb Graphic & State */}
      <View style={styles.bulbSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!isConnected || loading}
          onPress={handleToggle}
          style={[
            styles.bulbCircle,
            {
              backgroundColor: isOn
                ? '#FACC15'
                : isDark
                ? '#2D3036'
                : '#E2E8F0',
            },
            isOn && styles.bulbGlow,
          ]}>
          {loading ? (
            <ActivityIndicator size="large" color={isOn ? '#78350F' : '#6B7280'} />
          ) : (
            <Text style={styles.bulbEmoji}>{isOn ? '💡' : '🌑'}</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.bulbHint, { color: colors.textSecondary }]}>
          {isConnected
            ? 'Chạm vào bóng đèn để chuyển đổi (TOGGLE)'
            : 'Vui lòng kết nối MQTT để điều khiển'}
        </Text>
      </View>

      {/* Control Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.btnOn,
            (!isConnected || loading) && styles.btnDisabled,
          ]}
          disabled={!isConnected || loading}
          onPress={handleTurnOn}>
          <Text style={styles.btnOnText}>BẬT (LIGHT_ON)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.btnToggle,
            (!isConnected || loading) && styles.btnDisabled,
          ]}
          disabled={!isConnected || loading}
          onPress={handleToggle}>
          <Text style={styles.btnToggleText}>TOGGLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.btnOff,
            (!isConnected || loading) && styles.btnDisabled,
          ]}
          disabled={!isConnected || loading}
          onPress={handleTurnOff}>
          <Text style={styles.btnOffText}>TẮT (LIGHT_OFF)</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Info */}
      <View
        style={[
          styles.footer,
          { borderTopColor: isDark ? '#2D3036' : '#F1F3F5' },
        ]}>
        <View style={styles.footerCol}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Topic lệnh (Pub):
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]} numberOfLines={1}>
            {MQTT_TOPICS.COMMAND}
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Cập nhật từ {MQTT_TOPICS.DATA}:
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]}>
            {lastUpdated || 'Chưa nhận phản hồi'} {lastCommand ? `(Lệnh: ${lastCommand})` : ''}
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
  cardGlowLight: {
    shadowColor: '#EAB308',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardGlowDark: {
    shadowColor: '#FACC15',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  stateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bulbSection: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  bulbCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulbGlow: {
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 8,
  },
  bulbEmoji: {
    fontSize: 40,
  },
  bulbHint: {
    fontSize: 12,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOn: {
    backgroundColor: '#16A34A',
  },
  btnOnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnToggle: {
    backgroundColor: '#2563EB',
  },
  btnToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnOff: {
    backgroundColor: '#DC2626',
  },
  btnOffText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
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
