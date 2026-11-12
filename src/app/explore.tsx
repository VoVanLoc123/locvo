import React from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectionCard } from '@/components/connection-card';
import { MqttTester } from '@/components/mqtt-tester';
import { BottomTabInset, MaxContentWidth, Spacing, Colors } from '@/constants/theme';

export default function ExploreScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            MQTT Console & MQTTX Tool
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gửi lệnh, kiểm tra gói tin và giám sát broker thời gian thực
          </Text>
        </View>

        {/* Status card */}
        <View style={styles.connectionWrapper}>
          <ConnectionCard />
        </View>

        {/* Tester & Log monitor */}
        <MqttTester />

        {/* Bottom spacing for native tabs */}
        <View style={{ height: BottomTabInset + Spacing.two }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  connectionWrapper: {
    paddingHorizontal: Spacing.four,
  },
});
