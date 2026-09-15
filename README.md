# GyverLamp + Matter

[English](README.en.md)

[![Matter](https://img.shields.io/badge/Matter-000000?style=flat-square&logo=matter&logoColor=white)](https://csa-iot.org/all-solutions/matter/)
[![Yandex Alice](https://img.shields.io/badge/Yandex%20Alice-FC3F1D?style=flat-square)](https://alice.yandex.ru/)
[![Apple Home](https://img.shields.io/badge/Apple%20Home-000000?style=flat-square&logo=apple&logoColor=white)](https://www.apple.com/home-app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

Лампа Gyver в **Алисе** и **Apple Home** по Matter — без Home Assistant.  
Мост на ESP32‑C6/S3 шлёт команды на лампу по UDP `:8888`. Прошивка лампы — **gunner47** (ESP32‑C3).

```
Алиса / Apple Home ──Matter──► ESP32‑C6 (мост) ──UDP :8888──► лампа (ESP32‑C3 + 16×16)
```

## Что в репозитории

| Папка | Зачем |
|:------|:------|
| [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) | Прошивка лампы (ESP32‑C3 + WS2812B) |
| [`matter-bridge/`](matter-bridge/) | Мост **esp-matter** (ESP-IDF) |
| [`tasmota-bridge/`](tasmota-bridge/) | Мост **Tasmota** + Berry (без IDF) |

## Какой мост выбрать

| | Когда брать |
|:--|:------------|
| **[Tasmota](tasmota-bridge/)** | Быстрый старт без ESP-IDF: прошил → залил `autoexec.be` |
| **[esp-matter](matter-bridge/)** | Таблица сцен и правки моста на C++ (IDF v5.5.x) |

## Быстрый старт

1. **Лампа** — собери матрицу 16×16 на ESP32‑C3 и прошей [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) в Arduino IDE (имя папки = имя `.ino`). Data → `LED_PIN` в `Constants.h` (по умолчанию **4**), питание матрицы с БП **5 В / 3–5 А**, не с USB платы.
2. **Wi‑Fi лампы** — `cp secrets.env.example secrets.env`, заполни SSID/пароль, запусти `./scripts/apply_secrets.sh`. Появится `wifi_secrets.h` (не в git).
3. **Мост** — прошей по инструкции [Tasmota](tasmota-bridge/README.md) или [esp-matter](matter-bridge/README.md).
4. **Пара** — лампа и мост в одной сети **2.4 ГГц**. Добавь устройство по QR [`matter-bridge/matter-qr.png`](matter-bridge/matter-qr.png) в «Дом с Алисой» или Apple Home (нужен хаб: HomePod / Apple TV / iPad).

Wi‑Fi для моста обычно приходит при pairing — не прописывай CHIP `DEFAULT_WIFI_*` вручную.

### Коды pairing (esp-matter demo)

| | |
|:--|:--|
| Manual code | `3497-011-2332` |
| PIN | `20202021` |
| QR payload | `MT:Y.K9042C00KA0648G00` |

Обычный `flash` **без** `erase-flash` сохраняет Matter fabric.

## Комплектующие

Ссылки на Ozon могут устареть — ориентируйся по названию.

| | |
|:--|:--|
| Матрица | [WS2812B 16×16](https://www.ozon.ru/product/ws2812b-led-rgb-gibkaya-pikselnaya-panel-16x16-modul-matrichnyy-ekran-3679643255/) |
| Корпус | [Корпус лампы (Type‑C)](https://www.ozon.ru/product/korpus-lampy-dlya-samostoyatelnoy-sborki-s-type-c-razemom-1231390974/) |
| Лампа | [ESP32‑C3](https://www.ozon.ru/product/maketnaya-plata-esp32-c3-maketnaya-plata-esp32-wifi-bluetooth-3677061352/) |
| Мост | [ESP32‑C6 Super Mini](https://www.ozon.ru/product/esp32-c6-super-mini-maketnaya-plata-obuchayushchaya-pla-3800644524/) |

Почему отдельная прошивка под C3 (RISC‑V, FastLED): кратко — классический gunner47 под Xtensa на C3 не собирается как надо; в `lamp/gunner47_v2.87in1/` уже адаптированная линия. Подробности — в заметках рядом со скетчем (`PATCH_FASTLED.md` / `UPDATE_FASTLED.md`).

## Сцены и эффекты

Алиса не показывает ~90 эффектов Gyver. Обход: сценарий = **цвет + яркость** → мост выбирает `EFF` / `SPD`.

- Таблица: [`ALICE_SCENES.md`](matter-bridge/ALICE_SCENES.md) · [EN](matter-bridge/ALICE_SCENES.en.md)
- Правка: `matter-bridge/main/gyver_scenes.c`

Пример «Ночь»: hue ≈ **220°**, яркость **20%**, включить.

## Если что-то не так

| Симптом | Что проверить |
|:--------|:--------------|
| Алиса отклоняет устройство | Basic Info / SerialNumber; после смены DAC/PIN — erase + заново |
| Только температура, нет цвета | нужна HueSaturation (уже в этом репо) |
| Мост online, лампа молчит | одна Wi‑Fi; `ESP_MODE=1` + secrets; порт **8888** |
| После каждой прошивки — заново pairing | не делай `erase-flash` без нужды |
| Матрица мигает / тусклая | слабый БП 5 В; не питай матрицу с 3V3 |

Подробнее по мостам: [`matter-bridge/README.md`](matter-bridge/README.md), [`tasmota-bridge/README.md`](tasmota-bridge/README.md).

## Лицензия и благодарности

Код репозитория (мост, документация и доработки) — [MIT](LICENSE), © 2026 Anzor Magomedov.

База лампы — **gunner47 / [GyverLamp](https://github.com/AlexGyver/GyverLamp)**; у `esp-matter` и прочих зависимостей — свои лицензии.

## Для ИИ-агентов

[`llms.txt`](llms.txt) · [`llms.ru.txt`](llms.ru.txt) · [`AGENTS.md`](AGENTS.md) · [`AGENTS.ru.md`](AGENTS.ru.md)
