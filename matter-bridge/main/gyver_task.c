#include "gyver_task.h"

#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "sdkconfig.h"

#include "gyver_udp.h"
#include "status_led.h"

static const char *TAG = "gyver_task";

static QueueHandle_t s_q;
static int s_last_bri = -1;
static int s_last_eff = -1;
static int s_tick;
static bool s_was_online;
static volatile bool s_lamp_enabled;

static void apply_scene(int eff, int spd)
{
    if (!s_lamp_enabled || !gyver_udp_is_online()) {
        return;
    }
    if (eff == s_last_eff) {
        return;
    }
    ESP_LOGI(TAG, "scene EFF%d spd=%d", eff, spd);
    s_last_eff = eff;
    gyver_udp_eff(eff);
    if (spd > 0) {
        gyver_udp_spd(spd);
    }
    gyver_udp_power(true);
}

static void handle_cmd(const gyver_cmd_t *cmd)
{
    if (!s_lamp_enabled || !gyver_udp_is_online()) {
        return;
    }
    switch (cmd->type) {
    case GYVER_CMD_POWER:
        s_last_eff = -1;
        gyver_udp_power(cmd->value != 0);
        break;
    case GYVER_CMD_BRI:
        if (gyver_bri_should_send(cmd->value, s_last_bri)) {
            s_last_bri = gyver_bri_clamp(cmd->value);
            gyver_udp_bri(s_last_bri);
        }
        break;
    case GYVER_CMD_SCENE:
        apply_scene(cmd->value, cmd->value2);
        break;
    }
}

static void gyver_loop(void *arg)
{
    (void)arg;
    bool armed = false;

    for (;;) {
        if (!s_lamp_enabled) {
            /* Quiet during Alice Matter commissioning — no UDP to the lamp. */
            gyver_cmd_t drop;
            while (xQueueReceive(s_q, &drop, 0) == pdTRUE) {
            }
            s_was_online = false;
            armed = false;
            vTaskDelay(pdMS_TO_TICKS(250));
            continue;
        }

        if (!armed) {
            ESP_LOGI(TAG, "lamp bridge armed — discover/probe start");
            status_led_set_offline();
            gyver_udp_load_cached_ip();
            gyver_udp_discover_once();
            s_tick = 0;
            armed = true;
        }

        gyver_cmd_t cmd;
        while (xQueueReceive(s_q, &cmd, 0) == pdTRUE) {
            handle_cmd(&cmd);
        }

        status_led_tick();

        bool online = gyver_udp_is_online();
        if (online && !s_was_online) {
            status_led_celebrate_online();
        }
        if (!online && s_was_online) {
            status_led_set_offline();
        }
        s_was_online = online;

        s_tick++;
        if (!online) {
            if ((s_tick % 20) == 0) {
                gyver_udp_discover_once();
            }
        } else if ((s_tick % 40) == 0) {
            if (!gyver_udp_probe(gyver_udp_ip())) {
                gyver_udp_mark_offline();
            }
        }

        vTaskDelay(pdMS_TO_TICKS(250));
    }
}

bool gyver_task_post(const gyver_cmd_t *cmd)
{
    if (!s_q || !cmd) {
        return false;
    }
    return xQueueSend(s_q, cmd, 0) == pdTRUE;
}

void gyver_task_enable_lamp(void)
{
    if (!s_lamp_enabled) {
        ESP_LOGI(TAG, "enable lamp (Matter ready)");
    }
    s_lamp_enabled = true;
}

void gyver_task_disable_lamp(void)
{
    if (s_lamp_enabled) {
        ESP_LOGI(TAG, "disable lamp (commissioning)");
    }
    s_lamp_enabled = false;
    gyver_udp_mark_offline();
}

bool gyver_task_lamp_enabled(void)
{
    return s_lamp_enabled;
}

esp_err_t gyver_task_start(void)
{
    s_lamp_enabled = false;
    s_q = xQueueCreate(16, sizeof(gyver_cmd_t));
    if (!s_q) {
        return ESP_ERR_NO_MEM;
    }
    BaseType_t ok = xTaskCreate(gyver_loop, "gyver", 6144, NULL, 5, NULL);
    if (ok != pdPASS) {
        return ESP_ERR_NO_MEM;
    }
    ESP_LOGI(TAG, "started (lamp gated until Matter commissioning)");
    return ESP_OK;
}
