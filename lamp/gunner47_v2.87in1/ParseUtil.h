#pragma once
/*
 * Безопасные помощники для разбора текстовых команд (UDP / WebSocket).
 * Без зависимостей от Arduino, чтобы их можно было проверить на хосте
 * (см. lamp/host_tests).
 */
#include <stddef.h>
#include <stdint.h>
#include <string.h>

// Копирует src[offset..] в dst (размер dstSize) и всегда завершает нулём.
// Если offset за концом строки — в dst пустая строка.
static inline void copyArg(char *dst, size_t dstSize, const char *src, size_t offset)
{
  if (!dstSize)
  {
    return;
  }
  const size_t len = strlen(src);
  if (offset >= len)
  {
    dst[0] = '\0';
    return;
  }
  size_t n = len - offset;
  if (n > dstSize - 1)
  {
    n = dstSize - 1;
  }
  memcpy(dst, src + offset, n);
  dst[n] = '\0';
}

// Копирует не более count символов src[offset..] и завершает нулём.
static inline void copyArgN(char *dst, size_t dstSize, const char *src, size_t offset, size_t count)
{
  if (!dstSize)
  {
    return;
  }
  const size_t len = strlen(src);
  if (offset >= len)
  {
    dst[0] = '\0';
    return;
  }
  size_t n = len - offset;
  if (n > count)
  {
    n = count;
  }
  if (n > dstSize - 1)
  {
    n = dstSize - 1;
  }
  memcpy(dst, src + offset, n);
  dst[n] = '\0';
}

// Номер будильника из символа '1'..'9' -> индекс 0..count-1.
// Возвращает false, если символ не цифра или индекс вне диапазона.
static inline bool parseAlarmIndex(char c, uint8_t count, uint8_t *index)
{
  if (c < '1' || c > '9')
  {
    return false;
  }
  const uint8_t i = (uint8_t)(c - '1');
  if (i >= count)
  {
    return false;
  }
  *index = i;
  return true;
}
