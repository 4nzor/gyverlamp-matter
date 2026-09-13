#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

esp_err_t gyver_udp_init(void);
bool gyver_udp_is_online(void);
void gyver_udp_mark_offline(void);
bool gyver_udp_probe(const char *ip);
bool gyver_udp_discover_once(void);
esp_err_t gyver_udp_load_cached_ip(void);
esp_err_t gyver_udp_send(const char *cmd);
esp_err_t gyver_udp_power(bool on);
esp_err_t gyver_udp_bri(int bri);
esp_err_t gyver_udp_spd(int spd);
esp_err_t gyver_udp_eff(int mode);
const char *gyver_udp_ip(void);

#ifdef __cplusplus
}
#endif
