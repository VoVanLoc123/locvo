import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectionCard } from '@/components/connection-card';
import { LightCard } from '@/components/light-card';
import { DoorCard } from '@/components/door-card';
import { PumpCard } from '@/components/pump-card';
import { useMqtt } from '@/context/mqtt-context';
import { BottomTabInset, MaxContentWidth, Spacing, Colors } from '@/constants/theme';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { status, connect } = useMqtt();

  // Auto connect on first load if disconnected
  useEffect(() => {
    if (status === 'disconnected') {
      connect();
    }
  }, [status, connect]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* App Title Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.appTitle, { color: colors.text }]}>
              Kho Lạnh & Nông Nghiệp IoT
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
              Điều khiển & Giám sát ESP32 qua MQTT
            </Text>
          </View>
        </View>

        {/* MQTT Connection Status */}
        <ConnectionCard />

        {/* Section: Kho Lạnh (Cold Storage) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ❄️ Kho Lạnh (Cold Storage)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Đèn chiếu sáng & Cảnh báo an toàn cửa
          </Text>
        </View>

        <LightCard />
        <DoorCard />

        {/* Section: Nông Nghiệp / Tưới Cây (Smart Agriculture) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🌱 Nông Nghiệp Thông Minh
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Hệ thống tưới cây tự động theo độ ẩm đất
          </Text>
        </View>

        <PumpCard />

        {/* Bottom spacing for tabs */}
        <View style={{ height: BottomTabInset + Spacing.four }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
