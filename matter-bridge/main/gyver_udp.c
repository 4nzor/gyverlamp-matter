#include "gyver_udp.h"

#include <arpa/inet.h>
#include <errno.h>
#include <string.h>
#include <unistd.h>

#include "esp_log.h"
#include "esp_netif.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"
#include "lwip/sockets.h"
#include "nvs.h"
#include "sdkconfig.h"

#include "gyver_map.h"

static const char *TAG = "gyver_udp";
static const char *NVS_NS = "gyver";
static const char *NVS_KEY_IP = "ip";

static int s_sock = -1;
static char s_ip[16];
static bool s_online;
static SemaphoreHandle_t s_mu;

static void lock(void)
{
    if (s_mu) {
        xSemaphoreTake(s_mu, portMAX_DELAY);
    }
}

static void unlock(void)
{
    if (s_mu) {
        xSemaphoreGive(s_mu);
    }
}

esp_err_t gyver_udp_init(void)
{
    if (!s_mu) {
        s_mu = xSemaphoreCreateMutex();
        if (!s_mu) {
            return ESP_ERR_NO_MEM;
        }
    }
    return ESP_OK;
}

static esp_err_t ensure_sock(void)
{
    if (s_sock >= 0) {
        return ESP_OK;
    }

    /* lwIP must be up (Wi-Fi connected / netif started). */
    if (esp_netif_get_handle_from_ifkey("WIFI_STA_DEF") == NULL) {
        return ESP_ERR_INVALID_STATE;
    }

    s_sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (s_sock < 0) {
        ESP_LOGE(TAG, "socket failed: %d", errno);
        return ESP_FAIL;
    }

    int yes = 1;
    setsockopt(s_sock, SOL_SOCKET, SO_BROADCAST, &yes, sizeof(yes));
    setsockopt(s_sock, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    struct sockaddr_in addr = { 0 };
    addr.sin_family = AF_INET;
    addr.sin_port = htons(0);
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    if (bind(s_sock, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        ESP_LOGE(TAG, "bind failed: %d", errno);
        close(s_sock);
        s_sock = -1;
        return ESP_FAIL;
    }

    struct timeval tv = { .tv_sec = 0, .tv_usec = 50000 };
    setsockopt(s_sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    ESP_LOGI(TAG, "UDP ready, port %d", CONFIG_GYVER_UDP_PORT);
    return ESP_OK;
}

bool gyver_udp_is_online(void)
{
    return s_online;
}

const char *gyver_udp_ip(void)
{
    return s_ip;
}

void gyver_udp_mark_offline(void)
{
    lock();
    if (s_online) {
        ESP_LOGW(TAG, "offline");
    }
    s_online = false;
    unlock();
}

static esp_err_t save_ip(const char *ip)
{
    nvs_handle_t h;
    esp_err_t err = nvs_open(NVS_NS, NVS_READWRITE, &h);
    if (err != ESP_OK) {
        return err;
    }
    err = nvs_set_str(h, NVS_KEY_IP, ip);
    if (err == ESP_OK) {
        err = nvs_commit(h);
    }
    nvs_close(h);
    return err;
}

esp_err_t gyver_udp_load_cached_ip(void)
{
    nvs_handle_t h;
    esp_err_t err = nvs_open(NVS_NS, NVS_READONLY, &h);
    if (err != ESP_OK) {
        return err;
    }
    size_t len = sizeof(s_ip);
    err = nvs_get_str(h, NVS_KEY_IP, s_ip, &len);
    nvs_close(h);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "cached IP %s", s_ip);
    }
    return err;
}

static esp_err_t send_to(const char *ip, const char *cmd)
{
    if (ensure_sock() != ESP_OK || ip == NULL || cmd == NULL) {
        return ESP_ERR_INVALID_STATE;
    }
    struct sockaddr_in dest = { 0 };
    dest.sin_family = AF_INET;
    dest.sin_port = htons(CONFIG_GYVER_UDP_PORT);
    if (inet_aton(ip, &dest.sin_addr) == 0) {
        return ESP_ERR_INVALID_ARG;
    }
    int n = sendto(s_sock, cmd, strlen(cmd), 0, (struct sockaddr *)&dest, sizeof(dest));
    if (n < 0) {
        ESP_LOGE(TAG, "send %s -> %s failed: %d", cmd, ip, errno);
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "%s -> %s", cmd, ip);
    return ESP_OK;
}

esp_err_t gyver_udp_send(const char *cmd)
{
    lock();
    if (!s_online || s_ip[0] == '\0') {
        unlock();
        return ESP_ERR_INVALID_STATE;
    }
    esp_err_t err = send_to(s_ip, cmd);
    unlock();
    return err;
}

esp_err_t gyver_udp_power(bool on)
{
    return gyver_udp_send(on ? "P_ON" : "P_OFF");
}

esp_err_t gyver_udp_bri(int bri)
{
    bri = gyver_bri_clamp(bri);
    char buf[16];
    snprintf(buf, sizeof(buf), "BRI%d", bri);
    return gyver_udp_send(buf);
}

esp_err_t gyver_udp_spd(int spd)
{
    if (spd < 1) {
        spd = 1;
    }
    if (spd > 255) {
        spd = 255;
    }
    char buf[16];
    snprintf(buf, sizeof(buf), "SPD%d", spd);
    return gyver_udp_send(buf);
}

esp_err_t gyver_udp_eff(int mode)
{
    char buf[16];
    snprintf(buf, sizeof(buf), "EFF%d", mode);
    return gyver_udp_send(buf);
}

static bool recv_line(char *buf, size_t buflen, int attempts)
{
    for (int i = 0; i < attempts; i++) {
        struct sockaddr_in from;
        socklen_t flen = sizeof(from);
        int n = recvfrom(s_sock, buf, buflen - 1, 0, (struct sockaddr *)&from, &flen);
        if (n > 0) {
            buf[n] = '\0';
            return true;
        }
        vTaskDelay(pdMS_TO_TICKS(25));
    }
    return false;
}

bool gyver_udp_probe(const char *ip)
{
    if (ip == NULL || strlen(ip) < 7) {
        return false;
    }
    lock();
    if (send_to(ip, "GET") != ESP_OK) {
        unlock();
        return false;
    }
    char buf[128];
    bool ok = false;
    for (int i = 0; i < 20; i++) {
        if (recv_line(buf, sizeof(buf), 1) && gyver_resp_is_curr(buf)) {
            ok = true;
            break;
        }
    }
    unlock();
    return ok;
}

static void mark_online(const char *ip)
{
    strncpy(s_ip, ip, sizeof(s_ip) - 1);
    s_ip[sizeof(s_ip) - 1] = '\0';
    s_online = true;
    save_ip(s_ip);
    ESP_LOGI(TAG, "online %s", s_ip);
}

bool gyver_udp_discover_once(void)
{
    lock();

    if (s_ip[0] != '\0' && !s_online) {
        unlock();
        if (gyver_udp_probe(s_ip)) {
            lock();
            mark_online(s_ip);
            unlock();
            return true;
        }
        lock();
    }

    char bcasts[2][16] = { "255.255.255.255", "" };
    int nb = 1;
    esp_netif_ip_info_t info;
    esp_netif_t *netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");
    if (netif && esp_netif_get_ip_info(netif, &info) == ESP_OK) {
        uint32_t b = info.ip.addr | ~info.netmask.addr;
        struct in_addr a = { .s_addr = b };
        inet_ntop(AF_INET, &a, bcasts[1], sizeof(bcasts[1]));
        nb = 2;
    }

    for (int i = 0; i < nb; i++) {
        send_to(bcasts[i], "DISCOVER");
    }

    char buf[128];
    char cand[16];
    for (int i = 0; i < 25; i++) {
        if (!recv_line(buf, sizeof(buf), 1)) {
            continue;
        }
        if (!gyver_parse_discover(buf, cand, sizeof(cand))) {
            continue;
        }
        unlock();
        if (gyver_udp_probe(cand)) {
            lock();
            mark_online(cand);
            unlock();
            return true;
        }
        lock();
    }

    unlock();
    return false;
}
