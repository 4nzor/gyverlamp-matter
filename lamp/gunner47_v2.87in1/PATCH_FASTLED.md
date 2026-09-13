# ПАТЧИ FASTLED ДЛЯ ESP32-C3

## ✅ ПАТЧИ УЖЕ ПРИМЕНЕНЫ АВТОМАТИЧЕСКИ

Все необходимые патчи для ESP32-C3 уже применены к библиотеке FastLED.

## Список примененных патчей:

### 1. Патч `esp_intr.h` → `esp_intr_alloc.h`
   - **Файл**: `platforms/esp/32/clockless_rmt_esp32.h` (строка 95)
   - **Файл**: `platforms/esp/32/clockless_i2s_esp32.h` (строка 106)
   - **Проблема**: ESP-IDF 5.0+ удалил `esp_intr.h`, заменил на `esp_intr_alloc.h`
   - **Решение**: Заменено `#include "esp_intr.h"` на `#include "esp_intr_alloc.h"`

### 2. Патч `avr/pgmspace.h` → `pgmspace.h` для ESP32
   - **Файл**: `fastled_progmem.h` (строка 30)
   - **Проблема**: ESP32-C3 не имеет `avr/pgmspace.h` (это только для AVR микроконтроллеров)
   - **Решение**: Добавлена условная компиляция:
     ```cpp
     #if defined(ESP32) || defined(ESP8266)
       #include <pgmspace.h>
     #elif defined(__AVR__)
       #include <avr/pgmspace.h>
     #endif
     ```

### 3. Патч `fastpin_esp32.h` для ESP32-C3
   - **Файл**: `platforms/esp/32/fastpin_esp32.h`
   - **Проблема**: ESP32-C3 имеет другую архитектуру (RISC-V) и не поддерживает прямые регистры GPIO как ESP32 (Xtensa)
   - **Решение**: Добавлена условная компиляция для ESP32-C3, использующая стандартные функции `digitalWrite()`/`digitalRead()` вместо прямых регистров `GPIO.out`

### 4. Создан программный драйвер для ESP32-C3
   - **Файл**: `platforms/esp/32/clockless_esp32c3.h` (новый файл)
   - **Файл**: `platforms/esp/32/fastled_esp32.h` (изменен)
   - **Проблема**: I2S и RMT API несовместимы с ESP32-C3 (другая архитектура RISC-V)
   - **Решение**: Создан специальный программный драйвер (bit-banging) для ESP32-C3, который использует стандартные функции GPIO вместо аппаратных методов

## Если нужно применить патчи вручную:

### Патч 1: esp_intr.h
1. Откройте: `Arduino/libraries/FastLED/platforms/esp/32/clockless_rmt_esp32.h`
2. Строка 95: замените `#include "esp_intr.h"` на `#include "esp_intr_alloc.h"`
3. Откройте: `Arduino/libraries/FastLED/platforms/esp/32/clockless_i2s_esp32.h`
4. Строка 106: замените `#include "esp_intr.h"` на `#include "esp_intr_alloc.h"`

### Патч 2: avr/pgmspace.h
1. Откройте: `Arduino/libraries/FastLED/fastled_progmem.h`
2. Строка 30: замените:
   ```cpp
   #include <avr/pgmspace.h>
   ```
   на:
   ```cpp
   #if defined(ESP32) || defined(ESP8266)
     #include <pgmspace.h>
   #elif defined(__AVR__)
     #include <avr/pgmspace.h>
   #endif
   ```

## Проверка

После применения патчей попробуйте скомпилировать проект. Ошибки должны исчезнуть.

