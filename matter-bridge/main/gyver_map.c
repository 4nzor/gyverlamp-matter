#include "gyver_map.h"

#include <stdio.h>
#include <string.h>

gyver_zone_t gyver_zone_of(int hue, int sat, int bri)
{
    if (sat < 160 || bri < 40) {
        return GYVER_ZONE_LOW;
    }
    if (hue <= 20 || hue >= 340) {
        return GYVER_ZONE_RED;
    }
    if (hue >= 100 && hue <= 155) {
        return GYVER_ZONE_GREEN;
    }
    if (hue >= 200 && hue <= 260) {
        return GYVER_ZONE_BLUE;
    }
    return GYVER_ZONE_OTHER;
}

bool gyver_bri_should_send(int bri, int last_bri)
{
    if (last_bri < 0) {
        return true;
    }
    if (bri == last_bri) {
        return false;
    }
    if (bri > last_bri - 4 && bri < last_bri + 4) {
        return false;
    }
    return true;
}

int gyver_bri_clamp(int bri)
{
    if (bri < 1) {
        return 1;
    }
    if (bri > 255) {
        return 255;
    }
    return bri;
}

bool gyver_parse_discover(const char *s, char *ip_out, size_t ip_out_len)
{
    if (s == NULL || ip_out == NULL || ip_out_len < 8) {
        return false;
    }

    /* Expect: "IP a.b.c.d:8888" */
    if (strncmp(s, "IP ", 3) != 0) {
        return false;
    }

    const char *rest = s + 3;
    while (*rest == ' ') {
        rest++;
    }

    char ip[64];
    size_t n = 0;
    while (rest[n] && rest[n] != ':' && rest[n] != ' ' && n + 1 < sizeof(ip)) {
        ip[n] = rest[n];
        n++;
    }
    ip[n] = '\0';
    if (n < 7) {
        return false;
    }

    if (n + 1 > ip_out_len) {
        return false;
    }
    memcpy(ip_out, ip, n + 1);
    return true;
}

bool gyver_resp_is_curr(const char *s)
{
    return s != NULL && strncmp(s, "CURR", 4) == 0;
}

int gyver_next_mode(int mode, int mode_amount)
{
    if (mode_amount <= 0) {
        return 0;
    }
    if (mode < 0) {
        return 0;
    }
    return (mode + 1) % mode_amount;
}
