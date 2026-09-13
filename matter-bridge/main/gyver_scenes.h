#pragma once

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const char *name; /* Alice scenario hint */
    int hue_deg;      /* 0..360 target */
    int bri;          /* 1..255 target (Alice % ≈ bri*100/255) */
    int eff;          /* Gyver EFF index */
    int spd;          /* 1..255, 0 = do not send SPD */
} gyver_scene_t;

/* hue 0..360, sat/bri 0..255. Returns NULL if no scene. */
const gyver_scene_t *gyver_scene_lookup(int hue, int sat, int bri);

/* White / low-sat path uses EFF 0 (Белый свет). */
bool gyver_scene_is_white(int sat);

#ifdef __cplusplus
}
#endif
