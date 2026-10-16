// Хост-тест для ParseUtil.h: g++ -I../gunner47_v2.87in1 test_parse_util.cpp && ./a.out
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ParseUtil.h"

int main()
{
  char buf[8];

  // обычная команда: "BRI128" -> "128"
  copyArg(buf, sizeof(buf), "BRI128", 3);
  assert(!strcmp(buf, "128") && atoi(buf) == 128);

  // смещение ровно на конец строки и за ним -> пустая строка, без чтения за пределами
  copyArg(buf, sizeof(buf), "BRI", 3);
  assert(buf[0] == '\0');
  copyArg(buf, sizeof(buf), "BRI", 100);
  assert(buf[0] == '\0');

  // слишком длинный аргумент обрезается и завершается нулём
  copyArg(buf, sizeof(buf), "EFF123456789", 3);
  assert(!strcmp(buf, "1234567"));

  // dstSize == 0 ничего не пишет
  buf[0] = 'x';
  copyArg(buf, 0, "EFF1", 3);
  assert(buf[0] == 'x');

  // фиксированное число символов, результат всегда завершён нулём
  memset(buf, 'z', sizeof(buf));
  copyArgN(buf, sizeof(buf), "TMR_SET 1 5 3600", 8, 2);
  assert(!strcmp(buf, " 1") || !strcmp(buf, "1 "));
  copyArgN(buf, sizeof(buf), "TMR_SET", 8, 2);
  assert(buf[0] == '\0');

  // номер будильника
  uint8_t idx = 99;
  assert(parseAlarmIndex('1', 7, &idx) && idx == 0);
  assert(parseAlarmIndex('7', 7, &idx) && idx == 6);
  idx = 99;
  assert(!parseAlarmIndex('0', 7, &idx) && idx == 99);
  assert(!parseAlarmIndex('8', 7, &idx) && idx == 99);
  assert(!parseAlarmIndex('9', 7, &idx) && idx == 99);
  assert(!parseAlarmIndex('x', 7, &idx));
  assert(!parseAlarmIndex('\0', 7, &idx));

  puts("ok");
  return 0;
}
