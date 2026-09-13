#include "gyver_scenes.h"

#include <stdlib.h>

/* Alice scenario targets: set this color + brightness %.
 * bri ≈ pct * 255 / 100. Match: |hue|≤15°, |bri|≤18, sat≥150 (else white).
 */
static const gyver_scene_t s_scenes[] = {
    /* name              hue  bri(~%)  eff  spd */
    { "Свеча",            30,  64 /*25%*/, 18,  80 },  /* Пламя */
    { "Огонь",             0, 102 /*40%*/, 19, 128 },  /* Огонь 2021 */
    { "Лава",             20, 178 /*70%*/,  5, 160 },  /* Лава */
    { "Огонь яркий",       0, 204 /*80%*/, 42, 180 },  /* Огонь */
    { "Чтение",           45, 178 /*70%*/,  1,   0 },  /* Цвет */
    { "Комета",           60, 204 /*80%*/, 56, 200 },  /* Комета */
    { "Лес",              90, 128 /*50%*/, 10, 100 },  /* Лес */
    { "Матрица",         120, 102 /*40%*/, 38, 140 },  /* Матрица */
    { "Радуга",          120, 204 /*80%*/,  7, 160 },  /* Радуга 3D */
    { "Радуга полоса",   150, 178 /*70%*/, 84, 150 },  /* Радуга */
    { "Сияние",          160, 128 /*50%*/, 32,  90 },  /* Северное сияние */
    { "Мотыльки",        180, 153 /*60%*/, 25, 120 },  /* Мотыльки */
    { "Океан",           200, 115 /*45%*/, 11, 100 },  /* Океан */
    { "Ночь",            220,  51 /*20%*/, 21,  60 },  /* Тени */
    { "Тихий океан",     220, 140 /*55%*/, 20,  80 },  /* Тихий океан */
    { "Кино",            240,  89 /*35%*/, 66,  70 },  /* Дым */
    { "Плазма",          270, 191 /*75%*/,  6, 170 },  /* Плазма */
    { "Вечеринка",       300, 230 /*90%*/, 64, 220 },  /* Конфетти */
    { "Фейерверк",       320, 255 /*100%*/,86, 255 },  /* Фейерверк */
    { "Пульс",           330, 153 /*60%*/, 51, 130 },  /* Радужный пульс */
};

#define SCENE_COUNT ((int)(sizeof(s_scenes) / sizeof(s_scenes[0])))
#define HUE_TOL 15
#define BRI_TOL 18
#define SAT_MIN 150

static int hue_dist(int a, int b)
{
    int d = abs(a - b) % 360;
    if (d > 180) {
        d = 360 - d;
    }
    return d;
}

bool gyver_scene_is_white(int sat)
{
    return sat < SAT_MIN;
}

const gyver_scene_t *gyver_scene_lookup(int hue, int sat, int bri)
{
    if (gyver_scene_is_white(sat)) {
        return NULL;
    }
    if (hue < 0) {
        hue = 0;
    }
    hue %= 360;

    const gyver_scene_t *best = NULL;
    int best_score = 0x7fffffff;

    for (int i = 0; i < SCENE_COUNT; i++) {
        const gyver_scene_t *s = &s_scenes[i];
        int dh = hue_dist(hue, s->hue_deg);
        int db = abs(bri - s->bri);
        if (dh > HUE_TOL || db > BRI_TOL) {
            continue;
        }
        int score = dh * 4 + db; /* prefer hue match */
        if (score < best_score) {
            best_score = score;
            best = s;
        }
    }
    return best;
}
