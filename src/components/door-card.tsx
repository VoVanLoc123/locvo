import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useMqtt } from '@/context/mqtt-context';
import { MQTT_TOPICS } from '@/types/mqtt';
import { Colors } from '@/constants/theme';

export function DoorCard() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { deviceState } = useMqtt();
  const { status, isAlert, lastUpdated } = deviceState.door;

  const isClosed = status === 'CLOSED';
  const isOpen = status === 'OPEN';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1F2024' : '#FFFFFF',
          borderColor: isOpen
            ? '#DC2626'
            : isClosed
            ? '#16A34A'
            : isDark
            ? '#2D3036'
            : '#E5E7EB',
        },
        isOpen && (isDark ? styles.cardAlertDark : styles.cardAlertLight),
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: colors.text }]}>
            Cảm Biến Cửa Kho Lạnh
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            GPIO 15 • Công tắc gạt (Slide Switch)
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: isOpen
                ? isDark
                  ? '#7F1D1D'
                  : '#FEE2E2'
                : isClosed
                ? isDark
                  ? '#064E3B'
                  : '#DCFCE7'
                : isDark
                ? '#374151'
                : '#F3F4F6',
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {
                color: isOpen
                  ? '#DC2626'
                  : isClosed
                  ? '#16A34A'
                  : colors.textSecondary,
              },
            ]}>
            {isOpen
              ? 'CẢNH BÁO: MỞ (OPEN)'
              : isClosed
              ? 'ĐÃ ĐÓNG (CLOSED)'
              : 'CHỜ TÍN HIỆU'}
          </Text>
        </View>
      </View>

      {/* Main Status Display */}
      <View style={styles.body}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isOpen
                ? '#FEE2E2'
                : isClosed
                ? '#DCFCE7'
                : isDark
                ? '#2D3036'
                : '#F1F5F9',
            },
          ]}>
          <Text style={styles.iconEmoji}>{isOpen ? '🚨' : isClosed ? '🛡️' : '🚪'}</Text>
        </View>

        <View style={styles.bodyText}>
          <Text
            style={[
              styles.mainStatus,
              {
                color: isOpen
                  ? '#DC2626'
                  : isClosed
                  ? '#16A34A'
                  : colors.text,
              },
            ]}>
            {isOpen
              ? 'Kho Lạnh Đang Mở Cửa!'
              : isClosed
              ? 'Cửa Kho Đang Khóa Kín'
              : 'Chưa có dữ liệu từ ESP32'}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {isOpen
              ? 'Nguy cơ thất thoát nhiệt độ kho lạnh và hỏng hàng hóa!'
              : isClosed
              ? 'Áp suất và nhiệt độ được giữ kín an toàn.'
              : 'Gạt nút slide switch trên mạch hoặc gửi MQTT để cập nhật.'}
          </Text>
        </View>
      </View>

      {/* Urgent Warning Banner if door is open */}
      {isAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerIcon}>⚠️</Text>
          <Text style={styles.alertBannerText}>
            CẦN KIỂM TRA NGAY: Cửa kho lạnh mở sẽ làm máy nén quá tải!
          </Text>
        </View>
      )}

      {/* Footer Info */}
      <View
        style={[
          styles.footer,
          { borderTopColor: isDark ? '#2D3036' : '#F1F3F5' },
        ]}>
        <View style={styles.footerCol}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Topic dữ liệu (Sub JSON):
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]} numberOfLines={1}>
            {MQTT_TOPICS.DATA}
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Cập nhật lần cuối:
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]}>
            {lastUpdated || 'Chờ ESP32 publish...'}
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
  cardAlertLight: {
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    backgroundColor: '#FFF5F5',
  },
  cardAlertDark: {
    shadowColor: '#DC2626',
    shadowOpacity: 0.4,
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
    paddingVertical: 10,
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.14)',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
    gap: 8,
  },
  alertBannerIcon: {
    fontSize: 16,
  },
  alertBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 8,
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
