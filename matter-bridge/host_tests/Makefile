CC ?= gcc
CFLAGS ?= -Wall -Wextra -std=c11 -O0 -g
ROOT := ..

.PHONY: all clean

all: test_gyver_map
	./test_gyver_map

test_gyver_map: test_gyver_map.c $(ROOT)/main/gyver_map.c $(ROOT)/main/gyver_scenes.c \
		$(ROOT)/main/gyver_map.h $(ROOT)/main/gyver_scenes.h
	$(CC) $(CFLAGS) -I$(ROOT)/main -o $@ test_gyver_map.c $(ROOT)/main/gyver_map.c \
		$(ROOT)/main/gyver_scenes.c

clean:
	rm -f test_gyver_map
