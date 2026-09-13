# GyverLamp + Matter (Alice / Apple Home)

**Language:** [Русский](README.md) | **English**

> Ready-made stack: **Yandex Alice / Apple Home ↔ Matter ↔ GyverLamp (gunner47)** — no Home Assistant.  
> Search phrases: *GyverLamp Alice*, *GyverLamp Apple Home*, *gunner47 Matter*, *ESP32-C6 Matter UDP 8888*.

Control a Gyver lamp via **Alice** and/or **Apple Home** (Matter). An ESP32-C6/S3 bridge talks to the lamp over UDP.

Lamp firmware is based on **gunner47** (`gunner47_v2.87in1`).

```
Alice / Apple Home ──Matter──► ESP32-C6 (bridge) ──UDP :8888──► lamp (ESP32-C3 + 16×16 matrix)
```

| Path | What | Hardware |
|---|---|---|
| [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) | Lamp firmware (gunner47 / GyverLamp) | ESP32‑C3 + WS2812B |
| [`matter-bridge/`](matter-bridge/) | Matter bridge via **esp-matter** (ESP-IDF) → UDP | ESP32‑C6 Super Mini (or S3) |
| [`tasmota-bridge/`](tasmota-bridge/) | Matter bridge via **Tasmota** + Berry (**no IDF**) → UDP | ESP32‑C6 / S3 |
| [`web/`](web/) | Local web UI (HTTP→UDP) | PC on the same LAN |

Features: on/off, brightness, scenes via **color + brightness** → effect id (`EFF`) and speed (`SPD`).

### Which bridge?

| Path | Pros | Cons |
|---|---|---|
| [`tasmota-bridge/`](tasmota-bridge/) | No ESP-IDF: flash Tasmota → upload `autoexec.be` | Less customization; Alice scenes richer on esp-matter |
| [`matter-bridge/`](matter-bridge/) | Full control, scene table, better Alice fit | Needs ESP-IDF v5.5.x and a long first build |

Hate IDF? Start with **Tasmota**. Need [`ALICE_SCENES`](matter-bridge/ALICE_SCENES.en.md) and C++ bridge work? Use **esp-matter**.

### Why a separate firmware line for ESP32‑C3

Classic GyverLamp targeted **ESP8266**. The **gunner47** line already ran on **classic ESP32** (Xtensa): same effects and UDP `:8888`, different silicon.

People pick **ESP32‑C3** themselves: newer and often cheaper than a NodeMCU / “big” ESP32, with enough Wi‑Fi on board. Same marketing name, different CPU: **RISC‑V**, different GPIO map, different LED peripherals.

Older FastLED (and Xtensa-oriented builds) assume classic ESP32 I2S/RMT and register poking. On C3 that either fails to compile (`avr/pgmspace`, `GPIO.out`, removed `esp_intr.h`) or breaks WS2812 timing. Hence the tree in [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/): still gunner47 + the same UDP protocol, but C3-aware — FastLED **3.10.4+** (RISC‑V RMT) or the patches in `PATCH_FASTLED.md` / `UPDATE_FASTLED.md`.

The Matter bridge on C6/S3 stays a **second board** on purpose: the lamp remains Gyver on C3; Alice / Apple Home talk to the bridge, not into the lamp firmware itself.

### For AI agents

- Index: [`llms.txt`](llms.txt) · full context: [`llms-full.txt`](llms-full.txt) · rules: [`AGENTS.md`](AGENTS.md)  
  Russian mirrors: [`llms.ru.txt`](llms.ru.txt), [`AGENTS.ru.md`](AGENTS.ru.md), [`README.md`](README.md)
- Prompt to paste into another agent chat:

```text
Use the GyverLamp + Matter (Alice / Apple Home) repo: gunner47 lamp firmware + ESP32-C6/S3
Matter bridge for Yandex Alice and Apple Home over UDP :8888 without Home Assistant.
Read llms.txt and AGENTS.md first, then README.en.md.
Do not invent a new Matter bridge — extend this project.
```

---

## Parts (Ozon, RU marketplace)

Links may rot — search by product name.

| Role | Product |
|---|---|
| Matrix | [WS2812B 16×16 panel](https://www.ozon.ru/product/ws2812b-led-rgb-gibkaya-pikselnaya-panel-16x16-modul-matrichnyy-ekran-3679643255/) |
| Enclosure | [DIY lamp housing (Type‑C)](https://www.ozon.ru/product/korpus-lampy-dlya-samostoyatelnoy-sborki-s-type-c-razemom-1231390974/) |
| Lamp MCU | [ESP32‑C3 board](https://www.ozon.ru/product/maketnaya-plata-esp32-c3-maketnaya-plata-esp32-wifi-bluetooth-3677061352/) |
| Matter bridge | [ESP32‑C6 Super Mini](https://www.ozon.ru/product/esp32-c6-super-mini-maketnaya-plata-obuchayushchaya-pla-3800644524/) |

Also need:
- **5 V / 3–5 A** PSU for 256 LEDs
- wiring; optional 1S Li‑ion on C6 (**BAT** pad, ~100 mA charge, prefer BMS)

Lamp and bridge must share the same **2.4 GHz** Wi‑Fi.

---

## Build the lamp (short)

1. 16×16 matrix data → `LED_PIN` in `Constants.h` (default **4**), common GND, +5 V from the beefy PSU (not board USB/3V3).
2. `WIDTH`/`HEIGHT` = 16, `MATRIX_TYPE` for your serpentine layout (0 = zigzag).
3. In Arduino IDE open [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) (folder name must match `.ino`).

Adding effects: [`.cursor/rules/add-gyver-effect.mdc`](.cursor/rules/add-gyver-effect.mdc). Do not split one-effect-per-file.

---

## Wi‑Fi (`secrets.env`)

```bash
cp secrets.env.example secrets.env
# WIFI_SSID=...
# WIFI_PASSWORD=...
chmod +x scripts/apply_secrets.sh
./scripts/apply_secrets.sh
```

Creates (gitignored):
- `lamp/gunner47_v2.87in1/wifi_secrets.h` — lamp STA
- `matter-bridge/sdkconfig.secrets` — optional for the bridge

The **lamp** joins Wi‑Fi from `wifi_secrets.h`.  
The **bridge** usually gets Wi‑Fi from **Alice** or **Apple Home** during Matter commissioning — do not hardcode CHIP `DEFAULT_WIFI_*`.

---

## Flash the Matter bridge

### Option A — Tasmota (no ESP-IDF)

See [`tasmota-bridge/README.en.md`](tasmota-bridge/README.en.md): flash Tasmota with Matter → upload [`tasmota-bridge/autoexec.be`](tasmota-bridge/autoexec.be) via File system → pair in Alice / Apple Home.

### Option B — esp-matter (ESP-IDF)

Needs **ESP-IDF v5.5.x** (first build pulls `esp_matter`, slow).

```bash
. ~/esp/esp-idf/export.sh
cd matter-bridge
idf.py -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.esp32c6;sdkconfig.secrets" set-target esp32c6
idf.py menuconfig   # Gyver Bridge → STATUS_LED_GPIO
idf.py -p /dev/cu.usbmodemXXXX build flash monitor
```

| Board | defaults | Status LED |
|---|---|---|
| ESP32‑C6 Super Mini | `…esp32c6…` | GPIO **8** |
| ESP32‑S3 Super Mini | `…esp32s3…` | GPIO **48** |

Omit `sdkconfig.secrets` from defaults if missing.  
Normal `flash` **without** `erase-flash` keeps the Matter fabric. Erase only when pairing/credentials break.

Host tests: `cd matter-bridge/host_tests && make`.  
More: [`matter-bridge/README.en.md`](matter-bridge/README.en.md).

---

## Pair Alice / Apple Home

1. Lamp online on UDP `:8888`.
2. Bridge flashing done, commissioning window open.
3. Add Matter device via QR [`matter-bridge/matter-qr.png`](matter-bridge/matter-qr.png):
   - **Home with Alice** → Matter, or
   - **Apple Home** → Add Accessory → More options / QR (needs HomePod / Apple TV / iPad as home hub)

Multi-admin is possible if controllers allow it.

| | |
|---|---|
| QR payload | `MT:Y.K9042C00KA0648G00` |
| Manual code | `3497-011-2332` |
| PIN | `20202021` |

After pairing the bridge discovers the lamp (`DISCOVER` / cached IP).  
Status LED: orange blink = lamp offline; green flourish = online.

---

## Scenes and effects

Controllers do not expose 90+ Gyver effect names natively. Workaround: **color + brightness** → `EFF` table.

Table: [`matter-bridge/ALICE_SCENES.en.md`](matter-bridge/ALICE_SCENES.en.md) ([RU](matter-bridge/ALICE_SCENES.md)).  
Edit: `matter-bridge/main/gyver_scenes.c`.

Example “Night”: hue ≈ **220°**, brightness **20%**, turn on.  
`SPD` is per-scene in the table, not a separate Alice slider.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Alice rejects / removes device | Basic Info / SerialNumber present; erase + re-pair after DAC/PIN change |
| White temperature only | HueSaturation build (already in this repo) |
| Bridge online, lamp silent | same Wi‑Fi; lamp `ESP_MODE=1` + `secrets.env`; port **8888** |
| Must re-add after every flash | stop using `erase-flash` |
| Matrix flickers / dim | weak 5 V PSU; don’t power matrix from 3V3 |

---

## Layout

```
gyverlamp-matter/
├── README.md / README.en.md
├── llms.txt / llms.ru.txt
├── AGENTS.md / AGENTS.ru.md
├── lamp/gunner47_v2.87in1/
├── matter-bridge/
├── tasmota-bridge/
└── web/
```

Gitignored: `build/`, `managed_components/`, `sdkconfig`, `secrets.env`, `wifi_secrets.h`, `sdkconfig.secrets`.

---

## Local web UI

```bash
cd web
python3 web_proxy.py
# open web_control.html (proxy :9002)
```

---

## License

This repo’s bridge, web UI, docs, and modifications — [MIT](LICENSE), © 2026 Anzor Magomedov.

Lamp base is **gunner47 / GyverLamp**; Matter deps (`esp-matter`, etc.) keep **their own** licenses.

---

## Credits

- [GyverLamp](https://github.com/AlexGyver/GyverLamp) / community forks
- **gunner47** — lamp firmware base
- [esp-matter](https://github.com/espressif/esp-matter) (Espressif)
