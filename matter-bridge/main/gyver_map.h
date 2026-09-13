#pragma once

#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    GYVER_ZONE_LOW = 0,
    GYVER_ZONE_RED,
    GYVER_ZONE_GREEN,
    GYVER_ZONE_BLUE,
    GYVER_ZONE_OTHER,
} gyver_zone_t;

/* hue 0..360, sat/bri 0..255 — same thresholds as Berry autoexec.be v8 */
gyver_zone_t gyver_zone_of(int hue, int sat, int bri);

bool gyver_bri_should_send(int bri, int last_bri);
int gyver_bri_clamp(int bri);

bool gyver_parse_discover(const char *s, char *ip_out, size_t ip_out_len);
bool gyver_resp_is_curr(const char *s);

int gyver_next_mode(int mode, int mode_amount);

#ifdef __cplusplus
}
#endif
