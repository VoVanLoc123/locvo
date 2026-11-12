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
import { BrokerConfigModal } from './broker-config-modal';
import { Colors } from '@/constants/theme';

export function ConnectionCard() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { status, errorMsg, config, brokerUrl, connect, disconnect } = useMqtt();
  const [modalVisible, setModalVisible] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return {
          text: 'ĐÃ KẾT NỐI',
          color: '#10B981',
          bg: isDark ? '#064E3B' : '#D1FAE5',
        };
      case 'connecting':
        return {
          text: 'ĐANG KẾT NỐI...',
          color: '#F59E0B',
          bg: isDark ? '#78350F' : '#FEF3C7',
        };
      case 'reconnecting':
        return {
          text: 'KẾT NỐI LẠI...',
          color: '#F59E0B',
          bg: isDark ? '#78350F' : '#FEF3C7',
        };
      case 'error':
        return {
          text: 'LỖI KẾT NỐI',
          color: '#EF4444',
          bg: isDark ? '#7F1D1D' : '#FEE2E2',
        };
      default:
        return {
          text: 'NGẮT KẾT NỐI',
          color: '#6B7280',
          bg: isDark ? '#374151' : '#E5E7EB',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1F2024' : '#FFFFFF',
          borderColor: isDark ? '#2D3036' : '#E5E7EB',
        },
      ]}>
      {/* Top row: Status & Actions */}
      <View style={styles.topRow}>
        <View style={styles.statusGroup}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: badge.color },
              status === 'connected' && styles.glowDot,
            ]}
          />
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.text}
            </Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.configBtn,
              { backgroundColor: isDark ? '#2A2C32' : '#F3F4F6' },
            ]}
            onPress={() => setModalVisible(true)}>
            <Text style={[styles.configBtnText, { color: colors.text }]}>⚙️ Cấu hình</Text>
          </TouchableOpacity>

          {status === 'connected' ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.disconnectBtn]}
              onPress={disconnect}>
              <Text style={styles.actionBtnText}>Ngắt kết nối</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.connectBtn]}
              onPress={() => connect()}
              disabled={status === 'connecting'}>
              {status === 'connecting' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>Kết nối</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Broker Details */}
      <View style={styles.infoRow}>
        <Text style={[styles.brokerLabel, { color: colors.textSecondary }]}>
          Broker:
        </Text>
        <Text
          style={[styles.brokerValue, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="middle">
          {brokerUrl}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.tag}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            Port: {config.port} ({config.protocol.toUpperCase()})
          </Text>
        </View>
        <View style={styles.tag}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            User: {config.username || 'None'}
          </Text>
        </View>
        <View style={styles.tag}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            ID: {config.clientId.slice(0, 10)}...
          </Text>
        </View>
      </View>

      {/* Error display */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Modal */}
      <BrokerConfigModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  glowDot: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  configBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  configBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  connectBtn: {
    backgroundColor: '#2563EB',
  },
  disconnectBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  brokerLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  brokerValue: {
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
});
