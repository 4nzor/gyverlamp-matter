// Заглушка для esp_intr.h для ESP32-C3
// FastLED требует esp_intr.h, который был удален в новых версиях ESP-IDF
// Этот файл создает совместимость для ESP32-C3

#ifndef _ESP_INTR_FIX_H
#define _ESP_INTR_FIX_H

#if defined(ESP32) && (defined(CONFIG_IDF_TARGET_ESP32C3) || defined(ARDUINO_ESP32C3_DEV))

// Проверяем, существует ли esp_intr.h
#ifndef _ESP_INTR_H
#define _ESP_INTR_H

// Включаем новый заголовочный файл вместо старого
#include "esp_intr_alloc.h"

// Определяем константы, которые могут отсутствовать
#ifndef ESP_INTR_FLAG_IRAM
#define ESP_INTR_FLAG_IRAM (1<<0)
#endif

#ifndef ESP_INTR_FLAG_EDGE
#define ESP_INTR_FLAG_EDGE (1<<1)
#endif

#ifndef ESP_INTR_FLAG_LEVEL
#define ESP_INTR_FLAG_LEVEL (1<<2)
#endif

#ifndef ESP_INTR_FLAG_INTRDISABLED
#define ESP_INTR_FLAG_INTRDISABLED (1<<3)
#endif

// Типы, которые могут использоваться в FastLED
typedef void* intr_handle_t;

#endif // _ESP_INTR_H

#endif // ESP32-C3

#endif // _ESP_INTR_FIX_H

