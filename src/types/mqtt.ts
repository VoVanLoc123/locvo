export type MqttConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface MqttConfig {
  protocol: 'wss' | 'ws';
  host: string;
  port: number;
  path: string;
  clientId: string;
  username?: string;
  password?: string;
  clean?: boolean;
  reconnectPeriod?: number;
  connectTimeout?: number;
}

export interface MqttLogItem {
  id: string;
  topic: string;
  payload: string;
  direction: 'in' | 'out';
  timestamp: string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

export type DoorStatus = 'OPEN' | 'CLOSED' | 'UNKNOWN';
export type PumpStatus = 'ON' | 'OFF' | 'UNKNOWN';

export interface Esp32DataPayload {
  light?: string;
  door?: string;
  soil?: number;
  pump?: string;
}

export interface DeviceState {
  light: {
    isOn: boolean;
    lastUpdated: string | null;
    lastCommand: string | null;
  };
  door: {
    status: DoorStatus;
    isAlert: boolean;
    lastUpdated: string | null;
  };
  pump: {
    isOn: boolean;
    status: PumpStatus;
    lastUpdated: string | null;
    lastCommand: string | null;
  };
  soil: {
    value: number | null;
    lastUpdated: string | null;
  };
}

export const MQTT_TOPICS = {
  DATA: process.env.EXPO_PUBLIC_MQTT_TOPIC_DATA || 'test/data',
  COMMAND: process.env.EXPO_PUBLIC_MQTT_TOPIC_COMMAND || 'test/command',
} as const;

const envProtocol = (process.env.EXPO_PUBLIC_MQTT_PROTOCOL as 'wss' | 'ws') || 'wss';
const envPort = process.env.EXPO_PUBLIC_MQTT_PORT
  ? parseInt(process.env.EXPO_PUBLIC_MQTT_PORT, 10)
  : 8084;
const envClientPrefix = process.env.EXPO_PUBLIC_MQTT_CLIENT_PREFIX || 'RN-Client-';

export const DEFAULT_MQTT_CONFIG: MqttConfig = {
  protocol: envProtocol,
  host: process.env.EXPO_PUBLIC_MQTT_HOST || 'q283121a.ala.asia-southeast1.emqxsl.com',
  port: Number.isNaN(envPort) ? 8084 : envPort,
  path: process.env.EXPO_PUBLIC_MQTT_PATH || '/mqtt',
  clientId: `${envClientPrefix}${Math.random().toString(16).substring(2, 8)}`,
  username: process.env.EXPO_PUBLIC_MQTT_USERNAME ?? 'admin',
  password: process.env.EXPO_PUBLIC_MQTT_PASSWORD ?? '123',
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 10000,
};

export const PRESET_BROKERS = [
  {
    name: 'Sketch EMQX Server (sketch.ino)',
    desc: 'EMQX Cloud SSL - Port 8084 /mqtt (user: admin, pass: 123)',
    config: {
      protocol: 'wss' as const,
      host: 'q283121a.ala.asia-southeast1.emqxsl.com',
      port: 8084,
      path: '/mqtt',
      username: 'admin',
      password: '123',
    },
  },
  {
    name: 'EMQX Public Broker',
    desc: 'Public secure broker (wss://broker.emqx.io:8084/mqtt)',
    config: {
      protocol: 'wss' as const,
      host: 'broker.emqx.io',
      port: 8084,
      path: '/mqtt',
      username: '',
      password: '',
    },
  },
  {
    name: 'Local MQTTX / Mosquitto',
    desc: 'Local Broker WebSocket (ws://192.168.1.100:8083/mqtt)',
    config: {
      protocol: 'ws' as const,
      host: '192.168.1.100',
      port: 8083,
      path: '/mqtt',
      username: '',
      password: '',
    },
  },
];
