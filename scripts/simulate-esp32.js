/**
 * ESP32 Hardware Simulator Script for MQTT
 * Simulates the exact behavior of sketch.ino:
 * - Subscribes to: test/command
 * - Publishes to:   test/data
 *   Payload JSON:   {"light":"ON","door":"CLOSED","soil":1420,"pump":"OFF"}
 *
 * Usage:
 *   node scripts/simulate-esp32.js [host] [port] [username] [password]
 */

const mqtt = require('mqtt');

const host = process.argv[2] || process.env.EXPO_PUBLIC_MQTT_HOST || 'q283121a.ala.asia-southeast1.emqxsl.com';
const port = parseInt(process.argv[3] || '8883', 10);
const username = process.argv[4] || process.env.EXPO_PUBLIC_MQTT_USERNAME || 'admin';
const password = process.argv[5] || process.env.EXPO_PUBLIC_MQTT_PASSWORD || '123';

const protocol = port === 8883 ? 'mqtts' : 'mqtt';
const brokerUrl = `${protocol}://${host}:${port}`;

const options = {
  clientId: `ESP32-Home-${Math.floor(Math.random() * 0xffff).toString(16)}`,
  rejectUnauthorized: false,
};

if (username) options.username = username;
if (password) options.password = password;

const topic_data = 'test/data';
const topic_command = 'test/command';

let lightState = false;
let doorState = 'CLOSED';
let pumpOn = false;
let soilValue = 1800;

function publishData(client) {
  const payload = JSON.stringify({
    light: lightState ? 'ON' : 'OFF',
    door: doorState,
    soil: soilValue,
    pump: pumpOn ? 'ON' : 'OFF',
  });

  console.log('\n========== GUI MQTT (ESP32) ==========');
  console.log(`Topic:   ${topic_data}`);
  console.log(`Payload: ${payload}`);
  client.publish(topic_data, payload, { retain: true });
}

console.log('----------------------------------------------------');
console.log('🤖 ESP32 Simulator for sketch.ino starting...');
console.log(`Connecting to: ${brokerUrl}`);
console.log(`Username: ${username}, Password: ${password}`);
console.log(`Topics:   ${topic_data} & ${topic_command}`);
console.log('----------------------------------------------------');

const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
  console.log('✅ ESP32 Simulator Connected to MQTT Broker successfully!');

  // Subscribe to command topic
  client.subscribe(topic_command, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to command topic: ${topic_command}`);
      publishData(client);
    }
  });

  // Gửi định kỳ dữ liệu mỗi 2 giây giống loop() trong sketch.ino
  setInterval(() => {
    publishData(client);
  }, 2000);

  // Giả lập thay đổi cảm biến cửa và độ ẩm đất mỗi 10 giây
  setInterval(() => {
    doorState = doorState === 'CLOSED' ? 'OPEN' : 'CLOSED';
    soilValue = soilValue < 1500 ? 2500 : 1200;
    pumpOn = soilValue < 1500;
    console.log(`\n[Sim Event] Cửa -> ${doorState}, Đất -> ${soilValue}, Bơm -> ${pumpOn ? 'ON' : 'OFF'}`);
  }, 10000);
});

client.on('message', (topic, message) => {
  const msg = message.toString();
  console.log(`\n📥 Nhận lệnh [${topic}]: ${msg}`);

  if (topic === topic_command) {
    if (msg === 'LIGHT_ON' || msg === 'ON') {
      lightState = true;
    } else if (msg === 'LIGHT_OFF' || msg === 'OFF') {
      lightState = false;
    } else if (msg === 'TOGGLE') {
      lightState = !lightState;
    } else if (msg === 'PUMP_ON') {
      pumpOn = true;
    } else if (msg === 'PUMP_OFF') {
      pumpOn = false;
    } else {
      console.log('Lệnh không hợp lệ!');
      return;
    }

    publishData(client);
  }
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err.message);
});

client.on('close', () => {
  console.log('🔌 Disconnected from MQTT broker');
});
