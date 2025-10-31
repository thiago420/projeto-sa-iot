#define TINY_GSM_MODEM_SIM800

#include <TinyGsmClient.h>
#include <Wire.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>

#define SerialMon Serial
#define SerialAT Serial1

// ------------------- CONFIGURAÇÃO DE PINOS TTGO T-CALL -------------------
#define MODEM_TX 27
#define MODEM_RX 26
#define MODEM_PWRKEY 4
#define MODEM_RST 5
#define MODEM_POWER_ON 23   // Mantém o modem ligado

// GPS (se você tiver um módulo externo)
#define GPS_RX  15
#define GPS_TX  13

int fimDeCurso = 33;

// ------------------- CONFIGURAÇÃO GPRS -------------------
const char apn[]  = "zap.vivo.com.br";
const char user[] = "vivo";
const char pass[] = "vivo";
const char server[] = "api.tago.io";
const char token[] = "7e7717e5-4650-4d8b-a013-53541479a197";

const char simPIN[] = ""; // Deixe vazio se o SIM não tiver PIN

TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
TinyGPSPlus gps;
HardwareSerial neogps(2);

// ------------------- FUNÇÃO PARA MOSTRAR STATUS -------------------
void showModemStatus() {
  SerialMon.println("\n===== STATUS DO MÓDULO =====");

  int16_t signal = modem.getSignalQuality();
  SerialMon.print("Sinal GSM: ");
  SerialMon.print(signal);
  SerialMon.println(" (0-31)");

  bool network = modem.isNetworkConnected();
  SerialMon.print("Conectado à rede GSM: ");
  SerialMon.println(network ? "SIM" : "NÃO");

  bool gprs = modem.isGprsConnected();
  SerialMon.print("Conectado ao GPRS: ");
  SerialMon.println(gprs ? "SIM" : "NÃO");

  SerialMon.println("=============================\n");
}

// ------------------- INICIALIZAÇÃO -------------------
void setup() {
  SerialMon.begin(115200);
  delay(10);

  // Liga o modem SIM800L
  pinMode(MODEM_POWER_ON, OUTPUT);
  digitalWrite(MODEM_POWER_ON, HIGH);

  pinMode(MODEM_PWRKEY, OUTPUT);
  digitalWrite(MODEM_PWRKEY, HIGH);
  delay(100);
  digitalWrite(MODEM_PWRKEY, LOW);
  delay(1000);
  digitalWrite(MODEM_PWRKEY, HIGH);

  SerialMon.println("Inicializando modem...");

  // Inicializa o modem
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);

  pinMode(fimDeCurso, INPUT_PULLUP);

  modem.restart();
  String modemInfo = modem.getModemInfo();
  SerialMon.print("Módulo detectado: ");
  SerialMon.println(modemInfo);

  if (strlen(simPIN) && modem.getSimStatus() != 3) {
    SerialMon.println("Desbloqueando SIM...");
    modem.simUnlock(simPIN);
  }

  // Aguarda registro na rede GSM
  SerialMon.print("Registrando na rede GSM");
  int retry = 0;
  while (!modem.isNetworkConnected() && retry < 15) {
    delay(2000);
    SerialMon.print(".");
    retry++;
  }
  SerialMon.println();

  if (!modem.isNetworkConnected()) {
    SerialMon.println("❌ Falha ao registrar na rede GSM!");
  } else {
    SerialMon.println("✅ Registrado na rede GSM!");
  }

  // Conecta GPRS
  SerialMon.print("Conectando ao GPRS (APN: ");
  SerialMon.print(apn);
  SerialMon.println(")");
  retry = 0;
  while (!modem.isGprsConnected() && retry < 10) {
    if (modem.gprsConnect(apn, user, pass)) break;
    SerialMon.println("Tentando novamente...");
    retry++;
    delay(3000);
  }

  if (modem.isGprsConnected()) {
    SerialMon.println("✅ Conectado ao GPRS!");
  } else {
    SerialMon.println("❌ Falha ao conectar ao GPRS!");
  }

  showModemStatus();

  // GPS (opcional)
  neogps.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
}

// ------------------- LOOP PRINCIPAL -------------------
void loop() {
  boolean newData = false;

  // Lê dados do GPS
  for (unsigned long start = millis(); millis() - start < 1000;) {
    while (neogps.available()) {
      if (gps.encode(neogps.read())) {
        newData = true;
      }
    }
  }

  if (newData) {
    Serial.print("Latitude: ");
    Serial.println(-28.484880, 6);
    Serial.print("Longitude: ");
    Serial.println(-49.015994, 6);
  } else {
    Serial.println("Sem dados de GPS");
  }

  int estado = digitalRead(fimDeCurso);
  Serial.print("Estado do pino 33: ");
  Serial.println(estado);

  //if (!estado) {
    sendToTagoIO();
  //}

  delay(5000);
}

// ------------------- ENVIO DE DADOS -------------------
void sendToTagoIO() {
  if (!modem.isGprsConnected()) {
    SerialMon.println("❌ Sem conexão GPRS. Tentando reconectar...");
    if (!modem.gprsConnect(apn, user, pass)) {
      SerialMon.println("⚠️ Falha ao reconectar ao GPRS.");
      showModemStatus();
      return;
    }
  }

  StaticJsonDocument<200> jsonDocument;
  jsonDocument["variable"] = "location";
  jsonDocument["value"] = "";

  JsonObject location = jsonDocument.createNestedObject("location");
  location["lat"] = -28.484880;
  location["lng"] = -49.015994;

  String jsonString;
  serializeJson(jsonDocument, jsonString);

  if (client.connect(server, 80)) {
    SerialMon.println("🌐 Conectado ao servidor, enviando dados...");

    client.print(String("POST ") + "/data HTTP/1.1\r\n");
    client.print(String("Host: ") + server + "\r\n");
    client.print("Content-Type: application/json\r\n");
    client.print(String("token: ") + token + "\r\n");
    client.print("Content-Length: " + String(jsonString.length()) + "\r\n");
    client.print("Connection: close\r\n\r\n");
    client.print(jsonString);

    while (client.connected() || client.available()) {
      if (client.available()) {
        String line = client.readStringUntil('\n');
        SerialMon.println(line);
      }
    }
    client.stop();
    SerialMon.println("✅ Dados enviados com sucesso.");
  } else {
    SerialMon.println("❌ Falha ao conectar ao servidor TagoIO.");
  }

  showModemStatus();
}