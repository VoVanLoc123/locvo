import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  DEFAULT_MQTT_CONFIG,
  DeviceState,
  DoorStatus,
  Esp32DataPayload,
  MQTT_TOPICS,
  MqttConfig,
  MqttConnectionStatus,
  MqttLogItem,
  PumpStatus,
} from '@/types/mqtt';
import { mqttService } from '@/services/mqtt.service';

interface MqttContextValue {
  status: MqttConnectionStatus;
  errorMsg: string | null;
  config: MqttConfig;
  brokerUrl: string;
  deviceState: DeviceState;
  logs: MqttLogItem[];
  connect: (customConfig?: Partial<MqttConfig>) => void;
  disconnect: () => void;
  updateConfig: (patch: Partial<MqttConfig>) => void;
  resetConfig: () => void;
  publish: (
    topic: string,
    message: string,
    options?: { qos?: 0 | 1 | 2; retain?: boolean }
  ) => Promise<boolean>;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  turnLightOn: () => Promise<boolean>;
  turnLightOff: () => Promise<boolean>;
  toggleLight: () => Promise<boolean>;
  turnPumpOn: () => Promise<boolean>;
  turnPumpOff: () => Promise<boolean>;
  clearLogs: () => void;
  simulateMessage: (topic: string, payload: string) => void;
}

const initialDeviceState: DeviceState = {
  light: {
    isOn: false,
    lastUpdated: null,
    lastCommand: null,
  },
  door: {
    status: 'UNKNOWN',
    isAlert: false,
    lastUpdated: null,
  },
  pump: {
    isOn: false,
    status: 'UNKNOWN',
    lastUpdated: null,
    lastCommand: null,
  },
  soil: {
    value: null,
    lastUpdated: null,
  },
};

const MqttContext = createContext<MqttContextValue | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<MqttConnectionStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<MqttConfig>({ ...DEFAULT_MQTT_CONFIG });
  const [deviceState, setDeviceState] = useState<DeviceState>(initialDeviceState);
  const [logs, setLogs] = useState<MqttLogItem[]>([]);

  // Format current timestamp
  const getTimestamp = () => {
    const d = new Date();
    return (
      d.toTimeString().split(' ')[0] +
      '.' +
      String(d.getMilliseconds()).padStart(3, '0')
    );
  };

  const processIncomingMessage = useCallback((topic: string, payload: string) => {
    const trimmed = payload.trim();
    const now = getTimestamp();

    // 1. Nhận dữ liệu tổng hợp từ ESP32 qua topic_data (test/data)
    if (topic === MQTT_TOPICS.DATA) {
      try {
        const data: Esp32DataPayload = JSON.parse(trimmed);

        setDeviceState((prev) => {
          const next = { ...prev };

          // Cập nhật đèn
          if (data.light !== undefined) {
            const lightUpper = String(data.light).toUpperCase();
            const isOn = lightUpper === 'ON' || lightUpper === '1';
            next.light = {
              ...prev.light,
              isOn,
              lastUpdated: now,
            };
          }

          // Cập nhật cửa
          if (data.door !== undefined) {
            const doorUpper = String(data.door).toUpperCase();
            const isClosed = doorUpper === 'CLOSED' || doorUpper === '0';
            const isOpen = doorUpper === 'OPEN' || doorUpper === '1';
            const doorStatus: DoorStatus = isClosed
              ? 'CLOSED'
              : isOpen
              ? 'OPEN'
              : 'UNKNOWN';

            next.door = {
              status: doorStatus,
              isAlert: doorStatus === 'OPEN',
              lastUpdated: now,
            };
          }

          // Cập nhật độ ẩm đất
          if (data.soil !== undefined && typeof data.soil === 'number') {
            next.soil = {
              value: data.soil,
              lastUpdated: now,
            };
          }

          // Cập nhật bơm
          if (data.pump !== undefined) {
            const pumpUpper = String(data.pump).toUpperCase();
            const isPumpOn =
              pumpUpper === 'ON' || pumpUpper === 'PUMP_ON' || pumpUpper === '1';
            const isPumpOff =
              pumpUpper === 'OFF' || pumpUpper === 'PUMP_OFF' || pumpUpper === '0';
            const pumpStatus: PumpStatus = isPumpOn
              ? 'ON'
              : isPumpOff
              ? 'OFF'
              : 'UNKNOWN';

            next.pump = {
              ...prev.pump,
              isOn: isPumpOn,
              status: pumpStatus,
              lastUpdated: now,
            };
          }

          return next;
        });
      } catch (err) {
        console.warn('Không thể parse JSON từ topic test/data:', err, trimmed);
      }
    }
    // 2. Nhận thông báo lệnh gửi đi hoặc lệnh khác trên topic_command (test/command)
    else if (topic === MQTT_TOPICS.COMMAND) {
      const upper = trimmed.toUpperCase();
      setDeviceState((prev) => ({
        ...prev,
        light: upper.includes('LIGHT') || upper === 'TOGGLE'
          ? { ...prev.light, lastCommand: trimmed }
          : prev.light,
        pump: upper.includes('PUMP')
          ? { ...prev.pump, lastCommand: trimmed }
          : prev.pump,
      }));
    }
  }, []);

  useEffect(() => {
    const removeStatusListener = mqttService.addStatusListener((newStatus, error) => {
      setStatus(newStatus);
      if (error) {
        setErrorMsg(error);
      } else if (newStatus === 'connected') {
        setErrorMsg(null);
      }
    });

    const removeMessageListener = mqttService.addMessageListener((topic, payload) => {
      processIncomingMessage(topic, payload);
    });

    const removeLogListener = mqttService.addLogListener((logItem) => {
      setLogs((prev) => [logItem, ...prev.slice(0, 99)]); // Giữ 100 log gần nhất
    });

    return () => {
      removeStatusListener();
      removeMessageListener();
      removeLogListener();
    };
  }, [processIncomingMessage]);

  const connect = useCallback(
    (customConfig?: Partial<MqttConfig>) => {
      setErrorMsg(null);
      const targetConfig = customConfig ? { ...config, ...customConfig } : config;
      if (customConfig) {
        setConfig(targetConfig);
      }
      mqttService.connect(targetConfig);
    },
    [config]
  );

  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  const updateConfig = useCallback((patch: Partial<MqttConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_MQTT_CONFIG });
  }, []);

  const publish = useCallback(
    (
      topic: string,
      message: string,
      options?: { qos?: 0 | 1 | 2; retain?: boolean }
    ) => {
      return mqttService.publish(topic, message, options);
    },
    []
  );

  const subscribe = useCallback((topic: string) => {
    mqttService.subscribe(topic);
  }, []);

  const unsubscribe = useCallback((topic: string) => {
    mqttService.unsubscribe(topic);
  }, []);

  const turnLightOn = useCallback(async () => {
    const ok = await mqttService.turnLightOn();
    if (ok) {
      setDeviceState((prev) => ({
        ...prev,
        light: { ...prev.light, lastCommand: 'LIGHT_ON' },
      }));
    }
    return ok;
  }, []);

  const turnLightOff = useCallback(async () => {
    const ok = await mqttService.turnLightOff();
    if (ok) {
      setDeviceState((prev) => ({
        ...prev,
        light: { ...prev.light, lastCommand: 'LIGHT_OFF' },
      }));
    }
    return ok;
  }, []);

  const toggleLight = useCallback(async () => {
    const ok = await mqttService.toggleLight();
    if (ok) {
      setDeviceState((prev) => ({
        ...prev,
        light: { ...prev.light, lastCommand: 'TOGGLE' },
      }));
    }
    return ok;
  }, []);

  const turnPumpOn = useCallback(async () => {
    const ok = await mqttService.turnPumpOn();
    if (ok) {
      setDeviceState((prev) => ({
        ...prev,
        pump: { ...prev.pump, lastCommand: 'PUMP_ON' },
      }));
    }
    return ok;
  }, []);

  const turnPumpOff = useCallback(async () => {
    const ok = await mqttService.turnPumpOff();
    if (ok) {
      setDeviceState((prev) => ({
        ...prev,
        pump: { ...prev.pump, lastCommand: 'PUMP_OFF' },
      }));
    }
    return ok;
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const simulateMessage = useCallback(
    (topic: string, payload: string) => {
      const now = getTimestamp();
      const mockLog: MqttLogItem = {
        id: `sim-${Date.now()}`,
        topic,
        payload,
        direction: 'in',
        timestamp: now,
        qos: 0,
      };
      setLogs((prev) => [mockLog, ...prev.slice(0, 99)]);
      processIncomingMessage(topic, payload);
    },
    [processIncomingMessage]
  );

  const brokerUrl = useMemo(() => mqttService.getBrokerUrl(config), [config]);

  const value = useMemo(
    () => ({
      status,
      errorMsg,
      config,
      brokerUrl,
      deviceState,
      logs,
      connect,
      disconnect,
      updateConfig,
      resetConfig,
      publish,
      subscribe,
      unsubscribe,
      turnLightOn,
      turnLightOff,
      toggleLight,
      turnPumpOn,
      turnPumpOff,
      clearLogs,
      simulateMessage,
    }),
    [
      status,
      errorMsg,
      config,
      brokerUrl,
      deviceState,
      logs,
      connect,
      disconnect,
      updateConfig,
      resetConfig,
      publish,
      subscribe,
      unsubscribe,
      turnLightOn,
      turnLightOff,
      toggleLight,
      turnPumpOn,
      turnPumpOff,
      clearLogs,
      simulateMessage,
    ]
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = (): MqttContextValue => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt must be used within an MqttProvider');
  }
  return context;
};
