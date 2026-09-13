#pragma once

#if defined(ESP32)
// Переопределение макросов для ESP32 в async-mqtt-client
// Библиотека определяет их в AsyncMqttClient.hpp, но они могут быть не видны в .cpp файле
// Проблема: SEMAPHORE_TAKE вызывается как с параметром (SEMAPHORE_TAKE(false)), так и без (SEMAPHORE_TAKE())
// Используем вариативные макросы для поддержки обоих случаев

// Включаем заголовок FreeRTOS для типов
#include <freertos/semphr.h>

// Переопределяем макросы до включения библиотеки
// Используем вариативные макросы для поддержки вызова с параметром и без
#define SEMAPHORE_TAKE(...) \
  SEMAPHORE_TAKE_IMPL(__VA_ARGS__)

// Вспомогательные макросы для обработки с параметром и без
#define SEMAPHORE_TAKE_IMPL(...) \
  SEMAPHORE_TAKE_SELECT(__VA_ARGS__, SEMAPHORE_TAKE_WITH_ARG, SEMAPHORE_TAKE_NO_ARG)(__VA_ARGS__)

#define SEMAPHORE_TAKE_SELECT(_1, _2, _3, ...) _3
#define SEMAPHORE_TAKE_WITH_ARG(arg) \
  do { \
    extern SemaphoreHandle_t _xSemaphore; \
    if (_xSemaphore != NULL) { \
      if (xSemaphoreTake(_xSemaphore, 1000 / portTICK_PERIOD_MS) != pdTRUE) { \
        return arg; \
      } \
    } \
  } while(0)

#define SEMAPHORE_TAKE_NO_ARG() \
  do { \
    extern SemaphoreHandle_t _xSemaphore; \
    if (_xSemaphore != NULL) { \
      if (xSemaphoreTake(_xSemaphore, 1000 / portTICK_PERIOD_MS) != pdTRUE) { \
        return; \
      } \
    } \
  } while(0)

#define SEMAPHORE_GIVE() \
  do { \
    extern SemaphoreHandle_t _xSemaphore; \
    if (_xSemaphore != NULL) { \
      xSemaphoreGive(_xSemaphore); \
    } \
  } while(0)
#endif

