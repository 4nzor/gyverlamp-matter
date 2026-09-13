#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "../main/gyver_map.h"
#include "../main/gyver_scenes.h"

static void test_zones(void)
{
    assert(gyver_zone_of(10, 200, 100) == GYVER_ZONE_RED);
    assert(gyver_zone_of(350, 200, 100) == GYVER_ZONE_RED);
    assert(gyver_zone_of(120, 200, 100) == GYVER_ZONE_GREEN);
    assert(gyver_zone_of(220, 200, 100) == GYVER_ZONE_BLUE);
    assert(gyver_zone_of(120, 100, 100) == GYVER_ZONE_LOW);
    assert(gyver_zone_of(120, 200, 20) == GYVER_ZONE_LOW);
    assert(gyver_zone_of(180, 200, 100) == GYVER_ZONE_OTHER);
}

static void test_scenes(void)
{
    assert(gyver_scene_is_white(100));
    assert(!gyver_scene_is_white(200));
    assert(gyver_scene_lookup(10, 100, 100) == NULL);

    const gyver_scene_t *s = gyver_scene_lookup(0, 200, 102);
    assert(s && s->eff == 19);
    assert(strcmp(s->name, "Огонь") == 0);

    s = gyver_scene_lookup(220, 200, 51);
    assert(s && s->eff == 21);

    s = gyver_scene_lookup(300, 220, 230);
    assert(s && s->eff == 64);

    s = gyver_scene_lookup(120, 200, 204);
    assert(s && s->eff == 7);

    s = gyver_scene_lookup(120, 200, 102);
    assert(s && s->eff == 38);

    assert(gyver_scene_lookup(15, 200, 30) == NULL); /* bri too far */
}

static void test_discover(void)
{
    char ip[16];
    assert(gyver_parse_discover("IP 192.168.1.50:8888", ip, sizeof ip));
    assert(strcmp(ip, "192.168.1.50") == 0);
    assert(!gyver_parse_discover("CURR 1 2 3", ip, sizeof ip));
    assert(gyver_resp_is_curr("CURR 1 19 128"));
    assert(!gyver_resp_is_curr("IP 1.2.3.4:8888"));
}

static void test_bri(void)
{
    assert(gyver_bri_should_send(100, -1));
    assert(!gyver_bri_should_send(100, 100));
    assert(!gyver_bri_should_send(102, 100));
    assert(gyver_bri_should_send(110, 100));
    assert(gyver_bri_clamp(0) == 1);
    assert(gyver_bri_clamp(300) == 255);
}

static void test_next_mode(void)
{
    assert(gyver_next_mode(-1, 93) == 0);
    assert(gyver_next_mode(92, 93) == 0);
    assert(gyver_next_mode(18, 93) == 19);
}

int main(void)
{
    test_zones();
    test_scenes();
    test_discover();
    test_bri();
    test_next_mode();
    puts("OK");
    return 0;
}
