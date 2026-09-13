# Tasmota bridge (no ESP-IDF)

**Language:** [Русский](README.md) | **English**

If you do not want to install **ESP-IDF** and build `matter-bridge/`, flash **Tasmota** (ESP32-C6 / S3 with Matter) and upload the Berry script [`autoexec.be`](autoexec.be).

```
Alice / Apple Home ──Matter──► Tasmota ──UDP :8888──► GyverLamp
```

## When to use Tasmota

- Fast path: flash stock Tasmota → upload `autoexec.be`
- Avoid IDF / Component Registry pain

## When to prefer `matter-bridge/` (esp-matter)

- More reliable Alice pairing and the color→EFF scene table from this repo
- C++ bridge customizations (Basic Info, HueSaturation, scenes)

In practice **esp-matter** is the supported path for Alice; Tasmota is the “no IDF” shortcut.

## Setup

1. Use an ESP32-C6 Super Mini (or S3) with Tasmota Matter support.
2. Flash current **Tasmota** (Matter build) via [tasmota.github.io/install](https://tasmota.github.io/install/) or your flasher.
3. In Tasmota Web UI: **Consoles → Manage File system** → upload [`autoexec.be`](autoexec.be) to FS root (filename must be `autoexec.be`).
4. Reboot. The script discovers the lamp (`DISCOVER` / `GET`→`CURR`) on the LAN.
5. Add the device in **Home with Alice** or **Apple Home** as a Matter light.

Lamp and Tasmota must share the same 2.4 GHz Wi‑Fi. Flash the lamp from [`lamp/`](../lamp/gunner47_v2.87in1/) as usual.

## What `autoexec.be` (v8) does

- Power → `P_ON` / `P_OFF`
- Dimmer → `BRI`
- Color zones: red → fire (EFF 19); green/blue → next effect
- Status: orange blink offline; green celebration when online

The full esp-matter scene table is **not** ported here — extend Berry or use `matter-bridge/`.

## Files

| File | Role |
|---|---|
| [`autoexec.be`](autoexec.be) | Berry Gyver UDP bridge |

Do not commit personal IPs/passwords. Upload the script only via Tasmota File system UI.
