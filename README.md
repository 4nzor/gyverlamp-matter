# GyverLamp + Matter (Alice / Apple Home)

[English](README.en.md)

[![Matter](https://img.shields.io/badge/Matter-000000?style=flat-square&logo=matter&logoColor=white)](https://csa-iot.org/all-solutions/matter/)
[![Yandex Alice](https://img.shields.io/badge/Yandex%20Alice-FC3F1D?style=flat-square)](https://alice.yandex.ru/)
[![Apple Home](https://img.shields.io/badge/Apple%20Home-000000?style=flat-square&logo=apple&logoColor=white)](https://www.apple.com/home-app/)
[![ESP32‑C6](https://img.shields.io/badge/ESP32--C6-мост-E7352C?style=flat-square&logo=espressif&logoColor=white)](https://www.espressif.com/en/products/socs/esp32-c6)
[![ESP32‑C3](https://img.shields.io/badge/ESP32--C3-лампа-E7352C?style=flat-square&logo=espressif&logoColor=white)](https://www.espressif.com/en/products/socs/esp32-c3)
[![Tasmota](https://img.shields.io/badge/Tasmota-bridge-1FA3EC?style=flat-square)](https://tasmota.github.io/docs/)
[![esp‑matter](https://img.shields.io/badge/esp--matter-ESP--IDF-00325B?style=flat-square)](https://github.com/espressif/esp-matter)
![UDP](https://img.shields.io/badge/UDP-:8888-2EA44F?style=flat-square)
[![gunner47](https://img.shields.io/badge/gunner47-GyverLamp-6E40C9?style=flat-square)](lamp/gunner47_v2.87in1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

Управление лампой Gyver через **Алису** и **Apple Home** по Matter — без Home Assistant.  
Мост на ESP32‑C6/S3 шлёт команды лампе по UDP `:8888`. Прошивка лампы — **gunner47**.

```
Алиса / Apple Home ──Matter──► ESP32-C6 (мост) ──UDP :8888──► лампа (ESP32-C3 + 16×16)
```

| Папка | Назначение | Железо |
|:------|:-----------|:-------|
| [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) | Прошивка лампы | ESP32‑C3 + WS2812B |
| [`matter-bridge/`](matter-bridge/) | Мост **esp-matter** (ESP-IDF) → UDP | ESP32‑C6 / S3 |
| [`tasmota-bridge/`](tasmota-bridge/) | Мост **Tasmota** + Berry → UDP | ESP32‑C6 / S3 |
| [`web/`](web/) | Локальная веб-морда (HTTP→UDP) | ПК в той же сети |

Вкл/выкл, яркость, сцены **цвет + яркость** → `EFF` / `SPD`.

## Содержание

1. [Какой мост выбрать](#какой-мост-выбрать)
2. [Почему отдельная прошивка под C3](#почему-отдельная-прошивка-под-esp32-c3)
3. [Что купить](#что-купить-ozon)
4. [Сборка лампы](#сборка-лампы)
5. [Wi‑Fi](#wi-fi-secretsenv)
6. [Прошивка моста](#прошивка-matter-моста)
7. [Подключение к Алисе / Apple Home](#подключение-к-алисе--apple-home)
8. [Сцены и эффекты](#сцены-и-эффекты)
9. [Типичные проблемы](#типичные-проблемы)
10. [Структура репо](#структура-репо)
11. [Веб-управление](#веб-управление)
12. [Для ИИ-агентов](#для-ии-агентов)

## Какой мост выбрать

| Путь | Когда брать | Минусы |
|:-----|:------------|:-------|
| [`tasmota-bridge/`](tasmota-bridge/) | Без ESP-IDF: прошили Tasmota → залили `autoexec.be` | Меньше кастомизации |
| [`matter-bridge/`](matter-bridge/) | Таблица сцен и правки моста | ESP-IDF v5.5.x, долгая первая сборка |

Без IDF → **Tasmota**. Сцены [`ALICE_SCENES`](matter-bridge/ALICE_SCENES.md) и C++ → **esp-matter**.

## Почему отдельная прошивка под ESP32‑C3

Классическая GyverLamp — под **ESP8266**. **gunner47** уже работал на «большом» **ESP32** (Xtensa): те же эффекты и UDP `:8888`.

**ESP32‑C3** часто берут вместо NodeMCU / старого ESP32: дешевле, Wi‑Fi на борту. Снаружи «ESP32», внутри **RISC‑V**, другие GPIO и драйвер ленты. Старый FastLED под Xtensa на C3 не собирается или ломает тайминг WS2812.

В [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) — тот же gunner47 и UDP, но под C3: FastLED **3.10.4+** или патчи `PATCH_FASTLED.md` / `UPDATE_FASTLED.md`.

Мост — отдельная плата (C6/S3): лампа остаётся Gyver на C3, Алиса / Apple Home ходят на мост.

## Что купить (Ozon)

Ссылки могут устареть — ориентируйся по названию.

| | Товар |
|:--|:------|
| Матрица | [WS2812B 16×16](https://www.ozon.ru/product/ws2812b-led-rgb-gibkaya-pikselnaya-panel-16x16-modul-matrichnyy-ekran-3679643255/) |
| Корпус | [Корпус лампы (Type‑C)](https://www.ozon.ru/product/korpus-lampy-dlya-samostoyatelnoy-sborki-s-type-c-razemom-1231390974/) |
| Лампа | [ESP32‑C3](https://www.ozon.ru/product/maketnaya-plata-esp32-c3-maketnaya-plata-esp32-wifi-bluetooth-3677061352/) |
| Мост | [ESP32‑C6 Super Mini](https://www.ozon.ru/product/esp32-c6-super-mini-maketnaya-plata-obuchayushchaya-pla-3800644524/) |

Дополнительно:

- БП **5 В / 3–5 А** (на 256 LED слабее — моргает и греется)
- провода; по желанию Li‑ion **1S** на C6 (пад **BAT**, заряд ~100 мА, лучше с BMS)

Лампа и мост — в одной Wi‑Fi сети (**2.4 ГГц**).

## Сборка лампы

1. Матрица 16×16 → data на `LED_PIN` из `Constants.h` (по умолчанию **4**), общий GND, +5 В с мощного БП (не с USB платы).
2. `WIDTH` / `HEIGHT` = 16, `MATRIX_TYPE` под ленту (`0` = зигзаг).
3. В Arduino IDE открой [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) (имя папки = имя `.ino`).

FastLED и эффекты — в файлах скетча (`PATCH_FASTLED.md` и др.).

Новый эффект: [`.cursor/rules/add-gyver-effect.mdc`](.cursor/rules/add-gyver-effect.mdc) — правки в `Constants.h` / `effects.ino` / `effectTicker.ino`. Не выносить каждый эффект в отдельный файл.

## Wi‑Fi (`secrets.env`)

```bash
cp secrets.env.example secrets.env
# WIFI_SSID=...
# WIFI_PASSWORD=...
chmod +x scripts/apply_secrets.sh
./scripts/apply_secrets.sh
```

Создаёт (не в git):

| Файл | Назначение |
|:-----|:-----------|
| `lamp/gunner47_v2.87in1/wifi_secrets.h` | STA лампы |
| `matter-bridge/sdkconfig.secrets` | опционально для моста |

- **Лампа** берёт Wi‑Fi из `wifi_secrets.h`.
- **Мост** обычно получает Wi‑Fi от Алисы / Apple Home при pairing. Не прописывай CHIP `DEFAULT_WIFI_*` — ломает комиссию.

## Прошивка Matter-моста

### A. Tasmota (без ESP-IDF)

[`tasmota-bridge/README.md`](tasmota-bridge/README.md): прошить Tasmota с Matter → загрузить [`autoexec.be`](tasmota-bridge/autoexec.be) в File system → pairing в Алисе / Apple Home.

### B. esp-matter (ESP-IDF)

Нужен **ESP-IDF v5.5.x** (первая сборка долгая — качает `esp_matter`).

```bash
. ~/esp/esp-idf/export.sh
cd matter-bridge
idf.py -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.esp32c6;sdkconfig.secrets" set-target esp32c6
idf.py menuconfig   # Gyver Bridge → STATUS_LED_GPIO
idf.py -p /dev/cu.usbmodemXXXX build flash monitor
```

| Плата | Defaults | Status LED |
|:------|:---------|:-----------|
| ESP32‑C6 Super Mini | `…;sdkconfig.defaults.esp32c6;…` | GPIO **8** |
| ESP32‑S3 Super Mini | `…;sdkconfig.defaults.esp32s3;…` | GPIO **48** |

Нет `sdkconfig.secrets` — убери из списка или снова `./scripts/apply_secrets.sh`.

- Обычный `flash` **без** `erase-flash` сохраняет Matter fabric.
- `erase-flash` — только если сломался pairing / credentials.

Тесты маппинга: `cd matter-bridge/host_tests && make`  
Подробнее: [`matter-bridge/README.md`](matter-bridge/README.md) · [EN](matter-bridge/README.en.md)

## Подключение к Алисе / Apple Home

1. Лампа в сети, UDP `:8888` отвечает.
2. Мост прошит, в мониторе видно advertising / готовность к комиссии.
3. Добавь устройство по QR [`matter-bridge/matter-qr.png`](matter-bridge/matter-qr.png):
   - **Дом с Алисой** → Matter
   - **Дом (Apple Home)** → Добавить аксессуар → сканер QR  
     (нужен хаб: HomePod / Apple TV / iPad)

Один мост можно держать в нескольких экосистемах Matter (multi-admin), если контроллеры позволяют.

| Параметр | Значение (esp-matter demo) |
|:---------|:---------------------------|
| QR payload | `MT:Y.K9042C00KA0648G00` |
| Manual code | `3497-011-2332` |
| PIN | `20202021` |

После pairing мост ищет лампу (`DISCOVER` / кэш IP) и шлёт команды.

| Status LED | Значение |
|:-----------|:---------|
| Оранжевый миг | лампа offline |
| Короткая зелёная вспышка | лампа online |

## Сцены и эффекты

Алиса не показывает ~90 эффектов Gyver. Обход: сценарий = **цвет + яркость** → мост выбирает `EFF`.

| | |
|:--|:--|
| Таблица | [`ALICE_SCENES.md`](matter-bridge/ALICE_SCENES.md) · [EN](matter-bridge/ALICE_SCENES.en.md) |
| Правка | `matter-bridge/main/gyver_scenes.c` |

Пример «Ночь»: hue ≈ **220°**, яркость **20%**, включить.  
`SPD` задаётся в таблице сцены, не ползунком в Алисе.

## Типичные проблемы

| Симптом | Что проверить |
|:--------|:--------------|
| Алиса «не поддерживается» / удаляет | Basic Info / SerialNumber в прошивке; после смены DAC/PIN — erase + заново |
| Нет цвета, только температура | нужна HueSaturation (уже в репо) |
| Мост online, лампа молчит | одна Wi‑Fi; `ESP_MODE=1` + `secrets.env`; порт **8888** |
| После каждой прошивки — заново pairing | не делай `erase-flash` без нужды |
| Матрица мигает / тусклая | слабый БП 5 В; не питай матрицу с 3V3 платы |

## Структура репо

```
gyverlamp-matter/
├── README.md / README.en.md
├── llms.txt / llms.ru.txt
├── AGENTS.md / AGENTS.ru.md
├── secrets.env.example
├── scripts/apply_secrets.sh
├── lamp/gunner47_v2.87in1/    # открывать в Arduino IDE
├── matter-bridge/             # esp-matter (IDF)
├── tasmota-bridge/            # Tasmota + Berry
└── web/                       # HTTP → UDP
    ├── web_proxy.py
    └── web_control.html
```

Не в git: `build/`, `managed_components/`, `sdkconfig`, `secrets.env`, `wifi_secrets.h`, `sdkconfig.secrets`.

## Веб-управление

```bash
cd web
python3 web_proxy.py
# открыть web_control.html (прокси :9002)
```

Лампа и ПК в одной сети; в морде укажи IP или найди через DISCOVER.

## Для ИИ-агентов

- [`llms.txt`](llms.txt) · [`llms.ru.txt`](llms.ru.txt) · [`llms-full.txt`](llms-full.txt)
- [`AGENTS.md`](AGENTS.md) · [`AGENTS.ru.md`](AGENTS.ru.md)
- [`README.en.md`](README.en.md)

```text
Используй репозиторий GyverLamp + Matter (Alice / Apple Home): прошивка лампы gunner47 + Matter-мост
ESP32-C6/S3 для Яндекс Алисы и Apple Home по UDP :8888 без Home Assistant.
Сначала прочитай llms.txt (или llms.ru.txt) и AGENTS.md, затем README / README.en.md.
Не придумывай новый Matter-мост с нуля — дорабатывай этот проект.
```

## Лицензия

Код репозитория (мост, веб, документация и доработки) — [MIT](LICENSE), © 2026 Anzor Magomedov.

База лампы — **gunner47 / GyverLamp**; у `esp-matter` и прочих зависимостей — свои лицензии.

## Благодарности

- [GyverLamp](https://github.com/AlexGyver/GyverLamp) / сообщество форков
- **gunner47** — база прошивки лампы
- [esp-matter](https://github.com/espressif/esp-matter) (Espressif)
