#pragma once
/*
 * Транспорт управления лампой по WebSocket (RFC 6455).
 * Включается только при LAMP_NET_MODE == 1U в Constants.h.
 * Браузер: new WebSocket("ws://<ip>:81") и те же команды, что по UDP
 * (P_ON, P_OFF, BRI, SPD, SCA, EFF, GET, LIST1…).
 * Внешняя Arduino-библиотека WebSockets не нужна.
 */

#if (LAMP_NET_MODE == 1U)

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#include <Hash.h>
#else
#include <WiFi.h>
#include <mbedtls/sha1.h>
#endif

extern char inputBuffer[];
void processInputBuffer(char *inputBuffer, char *outputBuffer, bool generateOutput);

class WsManager
{
  public:
    static void begin();
    static void handle();
    static void send(const uint8_t *data, size_t len);
    static void send(const char *text);

  private:
    static WiFiServer server;
    static WiFiClient client;
    static bool upgraded;
    static uint8_t frameBuf[MAX_UDP_BUFFER_SIZE + 16];
    static size_t frameGot;

    static bool handshake();
    static void sha1_20(const uint8_t *data, size_t len, uint8_t out[20]);
    static void b64_20(const uint8_t in[20], char out[29]);
    static void sendFrame(uint8_t opcode, const uint8_t *data, size_t len);
    static void processIncoming();
    static void runCommand(char *cmd);
    static void dropClient();
};

WiFiServer WsManager::server(ESP_WS_PORT);
WiFiClient WsManager::client;
bool WsManager::upgraded = false;
uint8_t WsManager::frameBuf[MAX_UDP_BUFFER_SIZE + 16];
size_t WsManager::frameGot = 0;

void WsManager::begin()
{
  server.begin();
  server.setNoDelay(true);
  upgraded = false;
  frameGot = 0;
  LOG.printf_P(PSTR("WebSocket: ws://%s:%u\n"), WiFi.localIP().toString().c_str(), ESP_WS_PORT);
}

void WsManager::dropClient()
{
  if (client)
  {
    client.stop();
  }
  upgraded = false;
  frameGot = 0;
}

void WsManager::sha1_20(const uint8_t *data, size_t len, uint8_t out[20])
{
#if defined(ESP8266)
  sha1(data, len, out);
#else
  mbedtls_sha1_ret(data, len, out);
#endif
}

void WsManager::b64_20(const uint8_t in[20], char out[29])
{
  static const char tbl[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  uint8_t i = 0;
  uint8_t o = 0;
  while (i < 18)
  {
    uint32_t v = ((uint32_t)in[i] << 16) | ((uint32_t)in[i + 1] << 8) | in[i + 2];
    out[o++] = tbl[(v >> 18) & 63];
    out[o++] = tbl[(v >> 12) & 63];
    out[o++] = tbl[(v >> 6) & 63];
    out[o++] = tbl[v & 63];
    i += 3;
  }
  uint32_t v = ((uint32_t)in[18] << 16) | ((uint32_t)in[19] << 8);
  out[o++] = tbl[(v >> 18) & 63];
  out[o++] = tbl[(v >> 12) & 63];
  out[o++] = tbl[(v >> 6) & 63];
  out[o++] = '=';
  out[o] = '\0';
}

bool WsManager::handshake()
{
  char hdr[640];
  size_t n = 0;
  const uint32_t t0 = millis();
  while (millis() - t0 < 2000U && n < sizeof(hdr) - 1)
  {
    WDT_FEED();
    while (client.available() && n < sizeof(hdr) - 1)
    {
      hdr[n++] = (char)client.read();
      if (n >= 4 &&
          hdr[n - 4] == '\r' && hdr[n - 3] == '\n' &&
          hdr[n - 2] == '\r' && hdr[n - 1] == '\n')
      {
        goto got_headers;
      }
    }
    delay(1);
  }
got_headers:
  hdr[n] = '\0';

  char *keyLine = strstr(hdr, "Sec-WebSocket-Key:");
  if (!keyLine)
  {
    keyLine = strstr(hdr, "sec-websocket-key:");
  }
  if (!keyLine)
  {
    return false;
  }
  keyLine += 18;
  while (*keyLine == ' ' || *keyLine == '\t')
  {
    keyLine++;
  }
  char key[32];
  size_t k = 0;
  while (*keyLine && *keyLine != '\r' && *keyLine != '\n' && k < sizeof(key) - 1)
  {
    key[k++] = *keyLine++;
  }
  key[k] = '\0';
  if (k < 16)
  {
    return false;
  }

  char concat[64];
  snprintf(concat, sizeof(concat), "%s258EAFA5-E914-47DA-95CA-C5AB0DC85B11", key);
  uint8_t hash[20];
  sha1_20((const uint8_t *)concat, strlen(concat), hash);
  char accept[29];
  b64_20(hash, accept);

  client.print(F("HTTP/1.1 101 Switching Protocols\r\n"));
  client.print(F("Upgrade: websocket\r\n"));
  client.print(F("Connection: Upgrade\r\n"));
  client.print(F("Sec-WebSocket-Accept: "));
  client.print(accept);
  client.print(F("\r\n\r\n"));
  return true;
}

void WsManager::sendFrame(uint8_t opcode, const uint8_t *data, size_t len)
{
  if (!upgraded || !client || !client.connected())
  {
    return;
  }
  uint8_t hdr[4];
  size_t hlen = 2;
  hdr[0] = (uint8_t)(0x80U | opcode);
  if (len < 126)
  {
    hdr[1] = (uint8_t)len;
  }
  else if (len < 65536)
  {
    hdr[1] = 126;
    hdr[2] = (uint8_t)(len >> 8);
    hdr[3] = (uint8_t)(len & 0xFF);
    hlen = 4;
  }
  else
  {
    return;
  }
  client.write(hdr, hlen);
  if (len && data)
  {
    client.write(data, len);
  }
}

void WsManager::send(const uint8_t *data, size_t len)
{
  sendFrame(0x01, data, len);
}

void WsManager::send(const char *text)
{
  if (!text)
  {
    return;
  }
  send((const uint8_t *)text, strlen(text));
}

void WsManager::runCommand(char *cmd)
{
  size_t n = strlen(cmd);
  while (n && (cmd[n - 1] == '\r' || cmd[n - 1] == '\n' || cmd[n - 1] == ' '))
  {
    cmd[--n] = '\0';
  }
  if (!n)
  {
    return;
  }

  strncpy(inputBuffer, cmd, MAX_UDP_BUFFER_SIZE - 1);
  inputBuffer[MAX_UDP_BUFFER_SIZE - 1] = '\0';

#ifdef GENERAL_DEBUG
  LOG.print(F("Inbound WS: "));
  LOG.println(inputBuffer);
#endif

  char reply[MAX_UDP_BUFFER_SIZE];
  processInputBuffer(inputBuffer, reply, true);
  WDT_FEED();
  if (strlen(reply) > 0)
  {
    send(reply);
#ifdef GENERAL_DEBUG
    LOG.print(F("Outbound WS: "));
    LOG.println(reply);
#endif
  }
}

void WsManager::processIncoming()
{
  while (client.available() && frameGot < sizeof(frameBuf))
  {
    frameBuf[frameGot++] = (uint8_t)client.read();
  }

  for (uint8_t n = 0; n < 8 && frameGot >= 2; n++)
  {
    const uint8_t opcode = frameBuf[0] & 0x0F;
    const bool masked = (frameBuf[1] & 0x80) != 0;
    uint64_t payload = frameBuf[1] & 0x7F;
    size_t hdr = 2;
    if (payload == 126)
    {
      if (frameGot < 4)
      {
        return;
      }
      payload = ((uint16_t)frameBuf[2] << 8) | frameBuf[3];
      hdr = 4;
    }
    else if (payload == 127)
    {
      dropClient();
      return;
    }
    if (!masked)
    {
      dropClient();
      return;
    }
    hdr += 4;
    if (payload > MAX_UDP_BUFFER_SIZE - 1)
    {
      dropClient();
      return;
    }
    const size_t need = hdr + (size_t)payload;
    if (frameGot < need)
    {
      return;
    }

    const uint8_t *mask = frameBuf + hdr - 4;
    char cmd[MAX_UDP_BUFFER_SIZE];
    for (size_t i = 0; i < (size_t)payload; i++)
    {
      cmd[i] = (char)(frameBuf[hdr + i] ^ mask[i & 3]);
    }
    cmd[payload] = '\0';

    if (frameGot > need)
    {
      memmove(frameBuf, frameBuf + need, frameGot - need);
      frameGot -= need;
    }
    else
    {
      frameGot = 0;
    }

    switch (opcode)
    {
      case 0x01:
        runCommand(cmd);
        break;
      case 0x08:
        sendFrame(0x08, NULL, 0);
        dropClient();
        return;
      case 0x09:
        sendFrame(0x0A, (const uint8_t *)cmd, (size_t)payload);
        break;
      default:
        break;
    }
  }
}

void WsManager::handle()
{
  if (server.hasClient())
  {
    if (client && client.connected())
    {
      client.stop();
    }
    client = server.available();
    client.setNoDelay(true);
    frameGot = 0;
    upgraded = handshake();
    if (!upgraded)
    {
      dropClient();
    }
#ifdef GENERAL_DEBUG
    else
    {
      LOG.println(F("WS client connected"));
    }
#endif
  }

  if (!client || !client.connected())
  {
    if (upgraded)
    {
      dropClient();
    }
    return;
  }
  if (!upgraded)
  {
    return;
  }

  processIncoming();
  WDT_FEED();
}

#endif // LAMP_NET_MODE == 1U
