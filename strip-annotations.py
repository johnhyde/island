#!/usr/bin/env python3
import sys

if len(sys.argv) > 1:
  sys.stderr.write("ERROR: I only handle stdin and cannot take arguments.")
  exit(-1)

data = sys.stdin.read()
n = len(data)
annotation = 0
i = 0

while i < n:
    c = data[i]
    if c == '[' and i + 1 < n and data[i+1] == '@':
        annotation += 1
        i += 2
        continue
    if annotation == 0:
        sys.stdout.write(c)
    if c == ']' and annotation > 0:
        annotation -= 1
    i += 1
