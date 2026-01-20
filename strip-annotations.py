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
    was_just_newline = True

    """The wc utility shall consider a word to be a non-zero-length string of characters delimited by white space.
    —https://pubs.opengroup.org/onlinepubs/9799919799/utilities/wc.html
    """

    while i < n:
        c = data[i]
        if c == '[' and i + 1 < n and (annotation > 0 or data[i+1] == '@'):
            annotation += 1
            i += 2
            continue
        if was_just_newline and i + 2 < n and data[i:i+3] == '[^@':
            newline_index = data.find('\n', i)
            if newline_index == -1:
                i = n
            else:
                i = newline_index
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
        if (c == ']' or c == '\n') and annotation > 0:
            annotation -= 1
            # Note that this doesn't trigger a whitespace, as foo[@ adsfjlkj kalsjdf lkjasdf]bar is seen as "foobar".
        if c == '\n':
            was_just_newline = True
            if annotation > 0: annotation = 0
        else:
            was_just_newline = False
        i += 1

    if count_mode:
        sys.stdout.write("\t"+str(running_count)+"\t"+file+"\n", )
    running_total_count += running_count
print(f"{running_total_count}\ttotal")
