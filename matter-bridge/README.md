# ESP-Matter GyverLamp Bridge

Matter Extended Color Light → GyverLamp UDP `:8888`.

## Prerequisites

- ESP-IDF **v5.5.x** (для `espressif/esp_matter~1.5`)
- ESP32-C6 или ESP32-S3 Super Mini

```bash
. ~/esp/esp-idf/export.sh
```

## Configure

Wi‑Fi лампы — из корневого `secrets.env` (см. README репо). Для моста Алиса сама провиженит STA.

`idf.py menuconfig` → **Gyver Bridge** (статус-LED GPIO).

- C6 Super Mini: GPIO **8**
- S3 Super Mini: GPIO **48**

## Build / flash (C6)

```bash
# из корня репо (один раз):
# cp secrets.env.example secrets.env && ./scripts/apply_secrets.sh

cd matter-bridge
idf.py -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.esp32c6;sdkconfig.secrets" set-target esp32c6
idf.py -p /dev/cu.usbmodemXXXX build flash monitor
```

Без `sdkconfig.secrets` убери его из списка defaults.

## Build / flash (S3)

```bash
idf.py -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.esp32s3" set-target esp32s3
idf.py -p /dev/cu.usbmodemXXXX build flash monitor
```

Первая сборка тянет `esp_matter` из Component Registry (долго).

Обычный `flash` **без** `erase-flash` сохраняет Matter fabric / Wi‑Fi Алисы.

## Host unit tests

```bash
cd host_tests && make
```

## Alice

- QR: [`matter-qr.png`](matter-qr.png)
- Payload: `MT:Y.K9042C00KA0648G00`
- Manual: **3497-011-2332** (PIN **20202021**)

Сцены (цвет+яркость → EFF): [`ALICE_SCENES.md`](ALICE_SCENES.md).
