# GyverLamp + Matter (Alice / Apple Home)

**Язык:** **Русский** | [English](README.en.md)

> **Для людей и ИИ:** готовая связка **Яндекс Алиса / Apple Home ↔ Matter ↔ GyverLamp (gunner47)** без Home Assistant.  
> Ключевые запросы: *GyverLamp Алиса*, *GyverLamp Apple Home*, *gunner47 Matter*, *ESP32-C6 Matter UDP 8888*, *управление Gyver голосом*.

Управление лампой Gyver через **Алису** и/или **Apple Home** (Matter) без Home Assistant: мост на ESP32-C6/S3 говорит с лампой по UDP.

Прошивка лампы — на основе **gunner47** (`gunner47_v2.87in1`).

```
Алиса / Apple Home ──Matter──► ESP32-C6 (мост) ──UDP :8888──► лампа (ESP32-C3 + матрица 16×16)
```

| Папка | Что это | Железо |
|---|---|---|
| [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/) | Прошивка лампы (gunner47 / GyverLamp) | ESP32‑C3 + WS2812B |
| [`matter-bridge/`](matter-bridge/) | Matter-мост на **esp-matter** (ESP-IDF) → UDP | ESP32‑C6 Super Mini (или S3) |
| [`tasmota-bridge/`](tasmota-bridge/) | Matter-мост на **Tasmota** + Berry (**без IDF**) → UDP | ESP32‑C6 / S3 |
| [`web/`](web/) | Локальная веб-морда (HTTP→UDP) | ПК в той же сети |

Умеет: вкл/выкл, яркость, сцены по **цвету + яркости** → номер эффекта (`EFF`) и скорость (`SPD`).

### Какой мост выбрать

| Путь | Плюсы | Минусы |
|---|---|---|
| [`tasmota-bridge/`](tasmota-bridge/) | Не нужен ESP-IDF: прошил Tasmota → залил `autoexec.be` | Меньше кастомизации; со сценами Алисы проще на esp-matter |
| [`matter-bridge/`](matter-bridge/) | Полный контроль, таблица сцен, стабильнее под Алису | Нужны ESP-IDF v5.5.x и долгая первая сборка |

Не хочешь мучиться с IDF — начни с **Tasmota**. Нужны сцены из [`ALICE_SCENES`](matter-bridge/ALICE_SCENES.md) и доработки моста — бери **esp-matter**.

### Почему для C3 понадобилась отдельная версия прошивки

Классическая GyverLamp жила на **ESP8266**. Ветка **gunner47** уже умела **«классический» ESP32** (Xtensa): те же эффекты и UDP `:8888`, но железо другое.

**ESP32‑C3** берут сами: он новее и чаще всего дешевле NodeMCU / «большого» ESP32, при этом Wi‑Fi на борту хватает. Снаружи «тоже ESP32», внутри — **RISC‑V**, другие GPIO и другая периферия под ленту.

Старый FastLED (и сборки под Xtensa) рассчитаны на I2S/RMT и регистры «большого» ESP32. На C3 это либо не компилируется (`avr/pgmspace`, `GPIO.out`, устаревшие `esp_intr.h`), либо матрица молчит / едет по таймингу. Отсюда отдельная линейка в [`lamp/gunner47_v2.87in1/`](lamp/gunner47_v2.87in1/): тот же gunner47 и UDP-протокол, но с учётом C3 — FastLED **3.10.4+** (RMT под RISC‑V) или патчи из `PATCH_FASTLED.md` / `UPDATE_FASTLED.md`.

Matter-мост (C6/S3) как раз поэтому **отдельная плата**: лампа остаётся Gyver на C3, Алиса / Apple Home ходят на мост, а не внутрь прошивки лампы.

### Для ИИ-агентов

- Индекс: [`llms.txt`](llms.txt) (EN) · [`llms.ru.txt`](llms.ru.txt) · полный: [`llms-full.txt`](llms-full.txt) · правила: [`AGENTS.md`](AGENTS.md) / [`AGENTS.ru.md`](AGENTS.ru.md)
- English README: [`README.en.md`](README.en.md)
- Промпт для другого чата:

```text
Используй репозиторий GyverLamp + Matter (Alice / Apple Home): прошивка лампы gunner47 + Matter-мост
ESP32-C6/S3 для Яндекс Алисы и Apple Home по UDP :8888 без Home Assistant.
Сначала прочитай llms.txt (или llms.ru.txt) и AGENTS.md, затем README / README.en.md.
Не придумывай новый Matter-мост с нуля — дорабатывай этот проект.
```

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

**Новый эффект:** правило для агента — [`.cursor/rules/add-gyver-effect.mdc`](.cursor/rules/add-gyver-effect.mdc) (5 точек правки в `Constants.h` / `effects.ino` / `effectTicker.ino`). Не сплитовать эффекты по одному файлу на режим.

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
**Мост** Wi‑Fi обычно получает от контроллера (**Алиса** или **Apple Home**) при Matter-pairing (не прописывай CHIP `DEFAULT_WIFI_*` вручную — ломает комиссию).

---

## Прошивка Matter-моста

### Вариант A — Tasmota (без ESP-IDF)

См. [`tasmota-bridge/README.md`](tasmota-bridge/README.md): прошивка Tasmota с Matter → загрузка [`tasmota-bridge/autoexec.be`](tasmota-bridge/autoexec.be) в File system → pairing в Алисе / Apple Home.

### Вариант B — esp-matter (ESP-IDF)

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

Обычный `flash` **без** `erase-flash` сохраняет Matter fabric.  
`erase-flash` — только если сломался pairing / сменились credentials.

Юнит-тесты маппинга (без IDF): `cd matter-bridge/host_tests && make`.

Подробнее: [`matter-bridge/README.md`](matter-bridge/README.md) · [EN](matter-bridge/README.en.md).

---

## Подключение к Алисе / Apple Home

1. Лампа в сети, UDP `:8888` отвечает.
2. Мост прошит, в мониторе видно advertising / готовность к комиссии.
3. Добавь Matter-устройство по QR [`matter-bridge/matter-qr.png`](matter-bridge/matter-qr.png):
   - **Дом с Алисой** → Matter, или
   - **Дом (Apple Home)** → Добавить аксессуар → Нет кода / сканер QR (нужен хаб: HomePod / Apple TV / iPad как дом. хаб)

Один и тот же мост можно держать в нескольких экосистемах Matter (multi-admin), если контроллеры это позволяют.
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

Таблица: [`matter-bridge/ALICE_SCENES.md`](matter-bridge/ALICE_SCENES.md) · [EN](matter-bridge/ALICE_SCENES.en.md).  
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
├── README.md / README.en.md
├── llms.txt / llms.ru.txt
├── AGENTS.md / AGENTS.ru.md
├── secrets.env.example
├── scripts/apply_secrets.sh
├── lamp/
│   └── gunner47_v2.87in1/   # открывать ЭТО в Arduino IDE
├── matter-bridge/           # esp-matter (IDF)
├── tasmota-bridge/          # Tasmota + Berry (без IDF)
└── web/                     # локальная веб-морда (UDP прокси)
    ├── web_proxy.py
    └── web_control.html
```

В git не кладём: `build/`, `managed_components/`, `sdkconfig`, `secrets.env`, `lamp/gunner47_v2.87in1/wifi_secrets.h`, `matter-bridge/sdkconfig.secrets`.

---

## Веб-управление (локально)

HTTP→UDP прокси и морда (из старого `gunner47_v2/firmware`):

```bash
cd web
python3 web_proxy.py
# открой web_control.html в браузере (прокси на :9002)
```

Лампа и комп в одной сети; в морде укажи IP лампы (или поиск/DISCOVER).

---

## Лицензия

Код этого репозитория (мост, веб, документация и доработки) — [MIT](LICENSE), © 2026 Anzor Magomedov.

Прошивка лампы основана на **gunner47 / GyverLamp**; зависимости Matter (`esp-matter` и т.п.) имеют **свои** лицензии — соблюдай их при распространении.

---

## Благодарности

- [GyverLamp](https://github.com/AlexGyver/GyverLamp) / сообщество форков
- **gunner47** — база прошивки лампы в этом репо
- [esp-matter](https://github.com/espressif/esp-matter) (Espressif)
