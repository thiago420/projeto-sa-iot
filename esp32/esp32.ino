#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>

// -------------------------------------
// WIFI
// -------------------------------------
const char* ssid = "VIA PRESENTES";
const char* password = "kari2204";

// -------------------------------------
// URLs das APIs
// -------------------------------------
String IdBus = "ec9fc16d-3e6b-44d5-bf54-496c5e81d674";
// String apiUID = "http://192.168.16.121:8080/user/uid";
String apiUID = "https://api-go-2tfm.onrender.com/v1/bus/fare";
String apiGPS = "https://api-go-2tfm.onrender.com/v1/bus/ec9fc16d-3e6b-44d5-bf54-496c5e81d674/stats";

// -------------------------------------
// RFID CONFIG
// -------------------------------------
#define RFID_SDA 13
#define RFID_RST 25
MFRC522 rfid(RFID_SDA, RFID_RST);

// -------------------------------------
// GPS CONFIG
// -------------------------------------
TinyGPSPlus gps;
HardwareSerial GPS_Serial(1);

// Porta usada: RX no GPIO 34, TX no GPIO 12
#define GPS_RX 14
#define GPS_TX 21

unsigned long lastGpsPost = 0;

// -------------------------------------
// SETUP
// -------------------------------------
void setup() {
  Serial.begin(115200);

  GPS_Serial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // ---- WIFI ----
  WiFi.begin(ssid, password);
  Serial.println("Conectando ao WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi conectado!");

  // ---- RFID ----
  SPI.begin(18, 19, 23, RFID_SDA);
  rfid.PCD_Init();

  Serial.println("\nSistema Iniciado!");
  Serial.println("Aproxime um cartão RFID...");
}

// -------------------------------------
// LOOP
// -------------------------------------
void loop() {
  checkRFID();
  readGPS();
  sendGPSIfReady();
}


// ---------------------------------------------------
// RFID
// ---------------------------------------------------
void checkRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();

  Serial.println("UID LIDO: " + uidStr);
  sendUID(uidStr);
  rfid.PICC_HaltA();
}

void sendUID(String uid) {
  StaticJsonDocument<200> doc;
  doc["uid"] = uid;
  doc["id_bus"] = IdBus;

  String body;
  serializeJson(doc, body);

  sendPost(apiUID, body);
}


// ---------------------------------------------------
// GPS
// ---------------------------------------------------
void readGPS() {
  while (GPS_Serial.available()) {
    gps.encode(GPS_Serial.read());
  }
}

void sendGPSIfReady() {
  if (millis() - lastGpsPost < 10000) return;  // 10 segundos
  lastGpsPost = millis();

  if (!gps.location.isValid()) {
    Serial.println("GPS ainda sem fix...");
    return;
  }

  float lat = gps.location.lat();
  float lng = gps.location.lng();

  StaticJsonDocument<200> doc;
  doc["lat"] = lat;
  doc["lng"] = lng;

  String body;
  serializeJson(doc, body);

  Serial.println("📡 Enviando GPS:");
  Serial.println(body);

  sendPost(apiGPS, body);
}


// ---------------------------------------------------
// FUNÇÃO GENÉRICA DE POST
// ---------------------------------------------------
void sendPost(String url, String body) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Sem WiFi!");
    return;
  }

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(body);

  if (code > 0) {
    Serial.print("HTTP ");
    Serial.println(code);
    Serial.println("Resposta:");
    Serial.println(http.getString());
  } else {
    Serial.print("❌ Erro: ");
    Serial.println(code);
  }

  http.end();
}
