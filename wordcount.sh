echo Chapters:
./strip-annotations.py --count [0-9][0-9]*.jd | tr -d '\r'
echo Appendices:
./strip-annotations.py --count A[0-9]*.jd | tr -d '\r'
echo 'Note that these counts do not include annotations, but do include [X; foo words] type things (due to inconvenience of removing them).'
