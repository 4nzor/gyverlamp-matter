# ESP-Matter GyverLamp Bridge

**Language:** [Русский](README.md) | **English**

Matter Extended Color Light → GyverLamp UDP `:8888`.

## Prerequisites

- ESP-IDF **v5.5.x** (for `espressif/esp_matter~1.5`)
- ESP32-C6 or ESP32-S3 Super Mini

```bash
. ~/esp/esp-idf/export.sh
```

## Configure

Lamp Wi‑Fi comes from repo-root `secrets.env` (see main README). Bridge STA is usually provisioned by **Alice** or **Apple Home** during Matter pairing.

`idf.py menuconfig` → **Gyver Bridge** (status LED GPIO).

- C6 Super Mini: GPIO **8**
- S3 Super Mini: GPIO **48**

## Build / flash (C6)

```bash
# from repo root (once):
# cp secrets.env.example secrets.env && ./scripts/apply_secrets.sh

cd matter-bridge
idf.py -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.esp32c6;sdkconfig.secrets" set-target esp32c6
idf.py -p /dev/cu.usbmodemXXXX build flash monitor
```

If `sdkconfig.secrets` is missing, drop it from the defaults list.

## Build / flash (S3)

```bash
idf.py -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.esp32s3" set-target esp32s3
idf.py -p /dev/cu.usbmodemXXXX build flash monitor
```

First build downloads `esp_matter` (slow).  
`flash` without `erase-flash` keeps Matter fabric / controller Wi‑Fi.

## Host unit tests

```bash
cd host_tests && make
```

## Alice / Apple Home

- QR: [`matter-qr.png`](matter-qr.png)
- Payload: `MT:Y.K9042C00KA0648G00`
- Manual: **3497-011-2332** (PIN **20202021**)

Supported: **Yandex Alice** and **Apple Home** (Matter; Apple needs a home hub).  
Scenes (color+brightness → EFF): [`ALICE_SCENES.en.md`](ALICE_SCENES.en.md) ([RU](ALICE_SCENES.md)).
