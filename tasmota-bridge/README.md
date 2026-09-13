# Tasmota-мост (без ESP-IDF)

**Язык:** **Русский** | [English](README.en.md)

Если не хочешь ставить **ESP-IDF** и собирать `matter-bridge/`, можно прошить плату **Tasmota** (ESP32-C6 / S3 с Matter) и залить Berry-скрипт [`autoexec.be`](autoexec.be).

```
Алиса / Apple Home ──Matter──► Tasmota ──UDP :8888──► GyverLamp
```

## Когда выбирать Tasmota

- Нужен быстрый старт: скачал прошивку Tasmota → залил `autoexec.be`
- Не хочется возиться с IDF / Component Registry

## Когда лучше `matter-bridge/` (esp-matter)

- Стабильный pairing с Алисой и кастомные Basic Info / сцены цвет→EFF из этого репо
- Таблица [`ALICE_SCENES`](../matter-bridge/ALICE_SCENES.md) и доработки моста в C++

На практике для Алисы путь **esp-matter** надёжнее; Tasmota — упрощённый вариант «без IDF».

## Как поставить

1. Возьми ESP32-C6 Super Mini (или S3) с поддержкой Matter в Tasmota.
2. Прошей актуальный **Tasmota** (с Matter) через [tasmota.github.io/install](https://tasmota.github.io/install/) или свой flasher.
3. В веб-UI Tasmota: **Consoles → Manage File system** → загрузи [`autoexec.be`](autoexec.be) в корень FS (имя именно `autoexec.be`).
4. Перезагрузи плату. Скрипт сам ищет лампу (`DISCOVER` / `GET`→`CURR`) в LAN.
5. Добавь устройство в **Дом с Алисой** или **Apple Home** как Matter (как обычную Tasmota Matter light).

Лампа и Tasmota — в одной Wi‑Fi сети 2.4 ГГц. Лампу прошей как обычно из [`lamp/`](../lamp/gunner47_v2.87in1/).

## Что умеет `autoexec.be` (v8)

- Power → `P_ON` / `P_OFF`
- Dimmer → `BRI`
- Зоны цвета: красный → огонь (EFF 19); зелёный/синий → следующий эффект
- Статус: оранжевый миг offline; зелёный «праздник» online

Полная таблица сцен цвет+яркость→EFF из esp-matter **сюда не перенесена** — при необходимости допиливай Berry или используй `matter-bridge/`.

## Файлы

| Файл | Назначение |
|---|---|
| [`autoexec.be`](autoexec.be) | Berry-скрипт моста Gyver UDP |

Не коммить свои IP/пароли. Загрузка скрипта — только через File system UI Tasmota.
