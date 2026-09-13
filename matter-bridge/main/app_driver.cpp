/*
   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
*/

#include <esp_log.h>
#include <stdlib.h>

#include "bsp/esp-bsp.h"
#include <esp_matter.h>

#include <app_priv.h>
#include <common_macros.h>

#include "gyver_scenes.h"
#include "gyver_task.h"

using namespace chip::app::Clusters;
using namespace chip::app::Clusters::ColorControl::Attributes;
using namespace esp_matter;

static const char *TAG = "app_driver";
extern uint16_t light_endpoint_id;

static int s_cached_hue;
static int s_cached_sat = 255;
static int s_cached_bri = 128;

static void post_power(bool on)
{
    gyver_cmd_t cmd = { .type = GYVER_CMD_POWER, .value = on ? 1 : 0, .value2 = 0 };
    gyver_task_post(&cmd);
}

static void post_bri(int bri)
{
    gyver_cmd_t cmd = { .type = GYVER_CMD_BRI, .value = bri, .value2 = 0 };
    gyver_task_post(&cmd);
}

static void post_scene_from_cache(void)
{
    gyver_cmd_t cmd = { .type = GYVER_CMD_SCENE, .value = 0, .value2 = 0 };
    if (gyver_scene_is_white(s_cached_sat)) {
        cmd.value = 0; /* EFF_WHITE_COLOR */
        gyver_task_post(&cmd);
        return;
    }
    const gyver_scene_t *s = gyver_scene_lookup(s_cached_hue, s_cached_sat, s_cached_bri);
    if (!s) {
        ESP_LOGI(TAG, "no scene for h=%d s=%d b=%d", s_cached_hue, s_cached_sat, s_cached_bri);
        return;
    }
    ESP_LOGI(TAG, "scene '%s' -> EFF%d", s->name, s->eff);
    cmd.value = s->eff;
    cmd.value2 = s->spd;
    gyver_task_post(&cmd);
}

/* Do any conversions/remapping for the actual value here */
static esp_err_t app_driver_light_set_power(led_indicator_handle_t handle, esp_matter_attr_val_t *val)
{
    post_power(val->val.b);
#if CONFIG_BSP_LEDS_NUM > 0
    esp_err_t err = ESP_OK;
    if (val->val.b) {
        err = led_indicator_start(handle, BSP_LED_ON);
    } else {
        err = led_indicator_start(handle, BSP_LED_OFF);
    }
    return err;
#else
    ESP_LOGI(TAG, "LED set power: %d", val->val.b);
    return ESP_OK;
#endif
}

static esp_err_t app_driver_light_set_brightness(led_indicator_handle_t handle, esp_matter_attr_val_t *val)
{
    int value = REMAP_TO_RANGE(val->val.u8, MATTER_BRIGHTNESS, STANDARD_BRIGHTNESS);
    s_cached_bri = value;
    post_bri(value);
    post_scene_from_cache();
#if CONFIG_BSP_LEDS_NUM > 0
    return led_indicator_set_brightness(handle, value);
#else
    ESP_LOGI(TAG, "LED set brightness: %d", value);
    return ESP_OK;
#endif
}

static esp_err_t app_driver_light_set_hue(led_indicator_handle_t handle, esp_matter_attr_val_t *val)
{
    int value = REMAP_TO_RANGE(val->val.u8, MATTER_HUE, STANDARD_HUE);
    s_cached_hue = value;
    post_scene_from_cache();
#if CONFIG_BSP_LEDS_NUM > 0
    led_indicator_ihsv_t hsv;
    hsv.value = led_indicator_get_hsv(handle);
    hsv.h = value;
    return led_indicator_set_hsv(handle, hsv.value);
#else
    ESP_LOGI(TAG, "LED set hue: %d", value);
    return ESP_OK;
#endif
}

static esp_err_t app_driver_light_set_saturation(led_indicator_handle_t handle, esp_matter_attr_val_t *val)
{
    int value = REMAP_TO_RANGE(val->val.u8, MATTER_SATURATION, STANDARD_SATURATION);
    s_cached_sat = value;
    post_scene_from_cache();
#if CONFIG_BSP_LEDS_NUM > 0
    led_indicator_ihsv_t hsv;
    hsv.value = led_indicator_get_hsv(handle);
    hsv.s = value;
    return led_indicator_set_hsv(handle, hsv.value);
#else
    ESP_LOGI(TAG, "LED set saturation: %d", value);
    return ESP_OK;
#endif
}

static esp_err_t app_driver_light_set_temperature(led_indicator_handle_t handle, esp_matter_attr_val_t *val)
{
    uint32_t value = REMAP_TO_RANGE_INVERSE(val->val.u16, STANDARD_TEMPERATURE_FACTOR);
#if CONFIG_BSP_LEDS_NUM > 0
    return led_indicator_set_color_temperature(handle, value);
#else
    ESP_LOGI(TAG, "LED set temperature: %ld", value);
    return ESP_OK;
#endif
}

static esp_err_t app_driver_light_apply_color_mode(led_indicator_handle_t handle, uint8_t color_mode)
{
    esp_err_t err = ESP_OK;
    esp_matter_attr_val_t val = {};

    switch ((ColorControl::ColorMode)color_mode) {
    case ColorControl::ColorMode::kCurrentHueAndCurrentSaturation: {
        err = attribute::get_val(light_endpoint_id, ColorControl::Id, CurrentHue::Id, &val);
        if (err != ESP_OK) {
            return err;
        }
        err |= app_driver_light_set_hue(handle, &val);

        val = {};
        err = attribute::get_val(light_endpoint_id, ColorControl::Id, CurrentSaturation::Id, &val);
        if (err != ESP_OK) {
            return err;
        }
        err |= app_driver_light_set_saturation(handle, &val);
        return err;
    }
    case ColorControl::ColorMode::kColorTemperature: {
        err = attribute::get_val(light_endpoint_id, ColorControl::Id, ColorTemperatureMireds::Id, &val);
        if (err != ESP_OK) {
            return err;
        }
        return app_driver_light_set_temperature(handle, &val);
    }
    default: {
        ESP_LOGE(TAG, "Color mode %u is not supported", color_mode);
        return ESP_ERR_NOT_SUPPORTED;
    }
    }
}

static void app_driver_button_toggle_cb(void *arg, void *data)
{
    ESP_LOGI(TAG, "Toggle button pressed");
    uint16_t endpoint_id = light_endpoint_id;
    uint32_t cluster_id = OnOff::Id;
    uint32_t attribute_id = OnOff::Attributes::OnOff::Id;

    attribute_t *attribute = attribute::get(endpoint_id, cluster_id, attribute_id);

    esp_matter_attr_val_t val;
    attribute::get_val(attribute, &val);
    val.val.b = !val.val.b;
    attribute::update(endpoint_id, cluster_id, attribute_id, &val);
}

esp_err_t app_driver_attribute_update(app_driver_handle_t driver_handle, uint16_t endpoint_id, uint32_t cluster_id,
                                      uint32_t attribute_id, esp_matter_attr_val_t *val)
{
    esp_err_t err = ESP_OK;
    if (endpoint_id == light_endpoint_id) {
        led_indicator_handle_t handle = (led_indicator_handle_t)driver_handle;
        if (cluster_id == OnOff::Id) {
            if (attribute_id == OnOff::Attributes::OnOff::Id) {
                err = app_driver_light_set_power(handle, val);
            }
        } else if (cluster_id == LevelControl::Id) {
            if (attribute_id == LevelControl::Attributes::CurrentLevel::Id) {
                err = app_driver_light_set_brightness(handle, val);
            }
        } else if (cluster_id == ColorControl::Id) {
            // Reapply cached color attributes because a mode switch may not change
            // their values.
            if (attribute_id == ColorControl::Attributes::ColorMode::Id) {
                err = app_driver_light_apply_color_mode(handle, val->val.u8);
            } else if (attribute_id == ColorControl::Attributes::CurrentHue::Id) {
                err = app_driver_light_set_hue(handle, val);
            } else if (attribute_id == ColorControl::Attributes::CurrentSaturation::Id) {
                err = app_driver_light_set_saturation(handle, val);
            } else if (attribute_id == ColorControl::Attributes::ColorTemperatureMireds::Id) {
                err = app_driver_light_set_temperature(handle, val);
            }
        }
    }
    return err;
}

esp_err_t app_driver_light_set_defaults(uint16_t endpoint_id)
{
    esp_err_t err = ESP_OK;
    void *priv_data = endpoint::get_priv_data(endpoint_id);
    led_indicator_handle_t handle = (led_indicator_handle_t)priv_data;
    esp_matter_attr_val_t val;

    /* Setting brightness */
    attribute_t *attribute = attribute::get(endpoint_id, LevelControl::Id, LevelControl::Attributes::CurrentLevel::Id);
    attribute::get_val(attribute, &val);
    err |= app_driver_light_set_brightness(handle, &val);

    /* Setting color */
    attribute = attribute::get(endpoint_id, ColorControl::Id, ColorControl::Attributes::ColorMode::Id);
    attribute::get_val(attribute, &val);
    err |= app_driver_light_apply_color_mode(handle, val.val.u8);

    /* Setting power */
    attribute = attribute::get(endpoint_id, OnOff::Id, OnOff::Attributes::OnOff::Id);
    attribute::get_val(attribute, &val);
    err |= app_driver_light_set_power(handle, &val);

    return err;
}

app_driver_handle_t app_driver_light_init()
{
#if CONFIG_BSP_LEDS_NUM > 0
    /* Initialize led */
    led_indicator_handle_t leds[CONFIG_BSP_LEDS_NUM];
    ESP_ERROR_CHECK(bsp_led_indicator_create(leds, NULL, CONFIG_BSP_LEDS_NUM));
    led_indicator_set_hsv(leds[0], SET_HSV(DEFAULT_HUE, DEFAULT_SATURATION, DEFAULT_BRIGHTNESS));

    return (app_driver_handle_t)leds[0];
#else
    return NULL;
#endif
}

app_driver_handle_t app_driver_button_init()
{
    /* Initialize button */
    button_handle_t btns[BSP_BUTTON_NUM];
    ESP_ERROR_CHECK(bsp_iot_button_create(btns, NULL, BSP_BUTTON_NUM));
    ESP_ERROR_CHECK(iot_button_register_cb(btns[0], BUTTON_PRESS_DOWN, NULL, app_driver_button_toggle_cb, NULL));

    return (app_driver_handle_t)btns[0];
}
