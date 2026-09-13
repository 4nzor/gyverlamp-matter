#include "status_led.h"

#include "esp_log.h"
#include "led_strip.h"
#include "sdkconfig.h"

static const char *TAG = "status_led";

static led_strip_handle_t s_strip;
static int s_blink;
static int s_celebrate; /* remaining ticks: 6 = 3 green flashes */
static bool s_offline = true;

esp_err_t status_led_init(void)
{
    led_strip_config_t strip_config = {
        .strip_gpio_num = CONFIG_STATUS_LED_GPIO,
        .max_leds = 1,
        .led_pixel_format = LED_PIXEL_FORMAT_GRB,
        .led_model = LED_MODEL_WS2812,
        .flags = { .invert_out = false },
    };
    led_strip_rmt_config_t rmt_config = {
        .clk_src = RMT_CLK_SRC_DEFAULT,
        .resolution_hz = 10 * 1000 * 1000,
        .mem_block_symbols = 64,
        .flags = { .with_dma = false },
    };

    esp_err_t err = led_strip_new_rmt_device(&strip_config, &rmt_config, &s_strip);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "led_strip init failed: %s", esp_err_to_name(err));
        return err;
    }
    led_strip_clear(s_strip);
    ESP_LOGI(TAG, "WS2812 on GPIO %d", CONFIG_STATUS_LED_GPIO);
    return ESP_OK;
}

static void set_rgb(uint8_t r, uint8_t g, uint8_t b)
{
    if (!s_strip) {
        return;
    }
    led_strip_set_pixel(s_strip, 0, r, g, b);
    led_strip_refresh(s_strip);
}

void status_led_set_offline(void)
{
    s_offline = true;
    s_celebrate = 0;
}

void status_led_celebrate_online(void)
{
    s_offline = false;
    s_celebrate = 6; /* on,off,on,off,on,off */
    s_blink = 0;
}

bool status_led_busy(void)
{
    return s_celebrate > 0;
}

void status_led_tick(void)
{
    if (!s_strip) {
        return;
    }

    if (s_celebrate > 0) {
        if ((s_celebrate % 2) == 0) {
            set_rgb(0, 255, 0);
        } else {
            set_rgb(0, 0, 0);
        }
        s_celebrate--;
        if (s_celebrate == 0) {
            set_rgb(0x40, 0x40, 0x40); /* dim idle */
        }
        return;
    }

    if (!s_offline) {
        return;
    }

    s_blink = (s_blink + 1) % 4;
    if (s_blink < 2) {
        set_rgb(0xFF, 0x66, 0x00);
    } else {
        set_rgb(0, 0, 0);
    }
}
