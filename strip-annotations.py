#!/usr/bin/env python3
import sys

count_mode = False

def complain():
  sys.stderr.write("ERROR: I only handle stdin and cannot take arguments. Except --count.\n")
  exit(-1)
if len(sys.argv) > 2:
  complain()

if len(sys.argv) > 1:
  if sys.argv[1] == "--count":
    count_mode = True
  else:
    complain()

data = sys.stdin.read()
n = len(data)
annotation = 0
i = 0
running_count = 0
was_just_whitespace = True # the beginning of the file is effectively whitespace

"""The wc utility shall consider a word to be a non-zero-length string of characters delimited by white space.
—https://pubs.opengroup.org/onlinepubs/9799919799/utilities/wc.html
"""

while i < n:
    c = data[i]
    if c == '[' and i + 1 < n and data[i+1] == '@':
        annotation += 1
        i += 2
        continue
    if annotation == 0:
        if count_mode:
            if c.isspace():
                was_just_whitespace = True
            else:
                if was_just_whitespace:
                    running_count+=1
                was_just_whitespace = False
        else:
            sys.stdout.write(c)
    if c == ']' and annotation > 0:
        annotation -= 1
    i += 1

if count_mode:
  sys.stdout.write(str(running_count)+"\n")
