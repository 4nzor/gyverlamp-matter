<div align="center">

# 💡 GyverLamp + Matter

**«Алиса, включи лампу». «Привет, Siri, сделай потеплее».**
Лампа Gyver в **Яндекс Алисе** и **Apple Home** — без Home Assistant, без облаков и самописных навыков.

[![Matter](https://img.shields.io/badge/Matter-000000?style=for-the-badge&logo=matter&logoColor=white)](https://csa-iot.org/all-solutions/matter/)
[![Yandex Alice](https://img.shields.io/badge/Яндекс%20Алиса-FC3F1D?style=for-the-badge)](https://alice.yandex.ru/)
[![Apple Home](https://img.shields.io/badge/Apple%20Home-000000?style=for-the-badge&logo=apple&logoColor=white)](https://www.apple.com/home-app/)
[![ESP32](https://img.shields.io/badge/ESP32--C6%20%7C%20S3%20%7C%20C3-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[English](README.en.md) · [Быстрый старт](#-быстрый-старт) · [Какой мост выбрать](#-какой-мост-выбрать) · [Сцены](#-сцены-и-эффекты) · [Веб-пульт](#-веб-пульт)

</div>

---

## ✨ Что получаешь

- 🗣 **Голос:** включение, яркость и цвет через Алису и Siri.
- 🍏 **Apple Home и «Дом с Алисой»:** одно Matter-устройство видят обе экосистемы и любые другие Matter-контроллеры.
- 🚫 **Без Home Assistant:** мост — одна плата ESP32.
- 🎨 **Сцены вместо 90 эффектов:** Алиса не умеет показывать названия эффектов Gyver, поэтому «цвет + яркость» превращаются в нужный `EFF` (таблица сцен правится в одном файле).
- 🧰 **Два моста на выбор:** с ESP-IDF и без него (Tasmota + Berry).
- 🌐 **Веб-пульт в комплекте:** управление из браузера, спектр с микрофона или звука вкладки на матрице.

## 🧩 Как это работает

```mermaid
flowchart LR
    A["🗣 Алиса<br/>Apple Home"] -- Matter --> B["📡 Мост<br/>ESP32-C6 / S3"]
    B -- "UDP :8888" --> C["💡 Лампа<br/>ESP32-C3 + 16×16"]
```

Мост показывается контроллерам как Matter-лампа (Extended Color Light, цвет по Hue/Saturation) и переводит команды в протокол Gyver: `P_ON`, `P_OFF`, `BRI`, `SPD`, `EFF`.

## 📦 Что в репозитории

| Папка | Зачем |
|:------|:------|
| [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) | Прошивка лампы (ESP32‑C3 + WS2812B) |
| [`matter-bridge/`](matter-bridge/) | Мост на **esp-matter** (ESP-IDF) |
| [`tasmota-bridge/`](tasmota-bridge/) | Мост на **Tasmota + Berry** (без IDF) |
| [`web/`](web/) | Веб-пульт: UDP через прокси или WebSocket `:81` |

## 🔀 Какой мост выбрать

| | 🟢 [Tasmota](tasmota-bridge/README.md) | 🔵 [esp-matter](matter-bridge/README.md) |
|:--|:--|:--|
| Нужен ESP-IDF | нет | да (v5.5.x) |
| Как ставить | прошил Tasmota → залил `autoexec.be` | сборка и прошивка через IDF |
| Таблица сцен | — | ✅ `gyver_scenes.c` |
| Править мост на C++ | — | ✅ |
| Для кого | быстрый старт | кастомизация |

> Не получается с ESP-IDF — бери Tasmota.

## 🚀 Быстрый старт

1. **Собери лампу.** Матрица 16×16 на ESP32‑C3. Прошей [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) из Arduino IDE (имя папки = имя `.ino`). Data → `LED_PIN` в `Constants.h` (по умолчанию **4**). Питание матрицы — от БП **5 В / 3–5 А**, не от USB платы.
2. **Пропиши Wi‑Fi лампы.**
   ```bash
   cp secrets.env.example secrets.env   # впиши SSID и пароль
   ./scripts/apply_secrets.sh           # создаст wifi_secrets.h (в git не попадает)
   ```
3. **Прошей мост** по инструкции: [Tasmota](tasmota-bridge/README.md) или [esp-matter](matter-bridge/README.md).
4. **Добавь в Алису или Apple Home.** Лампа и мост — в одной сети **2.4 ГГц**. Отсканируй QR [`matter-bridge/matter-qr.png`](matter-bridge/matter-qr.png). Для Apple Home нужен хаб: HomePod, Apple TV или iPad.

Wi‑Fi для моста приходит при pairing, не прописывай CHIP `DEFAULT_WIFI_*` вручную.

> [!IMPORTANT]
> **Транспорт лампы.** Его задаёт `LAMP_NET_MODE` в `lamp/gunner47_v2.87in1/Constants.h`. В этом дереве стоит `1U` (WebSocket `ws://<ip>:81`). Для Matter, Алисы, Apple Home и приложения Gyver поставь **`0U`** — это возвращает UDP `:8888`.

<details>
<summary><b>🔑 Коды pairing (демо esp-matter)</b></summary>

| | |
|:--|:--|
| Manual code | `3497-011-2332` |
| PIN | `20202021` |
| QR payload | `MT:Y.K9042C00KA0648G00` |

Обычный `flash` **без** `erase-flash` сохраняет Matter fabric, заново добавлять лампу не придётся.

</details>

## 🎨 Сцены и эффекты

Контроллеры не показывают ~90 эффектов Gyver. Обход: **цвет + яркость → эффект**. Мост сам выбирает `EFF` и `SPD`.

| Сценарий | Что задать |
|:---------|:-----------|
| 🌙 «Ночь» | оттенок ≈ **220°**, яркость **20%**, включить |

- Таблица сцен: [`ALICE_SCENES.md`](matter-bridge/ALICE_SCENES.md) · [EN](matter-bridge/ALICE_SCENES.en.md)
- Правка: [`matter-bridge/main/gyver_scenes.c`](matter-bridge/main/gyver_scenes.c)

## 🖥 Веб-пульт

```bash
cd web
python3 -m http.server 8765
# открой http://localhost:8765/web_control.html
```

- Адрес по умолчанию — `gyverlamp.lan`, транспорт **WebSocket** (`ws://gyverlamp.lan:81`).
- Микрофон и звук вкладки рисуют спектр на матрице.
- Для UDP запусти `python3 web_proxy.py` и поставь `LAMP_NET_MODE 0U` на лампе.
- Открывай страницу с `http://localhost`: из файла (`file://`) браузер не отдаёт микрофон.

## 🛒 Комплектующие

Ссылки на Ozon могут устареть — ориентируйся по названию.

| | |
|:--|:--|
| Матрица | [WS2812B 16×16](https://www.ozon.ru/product/ws2812b-led-rgb-gibkaya-pikselnaya-panel-16x16-modul-matrichnyy-ekran-3679643255/) |
| Корпус | [Корпус лампы (Type‑C)](https://www.ozon.ru/product/korpus-lampy-dlya-samostoyatelnoy-sborki-s-type-c-razemom-1231390974/) |
| Лампа | [ESP32‑C3](https://www.ozon.ru/product/maketnaya-plata-esp32-c3-maketnaya-plata-esp32-wifi-bluetooth-3677061352/) |
| Мост | [ESP32‑C6 Super Mini](https://www.ozon.ru/product/esp32-c6-super-mini-maketnaya-plata-obuchayushchaya-pla-3800644524/) |

<sub>Почему отдельная прошивка под C3 (RISC‑V, FastLED): классический gunner47 под Xtensa на C3 не собирается как надо, в `lamp/gunner47_v2.87in1/` лежит адаптированная линия. Подробности — `PATCH_FASTLED.md` и `UPDATE_FASTLED.md` рядом со скетчем.</sub>

## 🛠 Если что-то не так

| Симптом | Что проверить |
|:--------|:--------------|
| Алиса отклоняет устройство | Basic Info / SerialNumber; после смены DAC/PIN — erase + заново |
| Только температура, нет цвета | нужна HueSaturation (уже есть в этом репо) |
| Мост online, лампа молчит | одна Wi‑Fi; `ESP_MODE=1` + secrets; порт **8888**; `LAMP_NET_MODE 0U` |
| После каждой прошивки — заново pairing | не делай `erase-flash` без нужды |
| Матрица мигает / тусклая | слабый БП 5 В; не питай матрицу с 3V3 |

Подробнее: [`matter-bridge/README.md`](matter-bridge/README.md), [`tasmota-bridge/README.md`](tasmota-bridge/README.md).

## 🤝 Лицензия и благодарности

Код репозитория (мост, документация, доработки) — [MIT](LICENSE), © 2026 Anzor Magomedov.

База лампы — **gunner47 / [GyverLamp](https://github.com/AlexGyver/GyverLamp)**. У `esp-matter` и прочих зависимостей свои лицензии.

## 🤖 Для ИИ-агентов

[`llms.txt`](llms.txt) · [`llms.ru.txt`](llms.ru.txt) · [`AGENTS.md`](AGENTS.md) · [`AGENTS.ru.md`](AGENTS.ru.md)
