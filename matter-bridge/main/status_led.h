#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

esp_err_t status_led_init(void);
void status_led_set_offline(void);
void status_led_celebrate_online(void);
void status_led_tick(void);
bool status_led_busy(void);

#ifdef __cplusplus
}
#endif
