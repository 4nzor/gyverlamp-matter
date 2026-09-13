# GyverLamp + Matter (Alice)

Управление лампой Gyver через **Алису** без Home Assistant: Matter-мост на ESP32-C6/S3 говорит с лампой по UDP.

Прошивка лампы — на основе **gunner47** (`gunner47_v2.87in1`).

```
Алиса ──Matter──► ESP32-C6 (мост) ──UDP :8888──► лампа (ESP32-C3 + матрица 16×16)
```

| Папка | Что это | Железо |
|---|---|---|
| [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) | Прошивка лампы (gunner47 / GyverLamp) | ESP32‑C3 + WS2812B |
| [`matter-bridge/`](matter-bridge/) | Matter Extended Color Light → UDP | ESP32‑C6 Super Mini (или S3) |

Умеет: вкл/выкл, яркость, сцены по **цвету + яркости** → номер эффекта (`EFF`) и скорость (`SPD`).

---

## Что купить (Ozon)

Ссылки могут устаревать — ориентируйся по названию.

| Для чего | Товар |
|---|---|
| Матрица | [WS2812B RGB панель 16×16](https://www.ozon.ru/product/ws2812b-led-rgb-gibkaya-pikselnaya-panel-16x16-modul-matrichnyy-ekran-3679643255/) |
| Корпус | [Корпус лампы для самостоятельной сборки (Type‑C)](https://www.ozon.ru/product/korpus-lampy-dlya-samostoyatelnoy-sborki-s-type-c-razemom-1231390974/) |
| Контроллер лампы | [ESP32‑C3 макетная плата](https://www.ozon.ru/product/maketnaya-plata-esp32-c3-maketnaya-plata-esp32-wifi-bluetooth-3677061352/) |
| Matter‑мост | [ESP32‑C6 Super Mini](https://www.ozon.ru/product/esp32-c6-super-mini-maketnaya-plata-obuchayushchaya-pla-3800644524/) |

Ещё нужно:
- БП **5 В / 3–5 А** (на 256 LED меньше нельзя — будет моргать и греться)
- провода, по желанию — Li‑ion **1S** на C6 (пад **BAT**, заряд ~100 мА, лучше с BMS)

Лампа и мост должны быть в **одной Wi‑Fi сети** (2.4 ГГц).

---

## Сборка лампы (кратко)

1. Матрица 16×16 → data на пин из `Constants.h` (`LED_PIN`, по умолчанию **4**), GND общий, +5 В с мощного БП (не с USB платы).
2. Проверь `WIDTH`/`HEIGHT` = 16, `MATRIX_TYPE` под свою ленту (0 = зигзаг).
3. В Arduino IDE открой папку [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) (имя папки = имя `.ino` — так требует Arduino).

Детали эффектов и FastLED — в файлах внутри скетча (в т.ч. `PATCH_FASTLED.md`).

---

## Wi‑Fi (`secrets.env`)

```bash
cp secrets.env.example secrets.env
# WIFI_SSID=...
# WIFI_PASSWORD=...
chmod +x scripts/apply_secrets.sh
./scripts/apply_secrets.sh
```

Появятся (в git не попадают):
- `lamp/gunner47_v2.87in1/wifi_secrets.h` — STA лампы
- `matter-bridge/sdkconfig.secrets` — опционально для моста

**Лампа** подключается к роутеру из `wifi_secrets.h`.  
**Мост** Wi‑Fi обычно получает от **Алисы** при Matter-pairing (не прописывай CHIP `DEFAULT_WIFI_*` вручную — ломает комиссию).

---

## Прошивка Matter-моста

Нужен **ESP-IDF v5.5.x** и Component Registry (первая сборка долгая — качает `esp_matter`).

```bash
. ~/esp/esp-idf/export.sh
cd matter-bridge
idf.py -D SDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.defaults.esp32c6;sdkconfig.secrets" set-target esp32c6
idf.py menuconfig   # Gyver Bridge → STATUS_LED_GPIO
idf.py -p /dev/cu.usbmodemXXXX build flash monitor
```

| Плата | `SDKCONFIG_DEFAULTS` | Статус-LED |
|---|---|---|
| ESP32‑C6 Super Mini | `…;sdkconfig.defaults.esp32c6;…` | GPIO **8** |
| ESP32‑S3 Super Mini | `…;sdkconfig.defaults.esp32s3;…` | GPIO **48** |

Нет `sdkconfig.secrets` — убери его из списка или снова запусти `./scripts/apply_secrets.sh`.

Обычный `flash` **без** `erase-flash` сохраняет fabric Алисы.  
`erase-flash` — только если сломался pairing / сменились credentials.

Юнит-тесты маппинга (без IDF): `cd matter-bridge/host_tests && make`.

Подробнее: [`matter-bridge/README.md`](matter-bridge/README.md).

---

## Подключение к Алисе

1. Лампа в сети, UDP `:8888` отвечает.
2. Мост прошит, в мониторе видно advertising / готовность к комиссии.
3. **Дом с Алисой** → добавить устройство → **Matter** → QR [`matter-bridge/matter-qr.png`](matter-bridge/matter-qr.png)

Тестовые credentials (esp-matter demo):

| | |
|---|---|
| QR payload | `MT:Y.K9042C00KA0648G00` |
| Manual code | `3497-011-2332` |
| PIN | `20202021` |

После успешного pairing мост сам ищет лампу (`DISCOVER` / кэш IP) и шлёт команды.

Статус-LED моста: оранжевый миг — лампа offline; зелёный «праздник» — online.

---

## Сцены и эффекты

Алиса не умеет список из 93 эффектов Gyver. Обход: **сценарий Алисы** = цвет + яркость → мост выбирает `EFF`.

Таблица: [`matter-bridge/ALICE_SCENES.md`](matter-bridge/ALICE_SCENES.md).  
Правка номеров/скоростей: `matter-bridge/main/gyver_scenes.c`.

Пример «Ночь»: цвет ≈ синий (hue **220°**), яркость **20%**, включить.

Скорость (`SPD`) сейчас задаётся **в таблице сцены**, не отдельным ползунком в Алисе.

---

## Типичные проблемы

| Симптом | Что проверить |
|---|---|
| Алиса «не поддерживается» / сразу удаляет | Basic Info / SerialNumber уже в прошивке; после смены DAC/PIN — erase + добавить заново |
| Нет цвета, только температура | нужна прошивка с HueSaturation (уже в этом репо) |
| Мост online, лампа не реагирует | одна Wi‑Fi сеть; лампа `ESP_MODE=1` + верный `secrets.env`; порт **8888** |
| После каждой прошивки надо заново добавлять | не делай `erase-flash` без нужды |
| Матрица мигает / тусклая | слабый БП 5 В; питание матрицы не с 3V3 платы |

---

## Структура репо

```
gyverlamp-matter/
├── README.md
├── secrets.env.example
├── scripts/apply_secrets.sh
├── lamp/
│   └── gunner47_v2.87in1/   # открывать ЭТО в Arduino IDE
└── matter-bridge/
```

В git не кладём: `build/`, `managed_components/`, `sdkconfig`, `secrets.env`, `lamp/gunner47_v2.87in1/wifi_secrets.h`, `matter-bridge/sdkconfig.secrets`.

---

## Благодарности

- [GyverLamp](https://github.com/AlexGyver/GyverLamp) / сообщество форков
- **gunner47** — база прошивки лампы в этом репо
- [esp-matter](https://github.com/espressif/esp-matter) (Espressif)
