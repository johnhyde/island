#!/usr/bin/env python3
import sys
import argparse

sys.stdout.reconfigure(encoding="utf-8") #important.

parser = argparse.ArgumentParser()
parser.add_argument('--count', action='store_true')
parser.add_argument('files', nargs='+')
args = parser.parse_args()

running_total_count = 0

count_mode = args.count
files = args.files
#print(files)
for file in files:
    #print(file)
    data = open(file, encoding="utf-8").read()
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
        sys.stdout.write("\t"+str(running_count)+"\t"+file+"\n", )
    running_total_count += running_count
print(f"{running_total_count}\ttotal")
