import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  useColorScheme,
} from 'react-native';
import { useMqtt } from '@/context/mqtt-context';
import { MQTT_TOPICS } from '@/types/mqtt';
import { Colors, Spacing } from '@/constants/theme';

export function MqttTester() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const {
    status,
    publish,
    logs,
    clearLogs,
    simulateMessage,
  } = useMqtt();

  const [topic, setTopic] = useState<string>(MQTT_TOPICS.COMMAND);
  const [payload, setPayload] = useState<string>('TOGGLE');
  const [qos, setQos] = useState<0 | 1 | 2>(0);
  const [retain, setRetain] = useState<boolean>(false);
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  const isConnected = status === 'connected';

  const handlePublish = async () => {
    if (!isConnected) {
      setPublishFeedback('Chưa kết nối MQTT broker');
      setTimeout(() => setPublishFeedback(null), 3000);
      return;
    }
    if (!topic.trim()) {
      setPublishFeedback('Vui lòng nhập Topic');
      setTimeout(() => setPublishFeedback(null), 3000);
      return;
    }

    const success = await publish(topic.trim(), payload, { qos, retain });
    if (success) {
      setPublishFeedback(`Đã publish thành công lên ${topic}`);
    } else {
      setPublishFeedback('Gửi thất bại');
    }
    setTimeout(() => setPublishFeedback(null), 3000);
  };

  const filteredLogs = logs.filter(
    (log) =>
      !filterTopic ||
      log.topic.toLowerCase().includes(filterTopic.toLowerCase()) ||
      log.payload.toLowerCase().includes(filterTopic.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Publisher Section */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1F2024' : '#FFFFFF',
            borderColor: isDark ? '#2D3036' : '#E5E7EB',
          },
        ]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            MQTT Publisher (Gửi lệnh)
          </Text>
          <View
            style={[
              styles.connectionPill,
              { backgroundColor: isConnected ? '#10B98120' : '#EF444420' },
            ]}>
            <Text
              style={[
                styles.connectionPillText,
                { color: isConnected ? '#10B981' : '#EF4444' },
              ]}>
              {isConnected ? 'Sẵn sàng' : 'Chưa kết nối'}
            </Text>
          </View>
        </View>

        {/* Quick Topic Chips (2 topics from sketch.ino) */}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          Chọn nhanh 2 Topic từ sketch.ino:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <TouchableOpacity
            style={[
              styles.chip,
              topic === MQTT_TOPICS.COMMAND && styles.chipActive,
            ]}
            onPress={() => {
              setTopic(MQTT_TOPICS.COMMAND);
              setPayload('TOGGLE');
            }}>
            <Text
              style={[
                styles.chipText,
                topic === MQTT_TOPICS.COMMAND && styles.chipTextActive,
              ]}>
              Lệnh điều khiển ({MQTT_TOPICS.COMMAND})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              topic === MQTT_TOPICS.DATA && styles.chipActive,
            ]}
            onPress={() => {
              setTopic(MQTT_TOPICS.DATA);
              setPayload('{"light":"ON","door":"CLOSED","soil":1800,"pump":"OFF"}');
            }}>
            <Text
              style={[
                styles.chipText,
                topic === MQTT_TOPICS.DATA && styles.chipTextActive,
              ]}>
              Dữ liệu cảm biến ({MQTT_TOPICS.DATA})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Topic Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Topic</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                borderColor: isDark ? '#3E424B' : '#E2E4E9',
              },
            ]}
            value={topic}
            onChangeText={setTopic}
            placeholder="vd: test/command"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>

        {/* Quick Payload Chips */}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          Payload mẫu:
        </Text>
        <View style={styles.payloadChipsRow}>
          {[
            'LIGHT_ON',
            'LIGHT_OFF',
            'TOGGLE',
            'PUMP_ON',
            'PUMP_OFF',
            '{"light":"ON","door":"OPEN","soil":1200,"pump":"ON"}',
          ].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.smallChip,
                payload === p && styles.chipActive,
                { backgroundColor: isDark ? '#2A2C32' : '#F1F3F7' },
              ]}
              onPress={() => setPayload(p)}>
              <Text
                style={[
                  styles.smallChipText,
                  { color: colors.text },
                  payload === p && styles.chipTextActive,
                ]}
                numberOfLines={1}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payload Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Payload / Tin nhắn</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? '#26282E' : '#F4F5F8',
                borderColor: isDark ? '#3E424B' : '#E2E4E9',
              },
            ]}
            value={payload}
            onChangeText={setPayload}
            placeholder="Nhập nội dung tin nhắn..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* QoS & Retain Options */}
        <View style={styles.optionsRow}>
          <View style={styles.qosGroup}>
            <Text style={[styles.optLabel, { color: colors.textSecondary }]}>QoS:</Text>
            {[0, 1, 2].map((q) => (
              <TouchableOpacity
                key={q}
                style={[
                  styles.qosBtn,
                  qos === q && styles.qosBtnActive,
                  { backgroundColor: isDark ? '#2A2C32' : '#E5E7EB' },
                ]}
                onPress={() => setQos(q as 0 | 1 | 2)}>
                <Text
                  style={[
                    styles.qosBtnText,
                    { color: colors.text },
                    qos === q && styles.qosBtnTextActive,
                  ]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.retainGroup}>
            <Text style={[styles.optLabel, { color: colors.textSecondary }]}>Retain:</Text>
            <Switch
              value={retain}
              onValueChange={setRetain}
              trackColor={{ false: '#767577', true: '#2563EB' }}
            />
          </View>
        </View>

        {/* Publish Action Button */}
        <TouchableOpacity
          style={[styles.publishBtn, !isConnected && styles.publishBtnDisabled]}
          onPress={handlePublish}>
          <Text style={styles.publishBtnText}>📤 Publish (Gửi tin nhắn)</Text>
        </TouchableOpacity>

        {publishFeedback && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{publishFeedback}</Text>
          </View>
        )}
      </View>

      {/* Simulator Tools */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1F2024' : '#FFFFFF',
            borderColor: isDark ? '#2D3036' : '#E5E7EB',
          },
        ]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Giả Lập JSON ESP32 ({MQTT_TOPICS.DATA})
          </Text>
          <Text style={[styles.badgeHint, { color: colors.textSecondary }]}>
            Test nhanh UI
          </Text>
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          Bấm các nút dưới đây để giả lập gói tin JSON gửi từ ESP32 lên topic test/data:
        </Text>

        <View style={styles.simButtonsGrid}>
          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#DC2626' }]}
            onPress={() =>
              simulateMessage(
                MQTT_TOPICS.DATA,
                JSON.stringify({ light: 'OFF', door: 'OPEN', soil: 1800, pump: 'OFF' })
              )
            }>
            <Text style={styles.simBtnText}>🚨 Cửa MỞ (OPEN)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#16A34A' }]}
            onPress={() =>
              simulateMessage(
                MQTT_TOPICS.DATA,
                JSON.stringify({ light: 'OFF', door: 'CLOSED', soil: 1800, pump: 'OFF' })
              )
            }>
            <Text style={styles.simBtnText}>🛡️ Cửa ĐÓNG (CLOSED)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#0284C7' }]}
            onPress={() =>
              simulateMessage(
                MQTT_TOPICS.DATA,
                JSON.stringify({ light: 'OFF', door: 'CLOSED', soil: 1200, pump: 'ON' })
              )
            }>
            <Text style={styles.simBtnText}>💧 Đất Khô & Bơm ON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#4B5563' }]}
            onPress={() =>
              simulateMessage(
                MQTT_TOPICS.DATA,
                JSON.stringify({ light: 'OFF', door: 'CLOSED', soil: 2400, pump: 'OFF' })
              )
            }>
            <Text style={styles.simBtnText}>🌱 Đủ Ẩm & Bơm OFF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#CA8A04' }]}
            onPress={() =>
              simulateMessage(
                MQTT_TOPICS.DATA,
                JSON.stringify({ light: 'ON', door: 'CLOSED', soil: 1800, pump: 'OFF' })
              )
            }>
            <Text style={styles.simBtnText}>💡 Đèn BẬT (ON)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#374151' }]}
            onPress={() =>
              simulateMessage(
                MQTT_TOPICS.DATA,
                JSON.stringify({ light: 'OFF', door: 'CLOSED', soil: 1800, pump: 'OFF' })
              )
            }>
            <Text style={styles.simBtnText}>🌑 Đèn TẮT (OFF)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Stream / Logs Section */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1F2024' : '#FFFFFF',
            borderColor: isDark ? '#2D3036' : '#E5E7EB',
          },
        ]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Nhật ký gói tin MQTT ({filteredLogs.length})
          </Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Xóa nhật ký</Text>
          </TouchableOpacity>
        </View>

        {/* Filter input */}
        <TextInput
          style={[
            styles.filterInput,
            {
              color: colors.text,
              backgroundColor: isDark ? '#26282E' : '#F4F5F8',
              borderColor: isDark ? '#3E424B' : '#E2E4E9',
            },
          ]}
          value={filterTopic}
          onChangeText={setFilterTopic}
          placeholder="Lọc theo topic hoặc payload..."
          placeholderTextColor={colors.textSecondary}
        />

        {filteredLogs.length === 0 ? (
          <View style={styles.emptyLogs}>
            <Text style={[styles.emptyLogsText, { color: colors.textSecondary }]}>
              Chưa có gói tin nào được ghi nhận.
            </Text>
            <Text style={[styles.emptyLogsHint, { color: colors.textSecondary }]}>
              Gói tin từ test/data và test/command sẽ xuất hiện tại đây theo thời gian thực.
            </Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {filteredLogs.map((item) => {
              const isIncoming = item.direction === 'in';
              return (
                <View
                  key={item.id}
                  style={[
                    styles.logItem,
                    {
                      backgroundColor: isDark ? '#26282E' : '#F8FAFC',
                      borderLeftColor: isIncoming ? '#10B981' : '#2563EB',
                    },
                  ]}>
                  <View style={styles.logHeader}>
                    <View style={styles.directionGroup}>
                      <View
                        style={[
                          styles.dirBadge,
                          {
                            backgroundColor: isIncoming
                              ? '#10B98120'
                              : '#2563EB20',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.dirBadgeText,
                            {
                              color: isIncoming ? '#10B981' : '#2563EB',
                            },
                          ]}>
                          {isIncoming ? 'IN (Nhận)' : 'OUT (Gửi)'}
                        </Text>
                      </View>
                      <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                        {item.timestamp}
                      </Text>
                    </View>

                    {item.qos !== undefined && (
                      <Text style={[styles.logQos, { color: colors.textSecondary }]}>
                        QoS: {item.qos} {item.retain ? '• Retain' : ''}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[styles.logTopic, { color: colors.text }]}
                    selectable>
                    {item.topic}
                  </Text>

                  <View
                    style={[
                      styles.payloadBox,
                      { backgroundColor: isDark ? '#1C1D21' : '#FFFFFF' },
                    ]}>
                    <Text
                      style={[
                        styles.logPayload,
                        { color: isDark ? '#60A5FA' : '#1D4ED8' },
                      ]}
                      selectable>
                      {item.payload}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: 8,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12.5,
    marginBottom: 12,
    lineHeight: 18,
  },
  connectionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  connectionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563EB20',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  payloadChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    maxWidth: '100%',
  },
  smallChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  qosGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  qosBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qosBtnActive: {
    backgroundColor: '#2563EB',
  },
  qosBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qosBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  retainGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: {
    opacity: 0.5,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackBanner: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#10B98120',
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  badgeHint: {
    fontSize: 11,
  },
  simButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12.5,
    marginBottom: 10,
  },
  emptyLogs: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyLogsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyLogsHint: {
    fontSize: 11.5,
    marginTop: 4,
  },
  logsList: {
    gap: 8,
  },
  logItem: {
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  directionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dirBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dirBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 11,
  },
  logQos: {
    fontSize: 10.5,
  },
  logTopic: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  payloadBox: {
    padding: 6,
    borderRadius: 6,
  },
  logPayload: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});
