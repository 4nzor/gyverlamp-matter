# GyverLamp + Matter

[Русский](README.md)

[![Matter](https://img.shields.io/badge/Matter-000000?style=flat-square&logo=matter&logoColor=white)](https://csa-iot.org/all-solutions/matter/)
[![Yandex Alice](https://img.shields.io/badge/Yandex%20Alice-FC3F1D?style=flat-square)](https://alice.yandex.ru/)
[![Apple Home](https://img.shields.io/badge/Apple%20Home-000000?style=flat-square&logo=apple&logoColor=white)](https://www.apple.com/home-app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

A Gyver lamp in **Yandex Alice** and **Apple Home** over Matter — no Home Assistant.  
An ESP32‑C6/S3 bridge talks to the lamp on UDP `:8888`. Lamp firmware is **gunner47** (ESP32‑C3).

```
Alice / Apple Home ──Matter──► ESP32‑C6 (bridge) ──UDP :8888──► lamp (ESP32‑C3 + 16×16)
```

## What's in the repo

| Path | Role |
|:-----|:-----|
| [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) | Lamp firmware (ESP32‑C3 + WS2812B) |
| [`matter-bridge/`](matter-bridge/) | **esp-matter** bridge (ESP-IDF) |
| [`tasmota-bridge/`](tasmota-bridge/) | **Tasmota** + Berry bridge (no IDF) |

## Which bridge?

| | When to use |
|:--|:------------|
| **[Tasmota](tasmota-bridge/)** | Fast path without ESP-IDF: flash → upload `autoexec.be` |
| **[esp-matter](matter-bridge/)** | Scene table and C++ bridge work (IDF v5.5.x) |

## Quick start

1. **Lamp** — build a 16×16 matrix on ESP32‑C3 and flash [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) from Arduino IDE (folder name must match `.ino`). Data → `LED_PIN` in `Constants.h` (default **4**); power the matrix from a **5 V / 3–5 A** PSU, not board USB.
2. **Lamp Wi‑Fi** — `cp secrets.env.example secrets.env`, fill SSID/password, run `./scripts/apply_secrets.sh`. Creates gitignored `wifi_secrets.h`.
3. **Bridge** — follow [Tasmota](tasmota-bridge/README.en.md) or [esp-matter](matter-bridge/README.en.md).
4. **Pair** — lamp and bridge on the same **2.4 GHz** network. Add the device via QR [`matter-bridge/matter-qr.png`](matter-bridge/matter-qr.png) in Home with Alice or Apple Home (needs a hub: HomePod / Apple TV / iPad).

The bridge usually gets Wi‑Fi during commissioning — do not hardcode CHIP `DEFAULT_WIFI_*`.

### Pairing codes (esp-matter demo)

| | |
|:--|:--|
| Manual code | `3497-011-2332` |
| PIN | `20202021` |
| QR payload | `MT:Y.K9042C00KA0648G00` |

A normal `flash` **without** `erase-flash` keeps the Matter fabric.

## Parts

Ozon links may go stale — search by product name.

| | |
|:--|:--|
| Matrix | [WS2812B 16×16](https://www.ozon.ru/product/ws2812b-led-rgb-gibkaya-pikselnaya-panel-16x16-modul-matrichnyy-ekran-3679643255/) |
| Enclosure | [DIY lamp housing (Type‑C)](https://www.ozon.ru/product/korpus-lampy-dlya-samostoyatelnoy-sborki-s-type-c-razemom-1231390974/) |
| Lamp MCU | [ESP32‑C3](https://www.ozon.ru/product/maketnaya-plata-esp32-c3-maketnaya-plata-esp32-wifi-bluetooth-3677061352/) |
| Bridge | [ESP32‑C6 Super Mini](https://www.ozon.ru/product/esp32-c6-super-mini-maketnaya-plata-obuchayushchaya-pla-3800644524/) |

Why a separate C3 firmware line (RISC‑V, FastLED): classic gunner47 for Xtensa does not build cleanly on C3; `lamp/gunner47_v2.87in1/` is the adapted line. Details live next to the sketch (`PATCH_FASTLED.md` / `UPDATE_FASTLED.md`).

## Scenes and effects

Controllers do not expose ~90 Gyver effect names. Workaround: **color + brightness** → bridge picks `EFF` / `SPD`.

- Table: [`ALICE_SCENES.en.md`](matter-bridge/ALICE_SCENES.en.md) · [RU](matter-bridge/ALICE_SCENES.md)
- Edit: `matter-bridge/main/gyver_scenes.c`

Example “Night”: hue ≈ **220°**, brightness **20%**, turn on.

## Troubleshooting

| Symptom | Check |
|:--------|:------|
| Alice rejects / removes device | Basic Info / SerialNumber; erase + re-pair after DAC/PIN change |
| White temperature only | HueSaturation build (already in this repo) |
| Bridge online, lamp silent | same Wi‑Fi; `ESP_MODE=1` + secrets; port **8888** |
| Must re-add after every flash | stop using `erase-flash` |
| Matrix flickers / dim | weak 5 V PSU; don’t power matrix from 3V3 |

More detail: [`matter-bridge/README.en.md`](matter-bridge/README.en.md), [`tasmota-bridge/README.en.md`](tasmota-bridge/README.en.md).

## License and credits

This repo’s bridge, docs, and modifications — [MIT](LICENSE), © 2026 Anzor Magomedov.

Lamp base is **gunner47 / [GyverLamp](https://github.com/AlexGyver/GyverLamp)**; `esp-matter` and other deps keep their own licenses.

## For AI agents

[`llms.txt`](llms.txt) · [`llms-full.txt`](llms-full.txt) · [`AGENTS.md`](AGENTS.md) · Russian: [`llms.ru.txt`](llms.ru.txt), [`AGENTS.ru.md`](AGENTS.ru.md)
