
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// =============== WIFI ===============
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// =============== MQTT ===============
const char* mqtt_server = "q283121a.ala.asia-southeast1.emqxsl.com";
const int mqtt_port = 8883;

const char* mqtt_username = "admin";
const char* mqtt_password = "123";

// =============== TOPIC ===============
const char* topic_data = "test/data";
const char* topic_command = "test/command";

// =============== CHÂN ESP32 ===============
const int pinLight = 23;
const int pinDoor = 15;
const int pinSoil = 34;
const int pinPump = 18;

// =============== MQTT CLIENT ===============
WiFiClientSecure espClient;
PubSubClient client(espClient);

// =============== TRẠNG THÁI ===============
bool lightState = false;
bool pumpOn = false;

int lastDoorState = HIGH;

const int SOIL_DRY = 1500;
const int SOIL_WET = 2200;

unsigned long lastPublish = 0;
const unsigned long publishInterval = 2000;

// =============== GỬI DỮ LIỆU ===============
void publishData() {

  if (!client.connected()) {
    Serial.println("MQTT chua ket noi, khong gui duoc!");
    return;
  }

  int soil = analogRead(pinSoil);
  int doorState = digitalRead(pinDoor);

  const char* door = (doorState == LOW) ? "CLOSED" : "OPEN";

  char payload[200];

  snprintf(payload, sizeof(payload),
    "{\"light\":\"%s\",\"door\":\"%s\",\"soil\":%d,\"pump\":\"%s\"}",
    lightState ? "ON" : "OFF",
    door,
    soil,
    pumpOn ? "ON" : "OFF"
  );

  Serial.println("\n========== GUI MQTT ==========");
  Serial.print("Topic: ");
  Serial.println(topic_data);

  Serial.print("Payload: ");
  Serial.println(payload);

  bool result = client.publish(topic_data, payload, true);

  if (result) {
    Serial.println("GUI MQTT THANH CONG!");
  } else {
    Serial.println("GUI MQTT THAT BAI!");
  }

  Serial.println("==============================");
}

// =============== NHẬN LỆNH ===============
void callback(char* topic, byte* payload, unsigned int length) {

  String msg = "";

  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  Serial.println("\n===== NHAN LENH MQTT =====");
  Serial.print("Topic: ");
  Serial.println(topic);
  Serial.print("Lenh: ");
  Serial.println(msg);

  if (String(topic) != topic_command) return;

  if (msg == "LIGHT_ON" || msg == "ON") {
    lightState = true;
    digitalWrite(pinLight, HIGH);
  }
  else if (msg == "LIGHT_OFF" || msg == "OFF") {
    lightState = false;
    digitalWrite(pinLight, LOW);
  }
  else if (msg == "TOGGLE") {
    lightState = !lightState;
    digitalWrite(pinLight, lightState ? HIGH : LOW);
  }
  else if (msg == "PUMP_ON") {
    pumpOn = true;
    digitalWrite(pinPump, HIGH);
  }
  else if (msg == "PUMP_OFF") {
    pumpOn = false;
    digitalWrite(pinPump, LOW);
  }
  else {
    Serial.println("Lenh khong hop le!");
    return;
  }

  publishData();
}

// =============== KẾT NỐI MQTT ===============
void reconnect() {

  while (!client.connected()) {

    Serial.println("Dang ket noi MQTT...");

    String clientId = "ESP32-Home-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(
      clientId.c_str(),
      mqtt_username,
      mqtt_password
    )) {

      Serial.println("MQTT KET NOI THANH CONG!");

      // Đăng ký Topic nhận lệnh
      if (client.subscribe(topic_command)) {
        Serial.println("Subscribe thanh cong!");
      } else {
        Serial.println("Subscribe that bai!");
      }

      // Gửi trạng thái ngay khi kết nối
      publishData();

    } else {

      Serial.print("MQTT loi, rc = ");
      Serial.println(client.state());

      delay(3000);
    }
  }
}

// =============== SETUP ===============
void setup() {

  Serial.begin(115200);

  pinMode(pinLight, OUTPUT);
  pinMode(pinPump, OUTPUT);
  pinMode(pinDoor, INPUT_PULLUP);

  digitalWrite(pinLight, LOW);
  digitalWrite(pinPump, LOW);

  analogReadResolution(12);

  // WiFi
  Serial.println("Dang ket noi WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi DA KET NOI!");

  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // MQTT SSL
  espClient.setInsecure();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  client.setBufferSize(512);

  // Giữ kết nối MQTT
  client.setKeepAlive(60);

  Serial.println("ESP32 SAN SANG!");
}

// =============== LOOP ===============
void loop() {

  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  // Đọc cảm biến cửa
  int doorState = digitalRead(pinDoor);

  if (doorState != lastDoorState) {

    lastDoorState = doorState;

    Serial.println(
      doorState == LOW ? "CUA DONG" : "CUA MO"
    );

    publishData();
  }

  // Đọc biến trở
  int soil = analogRead(pinSoil);

  // Đất khô: bật bơm
  if (!pumpOn && soil < SOIL_DRY) {

    pumpOn = true;
    digitalWrite(pinPump, HIGH);

    Serial.println("DAT KHO - BAT BOM");

    publishData();
  }

  // Đất đủ ẩm: tắt bơm
  else if (pumpOn && soil > SOIL_WET) {

    pumpOn = false;
    digitalWrite(pinPump, LOW);

    Serial.println("DAT DU AM - TAT BOM");

    publishData();
  }

  // Gửi toàn bộ dữ liệu mỗi 2 giây
  if (millis() - lastPublish >= publishInterval) {

    lastPublish = millis();

    publishData();
  }

  delay(50);
}
