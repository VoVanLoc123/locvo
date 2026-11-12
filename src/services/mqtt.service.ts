import mqtt, { MqttClient } from 'mqtt';
import {
  DEFAULT_MQTT_CONFIG,
  MQTT_TOPICS,
  MqttConfig,
  MqttConnectionStatus,
  MqttLogItem,
} from '@/types/mqtt';

type StatusListener = (status: MqttConnectionStatus, errorMsg?: string) => void;
type MessageListener = (topic: string, payload: string, packet?: any) => void;
type LogListener = (item: MqttLogItem) => void;

class MqttService {
  private client: MqttClient | null = null;
  private currentConfig: MqttConfig = { ...DEFAULT_MQTT_CONFIG };
  private status: MqttConnectionStatus = 'disconnected';
  private statusListeners: Set<StatusListener> = new Set();
  private messageListeners: Set<MessageListener> = new Set();
  private logListeners: Set<LogListener> = new Set();
  private subscribedTopics: Set<string> = new Set();

  public getStatus(): MqttConnectionStatus {
    return this.status;
  }

  public getConfig(): MqttConfig {
    return { ...this.currentConfig };
  }

  public addStatusListener(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public addMessageListener(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public addLogListener(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  private notifyStatus(status: MqttConnectionStatus, errorMsg?: string) {
    this.status = status;
    this.statusListeners.forEach((listener) => {
      try {
        listener(status, errorMsg);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  private notifyMessage(topic: string, payload: string, packet?: any) {
    this.messageListeners.forEach((listener) => {
      try {
        listener(topic, payload, packet);
      } catch (err) {
        console.error('Error in message listener:', err);
      }
    });
  }

  private addLog(
    topic: string,
    payload: string,
    direction: 'in' | 'out',
    qos?: 0 | 1 | 2,
    retain?: boolean
  ) {
    const now = new Date();
    const timeStr =
      now.toTimeString().split(' ')[0] +
      '.' +
      String(now.getMilliseconds()).padStart(3, '0');
    const logItem: MqttLogItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic,
      payload,
      direction,
      timestamp: timeStr,
      qos,
      retain,
    };

    this.logListeners.forEach((listener) => {
      try {
        listener(logItem);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });
  }

  public getBrokerUrl(cfg: MqttConfig = this.currentConfig): string {
    const formattedPath = cfg.path.startsWith('/') ? cfg.path : `/${cfg.path}`;
    return `${cfg.protocol}://${cfg.host}:${cfg.port}${formattedPath}`;
  }

  public connect(config?: Partial<MqttConfig>): void {
    if (config) {
      this.currentConfig = { ...this.currentConfig, ...config };
    }

    if (this.client) {
      try {
        this.client.end(true);
      } catch {
        // ignore cleanup error
      }
      this.client = null;
    }

    const brokerUrl = this.getBrokerUrl(this.currentConfig);
    this.notifyStatus('connecting');

    try {
      const options: any = {
        clientId:
          this.currentConfig.clientId ||
          `RN-Client-${Math.random().toString(16).substring(2, 8)}`,
        clean: this.currentConfig.clean ?? true,
        reconnectPeriod: this.currentConfig.reconnectPeriod ?? 5000,
        connectTimeout: this.currentConfig.connectTimeout ?? 10000,
      };

      if (this.currentConfig.username) {
        options.username = this.currentConfig.username;
      }
      if (this.currentConfig.password) {
        options.password = this.currentConfig.password;
      }

      const client = mqtt.connect(brokerUrl, options);
      this.client = client;

      client.on('connect', () => {
        this.notifyStatus('connected');
        // Tự động đăng ký topic nhận dữ liệu chính từ ESP32 (test/data)
        this.subscribe(MQTT_TOPICS.DATA);

        // Đăng ký lại các topic tùy chỉnh khác nếu có
        this.subscribedTopics.forEach((topic) => {
          if (topic !== MQTT_TOPICS.DATA) {
            client.subscribe(topic);
          }
        });
      });

      client.on('reconnect', () => {
        this.notifyStatus('reconnecting');
      });

      client.on('close', () => {
        if (this.status !== 'disconnected') {
          this.notifyStatus('disconnected');
        }
      });

      client.on('offline', () => {
        this.notifyStatus('disconnected');
      });

      client.on('error', (err) => {
        console.warn('MQTT client error:', err.message);
        this.notifyStatus('error', err.message);
      });

      client.on('message', (topic, payloadBuffer, packet) => {
        const payloadStr = payloadBuffer.toString();
        this.addLog(topic, payloadStr, 'in', packet.qos as 0 | 1 | 2, packet.retain);
        this.notifyMessage(topic, payloadStr, packet);
      });
    } catch (err: any) {
      console.error('MQTT connection initialization error:', err);
      this.notifyStatus('error', err.message || 'Connection failed');
    }
  }

  public disconnect(): void {
    if (this.client) {
      try {
        this.client.end();
      } catch (err) {
        console.error('Error disconnecting MQTT client:', err);
      }
      this.client = null;
    }
    this.notifyStatus('disconnected');
  }

  public subscribe(topic: string, qos: 0 | 1 | 2 = 0): void {
    this.subscribedTopics.add(topic);
    if (this.client && this.status === 'connected') {
      this.client.subscribe(topic, { qos }, (err) => {
        if (err) {
          console.error(`Failed to subscribe to topic ${topic}:`, err);
        }
      });
    }
  }

  public unsubscribe(topic: string): void {
    this.subscribedTopics.delete(topic);
    if (this.client && this.status === 'connected') {
      this.client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to unsubscribe from topic ${topic}:`, err);
        }
      });
    }
  }

  public publish(
    topic: string,
    message: string,
    options: { qos?: 0 | 1 | 2; retain?: boolean } = { qos: 0, retain: false }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.client || this.status !== 'connected') {
        console.warn('Cannot publish: MQTT client is not connected');
        resolve(false);
        return;
      }

      this.client.publish(topic, message, options, (err) => {
        if (err) {
          console.error(`Publish error on ${topic}:`, err);
          resolve(false);
        } else {
          this.addLog(topic, message, 'out', options.qos, options.retain);
          resolve(true);
        }
      });
    });
  }

  // Quick commands gửi đến topic_command ("test/command")
  public turnLightOn(): Promise<boolean> {
    return this.publish(MQTT_TOPICS.COMMAND, 'LIGHT_ON');
  }

  public turnLightOff(): Promise<boolean> {
    return this.publish(MQTT_TOPICS.COMMAND, 'LIGHT_OFF');
  }

  public toggleLight(): Promise<boolean> {
    return this.publish(MQTT_TOPICS.COMMAND, 'TOGGLE');
  }

  public turnPumpOn(): Promise<boolean> {
    return this.publish(MQTT_TOPICS.COMMAND, 'PUMP_ON');
  }

  public turnPumpOff(): Promise<boolean> {
    return this.publish(MQTT_TOPICS.COMMAND, 'PUMP_OFF');
  }
}

export const mqttService = new MqttService();
