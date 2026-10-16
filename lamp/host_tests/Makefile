CXX ?= g++
CXXFLAGS ?= -Wall -Wextra -fsanitize=address,undefined -g

test: test_parse_util
	./test_parse_util

test_parse_util: test_parse_util.cpp ../gunner47_v2.87in1/ParseUtil.h
	$(CXX) $(CXXFLAGS) -I../gunner47_v2.87in1 -o $@ test_parse_util.cpp

clean:
	rm -f test_parse_util
