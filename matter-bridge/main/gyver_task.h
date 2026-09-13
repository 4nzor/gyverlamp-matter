#pragma once

#include <stdbool.h>

#include "esp_err.h"
#include "gyver_map.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    GYVER_CMD_POWER = 0,
    GYVER_CMD_BRI,
    GYVER_CMD_SCENE, /* value=EFF, value2=SPD (0=skip SPD) */
} gyver_cmd_type_t;

typedef struct {
    gyver_cmd_type_t type;
    int value;
    int value2;
} gyver_cmd_t;

esp_err_t gyver_task_start(void);
bool gyver_task_post(const gyver_cmd_t *cmd);

/** Gate UDP/discover until Alice finishes Matter commissioning. */
void gyver_task_enable_lamp(void);
void gyver_task_disable_lamp(void);
bool gyver_task_lamp_enabled(void);

#ifdef __cplusplus
}
#endif
